import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { isCampaignQaAvailable } from '../../campaign/campaignQA';
import { emptyStudioDocumentV3, normalizeStudioDocumentV3, type StudioDocumentV3, type StudioSceneV3 } from '../../campaign/studio/schema';
import { changedSceneKeys, withAsset, withoutUnusedAssets } from '../../campaign/studio/ops';
import {
  parseAnyStudioDocument, readStudioDocumentV3, saveStudioDocumentV3,
} from '../../campaign/studio/migrate';
import {
  canRedo, canUndo, createStudioHistory, isStudioDirty, studioHistoryReducer,
  type StudioHistoryState, type StudioUpdate,
} from '../../campaign/studio/history';
import {
  DEFAULT_EDITOR_PREFS, normalizeEditorPrefs, readEditorPrefs, saveEditorPrefs,
  type StudioEditorPrefs,
} from '../../campaign/studio/grid';
import {
  addStudioMedia, exportStudioMedia, importStudioMedia, loadStudioMediaUrls, revokeStudioMediaUrls,
  type StudioPortableMedia,
} from '../../campaign/studioMedia';

export const STUDIO_PACKAGE_VERSION = 3;
export type StudioAudience = 'player'|'developer';
/** Autoguardado continuo del editor (recuperación tras cerrar sin guardar). */
export const STUDIO_AUTOSAVE_KEY = 'decreto-real.studio.autoguardado.v3';
export const STUDIO_PROJECT_FILENAME = 'decreto-real-studio-proyecto.json';

export type StudioStoredMedia = {id:string;name:string;mime:string};
export type StudioContextValue = {
  /** Los borradores locales se aplican (QA disponible). */
  active:boolean;
  /** El editor está abierto (`?studio=1`). */
  editing:boolean;
  doc:StudioDocumentV3;
  mediaUrls:Readonly<Record<string,string>>;
  dirty:boolean;canUndo:boolean;canRedo:boolean;
  status:string;setStatus:(text:string)=>void;
  selected:string|null;select:React.Dispatch<React.SetStateAction<string|null>>;
  /** Selección múltiple (para alinear). Incluye al elemento principal cuando no está vacía. */
  group:readonly string[];
  /** Añade o quita un elemento de la selección múltiple. */
  toggleGroup:(id:string)=>void;
  clearGroup:()=>void;
  /** Modo táctil «Seleccionar varios»: tocar añade o quita en vez de arrastrar. */
  multiMode:boolean;setMultiMode:(on:boolean)=>void;
  /** Preferencias del lienzo (grilla, ajuste, guías): nunca van al documento. */
  prefs:StudioEditorPrefs;setPrefs:(patch:Partial<StudioEditorPrefs>)=>void;
  /** Guía inteligente activa durante un arrastre (en % del escenario). */
  guides:{x:number|null;y:number|null};setGuides:(g:{x:number|null;y:number|null})=>void;
  /**
   * Quién mira: el jugador (versión publicada: se ocultan los elementos «solo
   * desarrollador») o el desarrollador (QA). Fuera de QA siempre es 'player'.
   */
  audience:StudioAudience;setAudience:(audience:StudioAudience)=>void;
  /** Comparar: muestra la composición original sin las ediciones. */
  compare:boolean;setCompare:(on:boolean)=>void;
  /** Escena tal como se pinta ahora (sin ediciones mientras se compara). */
  viewScene:(key:string|null)=>StudioSceneV3|undefined;
  /** El elemento o la intervención se ve con la audiencia actual. */
  visibleTo:(devOnly:boolean|undefined)=>boolean;
  /** Borrador autoguardado de una sesión anterior pendiente de recuperar. */
  recovery:{savedAt:string}|null;
  recover:()=>void;discardRecovery:()=>void;
  scene:(key:string|null)=>StudioSceneV3|undefined;
  /** Un cambio atómico (una entrada de deshacer). */
  apply:(update:StudioUpdate,status?:string)=>void;
  /** Gesto continuo: begin → preview* → commit = una sola entrada de deshacer. */
  begin:()=>void;preview:(update:StudioUpdate)=>void;commit:()=>void;
  undo:()=>void;redo:()=>void;
  save:()=>boolean;
  /** Guarda en IndexedDB; el llamador añade el recurso al documento con `withAsset`. */
  storeMedia:(file:File)=>Promise<StudioStoredMedia>;
  exportProject:()=>Promise<void>;
  importProject:(file:File)=>Promise<void>;
};

const noop=()=>{/* Studio inactivo */};
const INACTIVE:StudioContextValue={
  active:false,editing:false,doc:emptyStudioDocumentV3(),mediaUrls:{},
  dirty:false,canUndo:false,canRedo:false,status:'',setStatus:noop,
  selected:null,select:noop,scene:()=>undefined,
  group:[],toggleGroup:noop,clearGroup:noop,multiMode:false,setMultiMode:noop,
  prefs:{...DEFAULT_EDITOR_PREFS},setPrefs:noop,guides:{x:null,y:null},setGuides:noop,
  audience:'player',setAudience:noop,compare:false,setCompare:noop,viewScene:()=>undefined,
  visibleTo:devOnly=>!devOnly,recovery:null,recover:noop,discardRecovery:noop,
  apply:noop,begin:noop,preview:noop,commit:noop,undo:noop,redo:noop,save:()=>false,
  storeMedia:()=>Promise.reject(new Error('Studio no está disponible.')),
  exportProject:()=>Promise.resolve(),importProject:()=>Promise.resolve(),
};
const StudioContext=React.createContext<StudioContextValue>(INACTIVE);
export const useStudio=():StudioContextValue=>React.useContext(StudioContext);

function draftStorage():Storage|null {
  try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
}
function download(name:string,body:string){
  const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;link.download=name;
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const describeScene=(key:string)=>key.replace(/^prologo\//,'');

/**
 * Estado compartido de Decreto Real Studio v3 para la pantalla del prólogo.
 * En el juego público (sin QA) no lee almacenamiento ni IndexedDB.
 */
export function StudioProvider({children}:{children:React.ReactNode}){
  const [query]=useSearchParams();
  const active=isCampaignQaAvailable();
  const editing=active&&query.get('studio')==='1';
  const [initial]=React.useState(()=>active?readStudioDocumentV3(draftStorage()):null);
  const [history,dispatch]=React.useReducer(studioHistoryReducer,undefined,
    ()=>createStudioHistory(initial?.doc??emptyStudioDocumentV3()));
  const historyRef=React.useRef<StudioHistoryState>(history);
  historyRef.current=history;
  const [status,setStatus]=React.useState(()=>{
    if(initial?.source!=='legacy')return '';
    const dropped=initial.report?.dropped.length??0;
    return 'Borrador de Studio v2 convertido a v3.'+(dropped?' '+dropped+' intervenciones ya no existen y se omitieron.':'');
  });
  const [selected,select]=React.useState<string|null>(null);
  const [group,setGroup]=React.useState<string[]>([]);
  const [multiMode,setMultiMode]=React.useState(false);
  const [guides,setGuides]=React.useState<{x:number|null;y:number|null}>({x:null,y:null});
  const [audience,setAudience]=React.useState<StudioAudience>('developer');
  const [compare,setCompare]=React.useState(false);
  // Recuperación: borrador autoguardado que difiere del guardado explícito.
  const [recovery,setRecovery]=React.useState<{savedAt:string;doc:StudioDocumentV3}|null>(()=>{
    if(!editing)return null;
    try{
      const raw=draftStorage()?.getItem(STUDIO_AUTOSAVE_KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw) as {savedAt?:unknown;doc?:unknown};
      const doc=normalizeStudioDocumentV3(parsed.doc);
      if(JSON.stringify(doc)===JSON.stringify(initial?.doc??emptyStudioDocumentV3()))return null;
      return {savedAt:typeof parsed.savedAt==='string'?parsed.savedAt:'',doc};
    }catch{return null;}
  });
  const [prefs,setPrefsState]=React.useState<StudioEditorPrefs>(()=>editing?readEditorPrefs(draftStorage()):{...DEFAULT_EDITOR_PREFS});
  const setPrefs=React.useCallback((patch:Partial<StudioEditorPrefs>)=>{
    setPrefsState(previous=>{
      const next=normalizeEditorPrefs({...previous,...patch});
      saveEditorPrefs(draftStorage(),next);
      return next;
    });
  },[]);
  const selectionRef=React.useRef({selected,group});
  selectionRef.current={selected,group};
  const toggleGroup=React.useCallback((id:string)=>{
    const {selected:current,group:previous}=selectionRef.current;
    const base=previous.length?previous:current?[current]:[];
    const next=base.includes(id)?base.filter(item=>item!==id):[...base,id];
    setGroup(next);
    select(next.at(-1)??null);
  },[]);
  const clearGroup=React.useCallback(()=>setGroup([]),[]);

  React.useEffect(()=>{if(history.error)setStatus(history.error);},[history.error]);

  // Biblioteca multimedia: carga incremental; solo se revocan las URL retiradas.
  const [mediaUrls,setMediaUrls]=React.useState<Record<string,string>>({});
  const urlsRef=React.useRef<Record<string,string>>({});
  const assetKey=Object.keys(history.doc.assets??{}).sort().join('|');
  React.useEffect(()=>{
    if(!active)return;
    const wanted=new Set(assetKey?assetKey.split('|'):[]);
    const current=urlsRef.current;
    const kept:Record<string,string>={};
    const removed:Record<string,string>={};
    for(const id of Object.keys(current))(wanted.has(id)?kept:removed)[id]=current[id];
    const missing=[...wanted].filter(id=>!current[id]);
    if(Object.keys(removed).length){
      revokeStudioMediaUrls(removed);
      urlsRef.current=kept;
      setMediaUrls(kept);
    }
    if(!missing.length)return;
    let cancelled=false;
    loadStudioMediaUrls(missing).then(next=>{
      if(cancelled){revokeStudioMediaUrls(next);return;}
      urlsRef.current={...urlsRef.current,...next};
      setMediaUrls(urlsRef.current);
    }).catch(()=>setStatus('No se pudieron cargar algunos archivos locales.'));
    return ()=>{cancelled=true;};
  },[active,assetKey]);
  React.useEffect(()=>()=>revokeStudioMediaUrls(urlsRef.current),[]);

  const save=React.useCallback(()=>{
    const ok=saveStudioDocumentV3(draftStorage(),historyRef.current.doc);
    if(ok){
      dispatch({type:'saved'});setStatus('Borrador guardado en este dispositivo');
      try{draftStorage()?.removeItem(STUDIO_AUTOSAVE_KEY);}catch{/* sin almacenamiento */}
      setRecovery(null);
    }
    else setStatus('No se pudo guardar. Exporta el proyecto como respaldo.');
    return ok;
  },[]);
  const undoOrRedo=React.useCallback((type:'undo'|'redo')=>{
    const before=historyRef.current;
    const after=studioHistoryReducer(before,{type});
    dispatch({type});
    if(after.doc===before.doc)return;
    const scenes=changedSceneKeys(before.doc,after.doc);
    setStatus((type==='undo'?'Deshecho':'Rehecho')+
      (scenes.length?' · '+scenes.map(describeScene).join(', '):''));
  },[]);

  const value=React.useMemo<StudioContextValue>(()=>!active?INACTIVE:({
    active,editing,doc:history.doc,mediaUrls,
    dirty:isStudioDirty(history),canUndo:canUndo(history),canRedo:canRedo(history),
    status,setStatus,selected,select,
    group,toggleGroup,clearGroup,multiMode,setMultiMode,prefs,setPrefs,guides,setGuides,
    audience:editing?'developer':audience,setAudience,
    compare:editing&&compare,setCompare,
    viewScene:key=>key&&!(editing&&compare)?history.doc.scenes[key]:undefined,
    visibleTo:devOnly=>!devOnly||(editing?true:audience==='developer'),
    recovery:recovery?{savedAt:recovery.savedAt}:null,
    recover:()=>{
      if(!recovery)return;
      dispatch({type:'replace',doc:recovery.doc});
      setRecovery(null);
      setStatus('Cambios recuperados. Pulsa Guardar para conservarlos.');
    },
    discardRecovery:()=>{
      try{draftStorage()?.removeItem(STUDIO_AUTOSAVE_KEY);}catch{/* sin almacenamiento */}
      setRecovery(null);
      setStatus('Cambios no guardados descartados.');
    },
    scene:key=>key?history.doc.scenes[key]:undefined,
    apply:(update,text)=>{dispatch({type:'apply',update});if(text)setStatus(text);},
    begin:()=>dispatch({type:'begin'}),
    preview:update=>dispatch({type:'preview',update}),
    commit:()=>dispatch({type:'commit'}),
    undo:()=>undoOrRedo('undo'),
    redo:()=>undoOrRedo('redo'),
    save,
    storeMedia:async file=>{
      const record=await addStudioMedia(file);
      return {id:record.id,name:record.name,mime:record.mime};
    },
    exportProject:async()=>{
      try{
        setStatus('Preparando respaldo con imágenes y videos…');
        // Solo se exportan los recursos que alguna escena usa.
        const document=withoutUnusedAssets(historyRef.current.doc);
        const media=await exportStudioMedia(Object.keys(document.assets??{}));
        download(STUDIO_PROJECT_FILENAME,JSON.stringify({studioPackage:STUDIO_PACKAGE_VERSION,document,media}));
        setStatus('Proyecto completo exportado con sus archivos multimedia.');
      }catch(err){setStatus(err instanceof Error?err.message:'Error al exportar.');}
    },
    importProject:async file=>{
      try{
        if(file.size>100_000_000)throw new Error('Archivo demasiado grande (máximo 100 MB).');
        const payload:unknown=JSON.parse(await file.text());
        const pack=payload&&typeof payload==='object'?payload as {studioPackage?:unknown;document?:unknown;media?:unknown}:{};
        if(pack.studioPackage===2||pack.studioPackage===3){
          if(!Array.isArray(pack.media))throw new Error('Faltan los recursos multimedia.');
          const loaded=parseAnyStudioDocument(JSON.stringify(pack.document));
          await importStudioMedia(pack.media as StudioPortableMedia[]);
          dispatch({type:'replace',doc:loaded.doc});
          setStatus(importMessage(loaded.report?.dropped.length??0));
        }else{
          const loaded=parseAnyStudioDocument(JSON.stringify(payload));
          dispatch({type:'replace',doc:loaded.doc});
          setStatus(importMessage(loaded.report?.dropped.length??0));
        }
        select(null);
      }catch(err){setStatus(err instanceof Error?err.message:'No se pudo importar.');}
    },
  }),[active,editing,history,mediaUrls,status,selected,group,multiMode,prefs,guides,audience,compare,recovery,
    toggleGroup,clearGroup,setPrefs,save,undoOrRedo]);

  // Autoguardado continuo mientras hay cambios sin guardar (no sustituye a Guardar).
  React.useEffect(()=>{
    if(!editing||!isStudioDirty(history)||recovery)return;
    const timer=window.setTimeout(()=>{
      try{draftStorage()?.setItem(STUDIO_AUTOSAVE_KEY,JSON.stringify({savedAt:new Date().toISOString(),doc:history.doc}));}
      catch{/* sin espacio: el aviso de salida sigue protegiendo */}
    },800);
    return ()=>window.clearTimeout(timer);
  },[editing,history,recovery]);
  // Aviso del navegador al cerrar o recargar con cambios sin guardar.
  const dirtyNow=editing&&isStudioDirty(history);
  React.useEffect(()=>{
    if(!dirtyNow)return;
    const onBeforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',onBeforeUnload);
    return ()=>window.removeEventListener('beforeunload',onBeforeUnload);
  },[dirtyNow]);

  // Atajos de teclado del editor (fuera de los campos de texto).
  React.useEffect(()=>{
    if(!editing)return;
    const onKey=(event:KeyboardEvent)=>{
      if(!(event.ctrlKey||event.metaKey))return;
      const target=event.target as HTMLElement|null;
      if(target&&(target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable))return;
      const key=event.key.toLowerCase();
      if(key==='z'&&!event.shiftKey){event.preventDefault();undoOrRedo('undo');}
      else if((key==='z'&&event.shiftKey)||key==='y'){event.preventDefault();undoOrRedo('redo');}
      else if(key==='s'){event.preventDefault();save();}
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[editing,undoOrRedo,save]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

const importMessage=(dropped:number)=>'Proyecto importado. Revisa las escenas y pulsa Guardar.'+
  (dropped?' '+dropped+' intervenciones ya no existen y se omitieron.':'');

/** Añade un archivo a la biblioteca y devuelve la actualización que lo registra en el documento. */
export async function storeStudioFile(studio:StudioContextValue,file:File):Promise<{media:StudioStoredMedia;register:StudioUpdate}>{
  const media=await studio.storeMedia(file);
  return {media,register:doc=>withAsset(doc,media.id,{name:media.name,mime:media.mime})};
}
