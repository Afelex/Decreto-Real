import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_STORAGE_KEY,emptyStudioDocument,defaultStudioTransform,studioSceneKey,
  withStudioTransform,withoutStudioTransform,parseStudioDocument,getStudioTransform,
  normalizeStudioTransform,
} from './studioLayout.ts';

test('studio keeps each actor's corrections isolated to its exact narrative beat',()=>{
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
