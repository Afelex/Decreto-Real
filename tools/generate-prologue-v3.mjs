#!/usr/bin/env node
/**
 * Prologue v3: generate six transparent PNG artworks, sequentially and resumably.
 * A merge to main starts this workflow; before publishing, a complete manifest is required.
 */
import {existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,renameSync,statSync} from 'node:fs';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const CATALOG=join(ROOT,'prologue-art/revision-v3.json');
const ASSETS=join(ROOT,'public/campania/prologo-v3');
const OUTPUT=join(ROOT,'art-output/prologo-v3');
const URL='https://api.openai.com/v1/images/';
const redact=s=>String(s).replace(/sk-[A-Za-z0-9_-]+/g,'[REDACTADO]');
export const validPng=file=>{
 if(!existsSync(file)||statSync(file).size<100)return false;
 const a=readFileSync(file);
 return a.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) &&
    a.toString('ascii',12,16)==='IHDR' && [4,6].includes(a[25]); // transparency-capable grayscale+alpha or RGBA
};
const validWebp=file=>{
 if(!existsSync(file)||statSync(file).size<100)return false;
 const b=readFileSync(file);return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
};
const validRef=file=>extname(file)==='.png'?validPng(file):validWebp(file);
export function catalog(){
 const j=JSON.parse(readFileSync(CATALOG,'utf8'));
 if(j.version!==3||j.items?.length!==6)throw Error('El lote v3 requiere seis artes PNG.');
 const order=['N03','N04','X05','D07','G01','D08'];
 const paths=new Set();
 j.items.forEach((a,i)=>{
  if(a.id!==order[i]||!a.file.startsWith(['N03','N04'].includes(a.id)?'sprites/':a.id==='X05'||a.id==='D07'||a.id==='D08'?'sprites/':'props/'))throw Error('Identificador inesperado '+a.id);
  if(!/^(sprites|props)\/[a-z0-9_-]+\.png$/.test(a.file)||paths.has(a.file))throw Error('Nombre de PNG inválido '+a.file);
  if(a.prompt.length<200)throw Error('Prompt incompleto '+a.id);
  for(const ref of a.refs??[]){
    if(ref.includes('..')||!ref.startsWith('public/campania/prologo'))throw Error('Ref no permitida');
    if(ref.startsWith('public/campania/prologo-v3/')&&!paths.has(ref.slice('public/campania/prologo-v3/'.length)))throw Error('Referencia v3 fuera de orden: '+ref);
  }
  paths.add(a.file);
 });
 return j;
}
function record(out){mkdirSync(OUTPUT,{recursive:true});writeFileSync(join(OUTPUT,'status.json'),JSON.stringify(out,null,2)+'\n');}
function payload(item,quality,model){
 const images=(item.refs||[]).map(path=>{
  const full=join(ROOT,path);
  if(!validRef(full))throw Error('Falta referencia '+path);
  const mime=path.endsWith('.png')?'image/png':'image/webp';
  return {image_url:'data:'+mime+';base64,'+readFileSync(full).toString('base64')};
 });
 const body={model,n:1,size:'1024x1536',quality,output_format:'png',background:'transparent',
  prompt:item.prompt+' Render true transparent alpha, do not draw a fake checkered or white backdrop.'};
 return images.length?{url:URL+'edits',body:{...body,images}}:{url:URL+'generations',body};
}
export async function produce({mode='plan',quality='medium',confirm='',key=process.env.OPENAI_API_KEY}={}){
 const j=catalog();
 if(!['plan','generate'].includes(mode)||!['low','medium','high'].includes(quality))throw Error('Parámetros inválidos');
 const out={version:3,mode,quality,total:j.items.length,generated:[],skipped:[],errors:[],complete:false};
 if(mode==='plan'){
  for(const a of j.items)out[validPng(join(ASSETS,a.file))?'skipped':'generated'].push({id:a.id,file:a.file});
  record(out);console.log('Plan sin llamadas de pago:',out.generated.length,'pendientes');return out;
 }
 if(confirm!=='GENERAR_6_V3')throw Error('Es necesaria confirmación GENERAR_6_V3.');
 if(!key)throw Error('OPENAI_API_KEY sin configurar.');
 for(const a of j.items){
  const dest=join(ASSETS,a.file);
  if(validPng(dest)){out.skipped.push({id:a.id,file:a.file});continue;}
  try{
   const {url,body}=payload(a,quality,j.model);
   console.log('Generando '+a.id+' '+a.file);
   const resp=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(300000)});
   if(!resp.ok)throw Error('HTTP '+resp.status+': '+redact((await resp.text()).slice(0,440)));
   const json=await resp.json();
   if(!json.data?.[0]?.b64_json)throw Error('La API no devolvió imagen base64');
   const binary=Buffer.from(json.data[0].b64_json,'base64');
   mkdirSync(dirname(dest),{recursive:true});
   const temp=dest+'.partial';writeFileSync(temp,binary);
   if(!validPng(temp))throw Error('PNG inválido o sin capacidad de alpha');
   renameSync(temp,dest);
   const copy=join(OUTPUT,a.file);mkdirSync(dirname(copy),{recursive:true});copyFileSync(dest,copy);
   out.generated.push({id:a.id,file:a.file,bytes:binary.length});
   record(out);
  }catch(e){out.errors.push({id:a.id,error:redact(e.message||e)});record(out);process.exitCode=1;break;}
 }
 out.complete=j.items.every(a=>validPng(join(ASSETS,a.file)));
 if(out.complete){
  mkdirSync(ASSETS,{recursive:true});
  writeFileSync(join(ASSETS,'manifest.json'),JSON.stringify({
   version:3,completed:6,files:Object.fromEntries(j.items.map(a=>[a.id,a.file]))
  },null,2)+'\n');
  console.log('Se completaron los seis PNG transparentes v3.');
 }
 record(out);return out;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 produce({mode:process.env.PROLOGUE_V3_MODE||'plan',quality:process.env.PROLOGUE_V3_QUALITY||'medium',
 confirm:process.env.PROLOGUE_V3_CONFIRM||''}).catch(e=>{console.error(redact(e.message||e));process.exitCode=1;});
}
