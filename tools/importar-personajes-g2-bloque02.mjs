#!/usr/bin/env node
/**
 * Recuperación segura de seis referencias maestras G2.
 * Únicamente instala copias idénticas a los originales verificados. Nunca
 * genera expresiones, ni modifica public/, campaña o recursos G1.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
export const EXPECTED={
  'leandro-valcazar':{sha:'0bcfe3a9c18aa1062f77fb0f9040d788686482077939de82d7b6f9d3694de25f',format:'jpeg',width:1152,height:1536},
  'octavio-argento':{sha:'531bb124d8779caa67323336c9e03b3ee561a6118a150bfd3cf463f9e831bb1d',format:'png',width:1125,height:1398},
  'jeronimo-arrellano':{sha:'d9f6a440f102e5354e7dbcac4a0bf21bb6019c91898224ceb5e483da4d14c821',format:'png',width:1125,height:1398},
  'isabela-valdierra':{sha:'9e6f72964d6db122d038dda3446ade3792c2d3fbcbd5910af74f8e2c60652d0a',format:'png',width:1125,height:1398},
  'aukan-del-condor':{sha:'b1d93fabf62a18f7451697cc170d8f210ed8995538968b40a971cf730a814c7e',format:'jpeg',width:1229,height:1536},
  'gonzalo-de-montes':{sha:'ad52f79a641eb0cd699f984ac118c90f47ae47c5ed8b7e78804da80a0982fced',format:'jpeg',width:1229,height:1536},
};
const sha256=data=>createHash('sha256').update(data).digest('hex');
const entryName=id=>'originales/'+id+'.png';
const manifestName='manifiesto-seis-generales-G2.json';
const allowedNames=new Set(['LEEME.txt',manifestName,...Object.keys(EXPECTED).map(entryName)]);

export function validateNames(names){
  if(names.length!==allowedNames.size)throw Error('El paquete no contiene exactamente ocho archivos.');
  const unique=new Set(names);
  if(unique.size!==names.length)throw Error('Entradas ZIP duplicadas.');
  for(const name of names){
    if(!allowedNames.has(name)||name.includes('..')||name.startsWith('/'))
      throw Error('Entrada no autorizada en ZIP: '+name);
  }
  return true;
}
export function inspectSignature(data,expected){
  if(expected.format==='png'){
    if(!data.subarray(0,8).equals(PNG))throw Error('Firma PNG inválida.');
    if(data.length<33||data.toString('ascii',12,16)!=='IHDR'||
       data.readUInt32BE(16)!==expected.width||data.readUInt32BE(20)!==expected.height||
       data[25]!==6)throw Error('Dimensiones o canal RGBA del maestro no coinciden.');
  }else if(data.length<4||data[0]!==255||data[1]!==216||data[2]!==255){
    throw Error('Firma JPEG inválida.');
  }
  return true;
}
function zipRead(zip,name){
  return execFileSync('unzip',['-p',zip,name],{maxBuffer:6*1024*1024});
}
export function inspectPackage(zip){
  const list=execFileSync('unzip',['-Z','-1',zip],{encoding:'utf8',maxBuffer:1024*1024})
    .trim().split(/\r?\n/);
  validateNames(list);
  const manifest=JSON.parse(zipRead(zip,manifestName).toString('utf8'));
  if(manifest.project!=='Decreto Real'||manifest.generation!=='G2'||
      manifest.block!=='02'||manifest.assetCount!==6||manifest.assets?.length!==6)
    throw Error('Manifiesto de lote 02 inválido.');
  const assets=new Map(manifest.assets.map(a=>[a.id,a]));
  if(assets.size!==6)throw Error('Identidades duplicadas en manifiesto.');
  const validated=[];
  for(const [id,expected] of Object.entries(EXPECTED)){
    const meta=assets.get(id);
    if(!meta||meta.filename!==id+'.png'||meta.sha256!==expected.sha||
       meta.realFormat.toLowerCase()!==expected.format||
       meta.width!==expected.width||meta.height!==expected.height||
       meta.publishedInRepo!==false||meta.approvedG2!==false)
      throw Error('Metadatos incorrectos: '+id);
    const bytes=zipRead(zip,entryName(id));
    if(sha256(bytes)!==expected.sha)throw Error('SHA-256 no coincide: '+id);
    inspectSignature(bytes,expected);
    validated.push({id,bytes,relativePath:'art-reference/personajes-oficiales/imagenes/'+id+
      (expected.format==='jpeg'?'.jpg':'.png')});
  }
  return validated;
}

export function importPackage(zip,{root=ROOT}={}){
  const validated=inspectPackage(zip); // revisar TODOS antes de escribir
  const catalogFile=join(root,'art-reference/personajes-oficiales/catalogo.json');
  const catalog=JSON.parse(readFileSync(catalogFile,'utf8'));
  for(const entry of validated){
    const target=join(root,entry.relativePath);
    if(existsSync(target)&&sha256(readFileSync(target))!==sha256(entry.bytes))
      throw Error('No se sobrescribe un original distinto: '+entry.id);
    if(!catalog.personajes.some(p=>p.id===entry.id))
      throw Error('Personaje inexistente en catálogo: '+entry.id);
  }
  for(const entry of validated){
    const target=join(root,entry.relativePath);mkdirSync(dirname(target),{recursive:true});
    if(!existsSync(target))writeFileSync(target,entry.bytes);
    const character=catalog.personajes.find(p=>p.id===entry.id);
    character.archivoPendiente=entry.relativePath;
    character.imagenEnRepositorio=true;
    character.estadoG2='original_maestro_publicado; expresiones y aprobacion de variantes pendientes';
    if(character.verificacionOriginalRecuperado)character.verificacionOriginalRecuperado.archivoEnRepositorio=true;
  }
  const progress=catalog.avanceCanonVisual.bloque02Recuperacion;
  if(progress)progress.binariosSubidosAGitHub=6;
  catalog.nota='Originales de los seis generales del bloque 02 publicados; otras referencias y expresiones G2 pendientes.';
  writeFileSync(catalogFile,JSON.stringify(catalog,null,2)+'\n');
  return validated.map(x=>({id:x.id,path:x.relativePath,sha:sha256(x.bytes)}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const path=process.argv[2];
    if(!path)throw Error('Uso: node tools/importar-personajes-g2-bloque02.mjs <paquete.zip>');
    const result=importPackage(resolve(path));
    console.log('6 originales G2 importados sin tocar G1 ni recursos jugables: '+result.map(x=>x.id).join(', '));
  }catch(error){console.error('Importación cancelada: '+error.message);process.exitCode=1;}
}
