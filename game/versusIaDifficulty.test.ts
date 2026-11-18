import test from 'node:test';
import assert from 'node:assert/strict';
import { VS_IA_BASE_HP, VERSUS_IA_DIFFICULTIES, versusIaDifficulty, versusIaPlayerHp } from './versusIaDifficulty.ts';

test('Normal 20 PV, Difícil 15 PV y Extremo 5 PV contra rival de 20 PV', () => {
  assert.equal(VS_IA_BASE_HP, 20);
  assert.deepEqual(VERSUS_IA_DIFFICULTIES.map(option => option.hp), [20, 15, 5]);
  assert.equal(versusIaPlayerHp('normal'), 20);
  assert.equal(versusIaPlayerHp('dificil'), 15);
  assert.equal(versusIaPlayerHp('extremo'), 5);
});
test('Enlaces directos, valores inválidos y campañas conservan Normal', () => {
  for (const value of [undefined, null, '', 'imposible', 0, { hp: 999 }]) {
    assert.equal(versusIaDifficulty(value), 'normal');
    assert.equal(versusIaPlayerHp(value), 20);
  }
});
