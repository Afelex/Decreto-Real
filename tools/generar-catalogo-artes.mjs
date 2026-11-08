#!/usr/bin/env node
/** Inventario de TODOS los recursos gráficos publicados de Decreto Real.
 * Se regenera antes de compilar para incluir nuevas subidas publicadas de DRStudio.
 * No realiza llamadas remotas ni altera originales.
 */
import { readdirSync, readFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const supported=/\.(png|jpe?g|webp|gif|avif|svg|mp4|webm)$/i;

export function category(path){
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
  const items=[...collect(join(project,'art-reference')),...collect(join(project,'public'))]
    .sort((a,b)=>a.path.localeCompare(b.path,'en'));
  if(!items.length)throw new Error('No se encontró arte en el proyecto.');
  return {version:1,description:'Catálogo regenerado durante la compilación. Los medios nuevos de DRStudio aparecen además desde IndexedDB.',items};
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
