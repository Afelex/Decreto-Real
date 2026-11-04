import assert from 'node:assert/strict';
import test from 'node:test';
import { cardPlacementPrompt, checkCardPlacement, resolveVisualDropZone } from './cardPlacement.ts';

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

test('regular cards may be released on a stone tile, while Impact must hit its exact tile', () => {
  for (const zone of ['field','impact-1','impact-2','impact-3','impact-4'] as const) {
    assert.equal(resolveVisualDropZone(attack, zone), 'field');
    assert.equal(resolveVisualDropZone(defense, zone), 'field');
    assert.equal(resolveVisualDropZone(impact(2), zone), zone);
  }
  assert.deepEqual(checkCardPlacement(attack, resolveVisualDropZone(attack,'impact-1'), 0, false), { valid:true });
  assert.equal(checkCardPlacement(impact(2), resolveVisualDropZone(impact(2),'impact-1'), 1, false).valid,false);
  assert.equal(checkCardPlacement(impact(2), resolveVisualDropZone(impact(2),'impact-2'), 1, false).valid,true);
});

test('Sol Negro cannot chain a second Impact in the same turn',()=>{
  const sol={type:'MYSTIC' as const,name:'Decreto del Sol Negro',mysticId:'siguman-3'};
  assert.equal(checkCardPlacement(sol,'field',2,false).valid,true);
  assert.equal(checkCardPlacement(sol,'field',2,true).valid,false);
  assert.match(cardPlacementPrompt(sol,2),/Sol Negro/);
});
