#!/usr/bin/env node
/**
 * Importa exactamente seis expresiones candidatas del bloque G2.
 * No modifica public/, escenas, G1 ni retratos activos; solo conserva binarios
 * y registra sus rutas como candidate_generated_not_approved.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {inspectTransparentPng} from './generate-g2-characters.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=data=>createHash('sha256').update(data).digest('hex');
export const BATCH_SHA='8396309193aba69cd42bf0c0dbf7a86007dd3f4534d9b1e0563db9d84760da99';
export const CANDIDATES=[
  {id:'leandro-valcazar',variant:'orden-de-carga',sha256:'f2e1d54a2803a03a46525c951c4465b97f1783d762456236d7f32b75354a8477',masterSha:'0bcfe3a9c18aa1062f77fb0f9040d788686482077939de82d7b6f9d3694de25f'},
  {id:'octavio-argento',variant:'propuesta-de-pacto',sha256:'dfce1c9ac857971277608f6d7f8094752142a6dff390e79fda4b528489ac0d9b',masterSha:'531bb124d8779caa67323336c9e03b3ee561a6118a150bfd3cf463f9e831bb1d'},
  {id:'jeronimo-arrellano',variant:'orden-de-fuego',sha256:'832941fd569bebf17aefe29be1a0b018ae983878ba31a5b1169fb42be1870775',masterSha:'d9f6a440f102e5354e7dbcac4a0bf21bb6019c91898224ceb5e483da4d14c821'},
  {id:'isabela-valdierra',variant:'sentenciando',sha256:'1a7b67be0575c38b68c7f6c7036209965fdf582018652547c24f65f1bd7cb14e',masterSha:'9e6f72964d6db122d038dda3446ade3792c2d3fbcbd5910af74f8e2c60652d0a'},
  {id:'aukan-del-condor',variant:'orden-de-avance',sha256:'c61c8af7c8429a4a22178a9c5347fa05f678d2967a6f2eb1637687f008b81ae5',masterSha:'b1d93fabf62a18f7451697cc170d8f210ed8995538968b40a971cf730a814c7e'},
  {id:'gonzalo-de-montes',variant:'dando-orden',sha256:'f2489c98488701a592f729437fe44f177be3886db0640d1d355c457140f93704',masterSha:'ad52f79a641eb0cd699f984ac118c90f47ae47c5ed8b7e78804da80a0982fced'},
];
export const INPUT_MANIFEST='MANIFIESTO-G2-PER-CONTROL.json';
export const allowedPath=c=>'candidatos/'+c.id+'/'+c.variant+'.png';
export const outputPath=c=>'art-reference/personajes-oficiales/candidatos/'+c.id+'/'+c.variant+'.png';
const ALLOWED=new Set(['README.txt',INPUT_MANIFEST,...CANDIDATES.map(allowedPath)]);

export function validateEntryNames(names){
  if(names.length!==ALLOWED.size)throw Error('Se requieren exactamente 8 entradas controladas.');
  const found=new Set(names);
  if(found.size!==names.length)throw Error('ZIP contiene entradas duplicadas.');
  for(const path of names){
    if(!ALLOWED.has(path)||path.startsWith('/')||path.includes('..')||path.includes('\\'))
      throw Error('Ruta ZIP no autorizada: '+path);
  }
  return true;
}
function extract(zip,name){
  return execFileSync('unzip',['-p',zip,name],{maxBuffer:8*1024*1024});
}
export function validatePackage(zip,{root=ROOT}={}){
  const names=execFileSync('unzip',['-Z','-1',zip],{encoding:'utf8',maxBuffer:1024*1024}).trim().split(/\r?\n/);
  validateEntryNames(names);
  const m=JSON.parse(extract(zip,INPUT_MANIFEST).toString('utf8'));
  if(m.schemaVersion!==1||m.project!=='Decreto Real'||m.generation!=='DR-G2-2026'||
    m.batch!=='DR-G2-PER-LOTE-02-CONTROL'||m.assetCount!==6||m.assets?.length!==6)
    throw Error('Manifiesto de seis candidatos G2 inválido.');
  const byId=new Map(m.assets.map(a=>[a.characterId,a]));
  if(byId.size!==6)throw Error('Identidades duplicadas.');
  const catalog=JSON.parse(readFileSync(join(root,'art-reference/personajes-oficiales/catalogo.json'),'utf8'));
  const plan=JSON.parse(readFileSync(join(root,'art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json'),'utf8'));
  const out=[];
  for(const c of CANDIDATES){
    const meta=byId.get(c.id), character=catalog.personajes.find(p=>p.id===c.id);
    const planned=plan.characters.find(p=>p.id===c.id);
    if(!character?.imagenEnRepositorio||!planned)throw Error('No hay fuente canónica publicada: '+c.id);
    if(sha(readFileSync(join(root,character.archivoPendiente)))!==c.masterSha||
       character.verificacionOriginalRecuperado?.sha256!==c.masterSha||
       planned.master.sha256!==c.masterSha)throw Error('Huella maestra inválida: '+c.id);
    if(!planned.variants.some(v=>v.id==='G2-PER-'+c.id.toUpperCase()+'-02'))
      throw Error('Expresión no prevista en plan: '+c.id);
    if(!meta||meta.variant!==c.variant||meta.id!=='G2-PER-'+c.id.toUpperCase()+'-02'||
       meta.filename!==allowedPath(c)||meta.sha256!==c.sha256||meta.masterSha256!==c.masterSha||
       meta.width!==1024||meta.height!==1536||meta.mime!=='image/png'||
       meta.status!=='candidate_not_approved'||meta.inDRStudio!==false||
       meta.publishedToGame!==false)
      throw Error('Metadatos de candidato incoherentes: '+c.id);
    const bytes=extract(zip,allowedPath(c));
    if(sha(bytes)!==c.sha256)throw Error('SHA incorrecto de candidato: '+c.id);
    const inspection=inspectTransparentPng(bytes);
    if(inspection.alphaCoverage<0.1)throw Error('Falta transparencia real: '+c.id);
    const path=outputPath(c),existing=join(root,path);
    if(existsSync(existing)&&sha(readFileSync(existing))!==c.sha256)
      throw Error('Se prohíbe sobrescribir un candidato distinto: '+c.id);
    out.push({id:c.id,expression:c.variant,sha256:c.sha256,masterSha256:c.masterSha,
      path,bytes,alphaCoverage:inspection.alphaCoverage,status:'candidate_not_approved'});
  }
  return {items:out,catalog,plan};
}
export function importPackage(zip,{root=ROOT}={}){
  if(sha(readFileSync(zip))!==BATCH_SHA)throw Error('ZIP distinto del lote de control verificado.');
  const {items,plan}=validatePackage(zip,{root});
  for(const item of items){
    const target=join(root,item.path);
    mkdirSync(dirname(target),{recursive:true});
    if(!existsSync(target))writeFileSync(target,item.bytes);
    const character=plan.characters.find(p=>p.id===item.id);
    const variant=character.variants.find(v=>v.id==='G2-PER-'+item.id.toUpperCase()+'-02');
    variant.status='candidate_generated_not_approved';
    variant.fileInRepo=item.path;
    variant.sha256=item.sha256;
    variant.width=1024; variant.height=1536; variant.alphaRequired=true;
  }
  const planFile=join(root,'art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json');
  plan.status='six_control_candidates_imported_not_approved';
  writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n');
  const manifest={schemaVersion:1,batch:'DR-G2-PER-LOTE-02-CONTROL',assetCount:6,
    approved:false,publishedToGame:false,items:items.map(({bytes,...x})=>x)};
  const manifestFile=join(root,'art-reference/personajes-oficiales/candidatos/manifest.json');
  mkdirSync(dirname(manifestFile),{recursive:true});
  writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const zip=process.argv[2];
    if(!zip)throw Error('Uso: node tools/importar-g2-expresiones-control.mjs <zip>');
    const result=importPackage(resolve(zip));
    console.log('Seis expresiones G2 preservadas SOLO como candidatos: '+result.assetCount);
  }catch(error){console.error('Importación cancelada: '+error.message);process.exitCode=1;}
}
