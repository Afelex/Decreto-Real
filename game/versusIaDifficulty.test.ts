import test from 'node:test';
import assert from 'node:assert/strict';
import { VS_IA_BASE_HP, VERSUS_IA_DIFFICULTIES, versusIaDifficulty, versusIaPlayerHp, limitVersusIaPlayerHp } from './versusIaDifficulty.ts';

test('Normal 20 PV, Difícil 15 PV y Extremo 5 PV contra rival de 20 PV', () => {
  assert.equal(VS_IA_BASE_HP, 20);
  assert.deepEqual(VERSUS_IA_DIFFICULTIES.map(option => option.hp), [20, 15, 5]);
  assert.equal(versusIaPlayerHp('normal'), 20);
  assert.equal(versusIaPlayerHp('dificil'), 15);
  assert.equal(versusIaPlayerHp('extremo'), 5);
});
test('Las curaciones de cada nivel no pueden superar la vida máxima inicial', () => {
  assert.equal(limitVersusIaPlayerHp(30, 'normal'), 20);
  assert.equal(limitVersusIaPlayerHp(30, 'dificil'), 15);
  assert.equal(limitVersusIaPlayerHp(30, 'extremo'), 5);
  assert.equal(limitVersusIaPlayerHp(-2, 'extremo'), 0);
});
test('Enlaces directos, valores inválidos y campañas conservan Normal', () => {
  for (const value of [undefined, null, '', 'imposible', 0, { hp: 999 }]) {
    assert.equal(versusIaDifficulty(value), 'normal');
    assert.equal(versusIaPlayerHp(value), 20);
  }
});
