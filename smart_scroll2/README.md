# SmartScroll

SmartScroll turns the endless-scroll feed people already spend hours on (YouTube + Reddit) into a study tool: it pulls in video and post content, generates AI summaries and quizzes, lets you take notes alongside it, and adds a video-conferencing room for group study — all as a plain static site with a couple of small backend services, containerized and deployed to the cloud.

*[Русская версия](README.ru.md)*

---

## Screenshots

> Screenshots aren't committed yet — the live demo below is the fastest way to see the actual UI. Drop PNGs into `docs/screenshots/` and reference them here (e.g. `![Feed](docs/screenshots/feed.png)`) once you have them; the sections below list which pages are worth capturing.

| Page | What it shows |
|---|---|
| Feed (`feed.html`) | Mixed YouTube/Reddit feed, AI video summary + AI-generated quiz panel |
| Posts (`posts.html`) | Reddit search, results pulled through the OAuth2 server-side proxy |
| Stats (`stats.html`) | Live activity timer, achievements, weekly activity chart |
| Smart Shop (`smart-shop.html`) | Points-based shop for achievements/badges/titles |
| Conferences (`conference-template-new.html`) | Twilio Video room — join/create room, mute/camera/screen-share controls |
| Document Reader (`document-reader.html`) | Upload a PDF/DOCX, ask questions about it, get AI answers |

## Architecture

```
Browser
  │
  │  HTTPS (Let's Encrypt cert, auto-renewed)
  ▼
┌────────────────────────────────────────────────────────────┐
│ Caddy  (reverse proxy + TLS termination, ports 80/443)      │
└───────────────────────────┬──────────────────────────────────┘
                             │ localhost:8080
                             ▼
┌────────────────────────────────────────────────────────────┐
│ nginx ("web")  — serves the static HTML/CSS/JS app          │
│   reverse-proxies same-origin paths to the two API services: │
│   /reddit/*  → cors-proxy   /ai/*  → cors-proxy              │
│   /proxy     → cors-proxy   /token → token-server            │
└─────────┬──────────────────────────────────────┬─────────────┘
          │                                       │
          ▼                                       ▼
┌────────────────────────┐            ┌──────────────────────────┐
│ cors-proxy (Node)       │            │ token-server (Node)      │
│ - Reddit OAuth2         │            │ - Signs short-lived JWTs │
│   client-credentials    │            │   for Twilio Video       │
│   flow (server-side —   │            │   (Account SID / API     │
│   secret never reaches  │            │   Key / Secret stay      │
│   the browser)          │            │   server-side)           │
│ - /ai/chat: proxies to  │            └──────────────────────────┘
│   OpenRouter with a     │
│   server-held key       │
└─────────┬───────────────┘
          │
          ▼
  Reddit API · OpenRouter (DeepSeek / Mistral) · YouTube Data API (client-side, browser-restricted key) · Twilio Video

All four services (nginx, Caddy, cors-proxy, token-server) run as separate
containers. Locally they talk to each other over Docker Compose's service
DNS (`cors-proxy`, `token-server`); on Azure Container Instances they share
one network namespace, so the same images are told to use `localhost`
instead via an env var (`CORS_PROXY_HOST` / `TOKEN_SERVER_HOST`) — no code
change needed to move between the two.
```

**Why a server-side proxy at all?** Two unrelated reasons collided into the same fix:
1. Reddit blocks unauthenticated `.json` requests by IP (confirmed by direct `curl` testing — a plain fetch from the browser gets `403 Blocked` regardless of User-Agent). A real Reddit app (client id + secret) needs a client-credentials OAuth2 exchange, and that exchange is CORS-blocked from a browser and would expose the secret if attempted client-side anyway — so it has to happen on a server.
2. The OpenRouter (LLM) key is billable — hardcoding it in shipped HTML/JS would let anyone drain the account by reading the page source.

## Features

- **Mixed educational feed** — YouTube videos + Reddit posts in one infinite-scroll feed
- **AI video summaries** — structured breakdown (topics / key points / practical tips) generated from the video's title & description
- **AI-generated quizzes** — the model returns strict JSON (not HTML), so the app builds the quiz DOM itself: every question gets a guaranteed-unique radio group and the correct answer is graded from data, not scraped from rendered text
- **Document Q&A** — upload a PDF/DOCX, ask questions about its content, get AI answers grounded in the extracted text
- **Reddit search** with real OAuth2-backed results (not the public unauthenticated endpoint, which is IP-blocked)
- **Video conferencing** — Twilio Video rooms with mute/camera/screen-share/picture-in-picture controls
- **Gamified stats & shop** — activity timer, achievements, a Smart-points currency spendable on badges/titles
- **Bilingual UI (RU/EN)** — a single toggle re-translates the whole page, including AI responses (the app asks the model to answer in whichever language is active, not always Russian)
- **One unified navbar/header** across every page, namespaced (`ss-` prefix) so it can't collide with Bootstrap or any page's legacy CSS

## Tech stack

**Frontend** — plain HTML/CSS/JavaScript, no framework, no build step. Twilio Video SDK, PDF.js/Mammoth.js for document parsing.

**Backend services** (Node.js + Express):
- `cors-proxy.js` — Reddit OAuth2 proxy + `/ai/chat` proxy to OpenRouter
- `token-server.js` — Twilio Video access-token signing (`jsonwebtoken`)

**Infra**
- Docker + Docker Compose (3 services locally: `web`, `cors-proxy`, `token-server`)
- nginx (`nginx:alpine`), templated with `envsubst` so the same image adapts its upstream hostnames to either environment
- Caddy — automatic HTTPS via Let's Encrypt (needed because `getUserMedia`/camera access requires a secure context, and the app is reached over a plain HTTP domain otherwise)
- Docker Hub — public image registry
- Azure Container Instances — the actual runtime, on an Azure for Students subscription

**Third-party APIs** — Reddit API (OAuth2), YouTube Data API v3, OpenRouter (LLM routing — currently `mistralai/mistral-nemo`), Twilio Video.

## My contribution

This was an existing prototype I inherited with a lot of rough edges; the work here was auditing, fixing, and hardening it into something actually deployable:

- **Found and rotated leaked secrets.** The original repo had real Reddit/YouTube/OpenAI keys committed in plaintext (`.env.example`, `README.md`, and — worse — hardcoded directly in client-side `<script>` tags, meaning they were visible to any visitor). Squashed the git history to scrub them and rewired the app to fetch server-side keys through the proxy instead of shipping them to the browser.
- **Fixed real, previously-silent bugs**, not just cosmetic ones:
  - The Reddit proxy pointed at the wrong port *and* the wrong path (`/reddit/search.json` vs the actual `/reddit/search` route) — it had never actually worked, just silently fallen back to demo data.
  - The quiz feature's answer grading was fundamentally broken: the AI-generated HTML reused the same radio-button `name` for every question (copied verbatim from the prompt's one-question example), so selecting an answer in question 5 silently un-selected 1–4, and correctness was guessed with regexes over rendered explanation text. Rebuilt it so the model returns structured JSON and the app renders/grades the quiz itself.
  - AI responses were hardcoded to Russian regardless of the UI's EN/RU toggle.
- **Unified a genuinely inconsistent UI** — different pages shipped different navbars, a leftover template card that wrapped page content in an unstyled gray box, a double-navbar bug, and a missing translation for a whole page — into one namespaced, collision-proof shared header/nav component.
- **Took the app from "runs on my machine" to actually deployable**: everything that assumed `localhost` (the API proxy calls, the Twilio token server) only worked because dev and server were the same machine. Converted those to relative URLs behind an nginx reverse proxy, containerized the previously-unwrapped Twilio token server, and added Caddy for TLS — without which video conferencing is a hard browser-level failure (`getUserMedia` refuses to run outside a secure context).
- **Deployed it for real**: built and pushed the images to Docker Hub, and stood up the whole stack — nginx, both Node services, and Caddy — on Azure Container Instances.

## Demo

**Live:** https://smartscroll-app.germanywestcentral.azurecontainer.io

Video conferencing needs a real Twilio account behind it and the site needs its `.env` populated (see [Deployment](#deployment)) — if you're spinning this up fresh, expect Reddit search / AI features / video rooms to silently fall back to demo data until real keys are supplied.

## Deployment

**Images:** [`tmpalish/smartscroll-web`](https://hub.docker.com/r/tmpalish/smartscroll-web) · [`tmpalish/smartscroll-cors-proxy`](https://hub.docker.com/r/tmpalish/smartscroll-cors-proxy) · [`tmpalish/smartscroll-token-server`](https://hub.docker.com/r/tmpalish/smartscroll-token-server) · [`tmpalish/smartscroll-caddy`](https://hub.docker.com/r/tmpalish/smartscroll-caddy)

### Locally (Docker Compose)

```bash
cd smart_scroll2
cp .env.example .env   # fill in real API keys
docker compose up --build
# → http://localhost:3000
```

### Azure Container Instances

```bash
az login
az group create --name smartscroll-rg --location germanywestcentral

# build + push each image for linux/amd64 (Apple Silicon defaults to arm64)
for svc in web cors-proxy token-server caddy; do
  docker buildx build --platform linux/amd64 -f web/Dockerfile.$svc \
    -t tmpalish/smartscroll-$svc:latest --push web
done

az container create --resource-group smartscroll-rg --file aci-deploy.yaml
```

Fill in the placeholder values in `aci-deploy.yaml` from your own `.env` first. If you pick a different `dnsNameLabel`/region, update the domain in `web/Caddyfile` to match — Caddy only requests a certificate for the hostname it's told about.

`aci-deploy.yaml` deploys 4 containers sharing one network namespace (Azure Container Instances has no inter-container DNS, only shared `localhost`):

| Container | Role | Publicly exposed |
|---|---|---|
| `caddy` | TLS termination, auto Let's Encrypt cert for the `*.azurecontainer.io` FQDN | 80, 443 |
| `web` (nginx) | Static site + reverse proxy to the two API services | — (internal `8080`) |
| `cors-proxy` | Reddit OAuth2, `/ai/chat` → OpenRouter | — (internal `3002`) |
| `token-server` | Twilio Video JWT signing | — (internal `3007`) |

Environment variables (Reddit/OpenRouter/Twilio credentials) are injected per-container from `.env` at deploy time — they never get baked into the image or committed to git.

## Results

- The app runs end-to-end on a public HTTPS URL, not just `localhost` — every feature that used to silently depend on dev and server being the same machine (API proxying, video conferencing) now works identically in both places.
- Reddit search returns real, live results through a genuine OAuth2 flow instead of failing over to demo posts.
- The quiz feature grades correctly: 5 independently-answerable questions instead of one shared radio group.
- AI-generated content (summaries, quizzes, document Q&A) responds in whichever language the UI is set to.
- Video conferencing actually connects — `getUserMedia` works because the deployed app is served over valid HTTPS.
- No API key or secret is reachable by reading the page source or the git history anymore (the remaining Reddit/OpenRouter/Twilio credentials only exist inside container environment variables on the Azure deployment and in the local, git-ignored `.env`).
