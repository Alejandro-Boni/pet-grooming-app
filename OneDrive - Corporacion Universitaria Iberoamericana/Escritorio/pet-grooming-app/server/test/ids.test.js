const test = require('node:test');
const assert = require('node:assert/strict');
const { parseId } = require('../src/utils/ids');

test('acepta enteros positivos (string o número)', () => {
  assert.equal(parseId('7'), 7);
  assert.equal(parseId(' 42 '), 42);
  assert.equal(parseId(15), 15);
  assert.equal(parseId('2147483647'), 2147483647);
});

test('rechaza todo lo demás', () => {
  for (const bad of ['abc', '1e3', '-1', '0', '1.5', '', ' ', null, undefined, {}, [], true, NaN, 1.5, -3, 0,
    '2147483648', '99999999999', '12abc', '0x10']) {
    assert.equal(parseId(bad), null, `debería rechazar ${JSON.stringify(bad)}`);
  }
});
