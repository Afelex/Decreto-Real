#!/usr/bin/env node
/**
 * Generador de arte de Decreto Real para GitHub Actions.
 * SIN ejecuciones automáticas, SIN modificar el juego, SIN escribir claves en archivos.
 * Node 22+; catálogo extraído de los 38 enemigos y de la historia canónica.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENEMY_ROSTER } from '../campaign/characters.ts';
import { STORY_CHAPTERS, STORY_STAGES } from '../campaign/story.ts';
import { REGION_VISUALS } from '../campaign/regionVisuals.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'art-output');
const MODEL = 'gpt-image-2.5-flare';
const GENERAL_IDS = new Set(['06','10','14','18','22','26','30','34','38']);
const REGION_DETAILS = {
  '1': 'Puerto del Callao: muelles escalonados, atalaya central, galeras virreinales, bastiones navales, bruma del Pacífico; azul acero y bronce envejecido',
  '2': 'Caminos del Reino: posta de piedra de arcos, cruce de caminos secos, praderas ocres, estandartes escarlata, luz cálida',
  '3': 'Minas de la Sierra: dos entradas de mina, andamios de madera, casa de contabilidad de piedra, rocas plateadas y luz fría',
  '4': 'Fortaleza de Artillería: patio de piedra, dos torres defensivas, cañones de bronce, depósitos de pólvora y humo lejano',
  '5': 'Frontera Oriental: raíces arqueadas de árboles gigantes, río velado por la niebla, puesto de vigilancia cubierto de vegetación',
  '6': 'Ciudad de los Estandartes: plaza colonial, dos arcadas municipales, fuente central, balcones y banderas enfrentadas',
  '7': 'Fortaleza de las Cumbres: cordillera nevada, puente suspendido sobre quebrada, escaleras de piedra, torres de vigilancia',
  '8': 'Casa del Juramento: claustro ceremonial de columnas, mesa del juramento, tribunal de piedra ocre, tonos marfil y bronce',
  f: 'Casa del Sello: puerta monumental circular con sello real, escalera ascendente, arquitectura de piedra solemne, oro y violeta'
};
const BOSS_DETAILS = {
  '1': 'Muelle del mando del almirante, baterías navales y estandartes tensos por el viento',
  '2': 'Plataforma de mando de caballería ante la misma posta y cruce de caminos',
  '3': 'Patio fortificado de la casa de contabilidad, frente a las mismas dos minas',
  '4': 'Plataforma mayor de cañones sobre el mismo patio de fortaleza',
  '5': 'Claro secreto de mando bajo las mismas raíces gigantes y el mismo puesto de vigilancia',
  '6': 'Estrado ceremonial frente a las mismas dos arcadas y fuente central',
  '7': 'Plataforma del comandante detrás del mismo puente, bajo la tormenta de montaña',
  '8': 'Tribunal principal de la misma columnata, con iluminación ámbar solemne',
  f: 'Salón de Sigumán después de la misma puerta circular y escaleras, luz dorada falsa y sombras violetas'
};
const STYLE = 'Ilustración 2D original para videojuego de cartas, anime cinematográfico de fantasía andino-virreinal, Perú ficticio del siglo XVII, dibujo definido y sombreado elegante, materiales de piedra, tela y madera coherentes, profundidad atmosférica, paleta armónica. No plástico ni plastilina, sin caracteres escritos, sin marcas, sin interfaz, sin cartas, sin símbolos incas explícitos.';

const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function catalogo() {
  if (ENEMY_ROSTER.length !== 38 || STORY_STAGES.length !== 38) throw Error('El guion ya no tiene exactamente 38 misiones.');
  const stages = new Map(STORY_STAGES.map(s => [s.id,s]));
  const images = [];
  for (const chapter of STORY_CHAPTERS.filter(ch => ch.id !== 'p')) {
    const group = STORY_STAGES.filter(s => s.chapterId === chapter.id);
    if (group.length !== 4) throw Error('Capítulo incompleto: ' + chapter.id);
    for (const version of ['base','jefe']) {
      const focus = version === 'base'
        ? 'Vista general del mismo lugar, iluminación natural, paisaje explorable y atmósfera de aventura.'
        : 'Variante del MISMO lugar con idéntica arquitectura principal y horizonte; mayor tensión e iluminación dramática. Punto focal: ' + BOSS_DETAILS[chapter.id] + '.';
      images.push({
        id: 'fondo-' + chapter.id + '-' + version,
        filename: 'fondos/region-' + chapter.id + '-' + version + '.webp',
        chapterId: chapter.id,
        kind: 'fondo',
        title: chapter.title + ' — ' + version,
        prompt: STYLE + ' FONDO DE COMBATE SIN PERSONAS. Región: ' + chapter.title + ', ' + chapter.region + '. Hitos invariables: ' + REGION_DETAILS[chapter.id] + '. Atmósfera: ' + REGION_VISUALS[chapter.id].atmosphere + '. ' + focus + ' Composición vertical 2:3; conservar zona central despejada para DOS filas de cartas, banda inferior libre para HUD, detalles sobre los extremos. Sin figuras humanas, texto ni emblemas sueltos.'
      });
    }
  }
  for (const enemy of ENEMY_ROSTER) {
    if (GENERAL_IDS.has(enemy.missionId)) continue;
    const stage=stages.get(enemy.missionId);
    if (!stage) throw Error('Falta misión: ' + enemy.missionId);
    const chapter=STORY_CHAPTERS.find(c => c.id === stage.chapterId);
    images.push({
      id: 'rival-' + enemy.missionId,
      filename: 'retratos/rival-' + enemy.missionId + '-' + slug(enemy.name) + '.webp',
      chapterId: stage.chapterId,
      kind: 'retrato',
      title: enemy.name + ' — ' + enemy.alias,
      prompt: STYLE + ' RETRATO ORIGINAL DE OPONENTE. Nombre de referencia para producción (NO escribirlo): ' + enemy.name + '. Papel: ' + enemy.role + '. Alias: ' + enemy.alias + '. Dirección canónica: ' + enemy.portraitDirection + '. Lugar: ' + (chapter?.region || 'Virreinato del Perú') + '. Misión: ' + stage.title + '. Mostrar rostro y torso, silueta distintiva, expresión decidida pero neutral, vestimenta de su oficio y época, fondo regional desenfocado, encuadre vertical 2:3 adecuado para el HUD, rostro completo sin cortes. Sin letras ni logotipos.'
    });
  }
  const fondos=images.filter(i=>i.kind==='fondo').length;
  const retratos=images.filter(i=>i.kind==='retrato').length;
  if (fondos!==18 || retratos!==29 || images.length!==47 || new Set(images.map(i=>i.id)).size!==47) throw Error('Inventario inválido: '+fondos+' fondos y '+retratos+' retratos.');
  return images;
}
export function seleccion(grupo, images=catalogo()) {
  if (grupo==='una-imagen') return images.filter(i=>i.id==='fondo-1-base');
  if (grupo==='piloto-4') return images.filter(i=>['fondo-1-base','fondo-1-jefe','rival-01','rival-03'].includes(i.id));
  if (grupo==='prologo') return images.filter(i=>i.chapterId==='p');
  if (grupo==='final') return images.filter(i=>i.chapterId==='f');
  if (/^region-[1-8]$/.test(grupo)) return images.filter(i=>i.chapterId===grupo.slice(-1));
  throw Error('Grupo no permitido: '+grupo);
}
function htmlEscape(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
function generarGaleria(items,results) {
  const body=items.map(item=>{
    const status=results.find(r=>r.id===item.id);
    return '<article><img src="'+item.filename+'" alt="'+htmlEscape(item.title)+'" onerror="this.style.display=\'none\'"><h2>'+htmlEscape(item.title)+'</h2><p>'+htmlEscape(item.id)+'</p><small>'+htmlEscape(status?.status||'planeada')+'</small></article>';
  }).join('');
  writeFileSync(join(OUTPUT,'galeria.html'),'<!doctype html><html lang="es"><meta charset="UTF-8"><title>Decreto Real | Arte</title><style>body{background:#10141d;color:#faf1dc;font:16px system-ui;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}article{background:#1d2330;padding:16px;border-radius:12px}img{display:block;width:100%;border-radius:8px}h2{font-size:16px}</style><h1>Decreto Real · Galería de producción</h1><p>Solo archivos del lote. La publicación del juego no se modifica.</p><main>'+body+'</main></html>');
}
async function generar(item,quality,apiKey) {
  const response=await fetch('https://api.openai.com/v1/images/generations',{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,prompt:item.prompt,n:1,size:'1024x1536',quality,output_format:'webp',output_compression:80,background:'opaque'}),
    signal:AbortSignal.timeout(300000)
  });
  if (!response.ok) {
    const details=await response.text();
    throw Error('API HTTP '+response.status+': '+details.slice(0,650).replace(/sk-[\w-]+/g,'[REDACTED]'));
  }
  const data=await response.json();
  const b64=data.data?.[0]?.b64_json;
  if (!b64) throw Error('La API no devolvió una imagen codificada.');
  const path=join(OUTPUT,item.filename);
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,Buffer.from(b64,'base64'));
  return {id:item.id,status:'generada',filename:item.filename,usage:data.usage??null};
}
export async function ejecutar({grupo='una-imagen',modo='plan',calidad='low',confirmar='',apiKey=process.env.OPENAI_API_KEY}={}) {
  const items=seleccion(grupo);
  if (!['plan','generar'].includes(modo)) throw Error('Modo inválido');
  if (!['low','medium'].includes(calidad)) throw Error('Calidad inválida');
  if (items.length>5) throw Error('Máximo de cinco imágenes por ejecución.');
  mkdirSync(OUTPUT,{recursive:true});
  writeFileSync(join(OUTPUT,'catalogo-seleccionado.json'),JSON.stringify(items,null,2));
  const results=[];
  if (modo==='generar') {
    if (confirmar!=='SI') throw Error('Para gastar crédito escribe SI en la casilla de confirmación.');
    if (!apiKey) throw Error('Falta el secreto OPENAI_API_KEY en GitHub. No se ha hecho ningún cargo.');
    for (const item of items) {
      console.log('Generando '+item.id+' ('+(results.length+1)+'/'+items.length+')');
      try {
        results.push(await generar(item,calidad,apiKey));
        console.log('OK: '+item.filename);
      } catch (error) {
        results.push({id:item.id,status:'error',message:error.message});
        console.error('No se pudo generar '+item.id+': '+error.message);
        break; // Detener el lote para no consumir el saldo ante un error.
      } finally {
        writeFileSync(join(OUTPUT,'resultado.json'),JSON.stringify(results,null,2));
        generarGaleria(items,results);
      }
    }
    if (results.some(r=>r.status==='error')) process.exitCode=1;
  } else console.log('Plan gratis: '+items.length+' imágenes. No se ha llamado a la API.');
  writeFileSync(join(OUTPUT,'LEEME.txt'),'Decreto Real: '+grupo+' / '+modo+' / '+calidad+'\nImágenes planificadas: '+items.length+'\nPara ver imágenes, abre galeria.html una vez descargado el artefacto.\n');
  generarGaleria(items,results);
  console.log('Recursos seleccionados: '+items.map(i=>i.id).join(', '));
  return {items,results};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  ejecutar({grupo:process.env.ART_GROUP||'una-imagen',modo:process.env.ART_MODE||'plan',calidad:process.env.ART_QUALITY||'low',confirmar:process.env.ART_CONFIRM||'',apiKey:process.env.OPENAI_API_KEY}).catch(e=>{console.error(e.message);process.exitCode=1});
}
