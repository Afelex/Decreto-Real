import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENING_BEATS, AFTER_DUEL_BEATS, PROLOGUE_BEAT_IDS, PROLOGUE_PHASE_TITLES, prologueBeatGroup, prologueSceneKey,
} from './prologueScript.ts';

test('every prologue beat has a unique, well-formed stable id',()=>{
  assert.equal(OPENING_BEATS.length,25);
  assert.equal(AFTER_DUEL_BEATS.length,28);
  assert.equal(new Set(PROLOGUE_BEAT_IDS).size,PROLOGUE_BEAT_IDS.length);
  for(const id of PROLOGUE_BEAT_IDS)assert.match(id,/^[a-z]+-\d{2}$/);
});

test('beat ids follow their scene or phase so authors can read them',()=>{
  for(const beat of OPENING_BEATS)assert.ok(beat.id.startsWith(beat.scene+'-'),beat.id);
  for(const beat of AFTER_DUEL_BEATS){
    assert.ok(beat.id.startsWith(beat.phase+'-'),beat.id);
    assert.ok(PROLOGUE_PHASE_TITLES[beat.phase]);
  }
});

test('prologue scene keys are stable strings, not positions',()=>{
  assert.equal(prologueSceneKey('arresto-01'),'prologo/arresto-01');
  assert.equal(prologueSceneKey('reflexion-03'),'prologo/reflexion-03');
  assert.throws(()=>prologueSceneKey('arresto-99'),/desconocida/);
});

test('beat groups list every intervention of the same scene or phase',()=>{
  assert.deepEqual(prologueBeatGroup('arresto-02'),['arresto-01','arresto-02','arresto-03']);
  assert.deepEqual(prologueBeatGroup('cetro-05').length,5);
  assert.deepEqual(prologueBeatGroup('versus-01'),['versus-01']);
  assert.deepEqual(prologueBeatGroup('nada-01'),[]);
});

test('introducción presenta el año, los Reinos del Perú y el peligro de los sellos sin adelantar a Xervias',()=>{
  const opening = OPENING_BEATS.filter(beat => beat.scene === 'pergamino');
  assert.equal(opening.length,5);
  assert.match(opening[0].text,/Año 16XX\. Los Reinos del Perú/);
  assert.match(opening[1].text,/poder místico/);
  assert.match(opening[2].text,/solo algunas personas/);
  assert.match(opening[4].text,/Alguien está alterando los sellos/);
  assert.doesNotMatch(opening.map(beat => beat.text).join(' '),/Xervias|joven soldado/);
});
