const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// slots.js importa el pool de PostgreSQL; para probar la lógica pura no hace falta (ni se
// quiere) una base de datos, así que se sustituye el módulo antes de cargarlo.
const poolPath = require.resolve('../src/db/pool');
require.cache[poolPath] = { id: poolPath, filename: poolPath, loaded: true, exports: { query: async () => ({ rows: [] }) } };

const { hasTravelBuffer, rangesOverlap, minutesToTime, timeToMinutes } = require('../src/utils/slots');

test('rangesOverlap: citas contiguas no se solapan', () => {
  assert.equal(rangesOverlap(540, 600, 600, 660), false);
  assert.equal(rangesOverlap(540, 601, 600, 660), true);
  assert.equal(rangesOverlap(540, 660, 570, 600), true);
});

test('conversión hora ↔ minutos', () => {
  assert.equal(timeToMinutes('09:30:00'), 570);
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(minutesToTime(570), '09:30');
});

const appts = [
  { id: 1, start: 540, end: 600 },  // 09:00–10:00
  { id: 2, start: 840, end: 900 },  // 14:00–15:00
];

test('hasTravelBuffer exige tiempo de traslado desde la cita anterior', () => {
  const travelCache = new Map([[1, { toCandidate: 30, fromCandidate: 30 }], [2, { toCandidate: 30, fromCandidate: 30 }]]);
  assert.equal(hasTravelBuffer({ candidateStart: 620, candidateEnd: 680, sortedAppointments: appts, travelCache }), false); // 20 < 30
  assert.equal(hasTravelBuffer({ candidateStart: 630, candidateEnd: 690, sortedAppointments: appts, travelCache }), true);  // 30 ok
});

test('hasTravelBuffer exige tiempo de traslado hacia la cita siguiente', () => {
  const travelCache = new Map([[1, { toCandidate: 30, fromCandidate: 45 }], [2, { toCandidate: 30, fromCandidate: 45 }]]);
  assert.equal(hasTravelBuffer({ candidateStart: 700, candidateEnd: 800, sortedAppointments: appts, travelCache }), false); // 40 < 45
  assert.equal(hasTravelBuffer({ candidateStart: 700, candidateEnd: 795, sortedAppointments: appts, travelCache }), true);  // 45 ok
});

test('sin caché usa el buffer conservador de 60 minutos', () => {
  assert.equal(hasTravelBuffer({ candidateStart: 650, candidateEnd: 700, sortedAppointments: appts, travelCache: new Map() }), false);
  assert.equal(hasTravelBuffer({ candidateStart: 660, candidateEnd: 700, sortedAppointments: appts, travelCache: new Map() }), true);
});

test('sin citas ese día siempre hay espacio', () => {
  assert.equal(hasTravelBuffer({ candidateStart: 540, candidateEnd: 600, sortedAppointments: [], travelCache: new Map() }), true);
});

const { toSortedAppointments, findNeighbors } = require('../src/utils/slots');

const rows = [
  { id: 2, start_time: '14:00:00', end_time: '15:00:00', lat: '4.70', lng: '-74.10' },
  { id: 1, start_time: '09:00:00', end_time: '10:00:00', lat: '4.60', lng: '-74.00' },
];

test('toSortedAppointments ordena por inicio y calcula minutos', () => {
  const sorted = toSortedAppointments(rows);
  assert.deepEqual(sorted.map((a) => [a.id, a.start, a.end]), [[1, 540, 600], [2, 840, 900]]);
  assert.equal(sorted[0].startTimeStr, '09:00:00');
});

test('findNeighbors elige la cita anterior y la siguiente (null si no hay)', () => {
  const sorted = toSortedAppointments(rows);
  const mid = findNeighbors(sorted, 660, 720); // 11:00–12:00
  assert.equal(mid.previous.id, 1);
  assert.equal(mid.next.id, 2);
  assert.deepEqual(findNeighbors(sorted, 420, 480), { previous: null, next: sorted[0] });
  assert.deepEqual(findNeighbors(sorted, 960, 1020), { previous: sorted[1], next: null });
  assert.deepEqual(findNeighbors([], 540, 600), { previous: null, next: null });
});

test('una cita que termina justo cuando empieza la candidata cuenta como anterior', () => {
  const sorted = toSortedAppointments(rows);
  assert.equal(findNeighbors(sorted, 600, 660).previous.id, 1);
});
