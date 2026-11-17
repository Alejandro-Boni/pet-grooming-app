const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../src/middleware/rateLimit');

function fakeRes() {
  return {
    statusCode: 200, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

function hit(limiter, req) {
  const res = fakeRes();
  let passed = false;
  limiter(req, res, () => { passed = true; });
  return { res, passed };
}

test('permite hasta `max` y bloquea la siguiente con 429 y Retry-After', () => {
  let t = 0;
  const limiter = createRateLimiter({ max: 3, windowMs: 60000, message: 'alto', now: () => t });
  const req = { user: { id: 7 } };

  for (let i = 0; i < 3; i++) assert.equal(hit(limiter, req).passed, true);

  t = 10000;
  const blocked = hit(limiter, req);
  assert.equal(blocked.passed, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.deepEqual(blocked.res.body, { error: 'alto' });
  assert.equal(blocked.res.headers['Retry-After'], '50');
});

test('la ventana se reinicia al vencer', () => {
  let t = 0;
  const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => t });
  const req = { user: { id: 1 } };
  assert.equal(hit(limiter, req).passed, true);
  assert.equal(hit(limiter, req).passed, false);
  t = 1000;
  assert.equal(hit(limiter, req).passed, true);
});

test('cada usuario tiene su propio contador', () => {
  const limiter = createRateLimiter({ max: 1, now: () => 0 });
  assert.equal(hit(limiter, { user: { id: 1 } }).passed, true);
  assert.equal(hit(limiter, { user: { id: 1 } }).passed, false);
  assert.equal(hit(limiter, { user: { id: 2 } }).passed, true);
});

test('sin usuario cae a la IP', () => {
  const limiter = createRateLimiter({ max: 1, now: () => 0 });
  assert.equal(hit(limiter, { ip: '1.1.1.1' }).passed, true);
  assert.equal(hit(limiter, { ip: '1.1.1.1' }).passed, false);
  assert.equal(hit(limiter, { ip: '2.2.2.2' }).passed, true);
});

test('el usuario con id 0 no se confunde con "sin usuario"', () => {
  const limiter = createRateLimiter({ max: 1, now: () => 0 });
  assert.equal(hit(limiter, { user: { id: 0 }, ip: 'x' }).passed, true);
  assert.equal(hit(limiter, { user: { id: 0 }, ip: 'y' }).passed, false);
});
