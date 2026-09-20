const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3002;

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'SmartScroll/1.0';

let cachedToken = null;
let tokenExpiry = 0;

// Получение OAuth2 токена Reddit (client credentials) — только на сервере, секрет наружу не уходит
async function getRedditAccessToken() {
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
        return null;
    }

    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64'),
            'User-Agent': REDDIT_USER_AGENT
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error(`Reddit OAuth error: HTTP ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // на минуту раньше настоящего истечения
    return cachedToken;
}

// Включаем CORS для всех запросов
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash-0731';

// Прокси для AI-запросов (суммаризация видео, квизы, Q&A по документам) —
// ключ OpenRouter остаётся на сервере, клиент присылает только messages
app.post('/ai/chat', async (req, res) => {
    if (!OPENROUTER_API_KEY) {
        return res.status(503).json({ error: 'OPENROUTER_API_KEY не настроен на сервере' });
    }

    const { messages, max_tokens = 1000, temperature = 0.7 } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: '"messages" is required' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens, temperature })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Ошибка запроса к OpenRouter:', error);
        res.status(500).json({ error: 'Failed to fetch from OpenRouter', message: error.message });
    }
});

// Прокси для Reddit API — сначала пробуем авторизованный OAuth2-запрос, затем публичный как фоллбэк
app.get('/reddit/search', async (req, res) => {
    const { q, sort = 'relevance', limit = 10, type = 'link' } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const query = `q=${encodeURIComponent(q)}&sort=${sort}&limit=${limit}&type=${type}&include_over_18=on&restrict_sr=off&t=all`;

    try {
        const token = await getRedditAccessToken();
        if (token) {
            const oauthUrl = `https://oauth.reddit.com/search?${query}`;
            console.log('Проксируем авторизованный запрос к Reddit API:', oauthUrl);

            const response = await fetch(oauthUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': REDDIT_USER_AGENT,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                return res.json(await response.json());
            }
            console.log(`Авторизованный запрос к Reddit вернул ${response.status}, пробуем публичный API`);
        }
    } catch (error) {
        console.error('Ошибка OAuth-запроса к Reddit:', error.message);
    }

    try {
        // Публичный Reddit API как фоллбэк (без ключей)
        const redditUrl = `https://www.reddit.com/search.json?${query}`;

        console.log('Проксируем запрос к публичному Reddit API:', redditUrl);

        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': REDDIT_USER_AGENT,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Ошибка при запросе к Reddit:', error);
        res.status(500).json({
            error: 'Failed to fetch from Reddit',
            message: error.message
        });
    }
});

// Прокси для Reddit API (OAuth)
app.use('/reddit', createProxyMiddleware({
    target: 'https://oauth.reddit.com',
    changeOrigin: true,
    pathRewrite: {
        '^/reddit': ''
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('Проксируем запрос к Reddit OAuth:', proxyReq.path);
    },
    onError: (err, req, res) => {
        console.error('Ошибка прокси:', err);
        res.status(500).json({ error: 'Proxy error' });
    }
}));

// Прокси для общих запросов (доступен и на "/", и на "/proxy" — второй используется клиентом для транскриптов YouTube)
app.get(['/', '/proxy'], (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Проксируем запрос к:', targetUrl);
    
    // Прокси с правильными заголовками для Reddit API
    fetch(targetUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'SmartScroll/1.0 (by /u/smartscroll)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
        }
    })
    .then(response => {
        console.log('Статус ответа:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            // Если не JSON, возвращаем как текст
            return response.text().then(text => {
                console.log('Получен не-JSON ответ:', text.substring(0, 200) + '...');
                throw new Error('Reddit API вернул HTML вместо JSON. Возможно, требуется аутентификация.');
            });
        }
    })
    .then(data => {
        res.set('Content-Type', 'application/json');
        res.json(data);
    })
    .catch(error => {
        console.error('Ошибка при проксировании:', error);
        res.status(500).json({ 
            error: 'Failed to fetch', 
            message: error.message,
            details: 'Reddit API может требовать аутентификации'
        });
    });
});

// Обработка POST запросов
app.post(['/', '/proxy'], (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Проксируем POST запрос к:', targetUrl);
    
    fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SmartScroll/1.0'
        },
        body: JSON.stringify(req.body)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        res.set('Content-Type', 'application/json');
        res.send(data);
    })
    .catch(error => {
        console.error('Ошибка при проксировании POST:', error);
        res.status(500).json({ 
            error: 'Failed to fetch', 
            message: error.message 
        });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 CORS Proxy Server запущен на порту ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Доступные эндпоинты:`);
    console.log(`   - GET /?url=<encoded_url> - прокси для GET запросов`);
    console.log(`   - POST /?url=<encoded_url> - прокси для POST запросов`);
    console.log(`   - /reddit/* - прокси для Reddit API`);
});

module.exports = app;