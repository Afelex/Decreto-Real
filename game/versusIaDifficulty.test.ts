import test from 'node:test';
import assert from 'node:assert/strict';
import { VS_IA_BASE_HP, VERSUS_IA_DIFFICULTIES, versusIaDifficulty, versusIaPlayerHp, limitVersusIaPlayerHp } from './versusIaDifficulty.ts';

test('Normal 20 PV, Difícil 15 PV y Extremo 8 PV iniciales; todos conservan 20 PV máximos', () => {
  assert.equal(VS_IA_BASE_HP, 20);
  assert.deepEqual(VERSUS_IA_DIFFICULTIES.map(option => option.hp), [20, 15, 8]);
  assert.equal(versusIaPlayerHp('normal'), 20);
  assert.equal(versusIaPlayerHp('dificil'), 15);
  assert.equal(versusIaPlayerHp('extremo'), 8);
});
test('Las curaciones de todos los niveles pueden alcanzar 20 PV, sin exceder el máximo', () => {
  for (const level of ['normal', 'dificil', 'extremo']) {
    assert.equal(limitVersusIaPlayerHp(30, level), 20);
    assert.equal(limitVersusIaPlayerHp(20, level), 20);
  }
  assert.equal(limitVersusIaPlayerHp(8, 'extremo'), 8);
  assert.equal(limitVersusIaPlayerHp(-2, 'extremo'), 0);
});
test('Enlaces directos, valores inválidos y campañas conservan Normal', () => {
  for (const value of [undefined, null, '', 'imposible', 0, { hp: 999 }]) {
    assert.equal(versusIaDifficulty(value), 'normal');
    assert.equal(versusIaPlayerHp(value), 20);
  }
});
