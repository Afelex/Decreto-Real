import assert from 'node:assert/strict';
import test from 'node:test';
import { nextDecreeStreak } from './decreeStreak.ts';

test('el primer decreto o cambio de tipo muestra x1 sin marcador', () => {
  assert.equal(nextDecreeStreak(null, 0, 'ATTACK'), 1);
  assert.equal(nextDecreeStreak('ATTACK', 2, 'DEFENSE'), 1);
});
test('racha de cualquier decreto: Ataque, Defensa, Orden, Impacto, Místico', () => {
  for (const type of ['ATTACK','DEFENSE','ORDER','IMPACT','MYSTIC'] as const) {
    assert.equal(nextDecreeStreak(type, 1, type), 2);
    assert.equal(nextDecreeStreak(type, 2, type), 3);
    assert.equal(nextDecreeStreak(type, 3, type), 3);
  }
});
test('tras un combo ×3 consumido, la próxima carta comienza una nueva racha', () => {
  assert.equal(nextDecreeStreak(null, 0, 'ATTACK'), 1);
});
