import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_STORAGE_KEY,emptyStudioDocument,defaultStudioTransform,studioSceneKey,
  withStudioTransform,withoutStudioTransform,parseStudioDocument,getStudioTransform,
  normalizeStudioTransform,withStudioSettings,withStudioAsset,addStudioExtra,removeStudioExtra,
  withStudioExtraTransform,withStudioExtraAsset
} from './studioLayout.ts';

test("studio keeps each actor's corrections isolated to its exact narrative beat",()=>{
  const blank=emptyStudioDocument();
  const first=withStudioTransform(blank,studioSceneKey('opening',1),'Niño',{
    x:14.5,y:-2,scale:1.32,mirror:false,layer:7,visible:true,
  });
  const second=withStudioTransform(first,studioSceneKey('after',2),'Madre',{
    x:-3,y:4,scale:1,mirror:true,layer:4,visible:true,
  });
  assert.equal(getStudioTransform(second,'opening:1','Niño').scale,1.32);
  assert.equal(getStudioTransform(second,'opening:2','Niño').scale,1);
  assert.equal(getStudioTransform(second,'after:2','Madre').mirror,true);
  assert.equal(getStudioTransform(second,'opening:1','Madre').mirror,false);
  assert.deepEqual(blank,emptyStudioDocument());
});
test('Studio JSON export-import roundtrip and actor reset',()=>{
  const doc=withStudioTransform(emptyStudioDocument(),'opening:1','Niño',{
    x:12,y:5,scale:1.2,mirror:true,layer:8,visible:false,
  });
  assert.deepEqual(parseStudioDocument(JSON.stringify(doc)),doc);
  const reset=withoutStudioTransform(doc,'opening:1','Niño');
  assert.deepEqual(reset,emptyStudioDocument());
  assert.equal(STUDIO_STORAGE_KEY,'decreto-real.studio.borradores.v1');
});
test('import rejects hostile payloads and clamps transforms to safe limits',()=>{
  assert.throws(()=>parseStudioDocument(JSON.stringify({version:3,scenes:{}})),/compatible/);
  assert.throws(()=>parseStudioDocument(JSON.stringify({version:1,scenes:null})),/escenas/);
  assert.throws(()=>studioSceneKey('opening',-1),/válida/);
  const parsed=parseStudioDocument(JSON.stringify({version:1,scenes:{
    'opening:1':{'Niño':{x:1000,y:-1000,scale:NaN,mirror:'x',layer:999,visible:null},
       'no valido':{x:3}},
    '../../secret':{'Madre':{x:1}},
  }}));
  assert.equal(Object.keys(parsed.scenes).length,1);
  assert.deepEqual(Object.keys(parsed.scenes['opening:1']),['Niño']);
  assert.deepEqual(getStudioTransform(parsed,'opening:1','Niño'),{
    x:100,y:-100,scale:1,mirror:false,layer:30,visible:true,
  });
  assert.deepEqual(normalizeStudioTransform({scale:0,x:-300},'Madre').scale,.35);
  assert.equal(defaultStudioTransform('Niño').layer,6);
});


test('Studio v2 roundtrips sprite replacements, backgrounds, bubble flags and added layers',()=>{
 const id='media-11111111-1111-4111-8111-111111111111';
 const id2='media-22222222-2222-4222-8222-222222222222';
 let doc=withStudioAsset(emptyStudioDocument(),id,{name:'cambio.png',mime:'image/png'});
 doc=withStudioAsset(doc,id2,{name:'destello.gif',mime:'image/gif'});
 doc=withStudioTransform(doc,'opening:1','Madre',{
   ...defaultStudioTransform('Madre'),assetId:id,mirror:true,scale:1.4
 });
 doc=withStudioSettings(doc,'opening:1',{backgroundAsset:id,bubbleVisible:false,titleVisible:false});
 doc=addStudioExtra(doc,'opening:1',{
   id:'extra-33333333-3333-4333-8333-333333333333',name:'Destello',
   assetId:id2,kind:'effect',
   transform:{x:5,y:3,scale:.8,layer:11,mirror:false,visible:true}
 });
 const parsed=parseStudioDocument(JSON.stringify(doc));
 assert.deepEqual(parsed,doc);
 assert.equal(parsed.scenes['opening:1'].Madre?.assetId,id);
 assert.equal(parsed.settings?.['opening:1']?.bubbleVisible,false);
 assert.equal(parsed.extras?.['opening:1']?.length,1);
 const changed=withStudioExtraTransform(doc,'opening:1','extra-33333333-3333-4333-8333-333333333333',{
  x:13,y:5,scale:1.2,layer:2,mirror:true,visible:true
 });
 assert.equal(changed.extras?.['opening:1']?.[0].transform.x,13);
 const replaced=withStudioExtraAsset(changed,'opening:1','extra-33333333-3333-4333-8333-333333333333',id);
 assert.equal(replaced.extras?.['opening:1']?.[0].assetId,id);
 assert.equal(removeStudioExtra(replaced,'opening:1','extra-33333333-3333-4333-8333-333333333333').extras?.['opening:1']?.length,0);
 assert.equal(doc.extras?.['opening:1']?.[0].assetId,id2);
});

test('Studio v1 documents import without needing v2 optional sections',()=>{
 const v1=JSON.stringify({version:1,scenes:{'after:1':{Niño:{
  x:5,y:-8,scale:1.15,mirror:false,layer:6,visible:true
 }}}});
 const parsed=parseStudioDocument(v1);
 assert.equal(parsed.scenes['after:1'].Niño?.scale,1.15);
 assert.equal(parsed.settings,undefined);
 assert.equal(parsed.extras,undefined);
 assert.equal(parsed.assets,undefined);
});

test('Studio v2 refuses unsafe media metadata, invalid asset references and extra IDs',()=>{
 const parsed=parseStudioDocument(JSON.stringify({version:1,scenes:{
   'opening:2':{Madre:{x:0,y:0,scale:1,mirror:false,layer:3,visible:true,assetId:'javascript:alert(1)'}}
 },settings:{'opening:2':{backgroundAsset:'../../evil.mp4',bubbleVisible:false}},
 assets:{'media-11111111-1111-4111-8111-111111111111':{name:'script.svg',mime:'image/svg+xml'}},
 extras:{'opening:2':[{id:'bad',assetId:'x',name:'bad',kind:'image',transform:{x:0}}]}
 }));
 assert.equal(parsed.scenes['opening:2'].Madre?.assetId,undefined);
 assert.equal(parsed.settings?.['opening:2']?.backgroundAsset,undefined);
 assert.deepEqual(parsed.extras,undefined);
 assert.deepEqual(parsed.assets,undefined);
});
