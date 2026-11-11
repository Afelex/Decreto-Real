#!/usr/bin/env node
/** Inventario de TODOS los recursos gráficos publicados de Decreto Real.
 * Se regenera antes de compilar para incluir nuevas subidas publicadas de DRStudio.
 * No realiza llamadas remotas ni altera originales.
 */
import { readdirSync, readFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {ACTIVE_GENERATION,artGeneration,artState} from './arte-generaciones.mjs';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const supported=/\.(png|jpe?g|webp|gif|avif|svg|mp4|webm)$/i;

export function category(path){
  if(path.startsWith('art-reference/personajes-oficiales/candidatos/'))return 'Personajes · Candidatos G2';
  if(path.startsWith('art-reference/personajes-oficiales/imagenes/'))return 'Personajes · Referencias G2';
  if(path.startsWith('public/artes/generaciones/')){
    if(path.includes('/fondos/'))return 'Fondos de campaña';
    if(path.includes('/retratos/')||path.includes('/personajes/'))return 'Personajes';
    return 'Nueva generación';
  }
  if(path.includes('/artes/generaciones/DR-G2-2026/'))return 'G2 · Fondos de campaña';
  if(path.includes('/studio/media/'))return 'Arte publicado desde DRStudio';
  if(path.includes('/campania/arte/fondos/'))return 'Fondos de campaña';
  if(path.includes('/campania/arte/retratos/'))return 'Rivales de campaña';
  if(path.includes('/campania/prologo'))return 'Prólogo';
  if(path.includes('/campania/'))return 'Mapas y capítulos';
  if(path.includes('/cartas/'))return 'Cartas';
  if(path.includes('/interfaz/')||path.includes('/retratos/')||path.includes('/final/'))return 'Interfaz';
  if(path.includes('/efectos/')||path.includes('/animaciones/')||/\.(webm|mp4)$/i.test(path))return 'Animaciones';
  if(path.includes('/portada/'))return 'Portada';
  return 'Otros';
}
function collect(folder,output=[]){
  for(const entry of readdirSync(folder,{withFileTypes:true})){
    const full=join(folder,entry.name);
    if(entry.isDirectory())collect(full,output);
    else if(entry.isFile()&&supported.test(entry.name)){
      const path=relative(project,full).split(sep).join('/');
      output.push({path,group:category(path),name:entry.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),bytes:statSync(full).size});
    }
  }
  return output;
}
export function buildCatalog(){
  const canonical=JSON.parse(readFileSync(join(project,'art-reference/personajes-oficiales/catalogo.json'),'utf8'));
  const officialNames=new Map(canonical.personajes.filter(p=>p.imagenEnRepositorio)
    .map(p=>[p.archivoPendiente,p.nombre]));
  const plan=JSON.parse(readFileSync(join(project,'art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json'),'utf8'));
  for(const p of plan.characters){
    for(const v of p.variants){
      if(v.status==='candidate_generated_not_approved'&&v.fileInRepo)
        officialNames.set(v.fileInRepo,p.name+' · '+v.expression);
    }
  }
  const items=[...collect(join(project,'art-reference')),...collect(join(project,'public'))]
    .filter(i=>!i.path.startsWith('public/archivo-historico/'))
    .map(i=>({...i,name:officialNames.get(i.path)??i.name,
      generation:artGeneration(i.path),state:artState(i.path)}))
    .sort((a,b)=>a.path.localeCompare(b.path,'en'));
  if(!items.length)throw new Error('No se encontró arte en el proyecto.');
  return {version:2,activeGeneration:ACTIVE_GENERATION,description:'G2 es la nueva generación; G1 continúa disponible hasta su sustitución.',items};
}
export function generateCatalog(){
  const output=join(project,'public','artes','catalogo.json');
  mkdirSync(dirname(output),{recursive:true});
  const cat=buildCatalog();
  writeFileSync(output,JSON.stringify(cat,null,2)+'\n','utf8');
  return cat.items.length;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log('Catálogo de artes: '+generateCatalog()+' archivos.');
}
