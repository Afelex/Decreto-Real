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
};
export type StudioActorLayer = StudioLayerBase & {kind:'actor'; actor:StudioActor; assetId?:string};
export type StudioMediaLayer = StudioLayerBase & {kind:'image'|'effect'; name:string; assetId:string};
export type StudioBubbleLayer = StudioLayerBase & {kind:'bubble'; text?:string};
export type StudioLayer = StudioActorLayer | StudioMediaLayer | StudioBubbleLayer;
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
export type StudioSceneV3 = {
  layers?:StudioLayer[];
  background?:StudioBackground;
  titleVisible?:boolean;
};
export type StudioDocumentV3 = {
  version:3;
  scenes:Record<string,StudioSceneV3>;
  assets?:Record<string,StudioAssetMeta>;
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
const MEDIA_MIME = /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm))$/;
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
  };
}

/**
 * Valida una capa. Devuelve null si es inválida o si referencia un recurso
 * que no existe en `assets` (cuando se proporciona).
 */
export function normalizeStudioLayer(value:unknown,assets?:Record<string,StudioAssetMeta>):StudioLayer|null {
  if(!isRecord(value))return null;
  const assetKnown=(id:unknown):id is string=>
    typeof id==='string'&&MEDIA_ID.test(id)&&(!assets||Object.prototype.hasOwnProperty.call(assets,id));
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
  if(value.kind==='bubble'){
    return {
      id:STUDIO_BUBBLE_LAYER_ID,kind:'bubble',
      ...normalizeLayerTransform(value,defaultLayerTransform('bubble')),
      ...(typeof value.text==='string'?{text:value.text.slice(0,STUDIO_V3_MAX_BUBBLE_TEXT)}:{}),
    };
  }
  return null;
}

/** Valida el fondo; null si no aporta nada (sin recurso válido ni encuadre). */
export function normalizeStudioBackground(value:unknown,assets?:Record<string,StudioAssetMeta>):StudioBackground|null {
  if(!isRecord(value))return null;
  const bg:StudioBackground={};
  if(typeof value.assetId==='string'&&MEDIA_ID.test(value.assetId)&&(!assets||assets[value.assetId]))
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
  const doc:StudioDocumentV3={version:3,scenes:{},...(assets?{assets}:{})};
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
