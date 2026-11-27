const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCorsOptions, parseAllowedOrigins } = require('../src/utils/cors-options');

const decide = (cfg, origin) => new Promise((resolve) => cfg.options.origin(origin, (err, allowed) => resolve(allowed)));

test('sin CLIENT_ORIGIN: no se restringe (comportamiento anterior)', () => {
  for (const v of [undefined, '', '   ', ',,']) {
    const cfg = buildCorsOptions(v);
    assert.equal(cfg.restricted, false);
    assert.deepEqual(cfg.options, {});
  }
});

test('parseAllowedOrigins limpia espacios, barras finales y mayúsculas', () => {
  assert.deepEqual(parseAllowedOrigins(' https://App.vercel.app/ , https://mi-dominio.com '), ['https://app.vercel.app', 'https://mi-dominio.com']);
});

test('con CLIENT_ORIGIN: solo pasan los orígenes de la lista', async () => {
  const cfg = buildCorsOptions('https://mi-app.vercel.app, https://www.mi-dominio.com/');
  assert.equal(cfg.restricted, true);
  assert.equal(await decide(cfg, 'https://mi-app.vercel.app'), true);
  assert.equal(await decide(cfg, 'https://www.mi-dominio.com'), true);
  assert.equal(await decide(cfg, 'https://MI-APP.vercel.app'), true);
  assert.equal(await decide(cfg, 'https://malo.com'), false);
  assert.equal(await decide(cfg, 'https://mi-app.vercel.app.malo.com'), false);
  assert.equal(await decide(cfg, 'http://mi-app.vercel.app'), false); // otro esquema
});

test('las peticiones sin cabecera Origin (health checks, curl) siguen pasando', async () => {
  const cfg = buildCorsOptions('https://mi-app.vercel.app');
  assert.equal(await decide(cfg, undefined), true);
});
