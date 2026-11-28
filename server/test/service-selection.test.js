const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateServiceTotals } = require('../src/utils/service-selection');

const services = [
  { name: 'Baño', price_cop: 10000, base_duration_minutes: 45 },
  { name: 'Corte de uñas', price_cop: 20000, base_duration_minutes: 30 },
];

test('suma precio y duración ajustados al tamaño para varios servicios', () => {
  assert.deepEqual(calculateServiceTotals(services, 'pequeño'), {
    finalPriceCop: 30000,
    durationMinutes: 75,
  });
  assert.deepEqual(calculateServiceTotals(services, 'grande'), {
    finalPriceCop: 45000,
    durationMinutes: 120,
  });
});
