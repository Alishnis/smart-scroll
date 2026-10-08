// Test helper: load an Express app from web/ with a given environment and
// serve it on a random free port (the servers only call listen() when run directly).
const path = require('node:path');

async function loadApp(modulePath, env = {}) {
    const resolved = require.resolve(path.join(__dirname, '..', modulePath));
    delete require.cache[resolved]; // servers read process.env at load time
    const saved = {};
    for (const [key, value] of Object.entries(env)) {
        saved[key] = process.env[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    const app = require(resolved);
    const server = await new Promise((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    return {
        baseUrl,
        close: async () => {
            await new Promise((resolve) => server.close(resolve));
            for (const [key, value] of Object.entries(saved)) {
                if (value === undefined) delete process.env[key];
                else process.env[key] = value;
            }
        },
    };
}

module.exports = { loadApp };
