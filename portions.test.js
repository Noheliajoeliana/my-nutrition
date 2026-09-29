import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, parseGrams } from '../public/portions.js';

const portionsOf = (input) =>
  Object.fromEntries(calculate(input).groups.map((g) => [g.id, g.portions]));

test('Prueba 1: G8 C33 P3, no lácteo', () => {
  assert.deepEqual(portionsOf({ fat: 8, carbs: 33, protein: 3 }),
    { lacteo: 0, almidon: 2, proteina: 0, grasa: 1.5 });
});

test('Prueba 2: G8 C21 P2, no lácteo', () => {
  assert.deepEqual(portionsOf({ fat: 8, carbs: 21, protein: 2 }),
    { lacteo: 0, almidon: 1.5, proteina: 0, grasa: 1.5 });
});

test('Prueba 3: G1 C9 P20, lácteo (0.75 sube a 1)', () => {
  assert.deepEqual(portionsOf({ fat: 1, carbs: 9, protein: 20, dairy: true }),
    { lacteo: 1, almidon: 0, proteina: 1.5, grasa: 0 });
});

test('Prueba 4: P6 G6.2 C9.2, lácteo', () => {
  assert.deepEqual(portionsOf({ protein: 6, fat: 6.2, carbs: 9.2, dairy: true }),
    { lacteo: 1, almidon: 0, proteina: 0, grasa: 0.5 });
});

test('Lácteo: 0 g y 3 g de grasa dan lo mismo; más de 3 g deja grasa aparte', () => {
  const base = { carbs: 12, protein: 8, dairy: true };
  assert.deepEqual(portionsOf({ ...base, fat: 0 }), portionsOf({ ...base, fat: 3 }));
  assert.equal(portionsOf({ ...base, fat: 8 }).grasa, 1);
});

test('Sin marcar lácteo, nunca hay porciones de lácteo', () => {
  assert.equal(portionsOf({ carbs: 24, protein: 16, fat: 6 }).lacteo, 0);
});

test('Los gramos nunca quedan negativos', () => {
  const { left } = calculate({ carbs: 33, protein: 3, fat: 8 });
  assert.ok(Object.values(left).every((g) => g >= 0));
});

test('parseGrams: coma, vacío e inválidos', () => {
  assert.equal(parseGrams('12,5'), 12.5);
  assert.equal(parseGrams('.5'), 0.5);
  assert.equal(parseGrams(''), 0);
  for (const bad of ['-1', 'abc', '1e3', '1,2,3', '1001', '0x10']) {
    assert.ok(Number.isNaN(parseGrams(bad)), `${bad} debe ser inválido`);
  }
});
