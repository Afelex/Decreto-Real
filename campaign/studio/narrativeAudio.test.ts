import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {emptyStudioDocumentV3,normalizeStudioDocumentV3} from './schema.ts';
import {withNarrativeCard} from './ops.ts';
import {INITIAL_TUTORIAL_AUDIO,resolveNarrativeAudio,
  STUDIO_NARRATIVE_MUSIC_MODES,STUDIO_NARRATIVE_SOUND_CUES} from './narrativeAudio.ts';

test('audio narrative cues are bounded, serializable and isolated per step',()=>{
  const source=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g01':{narrative:{
      musicMode:'silent',soundCue:'ATTACK',
      audioUrl:'https://untrusted.example/audio.mp3',offset:-900,
    }},
    'tutorial/g02':{narrative:{
      musicMode:'unknown',soundCue:'javascript:alert(1)',
    }},
  }});
  assert.deepEqual(source.scenes['tutorial/g01'].narrative,{
    musicMode:'silent',soundCue:'ATTACK',
  });
  assert.equal(source.scenes['tutorial/g02'],undefined);
  let doc=withNarrativeCard(emptyStudioDocumentV3(),'tutorial/g00',{
    musicMode:'soft',soundCue:'CLICK',
  });
  assert.deepEqual(resolveNarrativeAudio(doc.scenes['tutorial/g00'].narrative),
    {music:'soft',sound:'CLICK'});
  assert.deepEqual(resolveNarrativeAudio(doc.scenes['tutorial/g01']?.narrative),
    {music:'normal',sound:'none'});
  doc=withNarrativeCard(doc,'tutorial/g00',{musicMode:null,soundCue:null});
  assert.deepEqual(doc,emptyStudioDocumentV3());
  assert.ok(STUDIO_NARRATIVE_MUSIC_MODES.includes('silent'));
  assert.ok(STUDIO_NARRATIVE_SOUND_CUES.includes('IMPACT'));
});

test('ten first-pass audio cues target known beats and preserve battle actions',()=>{
  const published=normalizeStudioDocumentV3(JSON.parse(
    readFileSync(new URL('../../public/studio/composiciones.json',import.meta.url),'utf8')));
  assert.equal(Object.keys(INITIAL_TUTORIAL_AUDIO).length,10);
  for(const [id,cue] of Object.entries(INITIAL_TUTORIAL_AUDIO)){
    const step=GUIDED_STEPS.find(s=>s.id===id);
    assert.ok(step,'missing guided beat '+id);
    assert.equal(step?.action,undefined,'do not double battle action sounds: '+id);
    assert.deepEqual(resolveNarrativeAudio(published.scenes['tutorial/'+id]?.narrative),cue,id);
  }
  const sfxCount=Object.values(INITIAL_TUTORIAL_AUDIO).filter(cue=>cue.sound!=='none').length;
  assert.equal(sfxCount,2);
  assert.equal(GUIDED_STEPS.length,32);
});
