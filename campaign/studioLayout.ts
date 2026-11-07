/**
 * Versioned Studio scene compositions. V2 adds media and additional layers
 * without breaking the v1 JSON drafts already saved on users' devices.
 */
export const STUDIO_STORAGE_KEY='decreto-real.studio.borradores.v1';
export const STUDIO_ACTORS=['Xervias','Domingo Quispe','Zhinchi','Madre','Niño'] as const;
export type StudioActor=typeof STUDIO_ACTORS[number];
export type StudioTransform={
  /** Horizontal/vertical offsets as percentages of the game viewport. */
  x:number;y:number;scale:number;mirror:boolean;layer:number;visible:boolean;
  /** Optional local media replacement, stored in IndexedDB. */
  assetId?:string;
};
export type StudioExtra={
  id:string;name:string;assetId:string;kind:'image'|'effect';transform:StudioTransform;
};
export type StudioSceneSettings={
  backgroundAsset?:string;
  bubbleVisible?:boolean;
  titleVisible?:boolean;
  bubbleText?:string;
  bubbleTransform?:StudioTransform;
};
export type StudioAssetMeta={name:string;mime:string};
export type StudioDocument={
  version:1;
  scenes:Record<string,Partial<Record<StudioActor,StudioTransform>>>;
  settings?:Record<string,StudioSceneSettings>;
  extras?:Record<string,StudioExtra[]>;
  assets?:Record<string,StudioAssetMeta>;
};
export const emptyStudioDocument=():StudioDocument=>({version:1,scenes:{}});
export const defaultStudioTransform=(actor:StudioActor):StudioTransform=>({
  x:0,y:0,scale:1,mirror:false,layer:actor==='Niño'?6:4,visible:true,
});
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const round=(n:number)=>Math.round(n*100)/100;
const keyOk=(key:string)=>/^(opening|after):(?:0|[1-9]\d{0,2})$/.test(key);
const assetOk=(id:string)=>/^media-[a-f\d-]{12,60}$/i.test(id);
export function normalizeStudioTransform(value:unknown,actor:StudioActor):StudioTransform{
  const d=defaultStudioTransform(actor);
  const v=(value&&typeof value==='object'?value:{}) as Partial<StudioTransform>;
  return {
    x:round(clamp(typeof v.x==='number'&&Number.isFinite(v.x)?v.x:0,-100,100)),
    y:round(clamp(typeof v.y==='number'&&Number.isFinite(v.y)?v.y:0,-100,100)),
    scale:round(clamp(typeof v.scale==='number'&&Number.isFinite(v.scale)?v.scale:1,.35,2.75)),
    mirror:typeof v.mirror==='boolean'?v.mirror:d.mirror,
    layer:Math.round(clamp(typeof v.layer==='number'&&Number.isFinite(v.layer)?v.layer:d.layer,1,30)),
    visible:typeof v.visible==='boolean'?v.visible:d.visible,
    ...(typeof v.assetId==='string'&&assetOk(v.assetId)?{assetId:v.assetId}:{})
  };
}
export function studioSceneKey(phase:'opening'|'after',index:number):string{
  if(!Number.isInteger(index)||index<0||index>200)throw Error('Escena no válida');
  return phase+':'+index;
}
export function parseStudioDocument(raw:string):StudioDocument{
  if(raw.length>3_000_000)throw Error('El documento supera el máximo de 3 MB.');
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=='object'||(value as {version?:number}).version!==1)
    throw Error('Formato de Decreto Real Studio no compatible.');
  const parsed=emptyStudioDocument();
  const obj=value as Record<string,unknown>;
  const scenes=obj.scenes;
  if(!scenes||typeof scenes!=='object'||Array.isArray(scenes))throw Error('No hay escenas válidas.');
  for(const [sceneKey,actors] of Object.entries(scenes)){
    if(!keyOk(sceneKey)||!actors||typeof actors!=='object'||Array.isArray(actors))continue;
    const result:Partial<Record<StudioActor,StudioTransform>>={};
    for(const actor of STUDIO_ACTORS){
      if(Object.prototype.hasOwnProperty.call(actors,actor))
        result[actor]=normalizeStudioTransform((actors as Record<string,unknown>)[actor],actor);
    }
    if(Object.keys(result).length)parsed.scenes[sceneKey]=result;
  }
  if(obj.settings&&typeof obj.settings==='object'&&!Array.isArray(obj.settings)){
    const settings:Record<string,StudioSceneSettings>={};
    for(const [scene,v] of Object.entries(obj.settings)){
      if(!keyOk(scene)||!v||typeof v!=='object'||Array.isArray(v))continue;
      const s=v as StudioSceneSettings;
      settings[scene]={
        ...(typeof s.backgroundAsset==='string'&&assetOk(s.backgroundAsset)?{backgroundAsset:s.backgroundAsset}:{}),
        ...(typeof s.bubbleVisible==='boolean'?{bubbleVisible:s.bubbleVisible}:{}),
        ...(typeof s.titleVisible==='boolean'?{titleVisible:s.titleVisible}:{}),
        ...(typeof s.bubbleText==='string'?{bubbleText:s.bubbleText.slice(0,140)}:{}),
        ...(s.bubbleTransform&&typeof s.bubbleTransform==='object'?{
          bubbleTransform:normalizeStudioTransform(s.bubbleTransform,'Madre')}:{}),
      };
    }
    if(Object.keys(settings).length)parsed.settings=settings;
  }
  if(obj.assets&&typeof obj.assets==='object'&&!Array.isArray(obj.assets)){
    const assets:Record<string,StudioAssetMeta>={};
    for(const [id,v] of Object.entries(obj.assets)){
      if(!assetOk(id)||!v||typeof v!=='object')continue;
      const meta=v as StudioAssetMeta;
      if(typeof meta.name!=='string'||typeof meta.mime!=='string'||
        !/^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm))$/.test(meta.mime))continue;
      assets[id]={name:meta.name.slice(0,100),mime:meta.mime};
    }
    if(Object.keys(assets).length)parsed.assets=assets;
  }
  if(obj.extras&&typeof obj.extras==='object'&&!Array.isArray(obj.extras)){
    const extras:Record<string,StudioExtra[]>={};
    let count=0;
    for(const [scene,arr] of Object.entries(obj.extras)){
      if(!keyOk(scene)||!Array.isArray(arr))continue;
      const sanitized:StudioExtra[]=[];
      for(const value of arr.slice(0,50)){
        if(count>=100)break;
        if(!value||typeof value!=='object')continue;
        const x=value as StudioExtra;
        if(typeof x.id!=='string'||!/^extra-[a-f\d-]{12,60}$/i.test(x.id)||
          typeof x.assetId!=='string'||!assetOk(x.assetId)||typeof x.name!=='string'||
          (x.kind!=='image'&&x.kind!=='effect'))continue;
        sanitized.push({id:x.id,name:x.name.slice(0,100),assetId:x.assetId,kind:x.kind,
          transform:normalizeStudioTransform(x.transform,'Madre')});
        count++;
      }
      if(sanitized.length)extras[scene]=sanitized;
    }
    if(Object.keys(extras).length)parsed.extras=extras;
  }
  return parsed;
}
export function getStudioTransform(doc:StudioDocument,scene:string,actor:StudioActor):StudioTransform{
  return doc.scenes[scene]?.[actor]??defaultStudioTransform(actor);
}
export function withStudioTransform(doc:StudioDocument,scene:string,actor:StudioActor,transform:StudioTransform):StudioDocument{
  if(!keyOk(scene))throw Error('Escena no válida');
  return {...doc,scenes:{...doc.scenes,[scene]:{...doc.scenes[scene],
    [actor]:normalizeStudioTransform(transform,actor)}}};
}
export function withoutStudioTransform(doc:StudioDocument,scene:string,actor:StudioActor):StudioDocument{
  const group={...doc.scenes[scene]};
  delete group[actor];
  const scenes={...doc.scenes};
  if(Object.keys(group).length)scenes[scene]=group;
  else delete scenes[scene];
  return {...doc,scenes};
}
export function withStudioSettings(doc:StudioDocument,scene:string,patch:StudioSceneSettings):StudioDocument{
  if(!keyOk(scene))throw Error('Escena no válida');
  return {...doc,settings:{...doc.settings,[scene]:{...doc.settings?.[scene],...patch}}};
}
export function withStudioAsset(doc:StudioDocument,id:string,meta:StudioAssetMeta):StudioDocument{
  if(!assetOk(id))throw Error('ID multimedia inválido');
  return {...doc,assets:{...doc.assets,[id]:meta}};
}
export function addStudioExtra(doc:StudioDocument,scene:string,item:StudioExtra):StudioDocument{
  if(!keyOk(scene)||!/^extra-[a-f\d-]{12,60}$/i.test(item.id))throw Error('Elemento inválido');
  const next=[...(doc.extras?.[scene]??[]),item];
  if(next.length>50)throw Error('Máximo 50 elementos por escena.');
  return {...doc,extras:{...doc.extras,[scene]:next}};
}
export function withStudioExtraTransform(doc:StudioDocument,scene:string,id:string,transform:StudioTransform):StudioDocument{
  const existing=doc.extras?.[scene]??[];
  return {...doc,extras:{...doc.extras,[scene]:existing.map(x=>x.id===id?
    {...x,transform:normalizeStudioTransform(transform,'Madre')}:x)}};
}
export function withStudioExtraAsset(doc:StudioDocument,scene:string,id:string,assetId:string):StudioDocument{
  if(!assetOk(assetId))throw Error('ID multimedia inválido');
  return {...doc,extras:{...doc.extras,[scene]:(doc.extras?.[scene]??[]).map(x=>
    x.id===id?{...x,assetId}:x)}};
}
export function removeStudioExtra(doc:StudioDocument,scene:string,id:string):StudioDocument{
  return {...doc,extras:{...doc.extras,[scene]:(doc.extras?.[scene]??[]).filter(x=>x.id!==id)}};
}
export function readStudioDocument():StudioDocument{
  if(typeof window==='undefined')return emptyStudioDocument();
  try{const raw=window.localStorage.getItem(STUDIO_STORAGE_KEY);
    return raw?parseStudioDocument(raw):emptyStudioDocument();
  }catch{return emptyStudioDocument();}
}
export function saveStudioDocument(doc:StudioDocument):boolean{
  if(typeof window==='undefined')return false;
  try{window.localStorage.setItem(STUDIO_STORAGE_KEY,JSON.stringify(doc));return true;}
  catch{return false;}
}
