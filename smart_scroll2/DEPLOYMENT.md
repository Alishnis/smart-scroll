# 🚀 Развертывание SmartScroll

## 🌐 Веб-развертывание

### 1. GitHub Pages

```bash
# Клонируйте репозиторий
git clone https://github.com/Alishnis/smart_scrolling.git
cd smart_scrolling

# Перейдите в веб-папку
cd web

# Запустите локально для тестирования
python3 -m http.server 3000
```

### 2. Netlify

1. Подключите GitHub репозиторий к Netlify
2. Установите:
   - **Build command**: `echo "No build needed"`
   - **Publish directory**: `web`
3. Добавьте переменные окружения в Netlify:
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `YOUTUBE_API_KEY`

### 3. Vercel

```bash
# Установите Vercel CLI
npm i -g vercel

# Разверните
cd web
vercel
```

## 🔧 Настройка API ключей

### Для продакшена

Создайте `.env` файл в `smart_scroll2/` (см. `.env.example` для полного списка переменных):
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
YOUTUBE_API_KEY=your_youtube_key
OPENAI_API_KEY=your_openai_key
```

## 🐳 Docker развертывание

Проект уже содержит рабочий `docker-compose.yml` в корне `smart_scroll2/`, поднимающий два контейнера:

* `web` — статика на nginx (`web/Dockerfile.web`), порт 3000
* `cors-proxy` — Node-прокси (`web/Dockerfile.proxy`), порт 3002

```bash
cd smart_scroll2
docker compose up --build
```

Открыть: `http://localhost:3000/feed.html`. Подробнее см. README.md.

## 🔒 Безопасность

### Важные моменты:

1. **НЕ коммитьте API ключи** в репозиторий
2. Используйте переменные окружения
3. Ограничьте доступ к API ключам
4. Регулярно обновляйте ключи

### .gitignore

```gitignore
.env
*.key
secrets.dart
```

## 📊 Мониторинг

### Логи

```bash
# Просмотр логов веб-сервера
tail -f /var/log/nginx/access.log

# Логи CORS прокси
node cors-proxy.js 2>&1 | tee cors-proxy.log
```

### Метрики

- Количество запросов к API
- Время отклика
- Ошибки CORS
- Использование памяти

## 🚨 Устранение неполадок

### CORS ошибки в продакшене

1. Настройте CORS на сервере
2. Используйте прокси-сервер
3. Обновите заголовки

### API лимиты

1. Мониторьте использование API
2. Реализуйте кэширование
3. Добавьте fallback контент

## 📈 Масштабирование

### Горизонтальное масштабирование

```yaml
# docker-compose.yml
services:
  web:
    scale: 3
  proxy:
    scale: 2
```

### Кэширование

```javascript
// Добавьте Redis для кэширования
const redis = require('redis');
const client = redis.createClient();
```

---

**Удачного развертывания! 🚀**

