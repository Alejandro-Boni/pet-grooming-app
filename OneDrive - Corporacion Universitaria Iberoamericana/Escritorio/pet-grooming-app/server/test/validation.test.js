const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePet, validateSetting, validateCoords } = require('../src/utils/validation');

const base = { name: 'Max', species: 'perro', size: 'mediano' };

test('mascota válida mínima: opcionales a null y banderas a false', () => {
  const { value } = validatePet(base);
  assert.deepEqual(value, {
    name: 'Max', species: 'perro', size: 'mediano', breed: null, ageYears: null, weightKg: null,
    allergyNotes: null, medicalConditions: null, isReactive: false, isAllergic: false, isGeriatric: false,
  });
});

test('mascota completa se normaliza (strings numéricos del formulario, espacios)', () => {
  const { value } = validatePet({
    ...base, name: '  Luna ', species: 'gato', size: 'gigante', breed: ' Criollo ', ageYears: '3.5', weightKg: '12',
    isReactive: 1, isAllergic: true, allergyNotes: ' pollo ', isGeriatric: 0, medicalConditions: '',
  });
  assert.equal(value.name, 'Luna');
  assert.equal(value.breed, 'Criollo');
  assert.equal(value.ageYears, 3.5);
  assert.equal(value.weightKg, 12);
  assert.equal(value.allergyNotes, 'pollo');
  assert.equal(value.medicalConditions, null);
  assert.equal(value.isReactive, true);
  assert.equal(value.isGeriatric, false);
  assert.equal(value.size, 'gigante');
});

test('campos obligatorios: mismo mensaje de siempre', () => {
  for (const body of [{}, { ...base, name: '' }, { ...base, name: '   ' }, { ...base, species: undefined }, { ...base, size: null }]) {
    assert.equal(validatePet(body).error, 'Nombre, especie y tamaño son obligatorios');
  }
});

test('REGRESIÓN: valores fuera de catálogo dan 400 (antes llegaban al CHECK de la base → 500)', () => {
  assert.match(validatePet({ ...base, species: 'conejo' }).error, /especie/);
  assert.match(validatePet({ ...base, size: 'enorme' }).error, /tamaño/);
  assert.match(validatePet({ ...base, ageYears: '-1' }).error, /edad/);
  assert.match(validatePet({ ...base, ageYears: '200' }).error, /edad/);
  assert.match(validatePet({ ...base, weightKg: 'mucho' }).error, /peso/);
  assert.match(validatePet({ ...base, weightKg: '1000' }).error, /peso/);
  assert.match(validatePet({ ...base, name: 'x'.repeat(81) }).error, /80/);
  assert.match(validatePet({ ...base, medicalConditions: 'x'.repeat(1001) }).error, /1000/);
});

test('edad o peso en 0 o vacío se guardan como null (comportamiento previo)', () => {
  assert.equal(validatePet({ ...base, ageYears: 0, weightKg: '' }).value.ageYears, null);
  assert.equal(validatePet({ ...base, ageYears: 0, weightKg: '' }).value.weightKg, null);
});

test('REGRESIÓN: max_concurrent_pets solo admite enteros 1–10', () => {
  assert.equal(validateSetting('max_concurrent_pets', '1').value, '1');
  assert.equal(validateSetting('max_concurrent_pets', 3).value, '3');
  assert.equal(validateSetting('max_concurrent_pets', ' 10 ').value, '10');
  for (const bad of ['abc', '', '0', '11', '-2', '1.5', '2e1', null, undefined, true, {}, []]) {
    assert.ok(validateSetting('max_concurrent_pets', bad).error, `debería rechazar ${JSON.stringify(bad)}`);
  }
});

test('claves de ajustes desconocidas se rechazan (incluidas las del prototipo)', () => {
  assert.equal(validateSetting('cualquier_cosa', '1').error, 'Ese ajuste no existe.');
  assert.equal(validateSetting('__proto__', '1').error, 'Ese ajuste no existe.');
  assert.equal(validateSetting('constructor', '1').error, 'Ese ajuste no existe.');
  assert.equal(validateSetting('toString', '1').error, 'Ese ajuste no existe.');
});

test('coordenadas: Bogotá, Cartagena y San Andrés son válidas (números o strings)', () => {
  assert.deepEqual(validateCoords(4.711, -74.0721).value, { lat: 4.711, lng: -74.0721 });
  assert.deepEqual(validateCoords('4.711000', '-74.072100').value, { lat: 4.711, lng: -74.0721 });
  assert.ok(validateCoords(10.391, -75.479).value);
  assert.ok(validateCoords(12.584, -81.7).value);
});

test('coordenadas absurdas o de otro país se rechazan', () => {
  for (const [la, lo] of [[NaN, -74], [4.7, 'x'], [null, null], [undefined, -74], ['', ''], [true, false],
    [0, 0], [40.4, -3.7], [-33.4, -70.6], [95, -74], [4.7, 200], [Infinity, -74]]) {
    assert.ok(validateCoords(la, lo).error, `debería rechazar ${la},${lo}`);
  }
});
