const test = require('node:test');
const assert = require('node:assert/strict');
const { createTomTomClient, TODAY_TTL_MS, FUTURE_TTL_MS } = require('../src/utils/tomtom');
const { createTtlCache } = require('../src/utils/ttl-cache');

const silent = { info() {}, error() {} };

// Un fetch que nunca responde. AbortSignal.timeout() usa un temporizador que no mantiene vivo
// el proceso (en producción lo mantiene el servidor HTTP), así que aquí se agrega uno propio.
function hangingFetch(url, { signal }) {
  return new Promise((_, reject) => {
    const keepAlive = setInterval(() => {}, 50);
    signal.addEventListener('abort', () => {
      clearInterval(keepAlive);
      reject(signal.reason);
    });
  });
}

const ok = (seconds) => ({ ok: true, json: async () => ({ routes: [{ summary: { travelTimeInSeconds: seconds } }] }) });

function build(overrides = {}) {
  const calls = [];
  let t = Date.UTC(2026, 10, 10, 15, 0, 0); // 10-nov-2026 10:00 en Bogotá
  const clock = { now: () => new Date(t), advance: (ms) => { t += ms; } };
  const fetchImpl = overrides.fetchImpl || (async (url) => { calls.push(url); return ok(1230); });
  const client = createTomTomClient({
    fetchImpl: async (...a) => { if (!overrides.fetchImpl) return fetchImpl(...a); calls.push(a[0]); return overrides.fetchImpl(...a); },
    getApiKey: () => 'KEY',
    now: clock.now,
    cache: createTtlCache({ now: () => t }),
    logger: silent,
    timeoutMs: overrides.timeoutMs ?? 4000,
    maxConcurrent: overrides.maxConcurrent ?? 3,
  });
  return { client, calls, clock };
}

const A = { lat: 4.65, lng: -74.05 };
const B = { lat: 4.7, lng: -74.1 };
const TODAY = '2026-11-10T11:00:00';
const FUTURE = '2026-11-12T11:00:00';

test('devuelve los minutos redondeados hacia arriba', async () => {
  const { client } = build();
  assert.equal(await client.getTravelMinutes(A, B, TODAY), 21); // 1230 s = 20.5 min
});

test('el mismo trayecto no vuelve a llamar a TomTom', async () => {
  const { client, calls } = build();
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes(A, B, TODAY);
  assert.equal(calls.length, 1);
});

test('coordenadas a menos de ~11 m comparten caché; más lejos, no', async () => {
  const { client, calls } = build();
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes({ lat: 4.650004, lng: -74.050004 }, B, TODAY);
  assert.equal(calls.length, 1);
  await client.getTravelMinutes({ lat: 4.651, lng: -74.05 }, B, TODAY); // ~110 m
  assert.equal(calls.length, 2);
});

test('distinta hora de salida o sentido contrario son consultas distintas', async () => {
  const { client, calls } = build();
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes(A, B, '2026-11-10T14:00:00');
  await client.getTravelMinutes(B, A, TODAY);
  assert.equal(calls.length, 3);
});

test('TTL: hoy 30 min, otros días 6 h', async () => {
  const { client, calls, clock } = build();
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes(A, B, FUTURE);
  assert.equal(calls.length, 2);

  clock.advance(TODAY_TTL_MS - 1);
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes(A, B, FUTURE);
  assert.equal(calls.length, 2); // ambas siguen en caché

  clock.advance(1); // vence la de hoy
  await client.getTravelMinutes(A, B, TODAY);
  await client.getTravelMinutes(A, B, FUTURE);
  assert.equal(calls.length, 3); // solo se repitió la de hoy

  clock.advance(FUTURE_TTL_MS - TODAY_TTL_MS);
  await client.getTravelMinutes(A, B, FUTURE);
  assert.equal(calls.length, 4);
});

test('consultas simultáneas idénticas hacen una sola llamada', async () => {
  const { client, calls } = build({ fetchImpl: async () => { await new Promise((r) => setTimeout(r, 15)); return ok(600); } });
  const results = await Promise.all([1, 2, 3, 4].map(() => client.getTravelMinutes(A, B, TODAY)));
  assert.deepEqual(results, [10, 10, 10, 10]);
  assert.equal(calls.length, 1);
});

test('los errores de TomTom no se guardan en caché', async () => {
  let n = 0;
  const { client, calls } = build({ fetchImpl: async () => (++n === 1 ? { ok: false, status: 500 } : ok(300)) });
  await assert.rejects(client.getTravelMinutes(A, B, TODAY), /respondió 500/);
  assert.equal(await client.getTravelMinutes(A, B, TODAY), 5);
  assert.equal(calls.length, 2);
});

test('timeout: falla rápido en vez de colgarse', async () => {
  const { client } = build({ fetchImpl: hangingFetch, timeoutMs: 30 });
  const started = Date.now();
  await assert.rejects(client.getTravelMinutes(A, B, TODAY));
  assert.ok(Date.now() - started < 1000);
});

test('coordenadas inválidas no gastan una llamada de la cuota', async () => {
  const { client, calls } = build();
  await assert.rejects(client.getTravelMinutes({ lat: NaN, lng: -74 }, B, TODAY), /inválidas/);
  await assert.rejects(client.getTravelMinutes({ lat: null, lng: null }, B, TODAY), /inválidas/);
  await assert.rejects(client.getTravelMinutes({ lat: 95, lng: 0 }, B, TODAY), /inválidas/);
  assert.equal(calls.length, 0);
});

test('acepta lat/lng como string (así los entrega NUMERIC de PostgreSQL)', async () => {
  const { client, calls } = build();
  await client.getTravelMinutes({ lat: '4.650000', lng: '-74.050000' }, B, TODAY);
  await client.getTravelMinutes(A, B, TODAY);
  assert.equal(calls.length, 1);
});

test('sin API key falla antes de tocar la red', async () => {
  const calls = [];
  const client = createTomTomClient({ fetchImpl: async (u) => { calls.push(u); return ok(1); }, getApiKey: () => undefined, logger: silent });
  await assert.rejects(client.getTravelMinutes(A, B, TODAY), /TOMTOM_API_KEY/);
  assert.equal(calls.length, 0);
});

test('máximo 3 llamadas simultáneas a TomTom', async () => {
  let active = 0;
  let peak = 0;
  const fetchImpl = async () => {
    active += 1; peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 10));
    active -= 1;
    return ok(600);
  };
  const { client } = build({ fetchImpl });
  // 8 trayectos distintos a la vez (como el calendario con varias citas en el día)
  await Promise.all(Array.from({ length: 8 }, (_, i) => client.getTravelMinutes({ lat: 4.6 + i * 0.01, lng: -74.05 }, B, TODAY)));
  assert.equal(peak, 3);
});
