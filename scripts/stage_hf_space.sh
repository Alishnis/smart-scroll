#!/usr/bin/env bash
# Stage a Hugging Face Docker Space folder from this repo.
#
# Usage: scripts/stage_hf_space.sh [OUTPUT_DIR]     (default: build/hf-space)
#
# Output layout (the Space repo root):
#   README.md    Space front matter (sdk: docker, app_port) + short description
#   Dockerfile   copy of smart_scroll2/space/Dockerfile.space
#   web/         the app, minus node_modules, tests, .env files, .DS_Store
#   space/       nginx.conf, entrypoint.sh
#
# Local test (needs a running Docker daemon):
#   scripts/stage_hf_space.sh /tmp/hf-space
#   docker build -t smartscroll-space /tmp/hf-space
#   docker run --rm -p 7860:7860 smartscroll-space
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$repo_root/smart_scroll2"
out="${1:-$repo_root/build/hf-space}"

[ -d "$app/web" ] && [ -f "$app/space/Dockerfile.space" ] || {
  echo "stage_hf_space: expected $app/web and $app/space/Dockerfile.space" >&2
  exit 1
}

# Refuse to wipe anything that is not an obviously disposable staging dir.
case "$out" in
  ""|"/"|"$repo_root"|"$app"|"$HOME") echo "stage_hf_space: refusing to use '$out' as output dir" >&2; exit 1 ;;
esac
rm -rf "$out"
mkdir -p "$out/web" "$out/space"

rsync -a \
  --exclude 'node_modules/' --exclude 'test/' \
  --exclude '.DS_Store' --exclude '.env' --exclude '.env.*' \
  "$app/web/" "$out/web/"
cp "$app/space/nginx.conf" "$app/space/entrypoint.sh" "$out/space/"
cp "$app/space/Dockerfile.space" "$out/Dockerfile"

cat > "$out/README.md" <<'README'
---
title: SmartScroll
emoji: 📚
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# SmartScroll

SmartScroll turns the endless-scroll feed (YouTube + Reddit) into a study tool: AI summaries and quizzes per item, document Q&A, activity stats and a video-conferencing room.

It started as a prototype the owner inherited; the owner audited it, removed leaked keys from it, fixed the proxy and quiz grading of it, containerized it, and deployed it on Azure. This Space runs the same app in a single container (nginx + the two Node services) on free hosting.

- Source and docs: https://github.com/Alishnis/smart-scroll
- Demo video: https://youtu.be/Zl6iXgb3fuk

Free Spaces sleep after about 48 hours without traffic; the first visit afterwards takes about a minute to wake the container. AI features, Reddit search and video rooms need the server-side keys set as Space secrets (see `docs/DEPLOY.md` in the GitHub repo); without them the app still loads.
README

# Fail loudly if a secrets-looking file slipped into the stage.
if find "$out" \( -name '.env' -o -name '.env.*' -o -name '.DS_Store' -o -name node_modules \) | grep -q .; then
  echo "stage_hf_space: unexpected env/junk file in staged folder" >&2
  exit 1
fi

echo "Staged Hugging Face Space folder: $out"
