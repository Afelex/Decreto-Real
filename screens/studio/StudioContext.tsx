import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { isCampaignQaAvailable } from '../../campaign/campaignQA';
import { emptyStudioDocumentV3, normalizeStudioDocumentV3, type StudioDocumentV3, type StudioSceneV3 } from '../../campaign/studio/schema';
import { assetUsage, changedSceneKeys, inheritPublishedNarrative, mergeStudioDocuments, referencedAssetIds, withAsset, withoutUnusedAssets } from '../../campaign/studio/ops';
import {
  migrateLegacyStudioDocument, readStudioDocumentV3, saveStudioDocumentV3,
} from '../../campaign/studio/migrate';
import { STUDIO_STORAGE_KEY, parseStudioDocument } from '../../campaign/studioLayout';
import {
  STUDIO_ZIP_FILENAME, buildStudioPackage, parseStudioPackage, summarizeImport, type ParsedStudioPackage,
} from '../../campaign/studio/package';
import {
  canRedo, canUndo, createStudioHistory, isStudioDirty, studioHistoryReducer,
  type StudioHistoryState, type StudioUpdate,
} from '../../campaign/studio/history';
import {
  DEFAULT_EDITOR_PREFS, normalizeEditorPrefs, readEditorPrefs, saveEditorPrefs,
  type StudioEditorPrefs,
} from '../../campaign/studio/grid';
import {
  addStudioMedia, deleteStudioMedia, listStudioMedia, loadStudioMediaUrls, putStudioMediaBytes,
  readStudioMediaBytes, renameStudioMedia, revokeStudioMediaUrls, type StudioMediaInfo,
} from '../../campaign/studioMedia';

import type { StudioMediaMime } from '../../campaign/studio/mediaSignature';
import { loadPublishedStudio, publishedMediaUrls } from '../../campaign/studio/published';

export const STUDIO_PACKAGE_VERSION = 3;
export type StudioAudience = 'player'|'developer';
/** Autoguardado continuo del editor (recuperación tras cerrar sin guardar). */
export const STUDIO_AUTOSAVE_KEY = 'decreto-real.studio.autoguardado.v3';
export const STUDIO_PROJECT_FILENAME = STUDIO_ZIP_FILENAME;

export type StudioStoredMedia = {id:string;name:string;mime:string;reused:boolean};
export type StudioImportSummary = ReturnType<typeof summarizeImport>&{fileName:string;format:'zip'|'json'};
export type StudioLibraryItem = StudioMediaInfo&{
  /** Escenas del documento actual que usan el archivo. */
  usedIn:string[];
  /** Lo usa el borrador, el historial de deshacer o un respaldo local: no se puede borrar. */
  protected:boolean;
};
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
  exportProject:(publishing?:boolean)=>Promise<void>;
  startPublished:()=>void;
  /** Lee un respaldo y prepara la importación (no cambia nada hasta confirmar). */
  importProject:(file:File)=>Promise<void>;
  pendingImport:StudioImportSummary|null;
  confirmImport:(mode:'merge'|'replace')=>Promise<void>;
  cancelImport:()=>void;
  /** Biblioteca multimedia local. */
  listLibrary:()=>Promise<StudioLibraryItem[]>;
  renameMedia:(id:string,name:string)=>Promise<void>;
  deleteMedia:(id:string)=>Promise<void>;
  /** Borra los archivos que nada usa; devuelve cuántos y cuánto espacio libera. */
  cleanLibrary:()=>Promise<{count:number;bytes:number}>;
  libraryVersion:number;
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
  startPublished:noop,exportProject:()=>Promise.resolve(),importProject:()=>Promise.resolve(),
  pendingImport:null,confirmImport:()=>Promise.resolve(),cancelImport:noop,
  listLibrary:()=>Promise.resolve([]),renameMedia:()=>Promise.resolve(),deleteMedia:()=>Promise.resolve(),
  cleanLibrary:()=>Promise.resolve({count:0,bytes:0}),libraryVersion:0,
};
const StudioContext=React.createContext<StudioContextValue>(INACTIVE);
export const useStudio=():StudioContextValue=>React.useContext(StudioContext);

function draftStorage():Storage|null {
  try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
}
function download(name:string,body:BlobPart,type='application/json'){
  const url=URL.createObjectURL(new Blob([body],{type}));
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
const EMPTY_PUBLISHED=emptyStudioDocumentV3();
export function StudioProvider({children,blocking=true}:{children:React.ReactNode;
  /** false: pinta la pantalla base mientras llega lo publicado (pantallas secundarias). */
  blocking?:boolean}){
  const [published,setPublished]=React.useState<StudioDocumentV3|null>(null);
  React.useEffect(()=>{
    let cancelled=false;
    loadPublishedStudio(import.meta.env.BASE_URL).then(doc=>{if(!cancelled)setPublished(doc);});
    return ()=>{cancelled=true;};
  },[]);
  // No bloqueante: el mismo proveedor desde el principio (sin remontar la
  // pantalla); lo publicado se aplica en cuanto llega.
  if(!published&&blocking)return null;
  return <LoadedStudioProvider published={published??EMPTY_PUBLISHED}>{children}</LoadedStudioProvider>;
}

function LoadedStudioProvider({children,published}:{children:React.ReactNode;published:StudioDocumentV3}){
  const [query]=useSearchParams();
  const active=isCampaignQaAvailable();
  const editing=active&&query.get('studio')==='1';
  const [initial]=React.useState(()=>active?readStudioDocumentV3(draftStorage()):null);
  const [history,dispatch]=React.useReducer(studioHistoryReducer,undefined,
    ()=>createStudioHistory(initial&&initial.source!=='empty'
      ?inheritPublishedNarrative(initial.doc,published):published));
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
      if(JSON.stringify(doc)===JSON.stringify(initial&&initial.source!=='empty'?initial.doc:published))return null;
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

  const [pendingImport,setPendingImport]=React.useState<{summary:StudioImportSummary;parsed:ParsedStudioPackage}|null>(null);
  const [libraryVersion,setLibraryVersion]=React.useState(0);
  /**
   * Archivos que no se pueden borrar: los usa el documento actual, cualquier
   * paso del historial de deshacer/rehacer, el borrador guardado, el
   * autoguardado o el borrador v2 que se conserva como respaldo.
   */
  const protectedAssetIds=React.useCallback(()=>{
    const ids=new Set<string>();
    const add=(doc:StudioDocumentV3|null|undefined)=>{if(doc)for(const id of referencedAssetIds(doc))ids.add(id);};
    const h=historyRef.current;
    [h.doc,h.saved,h.pending,...h.past,...h.future].forEach(add);
    const storage=draftStorage();
    try{add(readStudioDocumentV3(storage).doc);}catch{/* sin borrador */}
    try{const raw=storage?.getItem(STUDIO_AUTOSAVE_KEY);if(raw)add(normalizeStudioDocumentV3((JSON.parse(raw) as {doc?:unknown}).doc));}catch{/* sin autoguardado */}
    try{const raw=storage?.getItem(STUDIO_STORAGE_KEY);if(raw)add(migrateLegacyStudioDocument(parseStudioDocument(raw)).doc);}catch{/* sin borrador v2 */}
    return ids;
  },[]);
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

  const publicUrls=React.useMemo(()=>publishedMediaUrls(published,import.meta.env.BASE_URL),[published]);
  const value=React.useMemo<StudioContextValue>(()=>!active?{
    ...INACTIVE,doc:published,mediaUrls:publicUrls,
    scene:key=>key?published.scenes[key]:undefined,
    viewScene:key=>key?published.scenes[key]:undefined,
  }:({
    active,editing,doc:history.doc,mediaUrls:{...publicUrls,...mediaUrls},
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
      setLibraryVersion(v=>v+1);
      return {id:record.id,name:record.name,mime:record.mime,reused:record.reused};
    },
    startPublished:()=>{
      dispatch({type:'replace',doc:published});
      setStatus('Composición publicada recuperada. Pulsa Guardar para conservarla.');
    },
    exportProject:async(publishing=false)=>{
      try{
        setStatus('Preparando respaldo con imágenes y videos…');
        // Solo se exportan los recursos que alguna escena usa; sin base64.
        const document=withoutUnusedAssets(historyRef.current.doc);
        const files:Awaited<ReturnType<typeof readStudioMediaBytes>>=[];
        for(const id of referencedAssetIds(document)){
          try{files.push(...await readStudioMediaBytes([id]));}
          catch(error){if(!publicUrls[id])throw error;}
        }
        for(const id of referencedAssetIds(document)){
          if(files.some(file=>file.id===id))continue;
          const url=publicUrls[id];
          if(!url)throw new Error('Falta un recurso multimedia.');
          const response=await fetch(url,{cache:'no-store'});
          if(!response.ok)throw new Error('No se pudo cargar un recurso publicado.');
          const meta=document.assets![id];
          files.push({id,...meta,mime:meta.mime as StudioMediaMime,data:new Uint8Array(await response.arrayBuffer())});
        }
        const zip=buildStudioPackage(document,files);
        download(publishing?'decreto-real-studio-publicacion.zip':STUDIO_ZIP_FILENAME,zip as BlobPart,'application/zip');
        setStatus('Proyecto exportado (.zip) con '+files.length+' archivos multimedia.');
      }catch(err){setStatus(err instanceof Error?err.message:'Error al exportar.');}
    },
    importProject:async file=>{
      try{
        if(file.size>210_000_000)throw new Error('Archivo demasiado grande (máximo 200 MB).');
        const parsed=parseStudioPackage(new Uint8Array(await file.arrayBuffer()));
        const summary={...summarizeImport(historyRef.current.doc,parsed),fileName:file.name.slice(0,80),format:parsed.format};
        setPendingImport({summary,parsed});
        setStatus('Revisa el respaldo y elige cómo importarlo.');
      }catch(err){setPendingImport(null);setStatus(err instanceof Error?err.message:'No se pudo importar.');}
    },
    pendingImport:pendingImport?.summary??null,
    confirmImport:async mode=>{
      if(!pendingImport)return;
      try{
        const {parsed}=pendingImport;
        await putStudioMediaBytes(parsed.media);
        const doc=mode==='merge'?mergeStudioDocuments(historyRef.current.doc,parsed.doc):parsed.doc;
        dispatch({type:'replace',doc});
        setPendingImport(null);
        setLibraryVersion(v=>v+1);
        select(null);
        setStatus(importMessage(parsed.report?.dropped.length??0,mode));
      }catch(err){setStatus(err instanceof Error?err.message:'No se pudo importar.');}
    },
    cancelImport:()=>{setPendingImport(null);setStatus('Importación cancelada. No se cambió nada.');},
    listLibrary:async()=>{
      const usage=assetUsage(historyRef.current.doc);
      const guarded=protectedAssetIds();
      return (await listStudioMedia()).map(item=>({...item,usedIn:usage[item.id]??[],protected:guarded.has(item.id)}));
    },
    renameMedia:async(id,name)=>{
      await renameStudioMedia(id,name);
      const clean=name.trim().slice(0,100);
      const meta=historyRef.current.doc.assets?.[id];
      if(meta&&meta.name!==clean)dispatch({type:'apply',update:doc=>withAsset(doc,id,{...meta,name:clean})});
      setLibraryVersion(v=>v+1);
      setStatus('Archivo renombrado.');
    },
    deleteMedia:async id=>{
      if(protectedAssetIds().has(id))throw new Error('Este archivo está en uso (o en el historial). Quítalo primero de las escenas y guarda.');
      await deleteStudioMedia([id]);
      setLibraryVersion(v=>v+1);
      setStatus('Archivo eliminado de la biblioteca.');
    },
    cleanLibrary:async()=>{
      const guarded=protectedAssetIds();
      const orphans=(await listStudioMedia()).filter(item=>!guarded.has(item.id));
      await deleteStudioMedia(orphans.map(item=>item.id));
      setLibraryVersion(v=>v+1);
      const bytes=orphans.reduce((n,item)=>n+item.size,0);
      setStatus(orphans.length?'Biblioteca limpia: '+orphans.length+' archivos sin uso eliminados.':'No hay archivos sin uso.');
      return {count:orphans.length,bytes};
    },
    libraryVersion,
  }),[published,publicUrls,active,editing,history,mediaUrls,status,selected,group,multiMode,prefs,guides,audience,compare,recovery,
    pendingImport,libraryVersion,protectedAssetIds,
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

const importMessage=(dropped:number,mode:'merge'|'replace')=>
  (mode==='merge'?'Proyecto fusionado con tu borrador.':'Proyecto importado (reemplazó tu borrador).')+' Revisa las escenas y pulsa Guardar.'+
  (dropped?' '+dropped+' intervenciones ya no existen y se omitieron.':'');
