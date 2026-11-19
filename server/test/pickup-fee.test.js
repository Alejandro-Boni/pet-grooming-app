const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateLatePickupFee } = require('../src/utils/pickup-fee');

const finishedAt = new Date('2026-11-18T12:00:00Z');
const minutesLater = (minutes) =>
  new Date(finishedAt.getTime() + minutes * 60 * 1000);

test('no cobra dentro de los 15 minutos de cortesía', () => {
  assert.equal(calculateLatePickupFee(finishedAt, minutesLater(15)), 0);
});

test('cobra un bloque iniciado después de la cortesía', () => {
  assert.equal(calculateLatePickupFee(finishedAt, minutesLater(15.1)), 5000);
  assert.equal(calculateLatePickupFee(finishedAt, minutesLater(30)), 5000);
});

test('cobra otro bloque al iniciar los siguientes 15 minutos', () => {
  assert.equal(calculateLatePickupFee(finishedAt, minutesLater(30.1)), 10000);
});

test('no aplica recargos retroactivos si no hay hora de finalización registrada', () => {
  assert.equal(calculateLatePickupFee(null, minutesLater(60)), 0);
});

test('rechaza fechas inválidas', () => {
  assert.throws(
    () => calculateLatePickupFee('fecha-invalida', minutesLater(60)),
    /fechas.*válidas/i
  );
});
