import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyStudioDocumentV3} from './schema.ts';
import {withAsset,withNarrativeCard} from './ops.ts';
import {withMusicInScenes,withMusicOnFollowingGuideSteps} from './musicReuse.ts';

const A='media-11111111-1111-4111-8111-111111111111';
const B='media-22222222-2222-4222-8222-222222222222';
const populated=()=>{
  let doc=withAsset(emptyStudioDocumentV3(),A,{name:'Prólogo.mp3',mime:'audio/mpeg'});
  doc=withAsset(doc,B,{name:'Combate.wav',mime:'audio/wav'});
  doc=withNarrativeCard(doc,'tutorial/g01',{musicAssetId:A,tone:'neutral'});
  doc=withNarrativeCard(doc,'tutorial/g03',{musicAssetId:B,intent:'Escena ya dirigida'});
  doc=withNarrativeCard(doc,'tutorial/g02',{direction:'No tocar las cartas'});
  return doc;
};

test('sharing song with four following beats preserves existing music and other fields',()=>{
  const original=populated();
  const result=withMusicOnFollowingGuideSteps(original,'g01',A,4);
  assert.equal(result.scenes['tutorial/g02'].narrative?.musicAssetId,A);
  assert.equal(result.scenes['tutorial/g03'].narrative?.musicAssetId,B);
  assert.equal(result.scenes['tutorial/g04'].narrative?.musicAssetId,A);
  assert.equal(result.scenes['tutorial/g05'].narrative?.musicAssetId,A);
  assert.equal(result.scenes['tutorial/g02'].narrative?.direction,'No tocar las cartas');
  assert.equal(result.scenes['tutorial/g03'].narrative?.intent,'Escena ya dirigida');
  assert.equal(original.scenes['tutorial/g02'].narrative?.musicAssetId,undefined);
  assert.deepEqual(withMusicOnFollowingGuideSteps(result,'g01',A,4),result);
});

test('generic chapter reuse accepts only known audio and deduplicates scene keys',()=>{
  const original=populated();
  const next=withMusicInScenes(original,['prologo/rescate','prologo/rescate'],A);
  assert.equal(next.scenes['prologo/rescate'].narrative?.musicAssetId,A);
  assert.equal(Object.keys(next.scenes).filter(k=>k==='prologo/rescate').length,1);
  assert.throws(()=>withMusicInScenes(original,['tutorial/g06'],'media-33333333-3333-4333-8333-333333333333'),
    /biblioteca de audio/);
  assert.throws(()=>withMusicOnFollowingGuideSteps(original,'g99',A),/desconocida/);
});
