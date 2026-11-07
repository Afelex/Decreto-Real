import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffStudioMedia } from './mediaSignature.ts';
import { crc32, createZip, isSafeZipName, readZip } from './zip.ts';
import { buildStudioPackage, parseStudioPackage, summarizeImport, type PackageMedia } from './package.ts';
import { assetUsage, mergeStudioDocuments, withAsset, withLayer, withSceneSettings } from './ops.ts';
import { defaultLayerTransform, emptyStudioDocumentV3, type StudioDocumentV3 } from './schema.ts';

const PNG=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64'));
const GIF=Uint8Array.from(Buffer.from('R0lGODlhAQABAAAAACwAAAAAAQABAAA=','base64'));
const A='media-11111111-1111-4111-8111-111111111111';
const B='media-22222222-2222-4222-8222-222222222222';
const C='media-33333333-3333-4333-8333-333333333333';
const EXTRA='extra-44444444-4444-4444-8444-444444444444';
const KEY='prologo/arresto-01';

test('media type comes from the real file signature, not from its name',()=>{
  assert.equal(sniffStudioMedia(PNG),'image/png');
  assert.equal(sniffStudioMedia(GIF),'image/gif');
  assert.equal(sniffStudioMedia(Uint8Array.from([0xff,0xd8,0xff,0xe0])),'image/jpeg');
  assert.equal(sniffStudioMedia(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')),'image/webp');
  assert.equal(sniffStudioMedia(new TextEncoder().encode('\0\0\0\x18ftypmp42')),'video/mp4');
  assert.equal(sniffStudioMedia(Uint8Array.from([0x1a,0x45,0xdf,0xa3,1])),'video/webm');
  assert.equal(sniffStudioMedia(new TextEncoder().encode('<svg onload=alert(1)>')),null);
  assert.equal(sniffStudioMedia(new TextEncoder().encode('<html>')),null);
  assert.equal(sniffStudioMedia(new Uint8Array()),null);
});

test('zip roundtrip with CRC-32 and safe paths only',()=>{
  assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
  const entries=[{name:'proyecto.json',data:new TextEncoder().encode('{"a":1}')},{name:'media/a.png',data:PNG}];
  const zip=createZip(entries);
  assert.deepEqual(readZip(zip).map(e=>[e.name,[...e.data]]),entries.map(e=>[e.name,[...e.data]]));
  assert.deepEqual(createZip(entries),zip,'deterministic output');
  for(const bad of ['../x','/abs','a\\b','a//b','./a',''])assert.equal(isSafeZipName(bad),false,bad);
  assert.throws(()=>createZip([{name:'../evil',data:PNG}]),/no válido/);
  const corrupted=Uint8Array.from(zip);corrupted[45]^=0xff; // dentro de los datos de proyecto.json
  assert.throws(()=>readZip(corrupted),/CRC|dañado/);
  assert.throws(()=>readZip(new TextEncoder().encode('no es zip')),/ZIP válido/);
});

const sampleDoc=():StudioDocumentV3=>{
  let doc=withAsset(emptyStudioDocumentV3(),A,{name:'madre.png',mime:'image/png'});
  doc=withAsset(doc,B,{name:'destello.gif',mime:'image/gif'});
  doc=withAsset(doc,C,{name:'sin-uso.png',mime:'image/png'});
  doc=withLayer(doc,KEY,{id:'actor-madre',kind:'actor',actor:'Madre',...defaultLayerTransform('actor','Madre'),assetId:A});
  doc=withLayer(doc,KEY,{id:EXTRA,kind:'effect',name:'destello',assetId:B,...defaultLayerTransform('effect')});
  return withSceneSettings(doc,'prologo/arresto-02',{background:{assetId:A}});
};
const files:PackageMedia[]=[
  {id:A,name:'madre.png',mime:'image/png',data:PNG},
  {id:B,name:'destello.gif',mime:'image/gif',data:GIF},
  {id:C,name:'sin-uso.png',mime:'image/png',data:PNG},
];

test('ZIP project roundtrip keeps the document and only the files in use, without base64',()=>{
  const zip=buildStudioPackage(sampleDoc(),files);
  const names=readZip(zip).map(e=>e.name);
  assert.deepEqual(names,['proyecto.json','media/'+A+'.png','media/'+B+'.gif']);
  // Sin inflado base64: el ZIP pesa poco más que los archivos originales.
  assert.ok(zip.length<PNG.length+GIF.length+3000);
  const parsed=parseStudioPackage(zip);
  assert.equal(parsed.format,'zip');
  assert.deepEqual(Object.keys(parsed.doc.assets??{}).sort(),[A,B]);
  assert.deepEqual(parsed.doc.scenes,sampleDoc().scenes);
  assert.deepEqual(parsed.media.map(m=>[m.id,m.mime,[...m.data]]),[[A,'image/png',[...PNG]],[B,'image/gif',[...GIF]]]);
  assert.throws(()=>buildStudioPackage(sampleDoc(),[files[0]]),/Falta un recurso/);
});

test('import rejects disguised files and still reads legacy JSON backups',()=>{
  const fake:PackageMedia={id:B,name:'destello.gif',mime:'image/gif',data:new TextEncoder().encode('<script>')};
  assert.throws(()=>buildStudioPackage(sampleDoc(),[files[0],fake]),/dañado|formato/);
  const legacy=JSON.stringify({studioPackage:2,
    document:{version:1,scenes:{'opening:1':{Madre:{x:3,y:0,scale:1,mirror:false,layer:4,visible:true,assetId:A}}},
      assets:{[A]:{name:'madre.png',mime:'image/png'}}},
    media:[{id:A,name:'madre.png',mime:'image/png',data:'data:image/png;base64,'+Buffer.from(PNG).toString('base64')}]});
  const parsed=parseStudioPackage(new TextEncoder().encode(legacy));
  assert.equal(parsed.format,'json');
  assert.equal(parsed.doc.scenes[KEY].layers?.[0].x,3);
  assert.deepEqual([...parsed.media[0].data],[...PNG]);
  const disguised=JSON.stringify({studioPackage:3,document:{version:3,scenes:{}},
    media:[{id:A,name:'x.png',mime:'image/png',data:'data:image/png;base64,'+Buffer.from('<svg/>').toString('base64')}]});
  assert.throws(()=>parseStudioPackage(new TextEncoder().encode(disguised)),/no es una imagen/);
  assert.throws(()=>parseStudioPackage(new TextEncoder().encode('hola')),/no es un respaldo/);
});

test('merge keeps the current draft and replaces only matching scenes',()=>{
  const current=withSceneSettings(withSceneSettings(emptyStudioDocumentV3(),KEY,{titleVisible:false}),'prologo/cetro-01',{devOnly:true});
  const incoming=withSceneSettings(emptyStudioDocumentV3(),KEY,{title:'Importado'});
  const merged=mergeStudioDocuments(current,incoming);
  assert.deepEqual(merged.scenes[KEY],{title:'Importado'});
  assert.deepEqual(merged.scenes['prologo/cetro-01'],{devOnly:true});
  const summary=summarizeImport(current,{doc:incoming,media:[],format:'zip'});
  assert.deepEqual(summary,{scenes:1,overlapping:1,currentScenes:2,media:0,bytes:0,dropped:0});
});

test('asset usage lists the scenes that use each file',()=>{
  assert.deepEqual(assetUsage(sampleDoc()),{[A]:[KEY,'prologo/arresto-02'],[B]:[KEY]});
});
