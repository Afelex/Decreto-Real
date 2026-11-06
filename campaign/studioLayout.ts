/**
 * Decreto Real Studio v1 — non-destructive, device-local scene-composition drafts.
 * No gameplay, narrative text or combat rules are stored in this document.
 */
export const STUDIO_STORAGE_KEY='decreto-real.studio.borradores.v1';
export const STUDIO_ACTORS=['Xervias','Domingo Quispe','Zhinchi','Madre','Niño'] as const;
export type StudioActor=typeof STUDIO_ACTORS[number];
export type StudioTransform={
  /** Horizontal/vertical offsets as percentages of the game viewport. */
  x:number;y:number;
  scale:number;mirror:boolean;layer:number;visible:boolean;
};
export type StudioDocument={version:1; scenes:Record<string,Partial<Record<StudioActor,StudioTransform>>>};
export const emptyStudioDocument=():StudioDocument=>({version:1,scenes:{}});
export const defaultStudioTransform=(actor:StudioActor):StudioTransform=>({
  x:0,y:0,scale:1,mirror:false,layer:actor==='Niño'?6:4,visible:true
});
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const round=(n:number)=>Math.round(n*100)/100;
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
  };
}
export function studioSceneKey(phase:'opening'|'after',index:number):string{
  if(!Number.isInteger(index)||index<0||index>200)throw Error('Escena no válida');
  return phase+':'+index;
}
export function parseStudioDocument(raw:string):StudioDocument{
  if(raw.length>1_000_000)throw Error('El documento supera el máximo de 1 MB.');
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=='object'||(value as {version?:number}).version!==1)
    throw Error('Formato de Decreto Real Studio no compatible.');
  const scenes=(value as {scenes?:unknown}).scenes;
  if(!scenes||typeof scenes!=='object'||Array.isArray(scenes))throw Error('No hay escenas válidas.');
  const parsed=emptyStudioDocument();
  for(const [sceneKey,actors] of Object.entries(scenes)){
    if(!/^(opening|after):(?:0|[1-9]\d{0,2})$/.test(sceneKey))continue;
    if(!actors||typeof actors!=='object'||Array.isArray(actors))continue;
    const result:Partial<Record<StudioActor,StudioTransform>>={};
    for(const actor of STUDIO_ACTORS){
      if(Object.prototype.hasOwnProperty.call(actors,actor))
        result[actor]=normalizeStudioTransform((actors as Record<string,unknown>)[actor],actor);
    }
    if(Object.keys(result).length)parsed.scenes[sceneKey]=result;
  }
  return parsed;
}
export function getStudioTransform(doc:StudioDocument,scene:string,actor:StudioActor):StudioTransform{
  return doc.scenes[scene]?.[actor]??defaultStudioTransform(actor);
}
export function withStudioTransform(doc:StudioDocument,scene:string,actor:StudioActor,transform:StudioTransform):StudioDocument{
  if(!/^(opening|after):(?:0|[1-9]\d{0,2})$/.test(scene))throw Error('Escena no válida');
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
