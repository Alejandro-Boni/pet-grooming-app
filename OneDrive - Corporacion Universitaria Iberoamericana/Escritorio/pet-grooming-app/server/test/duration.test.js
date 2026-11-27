const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDurationMinutes } = require('../src/utils/duration');

test('redondea hacia arriba al bloque de 15 minutos', () => {
  assert.equal(calculateDurationMinutes(45, 'pequeño'), 45); // 33.75 → 45
  assert.equal(calculateDurationMinutes(60, 'mediano'), 60);
  assert.equal(calculateDurationMinutes(15, 'grande'), 30); // 22.5 → 30
});

test('un servicio genérico escala por tamaño (incluye gigante)', () => {
  assert.equal(calculateDurationMinutes(30, 'grande', 'Deslanado'), 45);
  assert.equal(calculateDurationMinutes(30, 'gigante', 'Deslanado'), 45);
  assert.equal(calculateDurationMinutes(30, 'tamaño-desconocido', 'Deslanado'), 30);
});

test('REGRESIÓN: servicios con el tamaño en el nombre no se escalan dos veces', () => {
  // Antes: 105 × 1.5 = 165 min. La base de "perro grande" ya está pensada para ese tamaño.
  assert.equal(calculateDurationMinutes(105, 'grande', 'Baño y corte perro grande'), 105);
  assert.equal(calculateDurationMinutes(75, 'grande', 'Baño perro grande'), 75);
  assert.equal(calculateDurationMinutes(45, 'pequeño', 'Baño perro pequeño'), 45);
  assert.equal(calculateDurationMinutes(120, 'gigante', 'Baño y corte perro gigante'), 120);
});

test('los servicios de gato siguen escalando por tamaño del animal', () => {
  assert.equal(calculateDurationMinutes(40, 'pequeño', 'Baño gato pelo corto'), 30);
});
