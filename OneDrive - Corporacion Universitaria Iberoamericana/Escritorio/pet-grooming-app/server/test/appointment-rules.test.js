const test = require('node:test');
const assert = require('node:assert/strict');
const { toDateKey, nowInBogota } = require('../src/utils/time');
const {
  canCancelAppointment,
  hasAppointmentPassed,
  appointmentStartMs,
} = require('../src/utils/appointment-rules');

const HOUR = 60 * 60 * 1000;
// 21-sep-2026 09:00 en Bogotá (UTC-5) = 14:00 UTC
const START_MS = Date.UTC(2026, 8, 21, 14, 0, 0);

test('toDateKey acepta string y Date (medianoche local, como lo crea pg)', () => {
  assert.equal(toDateKey('2026-09-21'), '2026-09-21');
  assert.equal(toDateKey('2026-09-21T05:00:00.000Z'), '2026-09-21');
  assert.equal(toDateKey(new Date(2026, 8, 21)), '2026-09-21');
  assert.equal(toDateKey(new Date('invalid')), null);
  assert.equal(toDateKey(undefined), null);
});

test('REGRESIÓN: canCancelAppointment funciona con appointment_date como Date', () => {
  // Antes devolvía siempre false (NaN) porque se interpolaba el objeto Date en un string.
  const appt = { appointment_date: new Date(2026, 8, 21), start_time: '09:00:00' };
  assert.equal(Number.isNaN(appointmentStartMs(appt)), false);
  assert.equal(appointmentStartMs(appt), START_MS);
  assert.equal(canCancelAppointment(appt, START_MS - 10 * HOUR), true);
});

test('la ventana de cancelación es de 4 horas (inclusive)', () => {
  const appt = { appointment_date: '2026-09-21', start_time: '09:00:00' };
  assert.equal(canCancelAppointment(appt, START_MS - 4 * HOUR), true);
  assert.equal(canCancelAppointment(appt, START_MS - 4 * HOUR + 1), false);
  assert.equal(canCancelAppointment(appt, START_MS + HOUR), false);
});

test('datos inválidos nunca permiten cancelar', () => {
  assert.equal(canCancelAppointment({ appointment_date: null, start_time: '09:00' }), false);
  assert.equal(canCancelAppointment({ appointment_date: '2026-09-21', start_time: null }), false);
});

test('hasAppointmentPassed compara fecha y hora de fin en hora de Bogotá', () => {
  const now = { date: '2026-09-21', minutes: 10 * 60 };
  assert.equal(hasAppointmentPassed({ appointment_date: '2026-09-20', end_time: '23:00' }, now), true);
  assert.equal(hasAppointmentPassed({ appointment_date: '2026-09-21', end_time: '10:00' }, now), true);
  assert.equal(hasAppointmentPassed({ appointment_date: '2026-09-21', end_time: '10:15' }, now), false);
  assert.equal(hasAppointmentPassed({ appointment_date: new Date(2026, 8, 22), end_time: '08:00' }, now), false);
});

test('nowInBogota usa UTC-5 sin importar la zona del servidor', () => {
  // 21-sep 02:30 UTC = 20-sep 21:30 en Bogotá
  assert.deepEqual(nowInBogota(new Date(Date.UTC(2026, 8, 21, 2, 30))), {
    date: '2026-09-20',
    minutes: 21 * 60 + 30,
  });
  // medianoche en Bogotá (05:00 UTC) no debe dar 24:00
  assert.deepEqual(nowInBogota(new Date(Date.UTC(2026, 8, 21, 5, 0))), {
    date: '2026-09-21',
    minutes: 0,
  });
});
