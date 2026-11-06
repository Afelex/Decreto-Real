#!/usr/bin/env node
/**
 * Six images only. Paid OpenAI Images API is triggered on the first merge to main;
 * subsequent runs skip existing valid WebP, so recovering after interruption is safe.
 * No secrets or API responses are stored in the repository.
 */
import { existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,renameSync,statSync } from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ROOT_ASSETS=join(ROOT,'public/campania/prologo-v2');
const ARTIFACT=join(ROOT,'art-output/prologo-v2');
const CATALOG_PATH=join(ROOT,'prologue-art/revision-v2.json');
const SECRET_RE=/sk-[A-Za-z0-9_-]+/g;
const API_BASE='https://api.openai.com/v1/images/';
export const validWebp=path=>{
 if(!existsSync(path)||statSync(path).size<100)return false;
 const sig=readFileSync(path).subarray(0,12);
 return sig.toString('ascii',0,4)==='RIFF' && sig.toString('ascii',8,12)==='WEBP';
};
export function catalog(){
 const data=JSON.parse(readFileSync(CATALOG_PATH,'utf8'));
 if(data.version!==2||data.items?.length!==6)throw Error('Catálogo v2 debe contener seis imágenes.');
 const ids=new Set(),paths=new Set(),previous=new Set();
 for(const a of data.items){
  if(!/^(D0[1-5]|F01)$/.test(a.id)||ids.has(a.id)||paths.has(a.file))throw Error('Duplicado '+a.id);
  if(!/^(sprites|retratos|fondos)\/[a-z0-9_-]+\.webp$/.test(a.file))throw Error('Ruta no válida '+a.file);
  if(!a.prompt||a.prompt.length<130)throw Error('Prompt incompleto '+a.id);
  for(const ref of a.refs??[]){
    if(!ref.startsWith('public/campania/prologo-v2/')||ref.includes('..')||!previous.has(ref))throw Error('Referencia no disponible en el lote '+ref);
  }
  ids.add(a.id);paths.add(a.file);previous.add('public/campania/prologo-v2/'+a.file);
 }
 return data;
}
function emit(status){
 mkdirSync(ARTIFACT,{recursive:true});
 writeFileSync(join(ARTIFACT,'status.json'),JSON.stringify(status,null,2)+'\n');
}
function request(item,quality,model){
 const refs=(item.refs??[]).map(path=>{
  const full=join(ROOT,path);
  if(!validWebp(full))throw Error('Referencia previa no disponible '+path);
  return {image_url:'data:image/webp;base64,'+readFileSync(full).toString('base64')};
 });
 const sprite=item.kind==='sprite';
 const payload={model,n:1,size:'1024x1536',quality,
  output_format:'webp',output_compression:82,
  background:sprite?'transparent':'opaque',prompt:item.prompt+
  (sprite?' Transparent real alpha with clean edges, no fake checkerboard.':
   ' Complete opaque artwork, no typography.')};
 return refs.length?{url:API_BASE+'edits',payload:{...payload,images:refs}}:
  {url:API_BASE+'generations',payload};
}
export async function produce({mode='plan',quality='medium',confirm='',key=process.env.OPENAI_API_KEY}={}){
 const data=catalog();
 if(!['plan','generate'].includes(mode)||!['low','medium','high'].includes(quality))throw Error('Parámetros inválidos');
 const results={mode,quality,generated:[],skipped:[],errors:[],total:6};
 if(mode==='plan'){
  for(const a of data.items)results[validWebp(join(ROOT_ASSETS,a.file))?'skipped':'generated'].push({id:a.id,file:a.file});
  emit(results);console.log('Plan sin costo:',results.generated.length,'pendientes.');return results;
 }
 if(confirm!=='GENERAR_6')throw Error('Generación con costo requiere confirmación GENERAR_6.');
 if(!key)throw Error('OPENAI_API_KEY no configurada.');
 for(const a of data.items){
  const dest=join(ROOT_ASSETS,a.file);
  if(validWebp(dest)){results.skipped.push({id:a.id,file:a.file});continue;}
  try{
    console.log('Generando '+a.id+' '+a.file);
    const {url,payload}=request(a,quality,data.model);
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(300000)});
    if(!response.ok)throw Error('HTTP '+response.status+' '+(await response.text()).replace(SECRET_RE,'[REDACTADO]').slice(0,300));
    const json=await response.json();
    if(!json.data?.[0]?.b64_json)throw Error('La API no devolvió imagen.');
    const binary=Buffer.from(json.data[0].b64_json,'base64');
    mkdirSync(dirname(dest),{recursive:true});
    const partial=dest+'.partial';writeFileSync(partial,binary);
    if(!validWebp(partial))throw Error('WebP inválido');
    renameSync(partial,dest);
    const mirror=join(ARTIFACT,a.file);mkdirSync(dirname(mirror),{recursive:true});copyFileSync(dest,mirror);
    results.generated.push({id:a.id,file:a.file,bytes:binary.length});
    emit(results);
  }catch(err){
    results.errors.push({id:a.id,error:String(err.message??err).replace(SECRET_RE,'[REDACTADO]')});
    emit(results);process.exitCode=1;break;
  }
 }
 if(data.items.every(a=>validWebp(join(ROOT_ASSETS,a.file)))){
  mkdirSync(ROOT_ASSETS,{recursive:true});
  writeFileSync(join(ROOT_ASSETS,'manifest.json'),JSON.stringify({
    version:2,completed:6,files:Object.fromEntries(data.items.map(a=>[a.id,a.file]))
  },null,2)+'\n');
  results.complete=true;console.log('Se completaron los seis artes del prólogo v2.');
 }else results.complete=false;
 emit(results);return results;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 produce({mode:process.env.PROLOGUE_V2_MODE||'plan',quality:process.env.PROLOGUE_V2_QUALITY||'medium',
   confirm:process.env.PROLOGUE_V2_CONFIRM||''}).catch(err=>{console.error(String(err.message??err).replace(SECRET_RE,'[REDACTADO]'));process.exitCode=1});
}
