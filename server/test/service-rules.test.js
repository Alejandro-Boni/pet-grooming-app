const test = require('node:test');
const assert = require('node:assert/strict');
const { isServiceAvailableForPet } = require('../src/utils/service-rules');
const { calculateServicePrice } = require('../src/utils/pricing');

const svc = (name) => ({ name });

test('un perro gigante puede reservar los servicios "perro gigante"', () => {
  const pet = { species: 'perro', size: 'gigante' };
  assert.equal(isServiceAvailableForPet(svc('Baño perro gigante'), pet), true);
  assert.equal(isServiceAvailableForPet(svc('Baño y corte perro gigante'), pet), true);
  assert.equal(isServiceAvailableForPet(svc('Baño perro grande'), pet), false);
});

test('el tamaño del perro debe coincidir con el del servicio', () => {
  assert.equal(isServiceAvailableForPet(svc('Baño perro pequeño'), { species: 'perro', size: 'grande' }), false);
  assert.equal(isServiceAvailableForPet(svc('Baño perro mediano'), { species: 'perro', size: 'mediano' }), true);
});

test('servicios genéricos están disponibles para perros y gatos', () => {
  assert.equal(isServiceAvailableForPet(svc('Corte de uñas'), { species: 'perro', size: 'grande' }), true);
  assert.equal(isServiceAvailableForPet(svc('Corte de uñas'), { species: 'gato', size: 'pequeño' }), true);
});

test('los gatos no ven servicios de perro y viceversa', () => {
  assert.equal(isServiceAvailableForPet(svc('Baño perro mediano'), { species: 'gato', size: 'mediano' }), false);
  assert.equal(isServiceAvailableForPet(svc('Baño gato pelo largo'), { species: 'perro', size: 'mediano' }), false);
});

test('precio: servicios por tamaño no se multiplican; los genéricos sí', () => {
  assert.equal(calculateServicePrice(100000, 'grande', 'Baño perro grande'), 100000);
  assert.equal(calculateServicePrice(20000, 'grande', 'Deslanado'), 30000);
  assert.equal(calculateServicePrice(20000, 'gigante', 'Deslanado'), 30000);
  assert.equal(calculateServicePrice(20000, 'pequeño', 'Deslanado'), 20000);
});
