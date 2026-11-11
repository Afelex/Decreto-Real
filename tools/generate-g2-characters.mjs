#!/usr/bin/env node
/**
 * Decreto Real G2 · retratos de Xervias y Zhinchi.
 * El modo plan NUNCA llama a la API. El modo generate requiere permiso explícito.
 * Todas las salidas son CANDIDATAS para aprobación, NO se escriben en public/.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const CATALOG=join(ROOT,'art-reference/personajes-g2/lote-01.json');
const OUTPUT=join(ROOT,'art-output/g2-personajes/lote-01');
const URL='https://api.openai.com/v1/images/';
const REDACT=/sk-[A-Za-z0-9_-]+/g;
const EXPECTED=[
  'G2-PER-XERVIAS-01','G2-PER-XERVIAS-02','G2-PER-XERVIAS-03','G2-PER-XERVIAS-04',
  'G2-PER-ZHINCHI-01','G2-PER-ZHINCHI-02','G2-PER-ZHINCHI-03','G2-PER-ZHINCHI-04',
];
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const cleanError=error=>String(error?.message??error).replace(REDACT,'[REDACTADO]');

export function catalog(){
  const doc=JSON.parse(readFileSync(CATALOG,'utf8'));
  if(doc.schemaVersion!==1||doc.batch!=='DR-G2-PER-LOTE-01'||doc.items?.length!==8)
    throw Error('El lote debe contener exactamente ocho retratos G2.');
  if(doc.resolution?.width!==1024||doc.resolution?.height!==1536||doc.assetType!=='png_transparent')
    throw Error('El formato de producción aprobado es PNG RGBA 1024×1536.');
  const out=new Set();
  doc.items.forEach((a,i)=>{
    if(a.id!==EXPECTED[i]||!['xervias','zhinchi'].includes(a.characterId))
      throw Error('Orden o identidad incoherente: '+a.id);
    if(!/^(xervias|zhinchi)\/[a-z0-9_-]+\.png$/.test(a.file)||out.has(a.file))
      throw Error('Ruta repetida o insegura: '+a.file);
    if(!a.file.startsWith(a.characterId+'/')||a.status!=='candidate_not_approved')
      throw Error('Solo candidatos no aprobados: '+a.id);
    if(typeof a.prompt!=='string'||a.prompt.length<450||
        !a.prompt.includes('TRANSPARENTE')||!a.prompt.includes(a.characterName))
      throw Error('Prompt incompleto: '+a.id);
    if(!Array.isArray(a.references)||a.references.length<1||a.references.length>3)
      throw Error('Falta referencia de identidad: '+a.id);
    for(const ref of a.references){
      if(!/^public\/campania\/prologo\/sprites\/(xervias|zhinchi)_[a-z0-9_]+\.webp$/.test(ref)||
          !ref.includes('/'+a.characterId+'_')||!validWebp(join(ROOT,ref)))
        throw Error('Referencia visual inexistente o ajena: '+a.id+' '+ref);
    }
    out.add(a.file);
  });
  return doc;
}
export function validWebp(file){
  if(!existsSync(file)||statSync(file).size<100)return false;
  const b=readFileSync(file);return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
}

/** Recorre PNG RGBA 8-bit, recuperando filtros PNG para comprobar que el fondo
 * es realmente transparente, no una imagen opaca con canal alfa decorativo. */
export function inspectTransparentPng(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<100||!buffer.subarray(0,8).equals(PNG_SIGNATURE))
    throw Error('No es un PNG válido.');
  let p=8,width=0,height=0,bitDepth=-1,colorType=-1;
  const data=[];let foundEnd=false;
  while(p+12<=buffer.length){
    const len=buffer.readUInt32BE(p),tag=buffer.toString('ascii',p+4,p+8);
    if(len>buffer.length-p-12)throw Error('Chunk PNG truncado.');
    if(tag==='IHDR'){
      width=buffer.readUInt32BE(p+8);height=buffer.readUInt32BE(p+12);
      bitDepth=buffer[p+16];colorType=buffer[p+17];
      if(buffer[p+20]!==0)throw Error('PNG entrelazado no soportado.');
    }
    if(tag==='IDAT')data.push(buffer.subarray(p+8,p+8+len));
    p+=len+12;
    if(tag==='IEND'){foundEnd=true;break;}
  }
  if(!foundEnd||width!==1024||height!==1536||bitDepth!==8||colorType!==6||!data.length)
    throw Error('PNG inválido: se requiere RGBA 8-bit 1024×1536 sin entrelazado.');
  const rowBytes=width*4;
  const raw=inflateSync(Buffer.concat(data),{maxOutputLength:(rowBytes+1)*height+1});
  if(raw.length!==(rowBytes+1)*height)throw Error('Datos PNG incompletos.');
  let prev=Buffer.alloc(rowBytes),pos=0,transparent=0,nearlyTransparent=0;
  for(let y=0;y<height;y++){
    const filter=raw[pos++],cur=Buffer.allocUnsafe(rowBytes);
    if(filter>4)throw Error('Filtro PNG desconocido.');
    for(let x=0;x<rowBytes;x++){
      const left=x>=4?cur[x-4]:0,up=prev[x],aboveLeft=x>=4?prev[x-4]:0;
      let prediction=0;
      if(filter===1)prediction=left;
      if(filter===2)prediction=up;
      if(filter===3)prediction=Math.floor((left+up)/2);
      if(filter===4){
        const q=left+up-aboveLeft,dl=Math.abs(q-left),du=Math.abs(q-up),dul=Math.abs(q-aboveLeft);
        prediction=dl<=du&&dl<=dul?left:du<=dul?up:aboveLeft;
      }
      cur[x]=(raw[pos+x]+prediction)&255;
    }
    for(let x=3;x<rowBytes;x+=4){
      if(cur[x]<248)transparent++;
      if(cur[x]<32)nearlyTransparent++;
    }
    pos+=rowBytes;prev=cur;
  }
  const pixels=width*height;
  const coverage=nearlyTransparent/pixels;
  if(coverage<0.1)throw Error('Imagen sin transparencia de fondo real (alfa insuficiente).');
  return {width,height,alphaCoverage:coverage,semiTransparentPixels:transparent-nearlyTransparent};
}
function statusPath(){mkdirSync(OUTPUT,{recursive:true});return join(OUTPUT,'resultado.json');}
function saveStatus(value){writeFileSync(statusPath(),JSON.stringify(value,null,2)+'\n');}
function responseConfig(item,doc,quality){
  const images=item.references.map(ref=>({image_url:
    'data:image/webp;base64,'+readFileSync(join(ROOT,ref)).toString('base64')}));
  return {
    url:URL+'edits',
    body:{
      model:doc.model,n:1,size:'1024x1536',quality,output_format:'png',background:'transparent',
      images,
      prompt:item.prompt+' CRITICAL: The output must be a SINGLE character illustration, not an information graphic, production status screen, collage, interface, typography or character sheet. Preserve facial identity of the reference; no extra character. Export real transparent alpha.'
    }
  };
}
export async function run({mode='plan',quality='medium',confirm='NO',
  group='ambos',key=process.env.OPENAI_API_KEY,max=8}={}){
  const doc=catalog();
  if(!['plan','generate'].includes(mode)||!['low','medium','high'].includes(quality)||
      !['ambos','xervias','zhinchi'].includes(group)||!Number.isInteger(max)||max<1||max>8)
    throw Error('Parámetros de generación inválidos.');
  const items=doc.items.filter(item=>group==='ambos'||item.characterId===group);
  const digest=createHash('sha256').update(readFileSync(CATALOG)).digest('hex');
  const result={batch:doc.batch,mode,group,quality,total:items.length,catalog_sha256:digest,
    candidates:[],skipped:[],errors:[],approved:false,published:false};
  if(mode==='plan'){
    for(const a of items)result.candidates.push({id:a.id,path:'propuestas/'+a.file,references:a.references,status:'planned'});
    saveStatus(result);
    console.log('PLAN GRATIS: '+items.length+' propuestas basadas en sprites reales. 0 peticiones de pago.');
    return result;
  }
  if(confirm!=='GENERAR_8_PERSONAJES_G2')
    throw Error('Sin confirmación explícita: no se ejecutó ninguna generación de pago.');
  if(!key)throw Error('Falta OPENAI_API_KEY en GitHub Secrets; no se ha consumido crédito.');
  if(items.length>max)throw Error('El lote supera el máximo autorizado de '+max+' imágenes.');
  for(const item of items){
    const target=join(OUTPUT,'propuestas',item.file);
    if(existsSync(target)){
      try{
        const audit=inspectTransparentPng(readFileSync(target));
        result.skipped.push({id:item.id,file:item.file,...audit});continue;
      }catch{ /* Un archivo incompleto nunca se da por válido. */ }
    }
    try{
      const {url,body}=responseConfig(item,doc,quality);
      console.log('Solicitando candidato '+item.id+' — '+item.characterName+' / '+item.variant);
      const reply=await fetch(url,{
        method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify(body),signal:AbortSignal.timeout(300000)
      });
      if(!reply.ok)throw Error('Images API HTTP '+reply.status+': '+(await reply.text()).slice(0,450));
      const data=await reply.json();
      const base64=data.data?.[0]?.b64_json;
      if(typeof base64!=='string'||base64.length<500)throw Error('La API no devolvió una imagen.');
      const png=Buffer.from(base64,'base64');
      const audit=inspectTransparentPng(png);
      mkdirSync(dirname(target),{recursive:true});
      writeFileSync(target,png);
      result.candidates.push({id:item.id,file:item.file,bytes:png.length,
        sha256:createHash('sha256').update(png).digest('hex'),...audit,status:'candidate_not_approved'});
      saveStatus(result);
    }catch(err){
      result.errors.push({id:item.id,error:cleanError(err)});
      saveStatus(result);process.exitCode=1;break;
    }
  }
  saveStatus(result);
  console.log('Lote terminado. Solo propuestas, nunca autoaprobadas ni publicadas.');
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  run({
    mode:process.env.G2_PERSON_MODE||'plan',quality:process.env.G2_PERSON_QUALITY||'medium',
    confirm:process.env.G2_PERSON_CONFIRM||'NO',group:process.env.G2_PERSON_GROUP||'ambos',
    max:Number(process.env.G2_PERSON_MAX||8)
  }).catch(err=>{console.error(cleanError(err));process.exitCode=1;});
}
