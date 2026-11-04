#!/usr/bin/env node
/** Combina arte aprobado con 42 imágenes pendientes en una entrega de GitHub. */
import {existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogo, seleccion} from './art-github.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const PACK=join(ROOT,'art-pack');
const LOTES=['prologo','region-2','region-3','region-4','region-5','region-6','region-7','region-8','final'];
const APROBADOS = {
  'fondo-1-base':'callao-base',
  'fondo-1-jefe':'callao-jefe',
  'rival-03':'callao-rivales',
  'rival-04':'callao-rivales',
  'rival-05':'callao-rivales'
};
export function inventarioGlobal() {
  const all=catalogo();
  const ids=new Set();
  const pending=[];
  for (const grupo of LOTES) {
    for (const item of seleccion(grupo)) {
      if (ids.has(item.id)) throw Error('Repetido: '+item.id);
      ids.add(item.id);
      pending.push({...item,grupo});
    }
  }
  const done=all.filter(item=>Object.hasOwn(APROBADOS,item.id));
  if (pending.length!==42 || done.length!==5 || all.length!==47) throw Error('Conteo inválido: '+pending.length+' pendientes, '+done.length+' aprobadas');
  for (const item of all) {
    if (ids.has(item.id)===Object.hasOwn(APROBADOS,item.id)) throw Error('Falta o se duplica recurso: '+item.id);
  }
  return {all,pending,done};
}
export function origenPara(item) {
  const previous=APROBADOS[item.id];
  if (previous) return join(ROOT,'aprobados',previous,item.filename);
  const group=LOTES.find(grupo=>seleccion(grupo).some(sub=>sub.id===item.id));
  if (!group) throw Error('No existe lote para '+item.id);
  return join(ROOT,'lotes','arte-42-'+group,item.filename);
}
function h(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
export function prepararPaquete({modo='plan',salida=PACK}={}) {
  if (!['plan','generar'].includes(modo)) throw Error('Modo inválido');
  const {all,pending,done}=inventarioGlobal();
  mkdirSync(salida,{recursive:true});
  const manifest=[];
  const missing=[];
  for (const item of all) {
    const source=origenPara(item);
    const status=modo==='plan' ? (Object.hasOwn(APROBADOS,item.id)?'aprobada previamente':'pendiente') : existsSync(source)?'disponible':'faltante';
    if (modo==='generar') {
      if (!existsSync(source) || statSync(source).size<100 || readFileSync(source).subarray(0,4).toString()!=='RIFF') {
        missing.push(item.id);
      } else {
        const target=join(salida,item.filename);
        mkdirSync(dirname(target),{recursive:true});
        copyFileSync(source,target);
      }
    }
    manifest.push({id:item.id,nombre:item.title,tipo:item.kind,region:item.chapterId,archivo:item.filename,estado:status,origen:Object.hasOwn(APROBADOS,item.id)?'aprobado':pending.find(p=>p.id===item.id)?.grupo});
  }
  const available=manifest.length-missing.length;
  writeFileSync(join(salida,'manifest.json'),JSON.stringify({modo,esperadas:47,pendientes:42,aprobadas:5,completadas:modo==='generar'?available:0,faltantes:missing,items:manifest},null,2));
  const blocks=manifest.map(item=>`<article><img src="${h(item.archivo)}" onerror="this.hidden=true" alt="${h(item.nombre)}"><b>${h(item.nombre)}</b><small>${h(item.region)} · ${h(item.estado)}</small></article>`).join('');
  writeFileSync(join(salida,'galeria.html'),`<!doctype html><html lang="es"><meta charset="utf-8"><title>Decreto Real · 47 imágenes</title><style>body{font:15px system-ui;background:#121926;color:#f2eddf;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}article{border:1px solid #394453;border-radius:12px;padding:12px;background:#1e2a3b}img{width:100%;aspect-ratio:2/3;object-fit:contain}b,small{display:block;margin:5px 0}small{color:#a6b2be}</style><h1>Decreto Real · Arte estático de campaña</h1><p>${modo==='plan'?'PLAN GRATIS · No se generaron imágenes':'Imágenes recibidas: '+available+' de 47'}</p><main>${blocks}</main></html>`);
  const msg = modo==='plan' ? 'Plan gratuito de 42 solicitudes nuevas y 5 imágenes existentes. No se ha llamado a OpenAI.' : 'Imágenes recibidas '+available+'/47. Archivos faltantes: '+(missing.join(', ')||'ninguno')+'.';
  writeFileSync(join(salida,'LEEME.txt'), 'DECRETO REAL · PAQUETE VISUAL\n'+msg+'\nAbre galeria.html para revisar las imágenes en tu navegador.\nNo se ha modificado la versión publicada del juego.\n');
  console.log(msg);
  if (modo==='generar' && missing.length) throw Error('Faltan '+missing.length+' imágenes. Descarga el paquete parcial para revisar el resultado, NO relances todo el lote sin controlar qué faltó.');
  return {all,pending,done,missing};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { prepararPaquete({modo:process.env.ART_MODE||'plan'}); } catch(error) { console.error(error.message);process.exitCode=1; }
}
