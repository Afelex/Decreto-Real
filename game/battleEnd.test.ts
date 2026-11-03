import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBattleEnd } from './battleEnd.ts';

const normal = { playerHP: 20, opponentHP: 20, playerImpactLevel: 0, opponentImpactLevel: 0 };

test('solo se muestra el banner cuando hay un vencedor', () => {
  assert.equal(resolveBattleEnd(normal), null);
});

test('victoria al dejar sin vida al rival', () => {
  assert.deepEqual(resolveBattleEnd({ ...normal, opponentHP: 0 }), {
    phase: 'VICTORY', reason: 'RIVAL_HP_ZERO', title: 'Victoria',
    message: 'Los puntos de vida de tu rival llegaron a 0',
  });
});

test('victoria por Decreto Final tiene prioridad si también deja al rival con 0 de vida', () => {
  assert.deepEqual(resolveBattleEnd({ ...normal, opponentHP: 0, playerImpactLevel: 4 }), {
    phase: 'VICTORY', reason: 'PLAYER_FINAL_DECREE', title: 'Victoria',
    message: 'Victoria por Decreto Final',
  });
});

test('derrota al quedar sin vida', () => {
  assert.deepEqual(resolveBattleEnd({ ...normal, playerHP: 0 }), {
    phase: 'DEFEAT', reason: 'PLAYER_HP_ZERO', title: 'Derrota',
    message: 'Tus puntos de vida llegaron a 0',
  });
});

test('derrota por Decreto Final del rival', () => {
  assert.deepEqual(resolveBattleEnd({ ...normal, playerHP: 0, opponentImpactLevel: 4 }), {
    phase: 'DEFEAT', reason: 'OPPONENT_FINAL_DECREE', title: 'Derrota',
    message: 'Tu rival invocó el Decreto Final',
  });
});

test('rendición voluntaria: derrota sin reducir artificialmente los 20 HP', async () => {
  const { resolveSurrender } = await import('./battleEnd.ts');
  assert.deepEqual(resolveSurrender(), {
    phase: 'DEFEAT', reason: 'PLAYER_SURRENDER', title: 'Derrota', message: 'Te has rendido.',
  });
});

test('victoria automática de QA no simula un Decreto Final', async () => {
  const { resolveDevelopmentVictory } = await import('./battleEnd.ts');
  assert.deepEqual(resolveDevelopmentVictory(), {
    phase: 'VICTORY', reason: 'DEVELOPMENT_VICTORY', title: 'Victoria', message: 'Victoria automática de prueba.',
  });
});
