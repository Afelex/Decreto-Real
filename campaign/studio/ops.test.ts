import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLayerTransform, emptyStudioDocumentV3, type StudioLayer } from './schema.ts';
import {
  copyScene, editedSceneKeys, getLayer, referencedAssetIds, sceneLayers, withAsset, withLayer,
  withLayerPatch, withSceneSettings, withoutLayer, withoutScene, withoutUnusedAssets,
} from './ops.ts';

const MEDIA='media-11111111-1111-4111-8111-111111111111';
const MEDIA2='media-22222222-2222-4222-8222-222222222222';
const EXTRA='extra-33333333-3333-4333-8333-333333333333';
const ARRESTO='prologo/arresto-01';
const madre:StudioLayer={id:'actor-madre',kind:'actor',actor:'Madre',...defaultLayerTransform('actor','Madre')};

test('layer edits are immutable and isolated per stable scene key',()=>{
  const blank=emptyStudioDocumentV3();
  const doc=withLayer(blank,ARRESTO,{...madre,y:5});
  assert.deepEqual(blank,emptyStudioDocumentV3());
  assert.equal(getLayer(doc,ARRESTO,'actor-madre')?.y,5);
  assert.equal(getLayer(doc,'prologo/arresto-02','actor-madre'),undefined);
  const patched=withLayerPatch(doc,ARRESTO,'actor-madre',{x:-12.346,opacity:.4});
  assert.equal(getLayer(patched,ARRESTO,'actor-madre')?.x,-12.35);
  assert.equal(getLayer(doc,ARRESTO,'actor-madre')?.x,0);
  assert.throws(()=>withLayerPatch(doc,ARRESTO,'bubble',{x:1}),/no existe/);
  assert.throws(()=>withLayer(blank,'opening:1',madre),/Escena no válida/);
});

test('patching cannot change a layer identity or kind',()=>{
  const doc=withLayer(emptyStudioDocumentV3(),ARRESTO,madre);
  const patched=withLayerPatch(doc,ARRESTO,'actor-madre',{id:'otro',kind:'bubble'} as never);
  assert.deepEqual(sceneLayers(patched,ARRESTO).map(l=>[l.id,l.kind]),[['actor-madre','actor']]);
});

test('layers stay sorted by z in a single plane',()=>{
  let doc=withAsset(emptyStudioDocumentV3(),MEDIA,{name:'fx.gif',mime:'image/gif'});
  doc=withLayer(doc,ARRESTO,{id:EXTRA,kind:'effect',name:'fx',assetId:MEDIA,...defaultLayerTransform('effect'),z:15});
  doc=withLayer(doc,ARRESTO,{...madre,z:20});
  doc=withLayer(doc,ARRESTO,{id:'actor-xervias',kind:'actor',actor:'Xervias',...defaultLayerTransform('actor'),z:10});
  // Un efecto ENTRE dos actores: imposible en v2.
  assert.deepEqual(sceneLayers(doc,ARRESTO).map(l=>l.id),['actor-xervias',EXTRA,'actor-madre']);
});

test('media layers require a known asset; removing the last edit removes the scene',()=>{
  const blank=emptyStudioDocumentV3();
  assert.throws(()=>withLayer(blank,ARRESTO,{id:EXTRA,kind:'image',name:'x',assetId:MEDIA,
    ...defaultLayerTransform('image')}),/recurso inexistente/);
  assert.throws(()=>withSceneSettings(blank,ARRESTO,{background:{assetId:MEDIA}}),/inexistente/);
  const doc=withLayer(blank,ARRESTO,madre);
  assert.deepEqual(withoutLayer(doc,ARRESTO,'actor-madre'),blank);
  assert.equal(withoutLayer(doc,ARRESTO,'no-existe'),doc);
});

test('scene settings set and clear background and title',()=>{
  let doc=withAsset(emptyStudioDocumentV3(),MEDIA,{name:'plaza.webp',mime:'image/webp'});
  doc=withSceneSettings(doc,ARRESTO,{background:{assetId:MEDIA},titleVisible:false});
  assert.deepEqual(doc.scenes[ARRESTO],{background:{assetId:MEDIA},titleVisible:false});
  doc=withSceneSettings(doc,ARRESTO,{background:null,titleVisible:null});
  assert.equal(doc.scenes[ARRESTO],undefined);
});

test('copyScene applies one composition to the other beats of the same scene',()=>{
  let doc=withLayer(emptyStudioDocumentV3(),ARRESTO,{...madre,x:8});
  doc=withLayer(doc,'prologo/arresto-03',{...madre,x:-20});
  const copied=copyScene(doc,ARRESTO,['prologo/arresto-02','prologo/arresto-03',ARRESTO]);
  assert.equal(getLayer(copied,'prologo/arresto-02','actor-madre')?.x,8);
  assert.equal(getLayer(copied,'prologo/arresto-03','actor-madre')?.x,8);
  // Copias independientes: editar una no cambia las demás.
  const edited=withLayerPatch(copied,'prologo/arresto-02','actor-madre',{x:1});
  assert.equal(getLayer(edited,ARRESTO,'actor-madre')?.x,8);
  // Copiar una escena sin ediciones restablece los destinos.
  assert.equal(copyScene(copied,'prologo/arresto-02',[]).scenes['prologo/arresto-02']?.layers?.length,1);
  assert.equal(copyScene(doc,'prologo/xervias-01',[ARRESTO]).scenes[ARRESTO],undefined);
  assert.deepEqual(editedSceneKeys(copied),[ARRESTO,'prologo/arresto-02','prologo/arresto-03']);
  assert.equal(withoutScene(copied,ARRESTO).scenes[ARRESTO],undefined);
});

test('unused assets are detected and pruned from the index',()=>{
  let doc=withAsset(emptyStudioDocumentV3(),MEDIA,{name:'a.png',mime:'image/png'});
  doc=withAsset(doc,MEDIA2,{name:'b.png',mime:'image/png'});
  doc=withLayer(doc,ARRESTO,{...madre,assetId:MEDIA});
  assert.deepEqual([...referencedAssetIds(doc)],[MEDIA]);
  assert.deepEqual(Object.keys(withoutUnusedAssets(doc).assets??{}),[MEDIA]);
  assert.equal(withoutUnusedAssets(withoutLayer(doc,ARRESTO,'actor-madre')).assets,undefined);
  assert.throws(()=>withAsset(doc,'../x',{name:'x',mime:'image/png'}),/inválido/);
});
