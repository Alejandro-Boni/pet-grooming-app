const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBlackout, splitBlocks } = require('../src/utils/blackouts');

test('bloqueo de día completo (horas vacías) es válido', () => {
  const r = validateBlackout({ date: '2026-12-25', startTime: '', endTime: '', reason: ' Navidad ' });
  assert.deepEqual(r.value, { date: '2026-12-25', startTime: null, endTime: null, reason: 'Navidad' });
});

test('bloqueo por rango normaliza a HH:MM', () => {
  const r = validateBlackout({ date: '2026-12-24', startTime: '14:00:00', endTime: '18:30' });
  assert.deepEqual(r.value, { date: '2026-12-24', startTime: '14:00', endTime: '18:30', reason: null });
});

test('REGRESIÓN: inicio sin fin (o fin sin inicio) se rechaza', () => {
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '14:00', endTime: '' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '', endTime: '14:00' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '14:00' }).error);
});

test('rechaza fecha faltante/inválida, horas inválidas y rangos invertidos', () => {
  assert.ok(validateBlackout({}).error);
  assert.ok(validateBlackout({ date: '2026-02-30' }).error);
  assert.ok(validateBlackout({ date: '25/12/2026' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '25:00', endTime: '26:00' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '18:00', endTime: '14:00' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', startTime: '14:00', endTime: '14:00' }).error);
  assert.ok(validateBlackout({ date: '2026-12-24', reason: 'x'.repeat(201) }).error);
});

test('splitBlocks interpreta filas normales', () => {
  const r = splitBlocks([
    { start_time: '09:00:00', end_time: '11:00:00' },
    { start_time: '15:00:00', end_time: '16:30:00' },
  ]);
  assert.equal(r.wholeDay, false);
  assert.deepEqual(r.ranges, [{ start: 540, end: 660 }, { start: 900, end: 990 }]);
});

test('splitBlocks: start null = día completo', () => {
  assert.equal(splitBlocks([{ start_time: null, end_time: null }]).wholeDay, true);
});

test('REGRESIÓN: una fila con inicio y sin fin ya no lanza error', () => {
  // Antes: timeToMinutes(null) lanzaba TypeError y tumbaba todas las reservas de ese día.
  const r = splitBlocks([{ start_time: '14:00:00', end_time: null }]);
  assert.deepEqual(r.ranges, [{ start: 840, end: 1440 }]);
});
