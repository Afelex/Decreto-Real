import test from 'node:test';
import assert from 'node:assert/strict';
import type { CardData } from '../types.ts';
import {
  GENERAL_MYSTICS, SIGUMAN_MYSTICS, MAX_MYSTIC_SLOTS, bossMysticSlots, insertMystics,
  mysticCard, mysticDisplayName, MYSTIC_ABILITIES, mysticPower, mysticPowerText,
  resolveMysticPower, canActivateMystic,
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

test('nueve cartas obtenibles más tres exclusivas de Sigumán más místicas de Vándalo y Gaspar, con ids estables',()=>{
  assert.equal(GENERAL_MYSTICS.length,8);
  assert.equal(SIGUMAN_MYSTICS.length,3);
  assert.equal(mysticDisplayName('general-5'),'Velo de la Selva');
  assert.equal(mysticDisplayName('legado-zhinchi'),'Decreto del Legado');
  assert.equal(MAX_MYSTIC_SLOTS,3);
  assert.equal(Object.keys(MYSTIC_ABILITIES).length,14);
  assert.equal(mysticDisplayName('siguman-2'),'Juicio del Eclipse');
});

test('cada jefe equipa tres copias y Sigumán tres místicas distintas',()=>{
  for(const boss of GENERAL_MYSTICS) {
    const slots=bossMysticSlots(boss.missionId);
    assert.equal(slots.length,3);
    assert.ok(slots.every(slot=>slot.mysticId===boss.id&&slot.replace==='ATTACK'));
  }
  assert.deepEqual(bossMysticSlots('38').map(x=>x.mysticId),['siguman-1','siguman-2','siguman-3']);
  assert.deepEqual(bossMysticSlots('01'),[]);
  assert.deepEqual(bossMysticSlots('35').map(x=>x.mysticId),['vandalo-carmesi','vandalo-carmesi','vandalo-carmesi']);
  assert.deepEqual(bossMysticSlots('36').map(x=>x.mysticId),['gaspar-leon','gaspar-leon','gaspar-leon']);
  assert.deepEqual(bossMysticSlots('37').map(x=>x.mysticId),['siguman-1','siguman-2','siguman-1']);
  assert.deepEqual(mysticPower('gaspar-leon',1), {summon:{hp:4,attack:2}});
  assert.deepEqual(mysticPower('legado-zhinchi',1), {attackBoost:2,defenseBoost:2});
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

test('los ocho generales, Zhinchi y Sigumán tienen catorce habilidades y combos distintos', () => {
  const names = new Set(Object.values(MYSTIC_ABILITIES).map(a=>a.name));
  assert.equal(names.size, 14);
  for(const ability of Object.values(MYSTIC_ABILITIES)) {
    assert.ok(ability.theme.trim().length>5);
    assert.ok(mysticPowerText(ability.base).length>4);
    assert.ok(mysticPowerText(ability.combo2).length>4);
    assert.ok(mysticPowerText(ability.combo3).length>4);
  }
  assert.deepEqual(mysticPower('general-4',1), {damage:3});
  assert.deepEqual(mysticPower('general-4',2), {damage:4});
  assert.deepEqual(mysticPower('general-4',3), {damage:5,selfDamage:2});
  assert.equal(mysticCard('general-2','p1-g2').name,'Carga Sangrante');
  assert.match(mysticCard('siguman-3','ai-s3').description,/Invoca guardián/);
});

test('curación total, media vida e invocación del Sol Negro son poderes distintos',()=>{
 const start={selfHp:3,enemyHp:19,selfSeals:2,impactPlayedThisTurn:false};
 const rebirth=resolveMysticPower(mysticPower('siguman-1',1),start);
 assert.equal(rebirth.selfHp,20); assert.equal(rebirth.enemyHp,19);
 const eclipse=resolveMysticPower(mysticPower('siguman-2',1),start);
 assert.equal(eclipse.enemyHp,9);
 const sol=resolveMysticPower(mysticPower('siguman-3',1),start);
 assert.equal(sol.enemyHp,19);assert.equal(sol.selfSeals,2);
 assert.deepEqual(mysticPower('siguman-3',1).summon,{hp:6,attack:2});
 assert.equal(canActivateMystic('siguman-3',true),true);
 assert.equal(canActivateMystic('siguman-3',false),true);
});

test('curación limitada a 20, coste de vida nunca deja a 0 y combos tienen efectos',()=>{
 const reduced=resolveMysticPower(mysticPower('general-7',3),{
   selfHp:1,enemyHp:20,selfSeals:0,impactPlayedThisTurn:false,
 });
 assert.equal(reduced.selfHp,1);assert.equal(reduced.enemyHp,15);
 const trade=resolveMysticPower(mysticPower('general-3',1),{
   selfHp:19,enemyHp:18,selfSeals:1,impactPlayedThisTurn:false,
 });
 assert.equal(trade.selfHp,20);assert.equal(trade.enemyHp,19);
 const stealth=resolveMysticPower(mysticPower('general-5',2),{
   selfHp:15,enemyHp:20,selfSeals:1,impactPlayedThisTurn:false,
 });
 assert.equal(stealth.steal,1);assert.equal(stealth.draw,0);
 const last=resolveMysticPower(mysticPower('legado-zhinchi',1),{
   selfHp:10,enemyHp:20,selfSeals:1,impactPlayedThisTurn:false,
 });
 assert.equal(last.selfHp,10);assert.equal(last.enemyHp,15);
});
