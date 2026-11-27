const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isInServiceArea,
  SERVICE_AREA_VIEWBOX,
} = require('../src/utils/service-area');

test('incluye Bogotá y municipios cercanos dentro del área configurada', () => {
  const locations = [
    [4.711, -74.0721], // Bogotá D.C.
    [4.579, -74.216], // Soacha
    [4.858, -74.058], // Chía
    [4.809, -74.101], // Cota
    [4.716, -74.211], // Funza
    [4.705, -74.23], // Mosquera
    [4.732, -74.265], // Madrid
    [4.918, -74.028], // Cajicá
    [4.72, -73.97], // La Calera
  ];

  for (const [lat, lng] of locations) {
    assert.equal(isInServiceArea(lat, lng), true, `${lat}, ${lng} debe estar dentro del área`);
  }
});

test('excluye Medellín, ubicaciones fuera del área y coordenadas inválidas', () => {
  assert.equal(isInServiceArea(6.2442, -75.5812), false);
  assert.equal(isInServiceArea(5.02, -74.0), false);
  assert.equal(isInServiceArea(Number.NaN, -74.0), false);
});

test('expone el recuadro geográfico en el formato de LocationIQ', () => {
  assert.equal(SERVICE_AREA_VIEWBOX, '-74.32,4.98,-73.85,4.45');
});
