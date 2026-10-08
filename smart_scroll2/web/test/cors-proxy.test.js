// Tests for cors-proxy.js: the OpenRouter (/ai/chat) proxy and the Reddit search proxy.
// Outbound calls (OpenRouter / Reddit) are mocked; requests to the local test server pass through.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers');

const NO_KEYS = {
    OPENROUTER_API_KEY: undefined,
    OPENROUTER_MODEL: undefined,
    REDDIT_CLIENT_ID: undefined,
    REDDIT_CLIENT_SECRET: undefined,
};

// Replace global fetch; calls to 127.0.0.1 (the test server) still go through for real.
function mockOutboundFetch(handler) {
    const realFetch = global.fetch;
    const calls = [];
    global.fetch = (url, options = {}) => {
        if (String(url).startsWith('http://127.0.0.1')) return realFetch(url, options);
        calls.push({ url: String(url), options });
        return Promise.resolve(handler(String(url), options));
    };
    return { calls, restore: () => { global.fetch = realFetch; } };
}

const jsonResponse = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const post = (baseUrl, path, body) =>
    fetch(baseUrl + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

test('POST /ai/chat returns 503 when OPENROUTER_API_KEY is not configured', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', NO_KEYS);
    try {
        const res = await post(baseUrl, '/ai/chat', { messages: [{ role: 'user', content: 'hi' }] });
        assert.equal(res.status, 503);
    } finally {
        await close();
    }
});

test('POST /ai/chat rejects a request without messages', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', { ...NO_KEYS, OPENROUTER_API_KEY: 'test-key' });
    try {
        assert.equal((await post(baseUrl, '/ai/chat', {})).status, 400);
        assert.equal((await post(baseUrl, '/ai/chat', { messages: [] })).status, 400);
    } finally {
        await close();
    }
});

test('POST /ai/chat forwards messages to OpenRouter with the server-held key and returns its reply', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', { ...NO_KEYS, OPENROUTER_API_KEY: 'test-key', OPENROUTER_MODEL: 'test/model' });
    const mock = mockOutboundFetch(() => jsonResponse({ choices: [{ message: { content: 'hello' } }] }));
    try {
        const messages = [{ role: 'user', content: 'summarize this' }];
        const res = await post(baseUrl, '/ai/chat', { messages, max_tokens: 50 });
        assert.equal(res.status, 200);
        assert.equal((await res.json()).choices[0].message.content, 'hello');

        assert.equal(mock.calls.length, 1);
        const { url, options } = mock.calls[0];
        assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
        assert.equal(options.headers.Authorization, 'Bearer test-key'); // key comes from the server env, not the client
        const sent = JSON.parse(options.body);
        assert.equal(sent.model, 'test/model');
        assert.deepEqual(sent.messages, messages);
        assert.equal(sent.max_tokens, 50);
        assert.equal(sent.temperature, 0.7); // default
    } finally {
        mock.restore();
        await close();
    }
});

test('GET /reddit/search requires the q parameter', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', NO_KEYS);
    try {
        assert.equal((await fetch(`${baseUrl}/reddit/search`)).status, 400);
    } finally {
        await close();
    }
});

test('GET /reddit/search uses the OAuth2 endpoint when credentials are set and caches the access token', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', {
        ...NO_KEYS,
        REDDIT_CLIENT_ID: 'id',
        REDDIT_CLIENT_SECRET: 'secret',
    });
    const mock = mockOutboundFetch((url) => {
        if (url === 'https://www.reddit.com/api/v1/access_token') return jsonResponse({ access_token: 'tok', expires_in: 3600 });
        return jsonResponse({ data: { children: [] } });
    });
    try {
        for (let i = 0; i < 2; i++) {
            const res = await fetch(`${baseUrl}/reddit/search?q=${encodeURIComponent('python tips')}`);
            assert.equal(res.status, 200);
        }
        const tokenCalls = mock.calls.filter((c) => c.url.endsWith('/api/v1/access_token'));
        const searchCalls = mock.calls.filter((c) => c.url.startsWith('https://oauth.reddit.com/search?'));
        assert.equal(tokenCalls.length, 1, 'token should be fetched once and reused');
        assert.equal(searchCalls.length, 2);
        assert.equal(searchCalls[0].options.headers.Authorization, 'Bearer tok');
        assert.match(searchCalls[0].url, /q=python%20tips/);
        // Client credentials are sent as HTTP Basic auth on the token request.
        assert.equal(tokenCalls[0].options.headers.Authorization, 'Basic ' + Buffer.from('id:secret').toString('base64'));
    } finally {
        mock.restore();
        await close();
    }
});

test('GET /reddit/search falls back to the public endpoint when no credentials are configured', async () => {
    const { baseUrl, close } = await loadApp('./cors-proxy.js', NO_KEYS);
    const mock = mockOutboundFetch(() => jsonResponse({ data: { children: [{ data: { title: 'post' } }] } }));
    try {
        const res = await fetch(`${baseUrl}/reddit/search?q=rust`);
        assert.equal(res.status, 200);
        assert.equal((await res.json()).data.children[0].data.title, 'post');
        assert.equal(mock.calls.length, 1);
        assert.match(mock.calls[0].url, /^https:\/\/www\.reddit\.com\/search\.json\?q=rust/);
    } finally {
        mock.restore();
        await close();
    }
});
