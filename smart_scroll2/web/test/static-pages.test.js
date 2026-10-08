// Static checks on the front-end: catches broken local links and API paths that nginx does not proxy.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WEB_DIR = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(WEB_DIR, file), 'utf8');
const topLevel = (ext) => fs.readdirSync(WEB_DIR).filter((f) => f.endsWith(ext));

test('every local script/stylesheet/link referenced by a page exists', () => {
    const missing = [];
    for (const page of topLevel('.html')) {
        const html = read(page);
        for (const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
            const ref = m[1].split(/[?#]/)[0];
            if (!ref || /^(?:[a-z]+:|\/\/|\/|#)/i.test(ref) || ref.includes('${')) continue; // external, absolute or templated
            if (!fs.existsSync(path.join(WEB_DIR, ref))) missing.push(`${page} -> ${ref}`);
        }
    }
    assert.deepEqual(missing, []);
});

test('same-origin API paths called by the front-end are proxied by nginx', () => {
    const nginx = read('nginx.conf.template');
    const locations = [...nginx.matchAll(/location\s+(\/[\w-]*)/g)].map((m) => m[1]);
    assert.ok(locations.length > 0);

    // Known gap: conference-template-new.html polls /room/:name, which only the legacy
    // twilio-token-server.js implements. The deployed stack has no such route, so the page
    // gets a 404 and shows its waiting message. Remove this entry once the route exists.
    const KNOWN_UNPROXIED = ['/room'];

    const files = [...topLevel('.html'), ...topLevel('.js').filter((f) => !f.includes('quiz-data'))];
    const unproxied = [];
    for (const file of files) {
        for (const m of read(file).matchAll(/fetch\(\s*[`'"](\/[\w-]+)/g)) {
            if (KNOWN_UNPROXIED.includes(m[1])) continue;
            if (!locations.some((loc) => loc === m[1] || loc === m[1] + '/')) unproxied.push(`${file} -> ${m[1]}`);
        }
    }
    assert.deepEqual(unproxied, []);
});

test('the deployed front-end never calls the API services on a hardcoded localhost port', () => {
    // Regression: conference-service.js used http://localhost:3007/token, which only worked on a dev machine.
    const offenders = [];
    for (const file of [...topLevel('.html'), ...topLevel('.js')]) {
        if (file.includes('quiz-data') || /(?:server|proxy)/.test(file)) continue; // Node servers log their own URL
        if (/localhost:(?:3002|3007)/.test(read(file))) offenders.push(file);
    }
    assert.deepEqual(offenders, []);
});
