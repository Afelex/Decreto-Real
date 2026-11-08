import test from 'node:test';
import assert from 'node:assert/strict';
import {sniffStudioMedia} from './mediaSignature.ts';
import {emptyStudioDocumentV3, normalizeStudioDocumentV3, normalizeStudioLayer,
  normalizeStudioBackground, defaultLayerTransform} from './schema.ts';
import {withAsset, withNarrativeCard, referencedAssetIds, assetUsage,
  withoutUnusedAssets} from './ops.ts';
import {buildStudioPackage, parseStudioPackage} from './package.ts';
import {publishedMediaUrls} from './published.ts';

const MP3_ID='media-44444444-4444-4444-8444-444444444444';
const WAV_ID='media-55555555-5555-4555-8555-555555555555';
const mp3=new Uint8Array([73,68,51,4,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0]);
const wav=new Uint8Array(44);
wav.set([82,73,70,70],0);wav.set([87,65,86,69],8);

test('Studio accepts real MP3 and WAV signatures, rejects arbitrary disguised bytes',()=>{
  assert.equal(sniffStudioMedia(mp3),'audio/mpeg');
  assert.equal(sniffStudioMedia(wav),'audio/wav');
  assert.equal(sniffStudioMedia(new TextEncoder().encode('fake.mp3 text')),null);
  assert.equal(sniffStudioMedia(new Uint8Array([0xff,0xfb,0x90,0x64])),'audio/mpeg');
});

test('narrative music asset must exist and have audio MIME',()=>{
  const without=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g00':{narrative:{musicAssetId:MP3_ID}},
  }});
  assert.equal(without.scenes['tutorial/g00'],undefined);
  const wrong=normalizeStudioDocumentV3({version:3,
    assets:{[MP3_ID]:{name:'fake.png',mime:'image/png'}},
    scenes:{'tutorial/g00':{narrative:{musicAssetId:MP3_ID}}},
  });
  assert.equal(wrong.scenes['tutorial/g00'],undefined);
  let doc=withAsset(emptyStudioDocumentV3(),MP3_ID,{name:'Prólogo Suno.mp3',mime:'audio/mpeg'});
  doc=withNarrativeCard(doc,'tutorial/g00',{musicAssetId:MP3_ID,musicMode:'soft'});
  assert.equal(doc.scenes['tutorial/g00'].narrative?.musicAssetId,MP3_ID);
  assert.equal(normalizeStudioDocumentV3(doc).scenes['tutorial/g00'].narrative?.musicAssetId,MP3_ID);
  assert.deepEqual([...referencedAssetIds(doc)],[MP3_ID]);
  assert.deepEqual(assetUsage(doc)[MP3_ID],['tutorial/g00']);
  assert.equal(withoutUnusedAssets(doc).assets?.[MP3_ID]?.mime,'audio/mpeg');
  assert.equal(publishedMediaUrls(doc,'/Decreto-Real/')[MP3_ID],
    '/Decreto-Real/studio/media/'+MP3_ID+'.mp3');
  assert.equal(normalizeStudioLayer({id:'extra-33333333-3333-4333-8333-333333333333',
    kind:'image',name:'Incorrecto',assetId:MP3_ID,...defaultLayerTransform('image')},doc.assets),null);
  assert.equal(normalizeStudioBackground({assetId:MP3_ID},doc.assets),null);
});

test('MP3 and WAV used by narrative survive Studio ZIP export/import',()=>{
  let doc=withAsset(emptyStudioDocumentV3(),MP3_ID,{name:'Prologo.mp3',mime:'audio/mpeg'});
  doc=withAsset(doc,WAV_ID,{name:'Tension.wav',mime:'audio/wav'});
  doc=withNarrativeCard(doc,'tutorial/g01',{musicAssetId:MP3_ID});
  doc=withNarrativeCard(doc,'tutorial/g02',{musicAssetId:WAV_ID});
  const zip=buildStudioPackage(doc,[
    {id:MP3_ID,name:'Prologo.mp3',mime:'audio/mpeg',data:mp3},
    {id:WAV_ID,name:'Tension.wav',mime:'audio/wav',data:wav},
  ]);
  const restored=parseStudioPackage(zip);
  assert.deepEqual(restored.doc,doc);
  assert.equal(restored.media.length,2);
  assert.equal(restored.media.find(m=>m.id===MP3_ID)?.mime,'audio/mpeg');
  assert.equal(restored.media.find(m=>m.id===WAV_ID)?.mime,'audio/wav');
  assert.ok(restored.media.find(m=>m.id===MP3_ID)?.data.every((x,i)=>x===mp3[i]));
});
