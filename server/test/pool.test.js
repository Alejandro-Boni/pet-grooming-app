const test = require('node:test');
const assert = require('node:assert/strict');

let pg = null;
try { pg = require('pg'); } catch { /* pg no instalado: se omite */ }

test('REGRESIÓN: las columnas DATE llegan como string, no como Date', { skip: !pg && 'pg no está instalado' }, () => {
  require('../src/db/pool'); // registra el type parser
  const parse = pg.types.getTypeParser(1082);
  assert.equal(parse('2026-09-21'), '2026-09-21');
});
