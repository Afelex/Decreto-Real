/**
 * Migración de borradores de Studio v1/v2 (`version:1`) al documento v3 y
 * lectura/escritura del borrador local.
 *
 * Las claves antiguas eran posiciones (`opening:N`, `after:N`). Se traducen
 * con una tabla CONGELADA del orden publicado en v2: si el guion se reordena
 * en el futuro, los borradores antiguos siguen apuntando a la intervención
 * correcta. No modificar estas tablas.
 *
 * Unidades: v2 guardaba vw/vh. En el viewport de referencia (390×844) el
 * escenario mide exactamente 100vw × 100dvh, así que los valores se conservan
 * como % del escenario (factor 1).
 */
import {
  STUDIO_STORAGE_KEY, parseStudioDocument,
  type StudioDocument, type StudioTransform,
} from '../studioLayout.ts';
import {
  STUDIO_V3_STORAGE_KEY, STUDIO_BUBBLE_LAYER_ID, STUDIO_ACTORS,
  actorLayerId, emptyStudioDocumentV3, normalizeStudioDocumentV3, parseStudioDocumentV3,
  type StudioDocumentV3, type StudioLayer,
} from './schema.ts';

/** Orden de las 21 intervenciones previas al duelo en Studio v1/v2. */
export const LEGACY_V2_OPENING_BEAT_IDS: readonly string[] = Object.freeze([
  'pergamino-01',
  'arresto-01','arresto-02','arresto-03',
  'xervias-01','xervias-02','xervias-03',
  'revision-01','revision-02','revision-03','revision-04',
  'desafio-01','desafio-02','desafio-03','desafio-04',
  'anillo-01','anillo-02','anillo-03','anillo-04','anillo-05',
  'versus-01',
]);
/** Orden de las 28 intervenciones posteriores al duelo en Studio v1/v2. */
export const LEGACY_V2_AFTER_BEAT_IDS: readonly string[] = Object.freeze([
  'desenlace-01','desenlace-02','desenlace-03','desenlace-04','desenlace-05',
  'desenlace-06','desenlace-07','desenlace-08','desenlace-09',
  'zhinchi-01','zhinchi-02','zhinchi-03','zhinchi-04',
  'cetro-01','cetro-02','cetro-03','cetro-04','cetro-05',
  'resolucion-01','resolucion-02','resolucion-03','resolucion-04',
  'resolucion-05','resolucion-06','resolucion-07',
  'reflexion-01','reflexion-02','reflexion-03',
]);
/** Factor vw→% de escenario y vh→% de escenario en el viewport de referencia. */
export const LEGACY_VIEWPORT_TO_STAGE = Object.freeze({x:1,y:1});
const LEGACY_SCREEN = 'prologo';

/** `opening:4` → `prologo/xervias-01`; null si la clave no existe en v2. */
export function legacySceneKeyToV3(key:string):string|null {
  const match=/^(opening|after):(0|[1-9]\d{0,2})$/.exec(key);
  if(!match)return null;
  const table=match[1]==='opening'?LEGACY_V2_OPENING_BEAT_IDS:LEGACY_V2_AFTER_BEAT_IDS;
  const beatId=table[Number(match[2])];
  return beatId?LEGACY_SCREEN+'/'+beatId:null;
}

/** Actores: z 11–40 dentro del antiguo grupo de figuras (z-index 3). */
export const legacyActorZ = (layer:number):number => 10+layer;
/**
 * Imágenes, efectos y globo competían con el grupo de figuras (z-index 3):
 * capa ≤ 2 quedaba detrás de todos los actores; capa ≥ 3, delante (van
 * después en el DOM).
 */
export const legacyOverlayZ = (layer:number):number => layer<=2?layer:40+layer;

const geometry=(t:StudioTransform,z:number)=>({
  x:t.x*LEGACY_VIEWPORT_TO_STAGE.x,
  y:t.y*LEGACY_VIEWPORT_TO_STAGE.y,
  scale:t.scale,rotation:0,opacity:1,mirror:t.mirror,z,visible:t.visible,
});

export type StudioMigrationReport = {
  /** Claves de v2 convertidas, con su clave v3. */
  migrated:Record<string,string>;
  /** Claves de v2 que no corresponden a ninguna intervención conocida. */
  dropped:string[];
};

/** Convierte un documento v1/v2 ya validado por `parseStudioDocument`. */
export function migrateLegacyStudioDocument(legacy:StudioDocument):{doc:StudioDocumentV3;report:StudioMigrationReport} {
  const report:StudioMigrationReport={migrated:{},dropped:[]};
  const scenes:Record<string,{layers:StudioLayer[];background?:{assetId:string};titleVisible?:boolean}>={};
  const keys=new Set([
    ...Object.keys(legacy.scenes),
    ...Object.keys(legacy.settings??{}),
    ...Object.keys(legacy.extras??{}),
  ]);
  for(const key of keys){
    const target=legacySceneKeyToV3(key);
    if(!target){report.dropped.push(key);continue;}
    report.migrated[key]=target;
    const scene:{layers:StudioLayer[];background?:{assetId:string};titleVisible?:boolean}={layers:[]};
    for(const actor of STUDIO_ACTORS){
      const t=legacy.scenes[key]?.[actor];
      if(!t)continue;
      scene.layers.push({
        id:actorLayerId(actor),kind:'actor',actor,...geometry(t,legacyActorZ(t.layer)),
        ...(t.assetId?{assetId:t.assetId}:{}),
      });
    }
    for(const extra of legacy.extras?.[key]??[]){
      scene.layers.push({
        id:extra.id,kind:extra.kind,name:extra.name,assetId:extra.assetId,
        ...geometry(extra.transform,legacyOverlayZ(extra.transform.layer)),
      });
    }
    const settings=legacy.settings?.[key];
    if(settings){
      const hasBubble=settings.bubbleTransform||settings.bubbleText!==undefined||settings.bubbleVisible===false;
      if(hasBubble){
        // Sin transformación propia, el globo de v2 tenía z-index 7 y su posición nativa.
        const t=settings.bubbleTransform??{x:0,y:0,scale:1,mirror:false,layer:7,visible:true};
        scene.layers.push({
          id:STUDIO_BUBBLE_LAYER_ID,kind:'bubble',
          ...geometry(t,legacyOverlayZ(t.layer)),
          visible:settings.bubbleVisible!==false&&t.visible,
          ...(settings.bubbleText!==undefined?{text:settings.bubbleText}:{}),
        });
      }
      if(settings.backgroundAsset)scene.background={assetId:settings.backgroundAsset};
      if(settings.titleVisible!==undefined)scene.titleVisible=settings.titleVisible;
    }
    scenes[target]=scene;
  }
  report.dropped.sort();
  // La normalización v3 acota valores, ordena capas y descarta referencias rotas.
  const doc=normalizeStudioDocumentV3({version:3,scenes,assets:legacy.assets});
  return {doc,report};
}

export type StudioDocumentSource = 'v3' | 'legacy' | 'empty';
export type LoadedStudioDocument = {doc:StudioDocumentV3;source:StudioDocumentSource;report?:StudioMigrationReport};

/**
 * Lee cualquier formato conocido (v1/v2 con `version:1`, o v3) desde texto JSON.
 * Útil para importar respaldos antiguos.
 */
export function parseAnyStudioDocument(raw:string):LoadedStudioDocument {
  const value:unknown=JSON.parse(raw);
  const version=value&&typeof value==='object'?(value as {version?:unknown}).version:undefined;
  if(version===3)return {doc:parseStudioDocumentV3(raw),source:'v3'};
  if(version===1){
    const {doc,report}=migrateLegacyStudioDocument(parseStudioDocument(raw));
    return {doc,source:'legacy',report};
  }
  throw new Error('Formato de Decreto Real Studio no compatible.');
}

type StudioStorage = Pick<Storage,'getItem'|'setItem'>;

/**
 * Lee el borrador local: primero la clave v3; si no existe, migra al vuelo el
 * borrador v1/v2 SIN borrarlo (queda como respaldo). Nunca lanza.
 */
export function readStudioDocumentV3(storage:StudioStorage|null|undefined):LoadedStudioDocument {
  if(!storage)return {doc:emptyStudioDocumentV3(),source:'empty'};
  try{
    const current=storage.getItem(STUDIO_V3_STORAGE_KEY);
    if(current)return {doc:parseStudioDocumentV3(current),source:'v3'};
  }catch{/* borrador v3 dañado: se intenta el anterior */}
  try{
    const legacy=storage.getItem(STUDIO_STORAGE_KEY);
    if(legacy){
      const {doc,report}=migrateLegacyStudioDocument(parseStudioDocument(legacy));
      return {doc,source:'legacy',report};
    }
  }catch{/* sin almacenamiento o borrador ilegible */}
  return {doc:emptyStudioDocumentV3(),source:'empty'};
}

export function saveStudioDocumentV3(storage:StudioStorage|null|undefined,doc:StudioDocumentV3):boolean {
  if(!storage)return false;
  try{storage.setItem(STUDIO_V3_STORAGE_KEY,JSON.stringify(doc));return true;}
  catch{return false;}
}

