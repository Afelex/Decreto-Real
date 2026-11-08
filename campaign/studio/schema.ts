/**
 * Decreto Real Studio v3 — documento de composición de escenas.
 *
 * Diferencias con v1/v2 (`version:1`, ver ../studioLayout.ts):
 * - Las escenas se identifican por una clave estable `pantalla/beatId`
 *   (p. ej. `prologo/arresto-01`), nunca por la posición del diálogo.
 * - x/y son desplazamientos en % del ESCENARIO (`.dcop-stage`), no del viewport.
 * - Actores, imágenes, efectos y globo comparten un único plano de capas (`z`).
 * - Una capa que apunta a un recurso inexistente en `assets` se descarta.
 *
 * Módulo puro: sin DOM, sin React, ejecutable con `node --experimental-strip-types`.
 */
import { STUDIO_ACTORS, type StudioActor, type StudioAssetMeta } from '../studioLayout.ts';
import { isNarrativeSpriteId } from './narrativeSprites.ts';
import {AUDIO_MUSIC_CUE_MODES, AUDIO_TIMING_PRESETS,validAudioTime,
  type AudioMusicCueMode} from './audioTimeline.ts';
import { STUDIO_NARRATIVE_MUSIC_MODES, STUDIO_NARRATIVE_SOUND_CUES,
  type StudioNarrativeMusicMode, type StudioNarrativeSoundCue } from './narrativeAudio.ts';

export { STUDIO_ACTORS, type StudioActor, type StudioAssetMeta };

export const STUDIO_V3_VERSION = 3;
export const STUDIO_V3_STORAGE_KEY = 'decreto-real.studio.borradores.v3';
export const STUDIO_V3_MAX_BYTES = 3_000_000;
export const STUDIO_V3_MAX_LAYERS_PER_SCENE = 60;
export const STUDIO_V3_MAX_MEDIA_LAYERS = 100;
export const STUDIO_V3_MAX_ASSETS = 200;
export const STUDIO_V3_MAX_BUBBLE_TEXT = 140;
export const STUDIO_V3_MAX_NAME = 100;
/** Ancla (en % del escenario) de imágenes y efectos añadidos: la misma que usaba v2. */
export const STUDIO_ADDED_LAYER_ANCHOR = Object.freeze({x:50,y:48});
export const STUDIO_BUBBLE_LAYER_ID = 'bubble';

export const STUDIO_LIMITS = Object.freeze({
  x:{min:-100,max:100}, y:{min:-100,max:100},
  scale:{min:.35,max:2.75}, rotation:{min:-180,max:180},
  opacity:{min:0,max:1}, z:{min:1,max:100},
});

export type StudioLayerBase = {
  id:string;
  /** Desplazamiento horizontal/vertical en % del ancho/alto del escenario. */
  x:number; y:number;
  scale:number; rotation:number; opacity:number;
  mirror:boolean;
  /** Orden en el plano único de capas (1 = más al fondo). */
  z:number;
  visible:boolean;
  /** Bloqueada: no se arrastra ni se redimensiona en el lienzo (sí desde el inspector). */
  locked?:boolean;
  /** Solo para desarrolladores: se oculta en la versión publicada. */
  devOnly?:boolean;
};
export type StudioActorLayer = StudioLayerBase & {kind:'actor'; actor:StudioActor; assetId?:string};
export type StudioMediaLayer = StudioLayerBase & {kind:'image'|'effect'; name:string; assetId:string};
/** Globo breve: el nativo de la intervención o uno nuevo (con `text`). Admite **negrita**. */
export type StudioBubbleLayer = StudioLayerBase & {kind:'bubble'; text?:string; side?:'left'|'right'};
/** Elemento nativo de la escena que no es un actor (p. ej. la ilustración o la tarjeta del pergamino). */
export type StudioNativeLayer = StudioLayerBase & {kind:'native'};
export const NATIVE_LAYER_ID = /^native-[a-z0-9-]{1,40}$/;
export type StudioLayer = StudioActorLayer | StudioMediaLayer | StudioBubbleLayer | StudioNativeLayer;
export type StudioLayerKind = StudioLayer['kind'];
export type StudioLayerTransform = Omit<StudioLayerBase,'id'>;

/**
 * Fondo de la escena: imagen/video local opcional y encuadre (desplazamiento
 * en % del escenario y escala). Bloqueado salvo `locked:false`, para no
 * moverlo por accidente al arrastrar personajes.
 */
export type StudioBackground = {assetId?:string;x?:number;y?:number;scale?:number;locked?:boolean};
export const STUDIO_BACKGROUND_SCALE = Object.freeze({min:.5,max:3});
export const isBackgroundLocked = (bg:StudioBackground|undefined):boolean => bg?.locked!==false;
/** Estilo del bloque de texto inferior (1 = tamaño original). */
export type StudioDialogueStyle = {textScale?:number;boxScale?:number;
  /** Ancho del bloque (1 = ancho completo). */
  boxWidth?:number;
  /** Ocultar a los jugadores el nombre de quien habla, el progreso («ESCENA 1/21») o el rótulo. */
  hideNameplate?:boolean;hideProgress?:boolean;hideTitle?:boolean;
};
export const STUDIO_DIALOGUE_BOX_WIDTH = Object.freeze({min:.5,max:1});
export const STUDIO_DIALOGUE_TEXT_SCALE = Object.freeze({min:.8,max:1.6});
export const STUDIO_DIALOGUE_BOX_SCALE = Object.freeze({min:.8,max:1.8});
export const STUDIO_V3_MAX_DIALOGUE_TEXT = 600;
export const STUDIO_V3_MAX_TITLE = 80;
/** Diálogo de la intervención: texto propio (con **negrita**) y tamaño del bloque. */
export type StudioDialogue = StudioDialogueStyle & {text?:string};
/** Director narrativo: datos editoriales, sin alterar la lógica de combate.
 * La emoción propone un sprite existente. Su id puede ajustarse en Studio. */
export const STUDIO_NARRATIVE_TONES = [
  'neutral','decidido','preocupado','sorprendido','enojado','sereno',
] as const;
export type StudioNarrativeTone = (typeof STUDIO_NARRATIVE_TONES)[number];
/** Aparición de la ilustración narrativa, independiente del texto y del duelo. */
export type StudioPortraitMode='auto'|'show'|'hide';
/** Entradas y salidas de los personajes, sin afectar su posición en el lienzo. */
export const STUDIO_PORTRAIT_MOTIONS=[
  'none','fade','slide-left','slide-right','zoom',
] as const;
export type StudioPortraitMotion=(typeof STUDIO_PORTRAIT_MOTIONS)[number];
export const STUDIO_PORTRAIT_DURATION={min:120,max:1200,default:320} as const;
export type StudioNarrativeCard = {
  /** Personaje mostrado en el diálogo; no altera el actor ni su mazo. */
  speaker?:string;
  /** Emoción para dirigir la interpretación, no cambia el sprite todavía. */
  tone?:StudioNarrativeTone;
  /** Sprite publicado y autorizado; omitirlo usa la expresión automática. */
  spriteId?:string;
  /** Automático: mostrar en diálogo, ocultar mientras se juega una carta. */
  portraitMode?:StudioPortraitMode;
  /** Animaciones independientes de entrada y salida; por defecto: fundido. */
  enterMotion?:StudioPortraitMotion;
  exitMotion?:StudioPortraitMotion;
  /** Duración en ms de cada animación, no de la pausa narrativa. */
  motionDurationMs?:number;
  /** Modo de la música de combate durante esta intervención. */
  musicMode?:StudioNarrativeMusicMode;
  /** Efecto puntual cuando comienza el texto, no al usar cartas. */
  soundCue?:StudioNarrativeSoundCue;
  /** Canción MP3/WAV de la biblioteca compartida: ID, nunca URL externa. */
  musicAssetId?:string;
  /** Dirección temporal: cambiar, continuar o detener la música del paso previo. */
  musicCueMode?:AudioMusicCueMode;
  /** Tiempo desde que aparece el diálogo hasta empezar la música. */
  musicStartDelayMs?:number;
  /** Tiempo desde el inicio de música hasta pausarla (0: sin límite). */
  musicStopAfterMs?:number;
  /** Tiempo desde que aparece el diálogo hasta disparar su efecto. */
  soundDelayMs?:number;
  /** Recorta solamente el efecto sonoro (0: duración natural). */
  soundMaxDurationMs?:number;
  /** Por qué existe la intervención en el relato. */
  intent?:string;
  /** Notas de composición que no se muestran al jugador. */
  direction?:string;
};
export const STUDIO_NARRATIVE_LIMITS={speaker:80,intent:180,direction:360} as const;
export type StudioSceneV3 = {
  layers?:StudioLayer[];
  background?:StudioBackground;
  titleVisible?:boolean;
  /** Texto propio del rótulo de la escena. */
  title?:string;
  /** El rótulo solo se muestra a desarrolladores. */
  titleDevOnly?:boolean;
  /** La intervención completa (con su texto) se omite en la versión publicada. */
  devOnly?:boolean;
  dialogue?:StudioDialogue;
  narrative?:StudioNarrativeCard;
};
export type StudioDocumentV3 = {
  version:3;
  scenes:Record<string,StudioSceneV3>;
  assets?:Record<string,StudioAssetMeta>;
  /** Valores comunes a todas las intervenciones (cada una puede sobrescribirlos). */
  defaults?:{dialogue?:StudioDialogueStyle};
};

const ACTOR_LAYER_IDS: Readonly<Record<StudioActor,string>> = {
  Xervias:'actor-xervias',
  'Domingo Quispe':'actor-domingo',
  Zhinchi:'actor-zhinchi',
  Madre:'actor-madre',
  Niño:'actor-nino',
};
export const actorLayerId = (actor:StudioActor):string => ACTOR_LAYER_IDS[actor];

export const MEDIA_ID = /^media-[a-f\d-]{12,60}$/i;
export const EXTRA_ID = /^extra-[a-f\d-]{12,60}$/i;
const MEDIA_MIME = /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm)|audio\/(mpeg|wav))$/;
/** `pantalla/beatId`, en minúsculas ASCII. */
const SCENE_KEY = /^[a-z][a-z0-9-]{0,30}\/[a-z0-9][a-z0-9-]{0,60}$/;

export const isStudioSceneKey = (key:string):boolean => SCENE_KEY.test(key);
export const isStudioMediaId = (id:string):boolean => MEDIA_ID.test(id);
const isActor = (value:unknown):value is StudioActor =>
  typeof value==='string' && (STUDIO_ACTORS as readonly string[]).includes(value);
const isRecord = (value:unknown):value is Record<string,unknown> =>
  Boolean(value) && typeof value==='object' && !Array.isArray(value);

const clamp = (v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const round2 = (n:number)=>Math.round(n*100)/100;
const num = (value:unknown,fallback:number,limit:{min:number;max:number}):number =>
  clamp(typeof value==='number'&&Number.isFinite(value)?value:fallback,limit.min,limit.max);

/** z por defecto de cada tipo en el plano único (coherente con la migración de v2). */
export function defaultLayerZ(kind:StudioLayerKind,actor?:StudioActor):number {
  if(kind==='actor')return actor==='Niño'?16:14;
  if(kind==='bubble')return 47;
  if(kind==='native')return 10;
  return kind==='effect'?49:48;
}
export function defaultLayerTransform(kind:StudioLayerKind,actor?:StudioActor):StudioLayerTransform {
  return {x:0,y:0,scale:1,rotation:0,opacity:1,mirror:false,z:defaultLayerZ(kind,actor),visible:true};
}

/** Normaliza y acota la parte geométrica de una capa. */
export function normalizeLayerTransform(value:unknown,defaults:StudioLayerTransform):StudioLayerTransform {
  const v = isRecord(value) ? value : {};
  const L = STUDIO_LIMITS;
  return {
    x:round2(num(v.x,defaults.x,L.x)),
    y:round2(num(v.y,defaults.y,L.y)),
    scale:round2(num(v.scale,defaults.scale,L.scale)),
    rotation:round2(num(v.rotation,defaults.rotation,L.rotation)),
    opacity:round2(num(v.opacity,defaults.opacity,L.opacity)),
    mirror:typeof v.mirror==='boolean'?v.mirror:defaults.mirror,
    z:Math.round(num(v.z,defaults.z,L.z)),
    visible:typeof v.visible==='boolean'?v.visible:defaults.visible,
    ...(v.locked===true?{locked:true}:{}),
    ...(v.devOnly===true?{devOnly:true}:{}),
  };
}

/**
 * Valida una capa. Devuelve null si es inválida o si referencia un recurso
 * que no existe en `assets` (cuando se proporciona).
 */
export function normalizeStudioLayer(value:unknown,assets?:Record<string,StudioAssetMeta>):StudioLayer|null {
  if(!isRecord(value))return null;
  const assetKnown=(id:unknown):id is string=>
    typeof id==='string'&&MEDIA_ID.test(id)&&(!assets||
      (Object.prototype.hasOwnProperty.call(assets,id)&&!assets[id].mime.startsWith('audio/')));
  if(value.kind==='actor'){
    if(!isActor(value.actor))return null;
    const actor=value.actor;
    return {
      id:actorLayerId(actor),kind:'actor',actor,
      ...normalizeLayerTransform(value,defaultLayerTransform('actor',actor)),
      ...(assetKnown(value.assetId)?{assetId:value.assetId}:{}),
    };
  }
  if(value.kind==='image'||value.kind==='effect'){
    if(typeof value.id!=='string'||!EXTRA_ID.test(value.id)||!assetKnown(value.assetId))return null;
    return {
      id:value.id,kind:value.kind,
      name:typeof value.name==='string'?value.name.slice(0,STUDIO_V3_MAX_NAME):'',
      assetId:value.assetId,
      ...normalizeLayerTransform(value,defaultLayerTransform(value.kind)),
    };
  }
  if(value.kind==='native'){
    if(typeof value.id!=='string'||!NATIVE_LAYER_ID.test(value.id))return null;
    return {id:value.id,kind:'native',...normalizeLayerTransform(value,defaultLayerTransform('native'))};
  }
  if(value.kind==='bubble'){
    return {
      id:STUDIO_BUBBLE_LAYER_ID,kind:'bubble',
      ...normalizeLayerTransform(value,defaultLayerTransform('bubble')),
      ...(typeof value.text==='string'?{text:value.text.slice(0,STUDIO_V3_MAX_BUBBLE_TEXT)}:{}),
      ...(value.side==='left'||value.side==='right'?{side:value.side}:{}),
    };
  }
  return null;
}

/** Valida el fondo; null si no aporta nada (sin recurso válido ni encuadre). */
export function normalizeStudioBackground(value:unknown,assets?:Record<string,StudioAssetMeta>):StudioBackground|null {
  if(!isRecord(value))return null;
  const bg:StudioBackground={};
  if(typeof value.assetId==='string'&&MEDIA_ID.test(value.assetId)&&
    (!assets||(assets[value.assetId]&&!assets[value.assetId].mime.startsWith('audio/'))))
    bg.assetId=value.assetId;
  for(const axis of ['x','y'] as const){
    const n=value[axis];
    if(typeof n==='number'&&Number.isFinite(n)&&n!==0)bg[axis]=round2(clamp(n,-100,100));
  }
  if(typeof value.scale==='number'&&Number.isFinite(value.scale)&&value.scale!==1)
    bg.scale=round2(clamp(value.scale,STUDIO_BACKGROUND_SCALE.min,STUDIO_BACKGROUND_SCALE.max));
  if(value.locked===false)bg.locked=false;
  return Object.keys(bg).length?bg:null;
}

/** Valida el estilo del bloque de diálogo; omite los valores neutros (1). */
export function normalizeDialogueStyle(value:unknown):StudioDialogueStyle {
  const v=isRecord(value)?value:{};
  const style:StudioDialogueStyle={};
  const scale=(n:unknown,limit:{min:number;max:number})=>
    typeof n==='number'&&Number.isFinite(n)?round2(clamp(n,limit.min,limit.max)):1;
  const text=scale(v.textScale,STUDIO_DIALOGUE_TEXT_SCALE);
  const box=scale(v.boxScale,STUDIO_DIALOGUE_BOX_SCALE);
  if(text!==1)style.textScale=text;
  if(box!==1)style.boxScale=box;
  const width=scale(v.boxWidth,STUDIO_DIALOGUE_BOX_WIDTH);
  if(width!==1)style.boxWidth=width;
  for(const flag of ['hideNameplate','hideProgress','hideTitle'] as const)if(v[flag]===true)style[flag]=true;
  return style;
}
/** Valida una ficha narrativa y elimina datos no reconocidos de paquetes externos. */
export function normalizeNarrativeCard(value:unknown,
  assets?:Record<string,StudioAssetMeta>):StudioNarrativeCard|null {
  if(!isRecord(value))return null;
  const card:StudioNarrativeCard={};
  const bounded=(val:unknown,max:number):string|undefined=>{
    if(typeof val!=='string')return undefined;
    const clean=Array.from(val).filter(ch=>ch==='\n'||ch==='\t'||ch.charCodeAt(0)>=32).join('').trim().slice(0,max);
    return clean||undefined;
  };
  const speaker=bounded(value.speaker,STUDIO_NARRATIVE_LIMITS.speaker);
  const intent=bounded(value.intent,STUDIO_NARRATIVE_LIMITS.intent);
  const direction=bounded(value.direction,STUDIO_NARRATIVE_LIMITS.direction);
  if(speaker)card.speaker=speaker;
  if(intent)card.intent=intent;
  if(direction)card.direction=direction;
  if((STUDIO_NARRATIVE_TONES as readonly string[]).includes(value.tone as string))
    card.tone=value.tone as StudioNarrativeTone;
  if(isNarrativeSpriteId(value.spriteId))card.spriteId=value.spriteId;
  if(typeof value.musicAssetId==='string'&&MEDIA_ID.test(value.musicAssetId)&&
    assets?.[value.musicAssetId]?.mime?.startsWith('audio/'))
    card.musicAssetId=value.musicAssetId;
  if((STUDIO_NARRATIVE_MUSIC_MODES as readonly string[]).includes(value.musicMode as string))
    card.musicMode=value.musicMode as StudioNarrativeMusicMode;
  if((STUDIO_NARRATIVE_SOUND_CUES as readonly string[]).includes(value.soundCue as string))
    card.soundCue=value.soundCue as StudioNarrativeSoundCue;
  if((AUDIO_MUSIC_CUE_MODES as readonly string[]).includes(value.musicCueMode as string))
    card.musicCueMode=value.musicCueMode as AudioMusicCueMode;
  for(const key of Object.keys(AUDIO_TIMING_PRESETS) as (keyof typeof AUDIO_TIMING_PRESETS)[]){
    const ms=validAudioTime(key,value[key]);
    if(ms!==undefined&&ms!==0)card[key]=ms;
  }
  if(value.portraitMode==='show'||value.portraitMode==='hide')card.portraitMode=value.portraitMode;
  if((STUDIO_PORTRAIT_MOTIONS as readonly string[]).includes(value.enterMotion as string))
    card.enterMotion=value.enterMotion as StudioPortraitMotion;
  if((STUDIO_PORTRAIT_MOTIONS as readonly string[]).includes(value.exitMotion as string))
    card.exitMotion=value.exitMotion as StudioPortraitMotion;
  if(typeof value.motionDurationMs==='number'&&Number.isFinite(value.motionDurationMs))
    card.motionDurationMs=Math.round(clamp(value.motionDurationMs,
      STUDIO_PORTRAIT_DURATION.min,STUDIO_PORTRAIT_DURATION.max));
  return Object.keys(card).length?card:null;
}
export function normalizeDialogue(value:unknown):StudioDialogue|null {
  if(!isRecord(value))return null;
  const dialogue:StudioDialogue=normalizeDialogueStyle(value);
  if(typeof value.text==='string'&&value.text.trim())dialogue.text=value.text.slice(0,STUDIO_V3_MAX_DIALOGUE_TEXT);
  return Object.keys(dialogue).length?dialogue:null;
}

/** Ordena por z (y por id para que el resultado sea determinista). */
export const sortLayers = (layers:readonly StudioLayer[]):StudioLayer[] =>
  [...layers].sort((a,b)=>a.z-b.z||(a.id<b.id?-1:a.id>b.id?1:0));

function normalizeAssets(value:unknown):Record<string,StudioAssetMeta>|undefined {
  if(!isRecord(value))return undefined;
  const assets:Record<string,StudioAssetMeta>={};
  let count=0;
  for(const [id,meta] of Object.entries(value)){
    if(count>=STUDIO_V3_MAX_ASSETS)break;
    if(!MEDIA_ID.test(id)||!isRecord(meta))continue;
    if(typeof meta.name!=='string'||typeof meta.mime!=='string'||!MEDIA_MIME.test(meta.mime))continue;
    assets[id]={name:meta.name.slice(0,STUDIO_V3_MAX_NAME),mime:meta.mime};
    count++;
  }
  return Object.keys(assets).length?assets:undefined;
}

/**
 * Valida un documento v3 ya deserializado. Descarta claves, capas y recursos
 * no válidos; nunca lanza por contenido parcial, solo por formato incompatible.
 */
export function normalizeStudioDocumentV3(value:unknown):StudioDocumentV3 {
  if(!isRecord(value)||value.version!==STUDIO_V3_VERSION)
    throw new Error('Formato de Decreto Real Studio v3 no compatible.');
  if(!isRecord(value.scenes))throw new Error('No hay escenas válidas.');
  const assets=normalizeAssets(value.assets);
  const defaultDialogue=isRecord(value.defaults)?normalizeDialogueStyle(value.defaults.dialogue):{};
  const doc:StudioDocumentV3={version:3,scenes:{},...(assets?{assets}:{}),
    ...(Object.keys(defaultDialogue).length?{defaults:{dialogue:defaultDialogue}}:{})};
  let mediaLayers=0;
  for(const [key,raw] of Object.entries(value.scenes)){
    if(!SCENE_KEY.test(key)||!isRecord(raw))continue;
    const scene:StudioSceneV3={};
    if(Array.isArray(raw.layers)){
      const seen=new Set<string>();
      const layers:StudioLayer[]=[];
      for(const item of raw.layers.slice(0,STUDIO_V3_MAX_LAYERS_PER_SCENE)){
        const layer=normalizeStudioLayer(item,assets??{});
        if(!layer||seen.has(layer.id))continue;
        if(layer.kind==='image'||layer.kind==='effect'){
          if(mediaLayers>=STUDIO_V3_MAX_MEDIA_LAYERS)continue;
          mediaLayers++;
        }
        seen.add(layer.id);
        layers.push(layer);
      }
      if(layers.length)scene.layers=sortLayers(layers);
    }
    const background=normalizeStudioBackground(raw.background,assets);
    if(background)scene.background=background;
    if(typeof raw.titleVisible==='boolean')scene.titleVisible=raw.titleVisible;
    if(typeof raw.title==='string'&&raw.title.trim())scene.title=raw.title.slice(0,STUDIO_V3_MAX_TITLE);
    if(raw.titleDevOnly===true)scene.titleDevOnly=true;
    if(raw.devOnly===true)scene.devOnly=true;
    const dialogue=normalizeDialogue(raw.dialogue);
    if(dialogue)scene.dialogue=dialogue;
    // Ficha por intervención, nunca en toda la escena ni en el tablero general.
    const narrative=normalizeNarrativeCard(raw.narrative,assets);
    if(narrative)scene.narrative=narrative;
    if(Object.keys(scene).length)doc.scenes[key]=scene;
  }
  return doc;
}

export function parseStudioDocumentV3(raw:string):StudioDocumentV3 {
  if(raw.length>STUDIO_V3_MAX_BYTES)throw new Error('El documento supera el máximo de 3 MB.');
  return normalizeStudioDocumentV3(JSON.parse(raw));
}

export const emptyStudioDocumentV3 = ():StudioDocumentV3 => ({version:3,scenes:{}});

/** Actor nativo al que corresponde un id de capa (`actor-madre` → `Madre`). */
export function actorForLayerId(id:string):StudioActor|undefined {
  return STUDIO_ACTORS.find(actor=>ACTOR_LAYER_IDS[actor]===id);
}
