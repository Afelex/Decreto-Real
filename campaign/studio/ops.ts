/**
 * Operaciones puras e inmutables sobre el documento de Studio v3.
 * Todas devuelven un documento nuevo, normalizado y con las capas ordenadas
 * por `z`; nunca mutan la entrada.
 */
import {
  STUDIO_BUBBLE_LAYER_ID, STUDIO_V3_MAX_LAYERS_PER_SCENE, actorForLayerId, defaultLayerTransform,
  isStudioSceneKey, isStudioMediaId, normalizeStudioLayer, sortLayers,
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
  const scenes={...doc.scenes};
  if(Object.keys(clean).length)scenes[key]=clean;
  else delete scenes[key];
  return {...doc,scenes};
}

export const sceneLayers = (doc:StudioDocumentV3,key:string):readonly StudioLayer[] =>
  doc.scenes[key]?.layers??[];

export const getLayer = (doc:StudioDocumentV3,key:string,id:string):StudioLayer|undefined =>
  sceneLayers(doc,key).find(layer=>layer.id===id);

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
  patch:{background?:{assetId:string}|null;titleVisible?:boolean|null}):StudioDocumentV3 {
  assertSceneKey(key);
  const scene:StudioSceneV3={...doc.scenes[key]};
  if(patch.background===null)delete scene.background;
  else if(patch.background){
    if(!doc.assets?.[patch.background.assetId])throw new Error('El fondo usa un recurso inexistente.');
    scene.background={assetId:patch.background.assetId};
  }
  if(patch.titleVisible===null)delete scene.titleVisible;
  else if(typeof patch.titleVisible==='boolean')scene.titleVisible=patch.titleVisible;
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
 * Copia la composición completa de una escena a otras («aplicar a toda la
 * escena» / «copiar de la anterior»). Las escenas destino se reemplazan.
 */
export function copyScene(doc:StudioDocumentV3,from:string,targets:readonly string[]):StudioDocumentV3 {
  assertSceneKey(from);
  targets.forEach(assertSceneKey);
  const source=doc.scenes[from];
  let next=doc;
  for(const target of targets){
    if(target===from)continue;
    next=source
      ? withScene(next,target,cloneScene(source))
      : withoutScene(next,target);
  }
  return next;
}
const cloneScene=(scene:StudioSceneV3):StudioSceneV3=>({
  ...scene,
  ...(scene.layers?{layers:scene.layers.map(layer=>({...layer}))}:{}),
  ...(scene.background?{background:{...scene.background}}:{}),
});

/** Recursos multimedia realmente usados por alguna capa o fondo. */
export function referencedAssetIds(doc:StudioDocumentV3):Set<string> {
  const used=new Set<string>();
  for(const scene of Object.values(doc.scenes)){
    if(scene.background)used.add(scene.background.assetId);
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
  return null;
}
