#!/usr/bin/env node
/**
 * Decreto Real / Prologo 2026 — OpenAI Images API.
 *
 * Modes: plan (no cost), generate (paid; explicit authorization required).
 * Produces exactly the missing assets described in prologue-art/catalog.json.
 * Stable destination: public/campania/prologo/{sprites,fondos,planos}/...
 * Base identity references are committed game portraits; expression variants
 * reuse their approved first generated character sprite.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = join(ROOT, 'prologue-art/catalog.json');
const DEST = join(ROOT, 'public/campania/prologo');
const ARTIFACT = join(ROOT, 'art-output/prologo');
const API_BASE = 'https://api.openai.com/v1/images/';
const TOKEN_RE = /sk-[A-Za-z0-9_-]+/g;

export function readCatalog() {
  const raw = readFileSync(CATALOG_PATH, 'utf8');
  const data = JSON.parse(raw);
  validateCatalog(data);
  return { data, digest: createHash('sha256').update(raw).digest('hex') };
}

export function validateCatalog(data) {
  if (data.version !== 1 || data.items?.length !== 23) throw Error('El plan debe contener 23 artes.');
  const ids = new Set(), paths = new Set(), earlier = new Set();
  for (const item of data.items) {
    if (!/^(D|M|N|Z|X|F|P)[0-9]{2}$/.test(item.id) || ids.has(item.id)) throw Error('ID repetido o inválido: ' + item.id);
    if (!/^(sprites|fondos|planos)\/[a-z0-9_-]+\.webp$/.test(item.file) || paths.has(item.file)) throw Error('Ruta inválida o repetida: ' + item.file);
    if (!['sprite','background','closeup'].includes(item.kind) || !item.prompt || item.prompt.length < 80) throw Error('Prompt inválido: ' + item.id);
    for (const ref of item.references ?? []) {
      if (!/^((public\/|art-reference\/)[a-zA-Z0-9_\-./]+\.webp)$/.test(ref) || ref.includes('..')) throw Error('Referencia insegura: ' + ref);
      if (!existsSync(join(ROOT, ref)) && !earlier.has(ref)) throw Error('Referencia no disponible ni generada antes: ' + item.id + ' -> ' + ref);
    }
    ids.add(item.id); paths.add(item.file);
    earlier.add('public/campania/prologo/' + item.file);
  }
  if (data.items.filter(x=>x.kind==='sprite').length!==18 || data.items.filter(x=>x.kind!=='sprite').length!==5) throw Error('Se esperaban 18 sprites y 5 artes adicionales.');
  return true;
}

export function isWebp(path) {
  if (!existsSync(path) || statSync(path).size < 100) return false;
  const sig = readFileSync(path).subarray(0, 12);
  return sig.toString('ascii',0,4)==='RIFF' && sig.toString('ascii',8,12)==='WEBP';
}

export function buildRequest(item, quality='medium', model='gpt-image-2.5-flare') {
  const refs = (item.references ?? []).map(path => {
    if (!isWebp(join(ROOT,path))) throw Error('La referencia visual no es WebP válido: ' + path);
    return { image_url: 'data:image/webp;base64,' + readFileSync(join(ROOT,path)).toString('base64') };
  });
  const transparent = item.kind==='sprite';
  const common = {
    model, n: 1, size: '1024x1536', quality,
    output_format:'webp', output_compression:85,
    background:transparent?'transparent':'opaque',
    prompt:item.prompt + ' IMPORTANT: Preserve the visual identity and costume of the first reference for character variants. ' +
      'Exactly ONE distinct person in character sprites, no other bodies, no text. ' +
      (transparent?'A genuinely transparent alpha background, not black, not white, and no fake checkerboard.':'A fully rendered opaque cinematic composition.')
  };
  return refs.length
    ? {url:API_BASE+'edits',payload:{...common,images:refs}}
    : {url:API_BASE+'generations',payload:common};
}

function writeStatus(status) {
  mkdirSync(ARTIFACT,{recursive:true});
  writeFileSync(join(ARTIFACT,'resultado.json'),JSON.stringify(status,null,2)+'\n');
}

export async function run({mode='plan',quality='medium',confirm='',key=process.env.OPENAI_API_KEY, max=23}={}) {
  const {data,digest}=readCatalog();
  if(!['plan','generate'].includes(mode))throw Error('Modo desconocido');
  if(!['low','medium','high'].includes(quality))throw Error('Calidad desconocida');
  if(!Number.isInteger(max)||max<1||max>23)throw Error('Límite de imágenes inválido');
  const missing=data.items.filter(item=>!isWebp(join(DEST,item.file)));
  const stats={catalog_sha256:digest,mode,quality,model:data.model,planned:data.items.length,existing:data.items.length-missing.length,generated:[],skipped:[],errors:[]};
  if(mode==='plan'){
    for(const item of data.items)stats[(isWebp(join(DEST,item.file))?'skipped':'generated')].push({id:item.id,file:item.file,status:isWebp(join(DEST,item.file))?'exists':'planned'});
    writeStatus(stats);
    console.log('PLAN SIN COSTO: '+missing.length+' imágenes pendientes, '+stats.existing+' ya presentes.');
    return stats;
  }
  if(confirm!=='GENERAR_23')throw Error('Generación de pago bloqueada: falta GENERAR_23');
  if(!key)throw Error('No existe OPENAI_API_KEY en GitHub Secrets. No se llamó a la API.');
  if(missing.length>max)throw Error('Se esperaban '+missing.length+' peticiones y el límite máximo autorizado es '+max);
  console.log('Producción autorizada de '+missing.length+' imágenes. Modelo '+data.model+', calidad '+quality+'.');
  for(const item of data.items){
    const target=join(DEST,item.file);
    if(isWebp(target)){
      stats.skipped.push({id:item.id,file:item.file,status:'existing'});
      continue;
    }
    try{
      const req=buildRequest(item,quality,data.model);
      console.log('Generando '+item.id+' → '+item.file+'; referencia(s): '+(item.references?.length??0));
      const response=await fetch(req.url,{
        method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify(req.payload),signal:AbortSignal.timeout(300000)
      });
      if(!response.ok){
        const message=(await response.text()).replace(TOKEN_RE,'[REDACTADO]');
        throw Error('API HTTP '+response.status+': '+message.slice(0,600));
      }
      const json=await response.json();
      const b64=json.data?.[0]?.b64_json;
      if(!b64)throw Error('La API no entregó datos de imagen.');
      const buffer=Buffer.from(b64,'base64');
      mkdirSync(dirname(target),{recursive:true});
      const temp=target+'.partial';
      writeFileSync(temp,buffer);
      if(!isWebp(temp))throw Error('El archivo retornado no es un WebP válido.');
      // Atomic publication after format validation.
      const {renameSync}=await import('node:fs');
      renameSync(temp,target);
      const mirror=join(ARTIFACT,'imagenes',item.file);
      mkdirSync(dirname(mirror),{recursive:true});
      copyFileSync(target,mirror);
      stats.generated.push({id:item.id,file:item.file,bytes:buffer.length,usage:json.usage??null,status:'generated'});
      writeStatus(stats);
    }catch(error){
      stats.errors.push({id:item.id,error:String(error.message||error).replace(TOKEN_RE,'[REDACTADO]')});
      writeStatus(stats);
      console.error('Generación interrumpida en '+item.id+'; lo anterior queda guardado en el artefacto.');
      process.exitCode=1;
      break;
    }
  }
  const completed=data.items.every(item=>isWebp(join(DEST,item.file)));
  if(completed){
    mkdirSync(DEST,{recursive:true});
    writeFileSync(join(DEST,'manifest.json'),JSON.stringify({
      version:1,catalog_sha256:digest,model:data.model,quality,completed:23,
      files:Object.fromEntries(data.items.map(item=>[item.id,item.file]))
    },null,2)+'\n');
    console.log('PROLOGO: 23/23 recursos verificados; manifest.json publicado.');
  } else {
    console.warn('Arte parcial: sin manifest completo; la app seguirá usando las imágenes de respaldo.');
  }
  writeStatus({...stats,completed});
  return stats;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 run({mode:process.env.PROLOGUE_MODE||'plan',quality:process.env.PROLOGUE_QUALITY||'medium',
   confirm:process.env.PROLOGUE_CONFIRM||'',max:Number(process.env.PROLOGUE_MAX||'23')})
 .catch(error=>{console.error(String(error.message||error).replace(TOKEN_RE,'[REDACTADO]'));process.exitCode=1;});
}
