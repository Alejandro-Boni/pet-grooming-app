const test = require('node:test');
const assert = require('node:assert/strict');
const { createGeocoder, normalizeAddress } = require('../src/utils/locationiq');
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

const hit = [{ lat: '4.7110', lon: '-74.0721', display_name: 'Calle 100 #15-20, Bogotá, Colombia' }];

function build(fetchImpl, extra = {}) {
  const calls = [];
  const geocoder = createGeocoder({
    fetchImpl: async (...a) => { calls.push(a[0]); return fetchImpl(...a); },
    getApiKey: () => 'KEY',
    cache: createTtlCache(),
    logger: silent,
    ...extra,
  });
  return { geocoder, calls };
}

test('normaliza mayúsculas, espacios y bordes', () => {
  assert.equal(normalizeAddress('  Calle   100  #15-20 '), 'calle 100 #15-20');
});

test('geocodifica y devuelve lat/lng numéricos', async () => {
  const { geocoder } = build(async () => ({ ok: true, json: async () => hit }));
  assert.deepEqual(await geocoder.geocodeAddress('Calle 100 #15-20'), {
    lat: 4.711, lng: -74.0721, formattedAddress: 'Calle 100 #15-20, Bogotá, Colombia',
  });
});

test('la misma dirección (con distinto formato) se consulta una sola vez', async () => {
  const { geocoder, calls } = build(async () => ({ ok: true, json: async () => hit }));
  await geocoder.geocodeAddress('Calle 100 #15-20');
  await geocoder.geocodeAddress('  calle  100 #15-20 ');
  assert.equal(calls.length, 1);
});

test('quien llama no puede mutar lo que está en caché', async () => {
  const { geocoder } = build(async () => ({ ok: true, json: async () => hit }));
  const first = await geocoder.geocodeAddress('Calle 100');
  first.lat = 0;
  assert.equal((await geocoder.geocodeAddress('Calle 100')).lat, 4.711);
});

test('dirección no encontrada: mensaje claro y no se guarda', async () => {
  let empty = true;
  const { geocoder, calls } = build(async () => ({ ok: true, json: async () => (empty ? [] : hit) }));
  await assert.rejects(geocoder.geocodeAddress('xyz'), /No se encontró esa dirección/);
  empty = false;
  assert.equal((await geocoder.geocodeAddress('xyz')).lat, 4.711);
  assert.equal(calls.length, 2);
});

test('timeout: mensaje en español para el usuario', async () => {
  const { geocoder } = build(hangingFetch, { timeoutMs: 20 });
  await assert.rejects(geocoder.geocodeAddress('Calle 1'), /tardó demasiado/);
});

test('error HTTP del proveedor: mensaje amable, sin exponer el código interno', async () => {
  const { geocoder } = build(async () => ({ ok: false, status: 429 }));
  await assert.rejects(geocoder.geocodeAddress('Calle 1'), (err) => {
    assert.match(err.message, /No se pudo consultar el servicio de direcciones/);
    assert.doesNotMatch(err.message, /429|LocationIQ/);
    return true;
  });
});

test('sin API key falla antes de tocar la red', async () => {
  const calls = [];
  const geocoder = createGeocoder({ fetchImpl: async (u) => { calls.push(u); return { ok: true, json: async () => hit }; }, getApiKey: () => '', logger: silent });
  await assert.rejects(geocoder.geocodeAddress('Calle 1'), /LOCATIONIQ_API_KEY/);
  assert.equal(calls.length, 0);
});
