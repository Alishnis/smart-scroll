# Running it

There is no live demo right now (TODO(owner): add the URL once deployed). Demo video: https://youtu.be/Zl6iXgb3fuk

You can run the whole app locally with Docker, in either of two ways. All environment variables are optional; a missing one only disables its feature (see below).

## Option 1: docker compose (three containers)

```bash
cd smart_scroll2
cp .env.example .env      # fill in real keys, all optional
docker compose up --build
# -> http://localhost:3000
```

This runs `web` (nginx + static site), `cors-proxy` and `token-server`.

## Option 2: single container

One image runs nginx plus both Node services and serves everything on port 7860, using the same `web/nginx.conf.template` as compose. It runs as UID 1000. Built and run locally to verify: the image is about 241 MB, `/` and `/feed.html` return 200, and `/token` returns 200 when the Twilio variables are set.

```bash
cd smart_scroll2
docker build -f space/Dockerfile.space -t smartscroll-single .
docker run --rm -p 7860:7860 --env-file .env smartscroll-single
# -> http://localhost:7860
```

`space/Dockerfile.space.dockerignore` keeps `.env` files and `node_modules` out of the build context. `space/entrypoint.sh` starts the three processes and exits if any of them dies.

## Deploy on SnapDeploy (free, no card)

SnapDeploy runs a public Docker image, so the repository publishes the single-container image to GitHub Container Registry (GHCR) with `.github/workflows/publish-image.yml` on every push to `main` that touches `smart_scroll2/`, or on demand (Actions -> Publish image -> Run workflow).

**1. Make the package public (one-time, owner only).** The first workflow run creates the GHCR package as **private**, and SnapDeploy can only pull public images. Open GitHub -> your profile -> Packages -> `smart-scroll` -> Package settings -> Change visibility -> Public.

**2. Create the container in the SnapDeploy dashboard.**

- Image: `ghcr.io/alishnis/smart-scroll:latest` (or pin a `:sha-<short sha>` tag).
- Port: the image declares `EXPOSE 7860`, so it should be picked up automatically; if the dashboard asks or defaults to something else, set it to **7860**.
- Health check: SnapDeploy polls `/`, which nginx answers with 200.
- Free tier size: 0.25 vCPU / 512 MB RAM. Measured locally with exactly those limits (`docker run --cpus 0.25 --memory 512m`): about 30 MiB resident at idle and after a few dozen requests, so there is plenty of headroom.

**3. Set environment variables in the dashboard** (names only; all optional, a missing one disables only its feature):

`REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`

Do not set `PORT`: the two Node services use fixed internal ports and nginx listens on 7860. The Twilio names are the ones in `smart_scroll2/web/env.example`; the full list with descriptions is in the table below.

**4. Use new keys.** Every key you enter must be a **newly created (rotated) key**, not one that was ever committed to this repository or its history. Enter them only in the dashboard, never in a file.

**5. Restrict the YouTube key.** The YouTube Data API key is hard-coded in `smart_scroll2/web/feed.html` and shipped to every visitor's browser. Replace it with a new key and restrict it in the Google Cloud console by **HTTP referrer** to the final SnapDeploy URL, and by API to YouTube Data API v3.

**Free-tier caveats**

- The container sleeps after 15 minutes without traffic; the first request afterwards takes about 60 s to wake it.
- 100 container-hours per month, shared across all your containers.
- No persistent disk. Nothing is stored server-side (the app keeps its state in the browser), but anything written inside the container is lost on restart.
- WebSockets need the paid tier. The app's own endpoints are plain HTTP; check this if you add anything that uses WebSockets.
- `/ai/chat` and `/proxy?url=` have no auth or rate limiting (see Security note below): put a spending cap on the OpenRouter key.

## Environment variables (names only)

Template: `smart_scroll2/.env.example`. Never commit real values.

| Name | Used by | Needed for |
|---|---|---|
| `REDDIT_CLIENT_ID` | cors-proxy | Reddit search via OAuth2 (falls back to the public endpoint without it) |
| `REDDIT_CLIENT_SECRET` | cors-proxy | same |
| `REDDIT_USER_AGENT` | cors-proxy | optional |
| `OPENROUTER_API_KEY` | cors-proxy | AI summaries, quizzes, document Q&A (503 without it) |
| `OPENROUTER_MODEL` | cors-proxy | optional; default is set in `cors-proxy.js` |
| `TWILIO_ACCOUNT_SID` | token-server | video rooms (`/token` answers 500 without them) |
| `TWILIO_API_KEY` | token-server | same |
| `TWILIO_API_SECRET` | token-server | same |

## Browser-shipped YouTube key (action required)

The YouTube Data API key is a constant in `smart_scroll2/web/feed.html` and is visible to every visitor. It is not an environment variable. It must be **rotated**, and the new key **restricted by HTTP referrer** (the origins the app is served from) and by API (YouTube Data API v3) in the Google Cloud console.

## Security note

`/ai/chat` and `/proxy?url=` have no auth or rate limiting (see README "Limitations"). Anyone who can reach a running instance can spend its OpenRouter key; if you expose one publicly, put a spending cap on that key.
