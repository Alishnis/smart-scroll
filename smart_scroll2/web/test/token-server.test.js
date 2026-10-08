// Tests for token-server.js: Twilio Video access-token signing.
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { loadApp } = require('./helpers');

const TWILIO_ENV = {
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_API_KEY: 'SKtest',
    TWILIO_API_SECRET: 'test-secret',
};

test('GET /token returns a JWT signed with the API secret and Twilio video grant', async () => {
    const { baseUrl, close } = await loadApp('./token-server.js', TWILIO_ENV);
    try {
        const res = await fetch(`${baseUrl}/token?identity=alice`);
        assert.equal(res.status, 200);
        const token = await res.text();

        // Verifying with the secret proves the signature is valid.
        const claims = jwt.verify(token, 'test-secret', { algorithms: ['HS256'] });
        assert.equal(claims.iss, 'SKtest');          // Twilio API Key SID
        assert.equal(claims.sub, 'ACtest');          // Account SID
        assert.equal(claims.grants.identity, 'alice');
        assert.deepEqual(claims.grants.video, { room: '*' });
        assert.equal(claims.exp - claims.iat, 3600); // 1 hour lifetime

        const header = jwt.decode(token, { complete: true }).header;
        assert.equal(header.cty, 'twilio-fpa;v=1');  // Twilio requires this header
    } finally {
        await close();
    }
});

test('GET /token defaults the identity to "anonymous"', async () => {
    const { baseUrl, close } = await loadApp('./token-server.js', TWILIO_ENV);
    try {
        const token = await (await fetch(`${baseUrl}/token`)).text();
        assert.equal(jwt.decode(token).grants.identity, 'anonymous');
    } finally {
        await close();
    }
});

test('GET /token returns 500 (not a crash) when Twilio credentials are not configured', async () => {
    const { baseUrl, close } = await loadApp('./token-server.js', {
        TWILIO_ACCOUNT_SID: undefined,
        TWILIO_API_KEY: undefined,
        TWILIO_API_SECRET: undefined,
    });
    try {
        const res = await fetch(`${baseUrl}/token?identity=bob`);
        assert.equal(res.status, 500);
    } finally {
        await close();
    }
});
