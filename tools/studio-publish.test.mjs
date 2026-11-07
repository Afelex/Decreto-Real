import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publishStudio } from './studio-publish.mjs';
import { buildStudioPackage, STUDIO_PUBLISH_MAX_FILE_BYTES } from '../campaign/studio/package.ts';
import { createZip } from '../campaign/studio/zip.ts';
import { publishedMediaUrls, loadPublishedStudio } from '../campaign/studio/published.ts';
const png=new Uint8Array([137,80,78,71,13,10,26,10]);
const doc={version:3,scenes:{'prologo/arresto-01':{background:{assetId:'media-11111111-1111-4111-8111-111111111111'},dialogue:{text:'**Publicado**'}}},assets:{'media-11111111-1111-4111-8111-111111111111':{name:'Prueba',mime:'image/png'}}};
const file={id:'media-11111111-1111-4111-8111-111111111111',name:'Prueba',mime:'image/png',data:png};
test('ZIP → publicación normalizada, rutas públicas e ida y vuelta; poda medios sin uso',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-publicar-'));
  try{
    await mkdir(join(root,'public/studio/media'),{recursive:true});
    await writeFile(join(root,'public/studio/media/viejo.png'),png);
    const result=await publishStudio(buildStudioPackage(doc,[file]),root);
    const saved=JSON.parse(await readFile(join(root,'public/studio/composiciones.json'),'utf8'));
    assert.deepEqual(saved,result);
    assert.deepEqual(await readdir(join(root,'public/studio/media')),['media-11111111-1111-4111-8111-111111111111.png']);
    assert.deepEqual(new Uint8Array(await readFile(join(root,'public/studio/media/media-11111111-1111-4111-8111-111111111111.png'))),png);
    assert.equal(publishedMediaUrls(saved)['media-11111111-1111-4111-8111-111111111111'],'./studio/media/media-11111111-1111-4111-8111-111111111111.png');
    assert.deepEqual(await loadPublishedStudio('./',async(url,options)=>{
      assert.equal(url,'./studio/composiciones.json');assert.equal(options.cache,'no-store');
      return new Response(JSON.stringify(saved));
    }),result);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('rechaza firmas disfrazadas, MIME incoherente, referencias rotas y archivos grandes',()=>{
  assert.throws(()=>buildStudioPackage(doc,[{...file,data:new TextEncoder().encode('<svg/>')}]),/formato/);
  assert.throws(()=>buildStudioPackage({...doc,assets:{'media-11111111-1111-4111-8111-111111111111':{name:'Prueba',mime:'video/mp4'}}},[file]),/MIME/);
  assert.throws(()=>buildStudioPackage({...doc,assets:{}},[file]),/rota/);
  const large=new Uint8Array(STUDIO_PUBLISH_MAX_FILE_BYTES+1);large.set(png);
  assert.throws(()=>buildStudioPackage(doc,[{...file,data:large}]),/25 MB/);
  assert.throws(()=>buildStudioPackage(doc,[]),/Falta/);
  assert.throws(()=>createZip([{name:'../escape.png',data:png}]),/no válido/i);
});
test('un manifiesto ausente o inválido conserva la composición base',async()=>{
  for(const request of [async()=>new Response('',{status:404}),async()=>new Response('<html>'),async()=>{throw new Error('sin conexión');}]){
    assert.deepEqual(await loadPublishedStudio('./',request),{version:3,scenes:{}});
  }
});
test('un paquete manipulado con firma falsa falla antes de escribir',async()=>{
  const zip=createZip([{name:'proyecto.json',data:new TextEncoder().encode(JSON.stringify({studioPackage:3,document:doc,media:[{...file,data:undefined,path:'media/media-11111111-1111-4111-8111-111111111111.png'}]}))},{name:'media/media-11111111-1111-4111-8111-111111111111.png',data:new TextEncoder().encode('<svg/>')}]);
  const root=await mkdtemp(join(tmpdir(),'studio-invalido-'));
  try{await assert.rejects(publishStudio(zip,root));assert.deepEqual(await readdir(root),[]);}
  finally{await rm(root,{recursive:true,force:true});}
});

test('rechaza más de 200 MB totales aunque cada archivo respete 25 MB',()=>{
  const data=new Uint8Array(STUDIO_PUBLISH_MAX_FILE_BYTES);data.set(png);
  const document={version:3,scenes:{},assets:{}};
  const files=[];
  for(let i=0;i<9;i++){
    const id='media-'+String(i).repeat(12);
    document.scenes['prologo/prueba-'+i]={background:{assetId:id}};
    document.assets[id]={name:id,mime:'image/png'};
    files.push({id,name:id,mime:'image/png',data});
  }
  assert.throws(()=>buildStudioPackage(document,files),/200 MB/);
});
