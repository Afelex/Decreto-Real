import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {normalizeStudioDocumentV3,emptyStudioDocumentV3} from './schema.ts';
import {withNarrativeCard,withDialogue,withAsset} from './ops.ts';
import {createGuidedAVBeat,createGuidedAVTimeline,
  avEventLeft,avEventWidth} from './avTimeline.ts';

const published=normalizeStudioDocumentV3(JSON.parse(readFileSync(
  new URL('../../public/studio/composiciones.json',import.meta.url),'utf8')));

test('all 32 guided steps have ordered audiovisual timeline beats without changing battle actions',()=>{
  const beats=createGuidedAVTimeline(GUIDED_STEPS,published);
  assert.equal(beats.length,32);
  assert.deepEqual(beats.map(b=>b.stepId),GUIDED_STEPS.map(s=>s.id));
  assert.equal(beats[0].speaker,'Domingo Quispe');
  assert.ok(beats[0].spritePath?.endsWith('.webp'));
  assert.ok(beats[0].events.some(e=>e.lane==='dialogue'&&e.approximate));
  assert.ok(beats[0].events.some(e=>e.lane==='music'));
  assert.ok(beats[0].events.some(e=>e.lane==='portrait'));
  assert.ok(beats[0].events.some(e=>e.lane==='effect'));
  const coin=beats[3];
  assert.equal(coin.actionLabel,'Lanzar moneda');
  assert.equal(coin.portraitVisible,false);
  assert.ok(coin.events.some(e=>e.lane==='action'&&e.untilAdvance));
  assert.ok(beats.every(b=>b.windowMs>=6000));
  assert.ok(beats.every(b=>b.events.every(e=>e.startMs>=0&&e.durationMs>=0)));
  assert.equal(beats[31].speaker,'Sistema');
  assert.equal(beats[31].spritePath,null);
});

test('timeline reacts to scene edits and preserves the guided step action',()=>{
  let doc=withNarrativeCard(published,'tutorial/g11',{
    speaker:'Domingo Quispe',tone:'enojado',enterMotion:'slide-right',
    musicStartDelayMs:1000,musicStopAfterMs:5000,
    soundCue:'ATTACK',soundDelayMs:500,soundMaxDurationMs:1000,
  });
  doc=withDialogue(doc,'tutorial/g11',{text:'Un nuevo texto con claridad'});
  const beat=createGuidedAVBeat(GUIDED_STEPS[11],11,doc);
  assert.equal(beat.speaker,'Domingo Quispe');
  assert.equal(beat.enterMotion,'slide-right');
  assert.equal(beat.text,'Un nuevo texto con claridad');
  assert.equal(beat.actionLabel,null);
  assert.equal(beat.estimatedReadingSeconds,4);
  assert.equal(beat.musicMode,'soft');
  const music=beat.events.find(e=>e.lane==='music');
  assert.equal(music?.startMs,1000);
  assert.equal(music?.durationMs,5000);
  assert.equal(beat.events.find(e=>e.lane==='effect')?.startMs,500);
  assert.equal(beat.events.find(e=>e.lane==='effect')?.durationMs,1000);
  assert.equal(beat.windowMs,6000);
  assert.equal(GUIDED_STEPS[11].speaker,'Xervias');
});

test('music reuse and continue/stop modes are represented without inventing audio sources',()=>{
  const id='media-44444444-4444-4444-8444-444444444444';
  let doc=withAsset(emptyStudioDocumentV3(),id,{name:'Canto del prólogo.mp3',mime:'audio/mpeg'});
  doc=withNarrativeCard(doc,'tutorial/g01',{
    musicAssetId:id,musicCueMode:'continue',musicMode:'soft',
  });
  const continuation=createGuidedAVBeat(GUIDED_STEPS[1],1,doc);
  assert.equal(continuation.musicLabel,'Canto del prólogo.mp3');
  assert.equal(continuation.events.find(e=>e.lane==='music')?.label,'Continuar pista anterior');
  doc=withNarrativeCard(doc,'tutorial/g01',{musicCueMode:'stop',musicStartDelayMs:1500});
  const stopped=createGuidedAVBeat(GUIDED_STEPS[1],1,doc);
  assert.equal(stopped.events.find(e=>e.lane==='music')?.label,'Detener música');
  assert.equal(stopped.events.find(e=>e.lane==='music')?.startMs,1500);
  assert.ok(stopped.events.every(e=>e.lane!=='effect'));
});

test('event percentages stay on the canvas with indefinite and estimated durations',()=>{
  assert.equal(avEventLeft({lane:'effect',label:'x',startMs:1500,durationMs:0},6000),25);
  assert.equal(avEventWidth({lane:'effect',label:'x',startMs:1500,durationMs:1000},6000),
    1000/6000*100);
  assert.equal(avEventWidth({lane:'music',label:'x',startMs:3000,
    durationMs:0,untilAdvance:true},6000),50);
  assert.equal(avEventLeft({lane:'music',label:'x',startMs:999999,
    durationMs:0},6000),100);
  assert.equal(avEventWidth({lane:'music',label:'x',startMs:999999,
    durationMs:1000},6000),0);
});
