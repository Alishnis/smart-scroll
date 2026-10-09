# Running it

There is no live demo right now: the Azure student credit that hosted it ran out, and the project is not hosted on paid or card-required tiers. Demo video: https://youtu.be/Zl6iXgb3fuk

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

## Legacy: Azure files

`smart_scroll2/aci-deploy.yaml`, `smart_scroll2/web/Dockerfile.caddy` and `smart_scroll2/web/Caddyfile` are reference material for the former Azure Container Instances deployment, which was taken offline when the student credit ran out. They are not used by the options above.

## Browser-shipped YouTube key (action required)

The YouTube Data API key is a constant in `smart_scroll2/web/feed.html` and is visible to every visitor. It is not an environment variable. It must be **rotated**, and the new key **restricted by HTTP referrer** (the origins the app is served from) and by API (YouTube Data API v3) in the Google Cloud console.

## Security note

`/ai/chat` and `/proxy?url=` have no auth or rate limiting (see README "Limitations"). Anyone who can reach a running instance can spend its OpenRouter key; if you expose one publicly, put a spending cap on that key.
