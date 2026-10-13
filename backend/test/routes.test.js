const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /health responds ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
});

test('GET /series validates its query params', async () => {
  const noTicker = await fetch(`${base}/series?range=1D`);
  assert.equal(noTicker.status, 400);

  const badRange = await fetch(`${base}/series?ticker=NVDA&range=5Y`);
  assert.equal(badRange.status, 400);
});

test('POST /report/generate rejects malformed dates', async () => {
  const res = await fetch(`${base}/report/generate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ date: '13/10/2026' }),
  });
  assert.equal(res.status, 400);
});

test('unknown routes return JSON 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Not found' });
});
