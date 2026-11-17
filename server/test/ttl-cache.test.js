const test = require('node:test');
const assert = require('node:assert/strict');
const { createTtlCache, createConcurrencyLimiter } = require('../src/utils/ttl-cache');

function clock(start = 1000) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => { t += ms; };
  return now;
}

test('guarda el valor y no vuelve a ejecutar el loader mientras no venza', async () => {
  const now = clock();
  const cache = createTtlCache({ now });
  let calls = 0;
  const loader = async () => { calls += 1; return 42; };

  assert.equal(await cache.getOrLoad('k', 1000, loader), 42);
  assert.equal(await cache.getOrLoad('k', 1000, loader), 42);
  assert.equal(calls, 1);

  now.advance(999);
  assert.equal(await cache.getOrLoad('k', 1000, loader), 42);
  assert.equal(calls, 1);

  now.advance(1); // vence exactamente a los 1000 ms
  assert.equal(await cache.getOrLoad('k', 1000, loader), 42);
  assert.equal(calls, 2);
  assert.deepEqual(cache.stats(), { hits: 2, misses: 2, shared: 0 });
});

test('peticiones simultáneas comparten una sola llamada real', async () => {
  const cache = createTtlCache();
  let calls = 0;
  const loader = () => new Promise((resolve) => setTimeout(() => { calls += 1; resolve('ok'); }, 20));

  const results = await Promise.all([1, 2, 3, 4, 5].map(() => cache.getOrLoad('k', 1000, loader)));
  assert.deepEqual(results, ['ok', 'ok', 'ok', 'ok', 'ok']);
  assert.equal(calls, 1);
  assert.equal(cache.stats().shared, 4);
});

test('los errores NO se guardan: el siguiente intento vuelve a llamar', async () => {
  const cache = createTtlCache();
  let calls = 0;

  await assert.rejects(cache.getOrLoad('k', 1000, async () => { calls += 1; throw new Error('boom'); }), /boom/);
  assert.equal(cache.size(), 0);
  assert.equal(await cache.getOrLoad('k', 1000, async () => { calls += 1; return 'recuperado'; }), 'recuperado');
  assert.equal(calls, 2);
});

test('el TTL puede depender del valor', async () => {
  const now = clock();
  const cache = createTtlCache({ now });
  await cache.getOrLoad('k', (v) => (v === 'corto' ? 10 : 1000), async () => 'corto');
  now.advance(11);
  assert.equal(cache.get('k'), undefined);
});

test('respeta maxEntries descartando la menos usada recientemente', () => {
  const cache = createTtlCache({ maxEntries: 2 });
  cache.set('a', 1, 1000);
  cache.set('b', 2, 1000);
  cache.get('a'); // 'a' pasa a ser la más reciente
  cache.set('c', 3, 1000); // expulsa a 'b'
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.size(), 2);
});

test('el limitador de concurrencia nunca excede el máximo y ejecuta todo', async () => {
  const run = createConcurrencyLimiter(3);
  let active = 0;
  let peak = 0;
  const task = async (i) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 5));
    active -= 1;
    return i;
  };

  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => run(() => task(i))));
  assert.deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(peak, 3);
});

test('el limitador sigue funcionando después de una tarea que falla', async () => {
  const run = createConcurrencyLimiter(1);
  await assert.rejects(run(async () => { throw new Error('x'); }), /x/);
  assert.equal(await run(async () => 'ok'), 'ok');
});
