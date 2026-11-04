import test from 'node:test';
import assert from 'node:assert/strict';
import type { CardData } from '../types.ts';
import {
  GENERAL_MYSTICS, SIGUMAN_MYSTICS, MAX_MYSTIC_SLOTS, bossMysticSlots, insertMystics,
  mysticCard, mysticDisplayName, PROVISIONAL_MYSTIC_DAMAGE,
} from './mysticCards.ts';

function standardDeck(): CardData[] {
  const make = (type: CardData['type'], amount: number) => Array.from({length:amount},(_,i)=>({
    id:`${type}-${i}`,type,name:type,description:type,cost:0,img:'',
  }));
  return [
    ...make('ATTACK',10), ...make('DEFENSE',10), ...make('ORDER',4),
    ...Array.from({length:4},(_,i)=>({id:`IMPACT-${i+1}`,type:'IMPACT' as const,rank:i+1,name:'Impacto',description:'',cost:0,img:''})),
  ];
}
const count = (cards:CardData[],kind:CardData['type']) => cards.filter(c=>c.type===kind).length;

test('nueve cartas obtenibles más tres exclusivas de Sigumán, con ids estables',()=>{
  assert.equal(GENERAL_MYSTICS.length,8);
  assert.equal(SIGUMAN_MYSTICS.length,3);
  assert.equal(mysticDisplayName('general-5'),'Mística de Nayisa de Sombras');
  assert.equal(mysticDisplayName('legado-zhinchi'),'Mística de Zhinchi');
  assert.equal(MAX_MYSTIC_SLOTS,3);
  assert.equal(PROVISIONAL_MYSTIC_DAMAGE,2);
});

test('cada jefe equipa tres copias y Sigumán tres místicas distintas',()=>{
  for(const boss of GENERAL_MYSTICS) {
    const slots=bossMysticSlots(boss.missionId);
    assert.equal(slots.length,3);
    assert.ok(slots.every(slot=>slot.mysticId===boss.id&&slot.replace==='ATTACK'));
  }
  assert.deepEqual(bossMysticSlots('38').map(x=>x.mysticId),['siguman-1','siguman-2','siguman-3']);
  assert.deepEqual(bossMysticSlots('01'),[]);
});

test('editar conserva 28 y los 4 impactos, sin alterar el mazo original',()=>{
  const deck=standardDeck(),input=[{mysticId:'general-1' as const,replace:'ATTACK' as const},{mysticId:'general-2' as const,replace:'DEFENSE' as const},{mysticId:'legado-zhinchi' as const,replace:'ORDER' as const}];
  const next=insertMystics(deck,input,'p1');
  assert.equal(deck.length,28);
  assert.equal(count(deck,'MYSTIC'),0);
  assert.equal(next.length,28);
  assert.equal(count(next,'ATTACK'),9);
  assert.equal(count(next,'DEFENSE'),9);
  assert.equal(count(next,'ORDER'),3);
  assert.equal(count(next,'IMPACT'),4);
  assert.equal(count(next,'MYSTIC'),3);
  assert.deepEqual(next.filter(c=>c.type==='IMPACT').map(c=>c.rank),[1,2,3,4]);
  assert.equal(new Set(next.map(x=>x.id)).size,28);
  assert.deepEqual(next.filter(c=>c.type==='MYSTIC').map(c=>c.mysticId),['general-1','general-2','legado-zhinchi']);
});

test('ni cuatro místicas ni sustitución de Impactos',()=>{
  const deck=standardDeck();
  assert.throws(()=>insertMystics(deck,Array.from({length:4},()=>({mysticId:'general-1' as const,replace:'ATTACK' as const})),'ai'));
  assert.throws(()=>insertMystics(deck,[{mysticId:'general-1',replace:'IMPACT' as never}],'p1'));
  assert.throws(()=>insertMystics(deck,[{mysticId:'siguman-9' as never,replace:'ORDER'}],'p1'));
  assert.equal(mysticCard('general-1','p1-one').type,'MYSTIC');
});
