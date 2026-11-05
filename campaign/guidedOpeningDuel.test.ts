import assert from 'node:assert/strict';
import test from 'node:test';
import { GUIDED_STEPS, guidedDuelAt, GUIDED_CARD_POOL } from './guidedOpeningDuel.ts';

test('tutorial starts with four cards, full health, no impacts and no cheated victory',()=>{
  const s=guidedDuelAt(0);
  assert.equal(s.playerHp,20);
  assert.equal(s.rivalHp,20);
  assert.deepEqual(s.hand,['attack1','attack2','impact1','impact2']);
  assert.equal(s.won,false);
  assert.equal(s.impacts,0);
});
test('guided cards exist and each step selects a real known card',()=>{
  for(const step of GUIDED_STEPS.filter(x=>x.action && /^(attack|impact|defense|order)/.test(x.action))){
    assert.ok(GUIDED_CARD_POOL.find(c=>c.id===step.action),step.id);
  }
});
test('every scripted response is nonlethal; final impact guarantees victory',()=>{
  for(let i=0;i<GUIDED_STEPS.length-1;i++){
    const s=guidedDuelAt(i);
    assert.ok(s.playerHp>0,'player dead at step '+i);
    assert.equal(s.won,false);
  }
  const before=guidedDuelAt(GUIDED_STEPS.length-2);
  assert.equal(before.impacts,3);
  assert.equal(before.rivalHp,10);
  const after=guidedDuelAt(GUIDED_STEPS.length-1);
  assert.equal(after.impacts,4);
  assert.equal(after.rivalHp,0);
  assert.equal(after.won,true);
  assert.ok(after.playerHp>0);
});
test('repeated projection is deterministic and never exceeds maximum HP',()=>{
  const outputs=GUIDED_STEPS.map((_,i)=>guidedDuelAt(i));
  assert.deepEqual(outputs,GUIDED_STEPS.map((_,i)=>guidedDuelAt(i)));
  for(const state of outputs){assert.ok(state.playerHp<=20&&state.rivalHp<=20);}
});
