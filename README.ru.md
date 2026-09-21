# 🎓 SmartScroll - Умная лента образовательного контента

*[English version](README.md)*

> **Умное приложение для просмотра образовательного контента с AI-суммаризацией и адаптивным мониторингом глаз**

SmartScroll объединяет лучший образовательный контент с YouTube и Reddit в единой ленте, используя искусственный интеллект для создания кратких резюме и мониторинга здоровья глаз.

## ✨ Основные возможности

* 🎥 **Смешанная лента**: Видео с YouTube (80%) + посты с Reddit (20%)
* 🤖 **AI-суммаризация**: Автоматическое создание кратких резюме контента
* 👁️ **Мониторинг глаз**: Адаптивная прокрутка на основе расстояния до экрана
* 📚 **Образовательный контент**: Умная фильтрация образовательных материалов
* 🎮 **Развлекательный контент**: Посты из популярных сообществ
* 🌐 **Работает в браузере**: без установки, без сборки — статические HTML/JS-страницы
* 🔄 **Бесконечная прокрутка**: Автоматическая загрузка нового контента
* 🌙 **Темная тема**: Поддержка темной и светлой темы

## 📱 Навигация

* **Лента** - Смешанный контент (видео + посты)
* **Посты** - Только посты с Reddit
* **Группы** - Функционал групп
* **Профиль** - Профиль пользователя

## 🛠 Технологии

* **HTML / CSS / JavaScript** - без фреймворков и без шага сборки
* **Node.js** - CORS-прокси
* **Docker / nginx** - контейнеризация и раздача статики
* **YouTube API** - Загрузка видео
* **Reddit API** - Загрузка постов
* **CORS Proxy** - Обход ограничений браузера

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/Alishnis/smart_scrolling.git
cd smart_scrolling
```

### 2. Запуск веб-версии (Рекомендуется)

#### Шаг 1: Запуск веб-сервера
```bash
cd web
python3 -m http.server 3000
```

#### Шаг 2: Запуск CORS прокси (в отдельном терминале)
```bash
cd web
node cors-proxy.js
```

#### Шаг 3: Открыть приложение
**Откройте браузер:** `http://localhost:3000/posts.html`

### 2b. Запуск веб-версии через Docker

```bash
cd smart_scroll2
docker compose up --build
```

Поднимутся два контейнера: `web` (статика на nginx, порт 3000) и `cors-proxy` (Node-прокси, порт 3002) — аналогично ручному запуску выше. Откройте `http://localhost:3000/posts.html`.

## 🔑 API ключи

Проект использует следующие сервисы — ключи нужно получить самостоятельно и положить в свой `.env` (см. `.env.example`):

* **YouTube API** — [console.cloud.google.com](https://console.cloud.google.com/) (включить YouTube Data API v3)
* **OpenAI API** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (для AI-суммаризации)
* **Reddit API** — [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
* **Twilio** — [console.twilio.com](https://console.twilio.com/) (для видеоконференций)

### Настройка .env файла

Создайте файл `.env` в корне проекта на основе `.env.example`:

```env
# SmartScroll API Configuration
# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0 by your_reddit_username

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Twilio (video conferencing)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret

# App Configuration
APP_NAME=smartscrolling
APP_DESCRIPTION=Smart educational content feed with AI summarization
REDIRECT_URI=http://localhost:3000/posts.html

# Development Settings
NODE_ENV=development
PORT=3000
CORS_PROXY_PORT=3002
```

## 🏗 Архитектура

```
├── web/                    # Веб-приложение (HTML/JS, без сборки)
│   ├── posts.html         # Страница постов
│   ├── feed.html          # Лента
│   ├── reddit_advanced_service.js  # Reddit API
│   ├── cors-proxy.js      # CORS прокси
│   ├── Dockerfile.web     # Образ статики (nginx)
│   └── Dockerfile.proxy   # Образ CORS-прокси (Node)
└── docker-compose.yml     # Запуск обоих контейнеров одной командой
```

## 📊 Особенности

* **CORS обход**: Использование прокси-сервисов для обхода ограничений браузера
* **Обработка ошибок**: Graceful fallback при недоступности API
* **Кэширование**: Оптимизация загрузки контента
* **Фильтрация**: Автоматическое определение образовательного контента

## 🎯 Планы развития

* Система рекомендаций на основе AI
* Персонализация контента
* Офлайн режим
* Социальные функции
* Аналитика просмотров

## 📱 Поддерживаемые платформы

* ✅ **Web** (Chrome, Firefox, Safari) — любое устройство с современным браузером

## 🔧 Требования

* Python 3.x (для локального запуска без Docker) **или** Docker + Docker Compose
* Node.js (для CORS-прокси)
* Современный браузер

## 🚨 Устранение неполадок

### CORS ошибки
Если возникают CORS ошибки, убедитесь что CORS прокси запущен:
```bash
cd web
node cors-proxy.js
```

### Порт занят
Если порт 3000 занят, используйте другой:
```bash
python3 -m http.server 3001
```
Или измените проброс портов в `docker-compose.yml` (например `"3001:80"`).

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл LICENSE для деталей.

## 🤝 Участие в разработке

### Как внести вклад

1. **Fork** репозитория
2. Создайте **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** изменения: `git commit -m 'Add amazing feature'`
4. **Push** в branch: `git push origin feature/amazing-feature`
5. Создайте **Pull Request**

### Правила

* Следуйте существующему стилю кода (без сборки, чистый HTML/CSS/JS)
* Добавляйте тесты для новой функциональности
* Обновляйте документацию
* **НЕ коммитьте API ключи!**

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте раздел "Устранение неполадок"
2. Создайте Issue в GitHub
3. Обратитесь к документации API

---

**Удачной разработки! 🚀**

_SmartScroll - Умная лента для образовательного контента с AI-суммаризацией и мониторингом глаз_ 👁️🤖

