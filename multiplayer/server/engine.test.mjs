import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, createMatch, act, viewFor } from './engine.mjs';

const deterministic = () => 0;
const match = () => createMatch(['Uno','Dos'], deterministic);

test('each deck has 28 cards and correct counts', () => {
  const deck = createDeck('t', deterministic);
  assert.equal(deck.length, 28);
  for (const [type, count] of [['ATTACK', 10], ['DEFENSE', 10], ['ORDER', 4], ['IMPACT', 4]])
    assert.equal(deck.filter(c => c.type === type).length, count);
});

test('turn validation and redaction', () => {
  const m = match(), slot = m.turn, other = 1-slot;
  const snapshot = JSON.stringify(m);
  assert.match(act(m, other, { type: 'end_turn' }), /turno/);
  assert.equal(JSON.stringify(m), snapshot);
  const own = viewFor(m, slot);
  const rival = viewFor(m, other);
  assert.equal(own.me.hand.length, 4);
  assert.equal(rival.opponent.handCount, 4);
  assert.equal(rival.opponent.hand, undefined);
  assert.equal(own.me.deck, undefined);
});

test('invalid card and wrong impact rank cannot change state', () => {
  const m = match(), slot = m.turn;
  const before = JSON.stringify(m);
  assert.match(act(m, slot, { type:'play', cardId:'bogus' }), /carta/);
  assert.equal(JSON.stringify(m), before);
  m.players[slot].hand.unshift({ id:'impact4', type:'IMPACT', rank:4 });
  const next = JSON.stringify(m);
  assert.match(act(m, slot, { type:'play', cardId:'impact4' }), /orden/);
  assert.equal(JSON.stringify(m), next);
});

test('attack, combo and handover', () => {
  const m = match(), slot = m.turn;
  m.players[slot].hand = [{id:'a',type:'ATTACK'}, {id:'b',type:'ATTACK'}, {id:'c',type:'ATTACK'}];
  assert.equal(act(m, slot, {type:'play',cardId:'a'}), null);
  assert.equal(m.players[1-slot].hp, 18);
  assert.equal(act(m, slot, {type:'play',cardId:'b'}), null);
  assert.equal(m.pendingCombo.level, 2);
  assert.match(act(m, slot, {type:'end_turn'}), /combo/);
  assert.equal(act(m, slot, {type:'combo',choice:'DAMAGE'}), null);
  assert.equal(m.players[1-slot].hp, 15);
  assert.equal(act(m, slot, {type:'play',cardId:'c'}), null);
  assert.equal(m.pendingCombo.level, 3);
  assert.equal(act(m, slot, {type:'combo',choice:'HEAL'}), null);
  assert.equal(m.players[slot].comboCount, 0);
  assert.equal(act(m, slot, {type:'end_turn'}), null);
  assert.equal(m.turn, 1-slot);
});

test('impact final wins and surrender', () => {
  const m = match(), slot = m.turn;
  m.players[slot].impact=3;
  m.players[slot].hand=[{id:'imp4',type:'IMPACT',rank:4}];
  assert.equal(act(m,slot,{type:'play',cardId:'imp4'}), null);
  assert.equal(viewFor(m,slot).winner,'me');
  assert.equal(viewFor(m,1-slot).winner,'opponent');
  assert.match(act(m,slot,{type:'end_turn'}),/activa/);
  const n = match();
  assert.equal(act(n,0,{type:'surrender'}),null);
  assert.equal(n.winner,1);
});
