/**
 * Operaciones puras e inmutables sobre el documento de Studio v3.
 * Todas devuelven un documento nuevo, normalizado y con las capas ordenadas
 * por `z`; nunca mutan la entrada.
 */
import {
  STUDIO_BUBBLE_LAYER_ID, STUDIO_V3_MAX_LAYERS_PER_SCENE, actorForLayerId, defaultLayerTransform,
  STUDIO_V3_MAX_TITLE, isStudioSceneKey, isStudioMediaId, normalizeDialogue, normalizeDialogueStyle,
  normalizeStudioBackground, normalizeStudioLayer, normalizeNarrativeCard, sortLayers, type StudioDialogueStyle,
  type StudioNarrativeCard,
  type StudioAssetMeta, type StudioDocumentV3, type StudioLayer, type StudioSceneV3,
} from './schema.ts';

function assertSceneKey(key:string):void {
  if(!isStudioSceneKey(key))throw new Error('Escena no válida: '+key);
}
/** Elimina la escena si queda vacía. */
function withScene(doc:StudioDocumentV3,key:string,scene:StudioSceneV3):StudioDocumentV3 {
  const clean:StudioSceneV3={...scene};
  if(!clean.layers?.length)delete clean.layers;
  if(!clean.background)delete clean.background;
  if(clean.titleVisible===undefined)delete clean.titleVisible;
  if(!clean.title)delete clean.title;
  if(!clean.titleDevOnly)delete clean.titleDevOnly;
  if(!clean.devOnly)delete clean.devOnly;
  if(!clean.dialogue||!Object.keys(clean.dialogue).length)delete clean.dialogue;
  if(!clean.narrative||!Object.keys(clean.narrative).length)delete clean.narrative;
  const scenes={...doc.scenes};
  if(Object.keys(clean).length)scenes[key]=clean;
  else delete scenes[key];
  return {...doc,scenes};
}

export const sceneLayers = (doc:StudioDocumentV3,key:string):readonly StudioLayer[] =>
  doc.scenes[key]?.layers??[];

export const getLayer = (doc:StudioDocumentV3,key:string,id:string):StudioLayer|undefined =>
  sceneLayers(doc,key).find(layer=>layer.id===id);

/**
 * Fase 1 del director narrativo. El diálogo sigue en `tutorial/g00`;
 * cada escena visual tiene una variante por perfil de pantalla.
 *
 * Studio y las composiciones preparadas desde GitHub comparten estas claves:
 * - `tablero/movil`: posición predeterminada compartida.
 * - `tutorial/g00-movil`: posición SOLO para la intervención g00.
 */
export type TutorialLayoutProfile='movil'|'horizontal'|'escritorio';
export const TUTORIAL_LAYOUT_IDS:readonly string[]=[
  'native-tablero-tutorial-dialogo',
  'native-tablero-tutorial-rival',
  'native-tablero-tutorial-jugador',
  'native-tablero-combo',
  'native-tablero-moneda',
  'native-tablero-combo-menu',
];
export const isTutorialLayoutId=(id:string):boolean=>TUTORIAL_LAYOUT_IDS.includes(id);
export function tutorialLayoutKey(stepId:string,profile:TutorialLayoutProfile):string {
  if(!/^g\d{2}$/.test(stepId))throw new Error('Intervención del tutorial no válida');
  if(!(['movil','horizontal','escritorio'] as string[]).includes(profile))
    throw new Error('Perfil del tutorial no válido');
  return 'tutorial/'+stepId+'-'+profile;
}
export function effectiveTutorialLayer(doc:StudioDocumentV3,stepId:string,
  profile:TutorialLayoutProfile,id:string):StudioLayer|undefined {
  if(!isTutorialLayoutId(id))return getLayer(doc,'tablero/'+profile,id);
  return getLayer(doc,tutorialLayoutKey(stepId,profile),id)??
    getLayer(doc,'tablero/'+profile,id);
}

/** Inserta o reemplaza una capa (por id). Lanza si la capa no es válida. */
export function withLayer(doc:StudioDocumentV3,key:string,layer:StudioLayer):StudioDocumentV3 {
  assertSceneKey(key);
  const normalized=normalizeStudioLayer(layer,doc.assets??{});
  if(!normalized)throw new Error('Capa no válida o con un recurso inexistente.');
  const current=sceneLayers(doc,key);
  const exists=current.some(item=>item.id===normalized.id);
  if(!exists&&current.length>=STUDIO_V3_MAX_LAYERS_PER_SCENE)
    throw new Error('Máximo '+STUDIO_V3_MAX_LAYERS_PER_SCENE+' capas por escena.');
  const layers=exists?current.map(item=>item.id===normalized.id?normalized:item):[...current,normalized];
  return withScene(doc,key,{...doc.scenes[key],layers:sortLayers(layers)});
}

/** Aplica un cambio parcial a una capa existente (no permite cambiar id ni tipo). */
export function withLayerPatch(doc:StudioDocumentV3,key:string,id:string,
  patch:Partial<Omit<StudioLayer,'id'|'kind'|'actor'>>):StudioDocumentV3 {
  const layer=getLayer(doc,key,id);
  if(!layer)throw new Error('La capa no existe en esta escena.');
  return withLayer(doc,key,{...layer,...patch,id:layer.id,kind:layer.kind} as StudioLayer);
}

export function withoutLayer(doc:StudioDocumentV3,key:string,id:string):StudioDocumentV3 {
  if(!getLayer(doc,key,id))return doc;
  return withScene(doc,key,{...doc.scenes[key],layers:sceneLayers(doc,key).filter(item=>item.id!==id)});
}

export function withSceneSettings(doc:StudioDocumentV3,key:string,
  patch:{background?:{assetId:string}|null;titleVisible?:boolean|null;
    title?:string|null;titleDevOnly?:boolean|null;devOnly?:boolean|null}):StudioDocumentV3 {
  assertSceneKey(key);
  const scene:StudioSceneV3={...doc.scenes[key]};
  if(patch.background===null){
    // «Fondo original»: se retira el recurso y el encuadre.
    delete scene.background;
  }else if(patch.background){
    if(!doc.assets?.[patch.background.assetId])throw new Error('El fondo usa un recurso inexistente.');
    scene.background={...scene.background,assetId:patch.background.assetId};
  }
  if(patch.titleVisible===null)delete scene.titleVisible;
  else if(typeof patch.titleVisible==='boolean')scene.titleVisible=patch.titleVisible;
  if(patch.title===null||patch.title==='')delete scene.title;
  else if(typeof patch.title==='string')scene.title=patch.title.slice(0,STUDIO_V3_MAX_TITLE);
  if(patch.titleDevOnly!==undefined)scene.titleDevOnly=patch.titleDevOnly===true;
  if(patch.devOnly!==undefined)scene.devOnly=patch.devOnly===true;
  return withScene(doc,key,scene);
}

/**
 * Texto propio (con **negrita**) y tamaño del bloque de diálogo de una
 * intervención. `null` vuelve al valor original.
 */
export function withDialogue(doc:StudioDocumentV3,key:string,
  patch:{text?:string|null;textScale?:number|null;boxScale?:number|null;boxWidth?:number|null;
    hideNameplate?:boolean|null;hideProgress?:boolean|null;hideTitle?:boolean|null}):StudioDocumentV3 {
  assertSceneKey(key);
  const merged:Record<string,unknown>={...doc.scenes[key]?.dialogue};
  for(const field of ['text','textScale','boxScale','boxWidth','hideNameplate','hideProgress','hideTitle'] as const){
    if(patch[field]===null)delete merged[field];
    else if(patch[field]!==undefined)merged[field]=patch[field];
  }
  const dialogue=normalizeDialogue(merged);
  const scene:StudioSceneV3={...doc.scenes[key]};
  if(dialogue)scene.dialogue=dialogue;
  else delete scene.dialogue;
  return withScene(doc,key,scene);
}

/** Edita solo la ficha editorial del paso; sus acciones de combate son inmutables.
 * null restaura un campo al valor propuesto inicialmente. */
export function withNarrativeCard(doc:StudioDocumentV3,key:string,
  patch:{[K in keyof StudioNarrativeCard]?:StudioNarrativeCard[K]|null}):StudioDocumentV3 {
  assertSceneKey(key);
  const merged:Record<string,unknown>={...doc.scenes[key]?.narrative};
  for(const field of ['speaker','tone','intent','direction'] as const){
    if(patch[field]===null)delete merged[field];
    else if(patch[field]!==undefined)merged[field]=patch[field];
  }
  const narrative=normalizeNarrativeCard(merged);
  const scene:StudioSceneV3={...doc.scenes[key]};
  if(narrative)scene.narrative=narrative;
  else delete scene.narrative;
  return withScene(doc,key,scene);
}

/** Tamaño del bloque de diálogo común a todas las intervenciones. */
export function withDialogueDefaults(doc:StudioDocumentV3,
  patch:{textScale?:number|null;boxScale?:number|null;boxWidth?:number|null;
    hideNameplate?:boolean|null;hideProgress?:boolean|null;hideTitle?:boolean|null}):StudioDocumentV3 {
  const merged:Record<string,unknown>={...doc.defaults?.dialogue};
  for(const field of ['textScale','boxScale','boxWidth','hideNameplate','hideProgress','hideTitle'] as const){
    if(patch[field]===null)delete merged[field];
    else if(patch[field]!==undefined)merged[field]=patch[field];
  }
  const dialogue=normalizeDialogueStyle(merged);
  const next={...doc};
  if(Object.keys(dialogue).length)next.defaults={...doc.defaults,dialogue};
  else delete next.defaults;
  return next;
}

/** Tamaño efectivo del bloque: el de la intervención o, si no, el común. */
export function effectiveDialogueStyle(doc:StudioDocumentV3,key:string|null):Required<StudioDialogueStyle> {
  const own=key?doc.scenes[key]?.dialogue:undefined;
  const common=doc.defaults?.dialogue;
  return {
    textScale:own?.textScale??common?.textScale??1,
    boxScale:own?.boxScale??common?.boxScale??1,
    boxWidth:own?.boxWidth??common?.boxWidth??1,
    hideNameplate:own?.hideNameplate??common?.hideNameplate??false,
    hideProgress:own?.hideProgress??common?.hideProgress??false,
    hideTitle:own?.hideTitle??common?.hideTitle??false,
  };
}

/** Cambia el encuadre o el bloqueo del fondo (sin tocar el recurso). */
export function withBackgroundFrame(doc:StudioDocumentV3,key:string,
  patch:{x?:number;y?:number;scale?:number;locked?:boolean}):StudioDocumentV3 {
  assertSceneKey(key);
  const merged={...doc.scenes[key]?.background,...patch};
  const background=normalizeStudioBackground(merged,doc.assets??{});
  const scene:StudioSceneV3={...doc.scenes[key]};
  if(background)scene.background=background;
  else delete scene.background;
  return withScene(doc,key,scene);
}

/** Restablece la escena a la composición original (borra todas sus ediciones). */
export function withoutScene(doc:StudioDocumentV3,key:string):StudioDocumentV3 {
  if(!doc.scenes[key])return doc;
  const scenes={...doc.scenes};
  delete scenes[key];
  return {...doc,scenes};
}

export function withAsset(doc:StudioDocumentV3,id:string,meta:StudioAssetMeta):StudioDocumentV3 {
  if(!isStudioMediaId(id))throw new Error('ID multimedia inválido.');
  return {...doc,assets:{...doc.assets,[id]:{name:meta.name.slice(0,100),mime:meta.mime}}};
}

/**
 * Copia la COMPOSICIÓN visual (capas y fondo) de una escena a otras
 * («aplicar a toda la escena» / «copiar de la anterior»). Los textos, el
 * rótulo y la visibilidad de cada intervención de destino se conservan.
 */
export function copyScene(doc:StudioDocumentV3,from:string,targets:readonly string[]):StudioDocumentV3 {
  assertSceneKey(from);
  targets.forEach(assertSceneKey);
  const source=doc.scenes[from];
  let next=doc;
  for(const target of targets){
    if(target===from)continue;
    const scene:StudioSceneV3={...next.scenes[target]};
    delete scene.layers;delete scene.background;
    if(source?.layers)scene.layers=source.layers.map(layer=>({...layer}));
    if(source?.background)scene.background={...source.background};
    next=withScene(next,target,scene);
  }
  return next;
}

/** Recursos multimedia realmente usados por alguna capa o fondo. */
export function referencedAssetIds(doc:StudioDocumentV3):Set<string> {
  const used=new Set<string>();
  for(const scene of Object.values(doc.scenes)){
    if(scene.background?.assetId)used.add(scene.background.assetId);
    for(const layer of scene.layers??[]){
      if((layer.kind==='actor'||layer.kind==='image'||layer.kind==='effect')&&layer.assetId)used.add(layer.assetId);
    }
  }
  return used;
}

/** Quita del índice `assets` los recursos que ninguna escena usa. */
export function withoutUnusedAssets(doc:StudioDocumentV3):StudioDocumentV3 {
  if(!doc.assets)return doc;
  const used=referencedAssetIds(doc);
  const assets=Object.fromEntries(Object.entries(doc.assets).filter(([id])=>used.has(id)));
  const next={...doc};
  if(Object.keys(assets).length)next.assets=assets;
  else delete next.assets;
  return next;
}

/** Claves de escena con alguna edición (para marcar la línea de tiempo). */
export const editedSceneKeys = (doc:StudioDocumentV3):string[] => Object.keys(doc.scenes).sort();

/** Escenas cuya composición difiere entre dos versiones del documento. */
export function changedSceneKeys(a:StudioDocumentV3,b:StudioDocumentV3):string[] {
  const keys=new Set([...Object.keys(a.scenes),...Object.keys(b.scenes)]);
  return [...keys].filter(key=>a.scenes[key]!==b.scenes[key]).sort();
}

/**
 * Capa existente o, para elementos nativos (actores, globo), una capa nueva
 * con la transformación por defecto. Null si el id no existe en la escena.
 */
export function layerOrDefault(doc:StudioDocumentV3,key:string,id:string):StudioLayer|null {
  const existing=getLayer(doc,key,id);
  if(existing)return existing;
  const actor=actorForLayerId(id);
  if(actor)return {id,kind:'actor',actor,...defaultLayerTransform('actor',actor)};
  if(id===STUDIO_BUBBLE_LAYER_ID)return {id,kind:'bubble',...defaultLayerTransform('bubble')};
  if(/^native-[a-z0-9-]{1,40}$/.test(id))return {id,kind:'native',...defaultLayerTransform('native')};
  return null;
}

/** Incorpora las nuevas fichas publicadas en un borrador anterior sin tocar
 * diálogos, posiciones, medios ni decisiones editoriales ya modificadas.
 * Los campos locales tienen precedencia incluso cuando solo hay uno editado. */
export function inheritPublishedNarrative(
  local:StudioDocumentV3,published:StudioDocumentV3,
):StudioDocumentV3 {
  let next:StudioDocumentV3=local;
  for(const [key,source] of Object.entries(published.scenes)){
    if(!/^tutorial\/g\d{2}$/.test(key)||!source.narrative)continue;
    const current=next.scenes[key];
    const localCard=current?.narrative??{};
    const incoming={...source.narrative,...localCard};
    if(Object.keys(incoming).every(field=>
      localCard[field as keyof StudioNarrativeCard]===incoming[field as keyof StudioNarrativeCard]))continue;
    next={...next,scenes:{...next.scenes,[key]:{...current,narrative:incoming}}};
  }
  return next;
}

/**
 * Fusiona un documento importado con el actual: las escenas importadas
 * reemplazan solo a las que coinciden; el resto del borrador se conserva.
 * Los recursos se unen y los tamaños comunes importados, si existen, ganan.
 */
export function mergeStudioDocuments(base:StudioDocumentV3,incoming:StudioDocumentV3):StudioDocumentV3 {
  const assets={...base.assets,...incoming.assets};
  const merged:StudioDocumentV3={
    version:3,
    scenes:{...base.scenes,...incoming.scenes},
    ...(Object.keys(assets).length?{assets}:{}),
  };
  const defaults=incoming.defaults??base.defaults;
  if(defaults)merged.defaults=defaults;
  return merged;
}

/** Escenas que usan cada recurso multimedia (capas o fondo). */
export function assetUsage(doc:StudioDocumentV3):Record<string,string[]> {
  const usage:Record<string,string[]>={};
  const add=(id:string,key:string)=>{(usage[id]??=[]).includes(key)||usage[id].push(key);};
  for(const [key,scene] of Object.entries(doc.scenes)){
    if(scene.background?.assetId)add(scene.background.assetId,key);
    for(const layer of scene.layers??[])
      if((layer.kind==='actor'||layer.kind==='image'||layer.kind==='effect')&&layer.assetId)add(layer.assetId,key);
  }
  return usage;
}
