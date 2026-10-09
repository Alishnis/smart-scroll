# Deploying to a free Hugging Face Space

The app runs as **one container** on a Hugging Face Docker Space (free CPU): nginx on port 7860 serves the static site and reverse-proxies `/reddit/*`, `/ai/*`, `/proxy` to `cors-proxy` (:3002) and `/token` to `token-server` (:3007), using the same `smart_scroll2/web/nginx.conf.template` as the compose/Azure setup. `smart_scroll2/space/entrypoint.sh` starts the three processes and exits if any of them dies, so Hugging Face restarts the container. Everything runs as UID 1000.

> **Legacy:** `smart_scroll2/aci-deploy.yaml`, `smart_scroll2/web/Dockerfile.caddy`, `smart_scroll2/web/Caddyfile` and the Azure steps in the README describe the previous Azure Container Instances deployment. They are kept for reference and are not used by the Space.

## How deployment works

Push to `main` (touching `smart_scroll2/`) or run the workflow manually -> `.github/workflows/deploy-hf-space.yml` runs `scripts/stage_hf_space.sh` (builds the Space folder: `README.md` front matter, root `Dockerfile`, `web/`, `space/`) and `scripts/upload_hf_space.py` (`create_repo(exist_ok=True, repo_type="space", space_sdk="docker")` + `upload_folder`). Hugging Face then builds the image and starts the Space.

If the repository variable `HF_SPACE_ID` is not set, the workflow prints a message and skips; CI stays green. If `HF_SPACE_ID` is set but `HF_TOKEN` is missing, the workflow fails with a clear error.

## Owner steps (one-time)

1. Create a Hugging Face account and a **write** access token: https://huggingface.co/settings/tokens
2. Add the token and the Space id to the GitHub repository (the Space is created on the first deploy if it does not exist; pick any `<space-name>`):
   ```bash
   gh secret set HF_TOKEN --repo Alishnis/smart-scroll          # paste the token when prompted
   gh variable set HF_SPACE_ID --repo Alishnis/smart-scroll --body <hf-user>/<space-name>
   ```
3. Trigger the first deploy: Actions -> "Deploy to Hugging Face Space" -> Run workflow (or push to `main`).
4. In the Space on huggingface.co: Settings -> Variables and secrets -> add the **secrets** below (they reach the container as environment variables). Restart the Space after changing them.
5. Put the live URL (`https://<hf-user>-<space-name>.hf.space`) into the README (search for `TODO(owner)`).

### Space secrets (names only; values come from your own accounts)

| Name | Used by | Needed for |
|---|---|---|
| `OPENROUTER_API_KEY` | cors-proxy | AI summaries, quizzes, document Q&A (503 without it) |
| `OPENROUTER_MODEL` | cors-proxy | optional; default is set in `cors-proxy.js` |
| `REDDIT_CLIENT_ID` | cors-proxy | Reddit search via OAuth2 (falls back to the public endpoint without it) |
| `REDDIT_CLIENT_SECRET` | cors-proxy | same |
| `REDDIT_USER_AGENT` | cors-proxy | optional |
| `TWILIO_ACCOUNT_SID` | token-server | video rooms (`/token` answers 500 without them) |
| `TWILIO_API_KEY` | token-server | same |
| `TWILIO_API_SECRET` | token-server | same |

Every one is optional: a missing one only disables its feature. Never commit real values; see `smart_scroll2/.env.example`.

## Browser-shipped YouTube key (action required)

The YouTube Data API key is a constant in `smart_scroll2/web/feed.html` and is visible to every visitor. It is not a Space secret. The owner must **rotate it** and **restrict the new key by HTTP referrer** (the `*.hf.space` origin and any custom domain) and by API (YouTube Data API v3) in the Google Cloud console.

## Behavior to expect

- **Cold start:** a free Space goes to sleep after about 48 hours without traffic. The first visit afterwards wakes it, which takes about a minute.
- **HTTPS:** Spaces are served over HTTPS, which `getUserMedia` (camera/microphone in video rooms) requires. If the camera is blocked while the app is shown inside the huggingface.co Space page, open the direct `*.hf.space` URL instead.
- **Unauthenticated endpoints:** `/ai/chat` and `/proxy?url=` have no auth or rate limiting (see README "Limitations"). Anyone who can reach the Space can spend the OpenRouter key; consider a spending cap on that key.

## Run the same image locally

```bash
scripts/stage_hf_space.sh /tmp/hf-space
docker build -t smartscroll-space /tmp/hf-space
docker run --rm -p 7860:7860 --env-file smart_scroll2/.env smartscroll-space
# -> http://localhost:7860
```
