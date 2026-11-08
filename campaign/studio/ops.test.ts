import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLayerTransform, emptyStudioDocumentV3, isBackgroundLocked, type StudioLayer } from './schema.ts';
import {
  changedSceneKeys, copyScene, editedSceneKeys, layerOrDefault, getLayer, referencedAssetIds, sceneLayers, withAsset, withLayer,
  effectiveDialogueStyle, effectiveTutorialLayer, tutorialLayoutKey, isTutorialLayoutId, withBackgroundFrame, withDialogue, withDialogueDefaults, withLayerPatch, withSceneSettings, withoutLayer, withoutScene, withoutUnusedAssets,
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

test('changedSceneKeys reports only the scenes touched by an edit',()=>{
  const a=withLayer(emptyStudioDocumentV3(),ARRESTO,madre);
  const b=withLayerPatch(a,ARRESTO,'actor-madre',{x:3});
  const c=withLayer(b,'prologo/xervias-01',{...madre});
  assert.deepEqual(changedSceneKeys(a,b),[ARRESTO]);
  assert.deepEqual(changedSceneKeys(b,c),['prologo/xervias-01']);
  assert.deepEqual(changedSceneKeys(c,c),[]);
});

test('layerOrDefault creates native actor and bubble layers on demand',()=>{
  const blank=emptyStudioDocumentV3();
  assert.deepEqual(layerOrDefault(blank,ARRESTO,'actor-nino'),
    {id:'actor-nino',kind:'actor',actor:'Niño',...defaultLayerTransform('actor','Niño')});
  assert.equal(layerOrDefault(blank,ARRESTO,'bubble')?.z,47);
  assert.equal(layerOrDefault(blank,ARRESTO,EXTRA),null);
  const doc=withLayer(blank,ARRESTO,{...madre,x:3});
  assert.equal(layerOrDefault(doc,ARRESTO,'actor-madre')?.x,3);
});

test('background framing is independent of its media and locked by default',()=>{
  let doc=withAsset(emptyStudioDocumentV3(),MEDIA,{name:'plaza.webp',mime:'image/webp'});
  doc=withBackgroundFrame(doc,ARRESTO,{x:4,scale:1.2});
  assert.deepEqual(doc.scenes[ARRESTO].background,{x:4,scale:1.2});
  assert.equal(isBackgroundLocked(doc.scenes[ARRESTO].background),true);
  doc=withSceneSettings(doc,ARRESTO,{background:{assetId:MEDIA}});
  doc=withBackgroundFrame(doc,ARRESTO,{locked:false,scale:9});
  assert.deepEqual(doc.scenes[ARRESTO].background,{assetId:MEDIA,x:4,scale:3,locked:false});
  assert.equal(isBackgroundLocked(doc.scenes[ARRESTO].background),false);
  assert.deepEqual([...referencedAssetIds(doc)],[MEDIA]);
  // Volver a los valores neutros elimina el fondo; «Fondo original» quita recurso y encuadre.
  assert.equal(withBackgroundFrame(withSceneSettings(doc,ARRESTO,{background:null}),ARRESTO,{}).scenes[ARRESTO],undefined);
  const neutral=withBackgroundFrame(withAsset(emptyStudioDocumentV3(),MEDIA,{name:'a',mime:'image/png'}),ARRESTO,{x:0,scale:1,locked:true});
  assert.equal(neutral.scenes[ARRESTO],undefined);
});

test('locked layers keep their flag; unlocked layers store nothing',()=>{
  const doc=withLayer(emptyStudioDocumentV3(),ARRESTO,{...madre,locked:true});
  assert.equal(getLayer(doc,ARRESTO,'actor-madre')?.locked,true);
  const unlocked=withLayerPatch(doc,ARRESTO,'actor-madre',{locked:false});
  assert.equal('locked' in (getLayer(unlocked,ARRESTO,'actor-madre')??{}),false);
});

test('dialogue text, sizes and common defaults; null restores the original',()=>{
  let doc=withDialogue(emptyStudioDocumentV3(),ARRESTO,{text:'¡Por **favor**!',textScale:1.3,boxScale:9});
  assert.deepEqual(doc.scenes[ARRESTO].dialogue,{text:'¡Por **favor**!',textScale:1.3,boxScale:1.8});
  assert.deepEqual(effectiveDialogueStyle(doc,ARRESTO),{textScale:1.3,boxScale:1.8,boxWidth:1,hideNameplate:false,hideProgress:false,hideTitle:false});
  doc=withDialogueDefaults(doc,{textScale:1.2,boxScale:1.4});
  assert.deepEqual(effectiveDialogueStyle(doc,'prologo/arresto-02'),{textScale:1.2,boxScale:1.4,boxWidth:1,hideNameplate:false,hideProgress:false,hideTitle:false});
  assert.deepEqual(effectiveDialogueStyle(doc,ARRESTO),{textScale:1.3,boxScale:1.8,boxWidth:1,hideNameplate:false,hideProgress:false,hideTitle:false});
  doc=withDialogue(doc,ARRESTO,{textScale:null,boxScale:null});
  assert.deepEqual(effectiveDialogueStyle(doc,ARRESTO),{textScale:1.2,boxScale:1.4,boxWidth:1,hideNameplate:false,hideProgress:false,hideTitle:false});
  doc=withDialogue(doc,ARRESTO,{text:'   '});
  assert.equal(doc.scenes[ARRESTO],undefined,'blank text means the original line');
  assert.equal(withDialogueDefaults(doc,{textScale:1,boxScale:null}).defaults,undefined);
});

test('title, title visibility for players and whole-beat dev-only flags',()=>{
  let doc=withSceneSettings(emptyStudioDocumentV3(),ARRESTO,{title:'Arresto en la plaza',titleDevOnly:true,devOnly:true});
  assert.deepEqual(doc.scenes[ARRESTO],{title:'Arresto en la plaza',titleDevOnly:true,devOnly:true});
  doc=withSceneSettings(doc,ARRESTO,{title:null,titleDevOnly:false,devOnly:false});
  assert.equal(doc.scenes[ARRESTO],undefined);
  const layer=withLayer(emptyStudioDocumentV3(),ARRESTO,{...madre,devOnly:true});
  assert.equal(getLayer(layer,ARRESTO,'actor-madre')?.devOnly,true);
});

test('copyScene copies only the visual layout, never the texts of the target beats',()=>{
  let doc=withLayer(emptyStudioDocumentV3(),ARRESTO,{...madre,x:8});
  doc=withDialogue(doc,ARRESTO,{text:'Texto propio de la fuente'});
  doc=withDialogue(doc,'prologo/arresto-02',{text:'Texto del destino'});
  doc=withSceneSettings(doc,'prologo/arresto-02',{devOnly:true});
  const copied=copyScene(doc,ARRESTO,['prologo/arresto-02']);
  assert.equal(getLayer(copied,'prologo/arresto-02','actor-madre')?.x,8);
  assert.equal(copied.scenes['prologo/arresto-02'].dialogue?.text,'Texto del destino');
  assert.equal(copied.scenes['prologo/arresto-02'].devOnly,true);
});

test('dialogue chrome: narrower block and developer-only nameplate, progress and title',()=>{
  let doc=withDialogueDefaults(emptyStudioDocumentV3(),{hideProgress:true,boxWidth:.3});
  assert.deepEqual(effectiveDialogueStyle(doc,ARRESTO),{textScale:1,boxScale:1,boxWidth:.5,hideNameplate:false,hideProgress:true,hideTitle:false});
  doc=withDialogue(doc,ARRESTO,{hideNameplate:true,hideTitle:true});
  assert.equal(effectiveDialogueStyle(doc,ARRESTO).hideNameplate,true);
  assert.equal(effectiveDialogueStyle(doc,'prologo/arresto-02').hideNameplate,false);
  doc=withDialogue(doc,ARRESTO,{hideNameplate:null,hideTitle:null});
  assert.equal(doc.scenes[ARRESTO],undefined);
});

test('director narrativo: cada intervención conserva posición visual y hereda el tablero base',()=>{
  const id='native-tablero-tutorial-dialogo';
  assert.equal(isTutorialLayoutId(id),true);
  assert.equal(isTutorialLayoutId('native-tablero-retrato-jugador'),false);
  assert.equal(tutorialLayoutKey('g11','movil'),'tutorial/g11-movil');
  assert.throws(()=>tutorialLayoutKey('../otro','movil'),/no válida/);
  const layer:StudioLayer={id,kind:'native',...defaultLayerTransform('native'),x:-5,y:-4};
  let doc=withLayer(emptyStudioDocumentV3(),'tablero/movil',layer);
  // g11 comienza heredando -5; solo g11 modifica esa ubicación.
  assert.equal(effectiveTutorialLayer(doc,'g11','movil',id)?.x,-5);
  doc=withLayer(doc,tutorialLayoutKey('g11','movil'),{...layer,x:-22});
  assert.equal(effectiveTutorialLayer(doc,'g11','movil',id)?.x,-22);
  assert.equal(effectiveTutorialLayer(doc,'g12','movil',id)?.x,-5);
  assert.equal(effectiveTutorialLayer(doc,'g11','horizontal',id),undefined);
  assert.equal(getLayer(doc,'tablero/movil',id)?.x,-5);
});
