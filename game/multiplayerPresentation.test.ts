import { test } from 'node:test';
import assert from 'node:assert/strict';
import { multiplayerCueFromState, type MultiplayerCueView } from './multiplayerPresentation.ts';

const state = (revision: number, isMyTurn: boolean, lastEvent: string,
  turnNumber = 1, status: 'playing' | 'finished' = 'playing'): MultiplayerCueView =>
  ({ revision, isMyTurn, lastEvent, turnNumber, status });

test('ambos jugadores reciben sus cintas respectivas al empezar la sala', () => {
  assert.deepEqual(multiplayerCueFromState(null, state(1, true, 'Comienza el duelo.')),
    { kind: 'turn', id: 1, isPlayer: true });
  assert.deepEqual(multiplayerCueFromState(null, state(1, false, 'Comienza el duelo.')),
    { kind: 'turn', id: 1, isPlayer: false });
});

test('cada cambio de turno dispara la cinta roja o azul y no repite estados', () => {
  const before = state(2, true, 'Ana jugó Decreto de Orden.');
  const after = state(3, false, 'Turno de Luis.', 2);
  assert.deepEqual(multiplayerCueFromState(before, after),
    { kind: 'turn', id: 3, isPlayer: false });
  assert.equal(multiplayerCueFromState(after, after), null);
  assert.equal(multiplayerCueFromState(after, { ...after, revision: 2 }), null);
});

test('todos los decretos activan efectos de vídeo en ambas pantallas', () => {
  const cards = [
    ['Decreto de Ataque', 'ATTACK'],
    ['Decreto de Defensa', 'DEFENSE'],
    ['Decreto de Orden', 'ORDER'],
    ['Impacto 1', 'IMPACT'],
    ['Impacto Final', 'IMPACT'],
  ] as const;
  for (const [label, cardType] of cards) {
    for (const isPlayer of [true, false]) {
      const lastEvent = 'Ana jugó ' + label + '.';
      const before = state(3, isPlayer, 'Comienza el duelo.');
      const after = state(4, isPlayer, lastEvent, 1,
        label === 'Impacto Final' ? 'finished' : 'playing');
      const cue = multiplayerCueFromState(before, after);
      assert.ok(cue && cue.kind === 'card');
      assert.equal(cue.isPlayer, isPlayer);
      assert.equal(cue.cardType, cardType);
      if (cue.cardType === 'IMPACT')
        assert.equal(cue.rank, label === 'Impacto Final' ? 4 : 1);
    }
  }
});

test('un combo o una reconexión sin nueva carta no inventan vídeo de decreto', () => {
  const before = state(4, true, 'Ana jugó Decreto de Ataque.');
  assert.equal(multiplayerCueFromState(before,
    state(5, true, 'Ana: combo ×2, -1 vida rival.')), null);
  assert.equal(multiplayerCueFromState(before, before), null);
});
