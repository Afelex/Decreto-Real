/**
 * Historial de edición de Studio v3: deshacer/rehacer por TRANSACCIONES.
 *
 * - `apply`: un cambio atómico (una entrada de deshacer).
 * - `begin` → `preview`* → `commit`: un gesto continuo (arrastre, escribir en
 *   un campo) produce UNA sola entrada, y solo si el documento cambió.
 * - El estado «sin guardar» se calcula por identidad con el último documento
 *   guardado: deshacer hasta él vuelve a «Guardado» sin serializar nada.
 *
 * Reducer puro: nunca lanza; los errores de una operación quedan en `error`.
 */
import type { StudioDocumentV3 } from './schema.ts';

export const STUDIO_HISTORY_LIMIT = 50;

export type StudioHistoryState = {
  doc:StudioDocumentV3;
  past:StudioDocumentV3[];
  future:StudioDocumentV3[];
  /** Documento al inicio de la transacción en curso, o null. */
  pending:StudioDocumentV3|null;
  /** Último documento guardado (comparación por identidad). */
  saved:StudioDocumentV3;
  error:string|null;
};
export type StudioUpdate = (doc:StudioDocumentV3)=>StudioDocumentV3;
export type StudioHistoryAction =
  | {type:'apply';update:StudioUpdate}
  | {type:'begin'}
  | {type:'preview';update:StudioUpdate}
  | {type:'commit'}
  | {type:'cancel'}
  | {type:'undo'}
  | {type:'redo'}
  /** Sustituye el documento (importar) como un cambio deshacible. */
  | {type:'replace';doc:StudioDocumentV3}
  /** Marca el documento actual como guardado. */
  | {type:'saved'};

export const createStudioHistory = (doc:StudioDocumentV3):StudioHistoryState =>
  ({doc,past:[],future:[],pending:null,saved:doc,error:null});

export const isStudioDirty = (s:StudioHistoryState):boolean => s.doc!==s.saved;
export const canUndo = (s:StudioHistoryState):boolean => s.past.length>0||(s.pending!==null&&s.pending!==s.doc);
export const canRedo = (s:StudioHistoryState):boolean => s.future.length>0&&s.pending===null;

const push=(past:StudioDocumentV3[],doc:StudioDocumentV3)=>[...past,doc].slice(-STUDIO_HISTORY_LIMIT);
const run=(s:StudioHistoryState,update:StudioUpdate):{doc:StudioDocumentV3;error:string|null}=>{
  try{return {doc:update(s.doc),error:null};}
  catch(err){return {doc:s.doc,error:err instanceof Error?err.message:'No se pudo aplicar el cambio.'};}
};
/** Cierra una transacción abierta antes de otra acción. */
const settle=(s:StudioHistoryState):StudioHistoryState=>{
  if(s.pending===null)return s;
  if(s.pending===s.doc)return {...s,pending:null};
  return {...s,past:push(s.past,s.pending),future:[],pending:null};
};

export function studioHistoryReducer(state:StudioHistoryState,action:StudioHistoryAction):StudioHistoryState {
  switch(action.type){
    case 'apply':{
      const s=settle(state);
      const {doc,error}=run(s,action.update);
      if(error)return {...s,error};
      if(doc===s.doc)return s.error?{...s,error:null}:s;
      return {...s,doc,past:push(s.past,s.doc),future:[],error:null};
    }
    case 'begin':{
      const s=settle(state);
      return {...s,pending:s.doc,error:null};
    }
    case 'preview':{
      const s=state.pending===null?{...state,pending:state.doc}:state;
      const {doc,error}=run(s,action.update);
      return error?{...s,error}:{...s,doc,error:null};
    }
    case 'commit':
      return settle(state);
    case 'cancel':
      return state.pending===null?state:{...state,doc:state.pending,pending:null};
    case 'undo':{
      const s=settle(state);
      const previous=s.past[s.past.length-1];
      if(!previous)return s;
      return {...s,doc:previous,past:s.past.slice(0,-1),future:[s.doc,...s.future],error:null};
    }
    case 'redo':{
      const s=settle(state);
      const [next,...rest]=s.future;
      if(!next)return s;
      return {...s,doc:next,past:push(s.past,s.doc),future:rest,error:null};
    }
    case 'replace':{
      const s=settle(state);
      if(action.doc===s.doc)return s;
      return {...s,doc:action.doc,past:push(s.past,s.doc),future:[],error:null};
    }
    case 'saved':
      return {...state,saved:state.doc};
  }
}
