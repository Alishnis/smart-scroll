# 🎓 SmartScroll — Smart Feed for Educational Content

*[Русская версия](README.md)*

> **A smart app for browsing educational content, with AI summarization and adaptive eye-strain monitoring**

SmartScroll pulls the best educational content from YouTube and Reddit into a single feed, using AI to generate concise summaries and to monitor eye health while you browse.

## ✨ Key Features

* 🎥 **Mixed feed**: YouTube videos (80%) + Reddit posts (20%)
* 🤖 **AI summarization**: automatic short summaries of content
* 👁️ **Eye monitoring**: adaptive scrolling based on distance from the screen
* 📚 **Educational content**: smart filtering for study material
* 🎮 **Entertainment content**: posts from popular communities
* 🌐 **Runs in the browser**: no install, no build step — static HTML/JS pages
* 🔄 **Infinite scroll**: automatic loading of new content
* 🌙 **Dark theme**: dark and light theme support

## 📱 Navigation

* **Feed** — mixed content (videos + posts)
* **Posts** — Reddit posts only
* **Groups** — group functionality
* **Profile** — user profile

## 🛠 Tech Stack

* **HTML / CSS / JavaScript** — no framework, no build step
* **Node.js** — CORS proxy
* **Docker / nginx** — containerization and static serving
* **YouTube API** — video loading
* **Reddit API** — post loading
* **CORS Proxy** — working around browser restrictions

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Alishnis/sscroll.git
cd sscroll/smart_scroll2
```

### 2. Run the web version (recommended)

#### Step 1: Start the web server
```bash
cd web
python3 -m http.server 3000
```

#### Step 2: Start the CORS proxy (in a separate terminal)
```bash
cd web
npm install   # first time only
node cors-proxy.js
```

#### Step 3: Open the app
**Open in your browser:** `http://localhost:3000/feed.html`

The web app ships with an EN/RU language toggle in the top-right corner of the navbar (defaults to Russian).

### 2b. Or run the web version with Docker

```bash
cd smart_scroll2
docker compose up --build
```

This builds and starts two containers: `web` (static files served by nginx on port 3000) and `cors-proxy` (the Node proxy on port 3002), matching the manual setup above. Open `http://localhost:3000/feed.html`.

## 🔑 API Keys

The app expects a `.env` file with your own API credentials — see `.env.example` for the full list of variables. **Never commit real keys to the repository.**

```env
# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=smartscrolling/1.0 by your_username

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# App Configuration
APP_NAME=smartscrolling
APP_DESCRIPTION=Smart educational content feed with AI summarization
REDIRECT_URI=http://localhost:3000/feed.html

# Development Settings
NODE_ENV=development
PORT=3000
CORS_PROXY_PORT=3002
```

You can get keys from:
* [Google Cloud Console](https://console.cloud.google.com/) → enable the YouTube Data API v3
* [Reddit App Preferences](https://www.reddit.com/prefs/apps) → create a script app
* [OpenAI Platform](https://platform.openai.com/api-keys) → create an API key

## 🏗 Architecture

```
├── web/                     # Web app (HTML/JS, no build step)
│   ├── feed.html            # Main feed
│   ├── posts.html           # Reddit posts page
│   ├── reddit_advanced_service.js  # Reddit API client
│   ├── cors-proxy.js        # CORS proxy
│   ├── Dockerfile.web       # Static site image (nginx)
│   └── Dockerfile.proxy     # CORS proxy image (Node)
└── docker-compose.yml       # Runs both containers with one command
```

## 📊 Highlights

* **CORS workaround**: proxy service to get around browser restrictions
* **Error handling**: graceful fallback when an API is unavailable
* **Caching**: optimized content loading
* **Filtering**: automatic detection of educational content

## 🎯 Roadmap

* AI-based recommendation system
* Content personalization
* Offline mode
* Social features
* Viewing analytics

## 📱 Supported Platforms

* ✅ **Web** (Chrome, Firefox, Safari) — any device with a modern browser

## 🔧 Requirements

* Python 3.x (for running without Docker) **or** Docker + Docker Compose
* Node.js (for the CORS proxy)
* A modern browser

## 🚨 Troubleshooting

### CORS errors
If you hit CORS errors, make sure the proxy is running:
```bash
cd web
node cors-proxy.js
```

### Port already in use
If port 3000 is taken, use a different one:
```bash
python3 -m http.server 3001
```
Or change the port mapping in `docker-compose.yml` (e.g. `"3001:80"`).

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

### Guidelines

* Follow the existing code style (plain HTML/CSS/JS, no build step)
* Add tests for new functionality
* Update documentation
* **Never commit API keys!**

## 📞 Support

If you run into questions or issues:

1. Check the "Troubleshooting" section above
2. Open an Issue on GitHub
3. Refer to each API's own documentation

---

**Happy building! 🚀**

_SmartScroll — a smart feed for educational content, with AI summarization and eye-health monitoring_ 👁️🤖
