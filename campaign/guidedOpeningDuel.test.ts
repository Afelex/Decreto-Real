import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUIDED_STEPS, GUIDED_ACTION_CARDS, GUIDED_PLAYER_TOP, GUIDED_RIVAL_TOP,
  arrangeGuidedDeck, guidedActionForCard,
} from './guidedOpeningDuel.ts';

test('opening tutorial maps every guided card action to standard GameBoard IDs', () => {
  const actions=GUIDED_STEPS.filter(s=>s.action && /^(attack|impact|defense|order)/.test(s.action)).map(s=>s.action!);
  assert.deepEqual(actions,['attack1','attack2','attack3','impact1','order','impact2','defense','impact3','impact4']);
  for(const action of actions){
    const id=GUIDED_ACTION_CARDS[action];
    assert.ok(id,action);
    assert.equal(guidedActionForCard(id),action);
  }
});
test('fixed starting hand and draw order uses only real cards from the 28-card deck',()=>{
  const deck = [
    ...Array.from({length:10},(_,i)=>({id:'p1-atk-'+i})),
    ...Array.from({length:10},(_,i)=>({id:'p1-def-'+i})),
    ...Array.from({length:4},(_,i)=>({id:'p1-ord-'+i})),
    ...Array.from({length:4},(_,i)=>({id:'p1-imp-'+(i+1)})),
  ].reverse();
  const arranged=arrangeGuidedDeck(deck,'player');
  assert.deepEqual(arranged.slice(0,GUIDED_PLAYER_TOP.length).map(c=>c.id),[...GUIDED_PLAYER_TOP]);
  assert.equal(arranged.length,28);
  assert.deepEqual(new Set(arranged.map(c=>c.id)),new Set(deck.map(c=>c.id)));
});
test('scripted enemy starts with real Attack cards; deck is still complete',()=>{
  const ids=[
    ...Array.from({length:10},(_,i)=>'ai-atk-'+i),
    ...Array.from({length:10},(_,i)=>'ai-def-'+i),
    ...Array.from({length:4},(_,i)=>'ai-ord-'+i),
    ...Array.from({length:4},(_,i)=>'ai-imp-'+(i+1)),
  ];
  const cards=ids.map(id=>({id}));
  const result=arrangeGuidedDeck(cards,'rival');
  assert.deepEqual(result.slice(0,GUIDED_RIVAL_TOP.length).map(c=>c.id),[...GUIDED_RIVAL_TOP]);
  assert.equal(new Set(result.map(c=>c.id)).size,28);
});
test('invalid decks never create fake cards',()=>{
  assert.throws(()=>arrangeGuidedDeck([{id:'p1-atk-0'}],'player'));
});
test('tutorial climax is the actual fourth Impact, not an automatic forced win',()=>{
  const finalAction=GUIDED_STEPS.filter(s=>s.action).at(-1);
  assert.equal(finalAction?.action,'impact4');
  assert.ok(GUIDED_STEPS.at(-1)?.text.includes('VICTORIA'));
});
