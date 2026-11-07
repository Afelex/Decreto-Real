import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_STORAGE_KEY, addStudioExtra, emptyStudioDocument, withStudioAsset, withStudioSettings,
  withStudioTransform,
} from '../studioLayout.ts';
import { AFTER_DUEL_BEATS, OPENING_BEATS, PROLOGUE_BEAT_IDS } from '../prologueScript.ts';
import {
  LEGACY_V2_AFTER_BEAT_IDS, LEGACY_V2_OPENING_BEAT_IDS, legacyActorZ, legacyOverlayZ,
  legacySceneKeyToV3, migrateLegacyStudioDocument, parseAnyStudioDocument,
  readStudioDocumentV3, saveStudioDocumentV3,
} from './migrate.ts';
import { STUDIO_V3_STORAGE_KEY, emptyStudioDocumentV3, type StudioLayer } from './schema.ts';

const MEDIA='media-11111111-1111-4111-8111-111111111111';
const MEDIA2='media-22222222-2222-4222-8222-222222222222';
const EXTRA='extra-33333333-3333-4333-8333-333333333333';

const memoryStorage=(initial:Record<string,string>={})=>{
  const data=new Map(Object.entries(initial));
  return {
    data,
    getItem:(key:string)=>data.get(key)??null,
    setItem:(key:string,value:string)=>{data.set(key,value);},
  };
};

test('frozen legacy tables match the beat order published with Studio v2',()=>{
  // Esta prueba documenta el orden de v2. Si el guion cambia de orden, la
  // migración NO debe cambiar: actualiza esta aserción solo para el guion,
  // nunca las tablas LEGACY_*.
  assert.equal(LEGACY_V2_OPENING_BEAT_IDS.length,21);
  assert.equal(LEGACY_V2_AFTER_BEAT_IDS.length,28);
  assert.deepEqual([...LEGACY_V2_OPENING_BEAT_IDS],OPENING_BEATS.map(b=>b.id));
  assert.deepEqual([...LEGACY_V2_AFTER_BEAT_IDS],AFTER_DUEL_BEATS.map(b=>b.id));
  assert.ok(Object.isFrozen(LEGACY_V2_OPENING_BEAT_IDS));
});

test('every legacy key resolves to an existing beat of the current script',()=>{
  for(const id of [...LEGACY_V2_OPENING_BEAT_IDS,...LEGACY_V2_AFTER_BEAT_IDS])
    assert.ok(PROLOGUE_BEAT_IDS.includes(id),id);
});

test('legacy positional keys map to stable beat ids, independent of the script order',()=>{
  assert.equal(legacySceneKeyToV3('opening:0'),'prologo/pergamino-01');
  assert.equal(legacySceneKeyToV3('opening:4'),'prologo/xervias-01');
  assert.equal(legacySceneKeyToV3('opening:20'),'prologo/versus-01');
  assert.equal(legacySceneKeyToV3('after:9'),'prologo/zhinchi-01');
  assert.equal(legacySceneKeyToV3('after:27'),'prologo/reflexion-03');
  assert.equal(legacySceneKeyToV3('opening:21'),null);
  assert.equal(legacySceneKeyToV3('after:28'),null);
  assert.equal(legacySceneKeyToV3('opening:01'),null);
  assert.equal(legacySceneKeyToV3('prologo/arresto-01'),null);
});

test('inserting a new beat in the script does not shift migrated edits',()=>{
  // Simula un guion futuro con un diálogo nuevo al principio: con claves por
  // posición, `opening:4` apuntaría a otro diálogo; con beatId no cambia.
  const futureOrder=['nuevo-01',...OPENING_BEATS.map(b=>b.id)];
  const legacy=withStudioTransform(emptyStudioDocument(),'opening:4','Xervias',
    {x:0,y:7,scale:1,mirror:false,layer:4,visible:true});
  const {doc}=migrateLegacyStudioDocument(legacy);
  assert.deepEqual(Object.keys(doc.scenes),['prologo/xervias-01']);
  assert.notEqual(futureOrder[4],'xervias-01');
  assert.equal(OPENING_BEATS.find(b=>'prologo/'+b.id==='prologo/xervias-01')?.speaker,'Xervias');
});

test('v1 actor drafts migrate with stage units and z inside the actor band',()=>{
  const legacy=withStudioTransform(emptyStudioDocument(),'opening:1','Niño',
    {x:14.5,y:-2,scale:1.32,mirror:true,layer:7,visible:false});
  const {doc,report}=migrateLegacyStudioDocument(legacy);
  assert.deepEqual(report,{migrated:{'opening:1':'prologo/arresto-01'},dropped:[]});
  assert.deepEqual(doc.scenes['prologo/arresto-01'].layers,[{
    id:'actor-nino',kind:'actor',actor:'Niño',
    x:14.5,y:-2,scale:1.32,rotation:0,opacity:1,mirror:true,z:17,visible:false,
  }]);
});

test('legacy z mapping preserves the v2 visual order between actors and overlays',()=>{
  // v2: grupo de figuras con z-index 3; extras ≤2 detrás, ≥3 delante de todos.
  for(let actorLayer=1;actorLayer<=30;actorLayer++){
    assert.ok(legacyOverlayZ(2)<legacyActorZ(actorLayer));
    assert.ok(legacyOverlayZ(3)>legacyActorZ(actorLayer));
  }
  assert.ok(legacyOverlayZ(1)<legacyOverlayZ(2));
  assert.equal(legacyOverlayZ(30),70);
});

test('v2 drafts migrate replacements, extras, bubble, background and title',()=>{
  let legacy=withStudioAsset(emptyStudioDocument(),MEDIA,{name:'madre.png',mime:'image/png'});
  legacy=withStudioAsset(legacy,MEDIA2,{name:'destello.webm',mime:'video/webm'});
  legacy=withStudioTransform(legacy,'opening:1','Madre',
    {x:-3,y:4,scale:1.4,mirror:true,layer:4,visible:true,assetId:MEDIA});
  legacy=addStudioExtra(legacy,'opening:1',{id:EXTRA,name:'Destello',assetId:MEDIA2,kind:'effect',
    transform:{x:5,y:3,scale:.8,mirror:false,layer:9,visible:true}});
  legacy=withStudioSettings(legacy,'opening:1',{backgroundAsset:MEDIA2,titleVisible:false,
    bubbleText:'¡Ayudadnos!',bubbleTransform:{x:6,y:0,scale:1.1,mirror:false,layer:7,visible:true}});
  legacy=withStudioSettings(legacy,'after:9',{bubbleVisible:false});
  const {doc}=migrateLegacyStudioDocument(legacy);
  assert.deepEqual(doc.assets,legacy.assets);
  const arresto=doc.scenes['prologo/arresto-01'];
  assert.equal(arresto.titleVisible,false);
  assert.deepEqual(arresto.background,{assetId:MEDIA2});
  const byId=Object.fromEntries((arresto.layers??[]).map(l=>[l.id,l])) as Record<string,StudioLayer>;
  assert.deepEqual(byId['actor-madre'],{id:'actor-madre',kind:'actor',actor:'Madre',
    x:-3,y:4,scale:1.4,rotation:0,opacity:1,mirror:true,z:14,visible:true,assetId:MEDIA});
  assert.deepEqual(byId[EXTRA],{id:EXTRA,kind:'effect',name:'Destello',assetId:MEDIA2,
    x:5,y:3,scale:.8,rotation:0,opacity:1,mirror:false,z:49,visible:true});
  assert.deepEqual(byId.bubble,{id:'bubble',kind:'bubble',
    x:6,y:0,scale:1.1,rotation:0,opacity:1,mirror:false,z:47,visible:true,text:'¡Ayudadnos!'});
  assert.deepEqual(arresto.layers?.map(l=>l.id),['actor-madre','bubble',EXTRA]);
  // Globo oculto sin transformación propia: posición nativa y z por defecto de v2 (7).
  assert.deepEqual(doc.scenes['prologo/zhinchi-01'].layers,[{id:'bubble',kind:'bubble',
    x:0,y:0,scale:1,rotation:0,opacity:1,mirror:false,z:47,visible:false}]);
});

test('out-of-range legacy keys are reported, not silently remapped',()=>{
  const raw=JSON.stringify({version:1,scenes:{
    'opening:3':{Madre:{x:1,y:0,scale:1,mirror:false,layer:4,visible:true}},
    'opening:150':{Madre:{x:9,y:0,scale:1,mirror:false,layer:4,visible:true}},
    'after:40':{Xervias:{x:9,y:0,scale:1,mirror:false,layer:4,visible:true}},
  }});
  const loaded=parseAnyStudioDocument(raw);
  assert.equal(loaded.source,'legacy');
  assert.deepEqual(Object.keys(loaded.doc.scenes),['prologo/arresto-03']);
  assert.deepEqual(loaded.report?.dropped,['after:40','opening:150']);
});

test('parseAnyStudioDocument accepts v3 and refuses unknown versions',()=>{
  const v3={version:3,scenes:{'prologo/arresto-01':{titleVisible:false}}};
  assert.deepEqual(parseAnyStudioDocument(JSON.stringify(v3)),{doc:v3,source:'v3'});
  assert.throws(()=>parseAnyStudioDocument(JSON.stringify({version:2,scenes:{}})),/compatible/);
});

test('local draft: v3 key wins, legacy draft migrates on the fly and is kept as backup',()=>{
  const legacyRaw=JSON.stringify(withStudioTransform(emptyStudioDocument(),'after:2','Madre',
    {x:-3,y:4,scale:1,mirror:true,layer:4,visible:true}));
  const storage=memoryStorage({[STUDIO_STORAGE_KEY]:legacyRaw});
  const first=readStudioDocumentV3(storage);
  assert.equal(first.source,'legacy');
  assert.ok(first.doc.scenes['prologo/desenlace-03']);
  assert.equal(storage.data.get(STUDIO_STORAGE_KEY),legacyRaw);
  assert.equal(storage.data.has(STUDIO_V3_STORAGE_KEY),false);

  assert.equal(saveStudioDocumentV3(storage,first.doc),true);
  const second=readStudioDocumentV3(storage);
  assert.equal(second.source,'v3');
  assert.deepEqual(second.doc,first.doc);
  assert.equal(storage.data.get(STUDIO_STORAGE_KEY),legacyRaw);
});

test('local draft reading never throws on missing, blocked or corrupted storage',()=>{
  assert.deepEqual(readStudioDocumentV3(null),{doc:emptyStudioDocumentV3(),source:'empty'});
  assert.equal(readStudioDocumentV3(memoryStorage()).source,'empty');
  const corrupted=memoryStorage({[STUDIO_V3_STORAGE_KEY]:'{no-json',[STUDIO_STORAGE_KEY]:'tampoco'});
  assert.equal(readStudioDocumentV3(corrupted).source,'empty');
  const blocked={getItem:()=>{throw new Error('SecurityError');},setItem:()=>{throw new Error('Quota');}};
  assert.equal(readStudioDocumentV3(blocked).source,'empty');
  assert.equal(saveStudioDocumentV3(blocked,emptyStudioDocumentV3()),false);
  assert.equal(saveStudioDocumentV3(null,emptyStudioDocumentV3()),false);
});
