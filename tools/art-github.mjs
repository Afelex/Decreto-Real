#!/usr/bin/env node
/**
 * Generador de arte de Decreto Real para GitHub Actions.
 * SIN ejecuciones automáticas, SIN modificar el juego, SIN escribir claves en archivos.
 * Node 22+; catálogo extraído de los 38 enemigos y de la historia canónica.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENEMY_ROSTER } from '../campaign/characters.ts';
import { STORY_CHAPTERS, STORY_STAGES } from '../campaign/story.ts';
import { REGION_VISUALS } from '../campaign/regionVisuals.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'art-output');
const STYLE_VERSION = 'anime-retratos-xervias-v4';
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
  '1': 'CALLAO ADMIRAL BOSS ARENA: The fortified naval command BATTERY on the stone terrace of Baltasar de Fierro, viewed noticeably CLOSER than the base harbor view. Enormous antique coastal cannons and angular stone gun embrasures frame left and right foreground; a military command platform and heavy harbor chain mark the boss battlefield. The same unmistakable central watchtower and familiar galleons remain visible in the background, now from a shifted three-quarter viewpoint. Darker sea, storm front and bright sunset breaking through clouds; imminent naval blockade, no combatant figures. One prominent white Cross of Burgundy flag with jagged red X, without coats of arms. It must immediately read as a different playable confrontation area of this SAME port.',
  '2': 'Royal cavalry BOSS ARENA: New closer viewpoint inside the arched courier-inn courtyard of the familiar road crossing; stone horse troughs, command pavilion, heraldic red cloth banners and hoof-marked parade ground. The recognizable inn and crimson road remain visible in the background, but main battlefield foreground is fundamentally different.',
  '3': 'Silver lord BOSS ARENA: New camera viewpoint within the guarded stone counting-house terrace overlooking the same twin mine entrances; heavy locked silver chests, ore weighing scales, metallic railings, large silver-lit arches; deep dramatic shadows but no people. Preserve the mountain and twin mine landmarks as distant identifiers.',
  '4': 'Artillery general BOSS ARENA: New camera viewpoint atop an elevated stone command battery with massive bronze cannons aimed toward the distant valley, powder barrels sheltered along side ramparts, twin fortress gun towers recognizable in the background, storm-lit smoky skies. A different arena, not the original courtyard recolored.',
  '5': 'Jungle general BOSS ARENA: New viewpoint into a hidden raised command platform reached through the same giant curved tree roots, wooden lookout decks and a stone gate, torch-lit ruins among vines, mist over a winding river behind. Preserve distinctive trees and watchpost as background markers.',
  '6': 'Banner lady BOSS ARENA: New viewpoint from an elevated ceremonial balcony of the same divided colonial square, twin rival standards and monumental cloth drapes framing the scene, ornate tribunal platform replacing the open plaza foreground; double arcade and fountain still visible beyond.',
  '7': 'Condor general BOSS ARENA: New viewpoint on the summit defense platform above the same suspension bridge, dramatic sheer cliffs and twin guard towers in background, stone lookout altar with ceremonial ropes in side foreground, cold clouds and snow wind. Different arena, same mountain landmarks.',
  '8': 'Oath knight BOSS ARENA: New camera inside the central ceremonial judgement court, very large carved oath table and stone bench toward the side foreground, tall marbled colonnade enclosing the space and old court glimpsed behind; strong side lighting. A different boss chamber belonging to the same House of the Oath.',
  f: 'FINAL SIGUMÁN BOSS ARENA: New viewpoint from INSIDE the grand throne chamber, at the far end of the same giant circular seal-door; dramatic stone throne terrace, enormous archways and looming golden-violet shafts of false sunlight, the distinctive circular seal-door visible behind at a different perspective; no characters. A new final confrontation room, not the base courtyard recolored.'
};
const STYLE = "MASTER STYLE: ORIGINAL 2D HAND-DRAWN ANIME VIDEO GAME ART for a fantasy card battle, matching Decreto Real illustrated backgrounds and portraits, absolutely NOT a photograph. Visible controlled dark ink contour lines around major forms, including characters, costumes, buildings, ships, trees and foreground objects, distinctive graphic silhouettes, broad simplified shapes, medium-complexity architecture, flat intentional color patches, 2–3-level cel shading per material, soft color washes only for clouds and distant atmospheric depth, elegant painterly anime finish. Reduce microtexture by 80 percent: stone is defined by large graphic slabs, water by smooth stylized reflections, wood by a few bold lines. Readable on a narrow mobile screen. NO photorealism, NO realistic matte painting, NO photobashing, NO photo filters, NO historical oil painting, NO 3D, NO CGI, NO Unreal Engine, NO realistic wet stone highlights, NO photographic lens effects, NO plastilina, clay or plastic. Fantasy 17th-century colonial Peru with Andean geography and original virreinal-inspired architecture. No modern materials, no explicit Inca glyphs, no lettering, no logos, no watermarks, no game interface or cards.";
const BATTLE_UI_COMPOSITION = "DUEL SCREEN COMPATIBILITY — This is an EMPTY environmental backdrop behind a vertically oriented one-screen mobile card battle, not a poster or a campaign map. HUD occupancy based on the actual Decreto Real duel: opponent portrait, opponent fan of cards and counters cover the TOP 0–25%; two central battle-field rows and four impact positions overlay approximately 35–65% of image height; player portrait, hand/cards and turn button cover much of the BOTTOM 65–100%. Keep the CENTER 30–70% relatively quiet, with LARGE low-contrast simple shapes, subtle haze or water/stone and few high-frequency details; protect legibility of game cards and numbers. Put the main impressive landmarks, distinctive towers, cliffs and flags UP HIGH or toward the LEFT/RIGHT EDGE, not underneath the central card slots. Do not leave a bright high-contrast focal point behind the card rows. Use a coherent 1024x1536 portrait background with 2:3 aspect ratio, allowing 3–5% cropping by mobile cover scaling. Edge-safe composition. Do NOT render any UI, deck, cards, portrait frames, health indicators, HP bars, labels, text, mission nodes, score counters, buttons, or character silhouettes directly into the background.";
const HISTORICAL_FLAGS = "HISTORICAL HERALDRY RULE: Never depict French flags, blue-white-red tricolours, modern national flags, the Spanish national coat of arms, Spanish royal shield, heraldic escutcheons or crowns on banners. When a Spanish royalist/colonial military flag is shown, use ONLY the historical Cross of Burgundy (aspa de Borgoña): a plain ivory/white flag with two broad jagged red diagonal branches making an X from corner to corner, without any other motif. Fictional faction banners elsewhere may be monochrome but never modern tricolours.";
const CALLAO_FLAGS = "MANDATORY CALLAO FLAG: Put exactly ONE clearly legible rectangular white or off-white flag on the CENTRAL WATCHTOWER. On this cloth paint only TWO JAGGED RED DIAGONAL BRANCHES that intersect into an X from all four corners: the red Cross of Burgundy (aspa de Borgoña). It is a red X on a white field, NOT a red-white-blue design. NO blue stripes, NO vertical or horizontal tricolour, NO French flags, NO coat of arms of Spain, NO crest, NO crown and NO national emblems. Omit all other tiny flags instead of inventing symbols.";
const BOSS_EDIT_RULES = "PROVIDED BASE IMAGE is a visual REFERENCE for the established region and its 2D anime style, NOT a pixel-for-pixel layout to preserve. Create a CLEARLY DIFFERENT BOSS BATTLE ARENA, a new nearby viewpoint or more imposing space WITHIN THE SAME geographic setting. Change the foreground architecture, camera distance and angle, arena props, composition and dramatic sky so the difference is unmistakable at a glance. Preserve recognisable regional LANDMARKS in the distance (e.g. the same watchtower, ships and coastline), palette, historical materials, ink outlines, and cell shading, but DO NOT keep the original object positions or simply change lighting and add tiny flags. Recompose at least 40 percent of the visible scene, especially foreground and side framing; keep the middle clear for two rows of cards and the lower HUD readable. Avoid figures, people, readable text, modern flags, modern machinery, UI and cards.";

const PORTRAIT_STYLE = "PORTRAIT VISUAL STYLE — This series belongs in the SAME illustrated fantasy card game as the attached original portrait of XERVIAS. Match the Xervias STYLE rather than his identity: precise bold black outlines, sharp expressive anime eyes, strong stylized eyebrows, clear geometric facial shadows, thick well-grouped hair clumps, clean two/three-tone cel shading, intense yet controlled red/blue/gold-era fantasy palette with each rival's own regional colors, and a tightly framed centered upper-body profile for the mobile duel HUD. Do not duplicate the protagonist's exact facial structure, eye color, youthful age, spiky brown hairstyle, red mantle, navy-and-gold uniform, gold ornaments or expression. Keep each canonical rival's own apparent age, facial proportions, hairstyle or beard, historical costume, occupation, gear and silhouette. Character must feel drawn by the SAME anime illustrator as Xervias, NOT a softly painted realistic historical sailor. Head-and-shoulders bust, matching Xervias portrait framing and eye prominence; original period costume. No writing, no app UI, no logos, no 3D, no photorealism. IMPORTANT: checkerboard squares around the Xervias reference are a raster background artifact, NOT an art direction. NEVER reproduce checkerboard, fake transparency, grids or modern flags. No Peruvian republican tricolor or French flag; if any colonial royalist flag is visible it may only have a red jagged Cross of Burgundy on white cloth, without heraldic shield, otherwise omit flags.";
const PORTRAIT_RESTYLE = "CHARACTER RE-ILLUSTRATION / TWO REFERENCE IMAGES. The FIRST image is the ALREADY DESIGNED RIVAL. Re-illustrate THIS SAME RIVAL and retain his identity: exact adult age impression, face structure, hairstyle and beard if present, profession-specific original historical uniform or outfit, accessories, distinctive props, color scheme, and personality. Do NOT change or replace the rival with a new character. The SECOND image is the ORIGINAL XERVIAS PORTRAIT. Use SECOND IMAGE FOR GRAPHIC DRAWING STYLE ONLY: bolder crisp black outlines, stronger anime eyes and angular eyebrows, more expressive shapes, geometric cell-shading with higher contrast, larger face-to-frame ratio like a trading-card rival. DO NOT copy Xervias's facial identity, youth, spiky hairstyle, red mantle, blue-and-gold ornaments, or pose. Match the second image's illustrator style while keeping the first image's person recognizable. The finished illustration must be a NEW drawing, not a soft photo filter. Eliminate blurred realistic painting. Reframe face and shoulders closer to camera with entire top of head intact; preserve period props where useful. Use a plain low-detail dark gradient or softly drawn regional backdrop with NO FLAGS; specifically no Peru red-white-red state flag, no French tricolor, no national coats of arms. No checkerboard transparency graphic from reference. No names, captions, logos, UI, cards or text. Vertical 2:3 portrait.";
const XERVIAS_REFERENCE = 'art-reference/xervias-estilo.webp';

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
        : 'NUEVA ARENA DEL JEFE DENTRO DE LA MISMA REGIÓN: conservar identidad del lugar, pero cambiar perspectiva, primer plano y punto de combate. NO solo cambiar luz. Escena: ' + BOSS_DETAILS[chapter.id] + '.';
      images.push({
        id: 'fondo-' + chapter.id + '-' + version,
        filename: 'fondos/region-' + chapter.id + '-' + version + '.webp',
        chapterId: chapter.id,
        kind: 'fondo',
        title: chapter.title + ' — ' + version,
        prompt: [STYLE, BATTLE_UI_COMPOSITION, 'DRAW AN ACTUAL STYLIZED 2D ANIME BACKGROUND, NEVER PHOTOGRAPHIC. Region: ' + chapter.title + ', ' + chapter.region + '. Permanent geographic and architectural landmarks: ' + REGION_DETAILS[chapter.id] + '. Atmosphere: ' + REGION_VISUALS[chapter.id].atmosphere + '. ' + focus,
          'VERTICAL 2:3 game environment. TWO rows of combat cards will overlay the middle, so leave a clean quiet center and lower HUD area. Emphasize bold ink-lined shapes, simplified stone and wood textures, drawn stylized water, controlled graphic shading. No people, no text, no HUD, no cards.', HISTORICAL_FLAGS, chapter.id === '1' ? CALLAO_FLAGS : ''].join(' '),
        promptEdicion: version === 'jefe' ? [STYLE, BATTLE_UI_COMPOSITION, BOSS_EDIT_RULES, 'Region: ' + chapter.title + '. Same recognizable permanent landmarks: ' + REGION_DETAILS[chapter.id] + '. BOSS DRAMA THROUGH LIGHT AND PROPS ONLY: ' + BOSS_DETAILS[chapter.id] + '.', HISTORICAL_FLAGS, chapter.id === '1' ? CALLAO_FLAGS : ''].join(' ') : null
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
      styleReference: XERVIAS_REFERENCE,
      prompt: STYLE + ' ' + PORTRAIT_STYLE + ' IMAGE REFERENCE: The ONLY supplied image is the Xervias portrait. Invent a DISTINCT NEW rival, never redraw Xervias. CANONICAL RIVAL: ' + enemy.name + '. Job: ' + enemy.role + '. Alias: ' + enemy.alias + '. Unique design direction: ' + enemy.portraitDirection + '. Region: ' + (chapter?.region || 'Virreinato del Perú') + '. Mission: ' + stage.title + '. Create a strong ink-lined anime bust with a visibly different individual face and profession, no flags, no text.',
      promptRestilizar: PORTRAIT_RESTYLE + ' Canonical existing rival to preserve: ' + enemy.name + ', ' + enemy.alias + '. Distinctive job: ' + enemy.role + '. Unique costume and role direction: ' + enemy.portraitDirection + '. Preserve person in FIRST reference while matching anime drawing style of SECOND reference. Do not make them Xervias.'
    });
  }
  const fondos=images.filter(i=>i.kind==='fondo').length;
  const retratos=images.filter(i=>i.kind==='retrato').length;
  if (fondos!==18 || retratos!==29 || images.length!==47 || new Set(images.map(i=>i.id)).size!==47) throw Error('Inventario inválido: '+fondos+' fondos y '+retratos+' retratos.');
  return images;
}
export function seleccion(grupo, images=catalogo()) {
  if (grupo==='una-imagen') return images.filter(i=>i.id==='fondo-1-base');
  if (grupo==='jefe-callao-aprobado') return images.filter(i=>i.id==='fondo-1-jefe');
  if (grupo==='rivales-callao') return images.filter(i=>['rival-03','rival-04','rival-05'].includes(i.id));
  if (grupo==='rival-callao-estilo-prueba') return images.filter(i=>i.id==='rival-03');
  if (grupo==='rivales-callao-estilo') return images.filter(i=>['rival-03','rival-04','rival-05'].includes(i.id));
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
export function construirSolicitud(item,quality,baseImage=null,styleImage=null,originalPortrait=null) {
  const shared = {model:MODEL,n:1,size:'1024x1536',quality,output_format:'webp',output_compression:80,background:'opaque'};
  const boss = item.kind === 'fondo' && item.id.endsWith('-jefe');
  if (boss) {
    if (!Buffer.isBuffer(baseImage) || baseImage.length === 0) throw Error('Falta el fondo base para editar la versión jefe; no se llama a la API.');
    return {url:'https://api.openai.com/v1/images/edits',payload:{...shared,prompt:item.promptEdicion,images:[{image_url:'data:image/webp;base64,'+baseImage.toString('base64')}]}};
  }
  if (item.kind === 'retrato') {
    if (!Buffer.isBuffer(styleImage) || styleImage.length === 0) throw Error('Falta la referencia visual de Xervias. No se hará ningún gasto.');
    const portraitInputs = originalPortrait ? [originalPortrait,styleImage] : [styleImage];
    const images = portraitInputs.map(bytes=>({image_url:'data:image/webp;base64,'+bytes.toString('base64')}));
    return {url:'https://api.openai.com/v1/images/edits',payload:{...shared,prompt:originalPortrait?item.promptRestilizar:item.prompt,images}};
  }
  return {url:'https://api.openai.com/v1/images/generations',payload:{...shared,prompt:item.prompt}};
}
async function generar(item,quality,apiKey,baseImage=null,styleImage=null,originalPortrait=null) {
  const request=construirSolicitud(item,quality,baseImage,styleImage,originalPortrait);
  const response=await fetch(request.url,{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify(request.payload),
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
  return {id:item.id,status:'generada',filename:item.filename,method:request.url.endsWith('/edits')?'edición con base':'generación nueva',usage:data.usage??null};
}
export async function ejecutar({grupo='una-imagen',modo='plan',calidad='low',confirmar='',apiKey=process.env.OPENAI_API_KEY}={}) {
  const items=seleccion(grupo);
  console.log('Versión artística: '+STYLE_VERSION+' (anime 2D, aspa de Borgoña)');
  if (!['plan','generar'].includes(modo)) throw Error('Modo inválido');
  if (!['low','medium'].includes(calidad)) throw Error('Calidad inválida');
  if (items.length>5) throw Error('Máximo de cinco imágenes por ejecución.');
  mkdirSync(OUTPUT,{recursive:true});
  writeFileSync(join(OUTPUT,'catalogo-seleccionado.json'),JSON.stringify(items,null,2));
  const results=[];
  const basesDelLote=new Map();
  const conservarRivalesPrevios=['rival-callao-estilo-prueba','rivales-callao-estilo'].includes(grupo);
  let referenciaEstilo=null;
  const retratosOriginales=new Map();
  if (modo==='generar' && grupo==='jefe-callao-aprobado') {
    // Reutilizar el arte producido y aprobado; evita generar de nuevo el mismo fondo base.
    const approvedBase=join(ROOT,'art-input','fondos','region-1-base.webp');
    if (!existsSync(approvedBase)) throw Error('No se encontró el fondo aprobado del Callao desde el artefacto de GitHub. No se ha llamado a la API.');
    const bytes=readFileSync(approvedBase);
    if (bytes.length===0 || bytes.subarray(0,4).toString()!=='RIFF') throw Error('El fondo aprobado no es un WebP válido. No se ha llamado a la API.');
    basesDelLote.set('1',bytes);
    console.log('Reutilizando fondo de Callao aprobado desde GitHub (sin generar fondo base).');
  }
  if (modo==='generar') {
    if (confirmar!=='SI') throw Error('Para gastar crédito escribe SI en la casilla de confirmación.');
    if (!apiKey) throw Error('Falta el secreto OPENAI_API_KEY en GitHub. No se ha hecho ningún cargo.');
    // Validación ANTES del primer cobro: ningún lote de retratos se enviará sin Xervias.
    if (items.some(item=>item.kind==='retrato')) {
      const file=join(ROOT,XERVIAS_REFERENCE);
      if (!existsSync(file)) throw Error('No se encontró la referencia Xervias en el repositorio. No se ha llamado a la API.');
      referenciaEstilo=readFileSync(file);
      if (referenciaEstilo.length<100 || referenciaEstilo.subarray(0,4).toString()!=='RIFF') throw Error('Referencia de Xervias no válida: se esperaba WebP. No se ha llamado a la API.');
      console.log('Usando referencia de estilo Xervias desde '+XERVIAS_REFERENCE+'; solo estilo, no identidad.');
    }
    if (conservarRivalesPrevios) {
      // Los originales se descargan desde el run de GitHub que generó los tres retratos.
      for (const item of items) {
        const path=join(ROOT,'art-input','anteriores',item.filename);
        if (!existsSync(path)) throw Error('No se encontró el retrato original de '+item.name+'. No se ha llamado a la API.');
        const bytes=readFileSync(path);
        if (bytes.length<100 || bytes.subarray(0,4).toString()!=='RIFF') throw Error('Retrato original inválido para '+item.name+'. No se ha llamado a la API.');
        retratosOriginales.set(item.id,bytes);
      }
      console.log('Conservando el diseño de los '+items.length+' rivales existentes; aplicando estilo de Xervias.');
    }
    for (const item of items) {
      console.log('Generando '+item.id+' ('+(results.length+1)+'/'+items.length+')');
      try {
        const referencia = item.kind === 'fondo' && item.id.endsWith('-jefe') ? basesDelLote.get(item.chapterId) : null;
        const generated = await generar(item,calidad,apiKey,referencia,referenciaEstilo,retratosOriginales.get(item.id)||null);
        results.push(generated);
        if (item.kind === 'fondo' && item.id.endsWith('-base')) basesDelLote.set(item.chapterId,readFileSync(join(OUTPUT,item.filename)));
        console.log('OK: '+item.filename+' ('+generated.method+')');
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
  writeFileSync(join(OUTPUT,'LEEME.txt'),'Decreto Real: '+grupo+' / '+modo+' / '+calidad+'\nVersión artística: '+STYLE_VERSION+'\nImágenes planificadas: '+items.length+'\nPara ver imágenes, abre galeria.html una vez descargado el artefacto.\n');
  generarGaleria(items,results);
  console.log('Recursos seleccionados: '+items.map(i=>i.id).join(', '));
  return {items,results};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  ejecutar({grupo:process.env.ART_GROUP||'una-imagen',modo:process.env.ART_MODE||'plan',calidad:process.env.ART_QUALITY||'low',confirmar:process.env.ART_CONFIRM||'',apiKey:process.env.OPENAI_API_KEY}).catch(e=>{console.error(e.message);process.exitCode=1});
}
