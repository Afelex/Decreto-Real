import assert from 'node:assert/strict';
import test from 'node:test';
import { cardPlacementPrompt, checkCardPlacement } from './cardPlacement.ts';

const attack = { type: 'ATTACK' as const, name: 'Decreto de Ataque' };
const defense = { type: 'DEFENSE' as const, name: 'Decreto de Defensa' };
const impact = (rank: number) => ({ type: 'IMPACT' as const, name: `Impacto ${rank}`, rank });

test('attack and defense activate only on the general battlefield', () => {
  assert.deepEqual(checkCardPlacement(attack, 'field', 0, false), {valid: true});
  assert.deepEqual(checkCardPlacement(defense, 'field', 0, false), {valid: true});
  for(const zone of ['impact-1','impact-2','impact-3','impact-4'] as const) {
    assert.equal(checkCardPlacement(attack, zone, 0, false).valid, false);
    assert.equal(checkCardPlacement(defense, zone, 0, false).valid, false);
  }
});

test('Impact I–Final must be placed left-to-right exactly once per turn', () => {
  for(let rank=1;rank<=4;rank++) {
    assert.deepEqual(checkCardPlacement(impact(rank), `impact-${rank}` as 'impact-1', rank-1,false), {valid:true});
    assert.equal(checkCardPlacement(impact(rank), `impact-${rank}` as 'impact-1', rank-1,true).valid,false);
    assert.equal(checkCardPlacement(impact(rank), 'field', rank-1,false).valid,false);
    for(let other=1;other<=4;other++) {
      if(other === rank)continue;
      assert.equal(checkCardPlacement(impact(rank), `impact-${other}` as 'impact-1', rank-1,false).valid,false);
    }
  }
  assert.equal(checkCardPlacement(impact(3), 'impact-3', 0,false).valid,false);
  assert.equal(checkCardPlacement(impact(1), 'impact-1', 1,false).valid,false);
});

test('prompts reflect the selected card without spending it', () => {
  assert.match(cardPlacementPrompt(null,0), /Selecciona una carta/);
  assert.match(cardPlacementPrompt(attack,0), /arrastra/i);
  assert.match(cardPlacementPrompt(impact(2),1), /casilla 2/);
  assert.match(cardPlacementPrompt(impact(3),0), /Necesitas Impacto I primero/);
});
