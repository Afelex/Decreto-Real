import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCombatAction, playBlockReason, type CombatAction, type CombatState } from './combatEngine.ts';
import { createTutorialCombat, tutorialAllows, tutorialCards, tutorialStep, tutorialTarget, type TutorialStepId } from './tutorial.ts';

function accept(state: CombatState, action: CombatAction) {
  const result = applyCombatAction(state, action);
  assert.equal(result.error, null, JSON.stringify(action)); return result.state;
}

test('the prepared seed still provides the tutorial situation through the normal engine', () => {
  const initial = createTutorialCombat();
  const cards = tutorialCards(initial);
  assert.equal(initial.difficulty, 'Aprendiz'); assert.equal(initial.journal.length, 0);
  let state = accept(initial, { type: 'play', cardId: cards.attack });
  assert.equal(state.enemyHp, 17);
  state = accept(state, { type: 'play', cardId: cards.defense });
  assert.equal(state.shield, 4); assert.equal(state.mana, 1);
  assert.equal(playBlockReason(state, cards.impact), 'mana', 'Impacto I is visibly blocked by mando');
  state = accept(state, { type: 'end_turn' });
  state = accept(state, { type: 'resolve_rival' });
  const attack = state.journal.at(-1)!.events.find(e => e.type === 'attack');
  assert.deepEqual(attack?.data.damageBlocked, 3, 'the rival attacks and the shield absorbs it');
  state = accept(state, { type: 'play', cardId: cards.impact });
  assert.equal(state.seals, 1); assert.equal(state.phase, 'player');
});

test('steps advance one main action at a time and stay complete-able to the end', () => {
  let state = createTutorialCombat();
  const cards = tutorialCards(state);
  const acknowledged = new Set<TutorialStepId>();
  let selected: string | null = null;
  const step = () => tutorialStep({ state, selected, acknowledged }, cards);
  const seen: TutorialStepId[] = [step()];
  const next = () => { const id = step(); if (seen.at(-1) !== id) seen.push(id); return id; };
  acknowledged.add('intro'); assert.equal(next(), 'select');
  assert.equal(tutorialTarget('select', cards, null), cards.attack);
  for (const other of state.hand.filter(c => c.id !== cards.attack)) assert.equal(tutorialAllows('select', cards, { kind: 'select', cardId: other.id }), false);
  assert.equal(tutorialAllows('select', cards, { kind: 'end_turn' }), false);
  selected = cards.attack; assert.equal(next(), 'confirm');
  selected = null; assert.equal(step(), 'select', 'cancelling steps back');
  selected = cards.attack;
  state = accept(state, { type: 'play', cardId: cards.attack }); selected = null; assert.equal(next(), 'defend');
  assert.equal(tutorialTarget('defend', cards, null), cards.defense);
  assert.equal(tutorialTarget('defend', cards, cards.defense), 'confirm');
  state = accept(state, { type: 'play', cardId: cards.defense }); assert.equal(next(), 'end_turn');
  assert.equal(tutorialAllows('end_turn', cards, { kind: 'end_turn' }), true);
  state = accept(state, { type: 'end_turn' }); assert.equal(next(), 'rival');
  state = accept(state, { type: 'resolve_rival' }); assert.equal(step(), 'rival', 'waits for the player to read the response');
  acknowledged.add('rival'); assert.equal(next(), 'impact');
  state = accept(state, { type: 'play', cardId: cards.impact }); assert.equal(next(), 'done');
  assert.deepEqual(seen, ['intro', 'select', 'confirm', 'defend', 'end_turn', 'rival', 'impact', 'done']);
  for (const card of state.hand) assert.equal(tutorialAllows('done', cards, { kind: 'play', cardId: card.id }), false);
});

test('restarting creates an identical fresh situation', () => {
  assert.deepEqual(createTutorialCombat(), createTutorialCombat());
});
