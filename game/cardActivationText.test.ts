import assert from 'node:assert/strict';
import test from 'node:test';
import { cardActivationCopy } from './cardActivationText.ts';

test('player/rival announce same attack with perspective-correct effects', () => {
  const card = { type: 'ATTACK' as const, name: 'Decreto de Ataque', description: '-2 HP al Rival' };
  assert.equal(cardActivationCopy(card, true).effect, 'Infliges 2 puntos de daño');
  assert.equal(cardActivationCopy(card, false).effect, 'Recibes 2 puntos de daño');
  assert.equal(cardActivationCopy(card, false).kicker, 'EL RIVAL ACTIVÓ');
});
test('support, defense and Impact use clear effect text', () => {
  assert.equal(cardActivationCopy({type:'DEFENSE',name:'Decreto de Defensa',description:'+1 HP Propio'},true).effect,'Recuperas 1 punto de vida');
  assert.match(cardActivationCopy({type:'ORDER',name:'Decreto de Orden',description:'Roba 1 carta extra'},false).effect,/rival roba/);
  assert.match(cardActivationCopy({type:'IMPACT',name:'Impacto Final',description:'Sello + Drenar 1',rank:4},true).effect,/victoria/);
});

test('mystic activation announces exact named effect instead of provisional text',()=>{
  const c={type:'MYSTIC' as const,name:'Descarga del Trueno',description:'−3 vida rival'};
  assert.equal(cardActivationCopy(c,true).title,'¡DESCARGA DEL TRUENO!');
  assert.equal(cardActivationCopy(c,false).effect,'−3 vida rival');
});
