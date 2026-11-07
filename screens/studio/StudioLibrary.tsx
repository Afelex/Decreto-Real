import React from 'react';
import { loadStudioMediaUrls, revokeStudioMediaUrls } from '../../campaign/studioMedia';
import { useStudio, type StudioLibraryItem } from './StudioContext';

export type LibraryUse = 'sprite'|'effect'|'background'|'replace';
type Props={
  /** Se puede reemplazar la imagen del elemento seleccionado (personaje o capa). */
  canReplace:boolean;
  onUse:(item:StudioLibraryItem,use:LibraryUse)=>void;
  onClose:()=>void;
};

export const formatBytes=(bytes:number)=>bytes<1024?bytes+' B':
  bytes<1024*1024?(bytes/1024).toFixed(1).replace('.',',')+' KB':(bytes/1024/1024).toFixed(1).replace('.',',')+' MB';

/**
 * Biblioteca multimedia local: ver, renombrar, reutilizar y eliminar
 * archivos. Un archivo en uso (o en el historial de deshacer, el borrador
 * guardado o el autoguardado) no se puede eliminar.
 */
export default function StudioLibrary({canReplace,onUse,onClose}:Props){
  const studio=useStudio();
  const [items,setItems]=React.useState<StudioLibraryItem[]|null>(null);
  const [urls,setUrls]=React.useState<Record<string,string>>({});
  const [confirmClean,setConfirmClean]=React.useState(false);
  const [error,setError]=React.useState('');
  const {listLibrary,libraryVersion}=studio;
  const docKey=studio.doc;
  React.useEffect(()=>{
    let cancelled=false;
    let loaded:Record<string,string>={};
    listLibrary().then(async list=>{
      if(cancelled)return;
      setItems(list);
      loaded=await loadStudioMediaUrls(list.map(item=>item.id));
      if(cancelled){revokeStudioMediaUrls(loaded);return;}
      setUrls(loaded);
    }).catch(err=>setError(err instanceof Error?err.message:'No se pudo abrir la biblioteca.'));
    return ()=>{cancelled=true;revokeStudioMediaUrls(loaded);};
  },[listLibrary,libraryVersion,docKey]);

  const orphans=(items??[]).filter(item=>!item.protected);
  const orphanBytes=orphans.reduce((n,item)=>n+item.size,0);
  const total=(items??[]).reduce((n,item)=>n+item.size,0);
  const run=async(work:()=>Promise<unknown>)=>{
    setError('');
    try{await work();}catch(err){setError(err instanceof Error?err.message:'No se pudo completar la acción.');}
  };
  return <section className="dr-studio-library" aria-label="Biblioteca multimedia" data-testid="studio-library">
    <header>
      <strong>Biblioteca</strong>
      <span data-testid="studio-library-summary">{items?items.length+' archivos · '+formatBytes(total):'Cargando…'}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar biblioteca">×</button>
    </header>
    {error&&<p className="dr-studio-library-error" role="alert">{error}</p>}
    <div className="dr-studio-library-clean">
      {!confirmClean?<button type="button" data-testid="studio-library-clean" disabled={!orphans.length}
        onClick={()=>setConfirmClean(true)}>
        🧹 Limpiar sin uso{orphans.length?' ('+orphans.length+' · '+formatBytes(orphanBytes)+')':''}</button>
      :<div className="dr-studio-actions" role="group" aria-label="Confirmar limpieza">
        <button type="button" data-testid="studio-library-clean-confirm" className="dr-studio-danger"
          onClick={()=>run(async()=>{await studio.cleanLibrary();setConfirmClean(false);})}>
          Eliminar {orphans.length} archivos</button>
        <button type="button" onClick={()=>setConfirmClean(false)}>Cancelar</button>
      </div>}
      <small>Nunca se borra lo que usan tus escenas, el historial de deshacer, el borrador guardado ni el autoguardado.</small>
    </div>
    <ul>
      {(items??[]).map(item=>{
        const isVideo=item.mime.startsWith('video/');
        return <li key={item.id} data-testid="studio-library-item" data-id={item.id}
          data-protected={item.protected?'true':'false'}>
          <span className="dr-studio-library-thumb" aria-hidden="true">
            {urls[item.id]&&(isVideo?<video src={urls[item.id]} muted playsInline preload="metadata"/>:<img src={urls[item.id]} alt=""/>)}
          </span>
          <div className="dr-studio-library-info">
            <input type="text" defaultValue={item.name} maxLength={100} aria-label={'Nombre de '+item.name}
              data-testid="studio-library-name"
              onKeyDown={e=>{if(e.key==='Enter')(e.currentTarget as HTMLInputElement).blur();}}
              onBlur={e=>{const name=e.currentTarget.value.trim();if(name&&name!==item.name)void run(()=>studio.renameMedia(item.id,name));}}/>
            <small>{item.mime.replace('image/','').replace('video/','video ').toUpperCase()} · {formatBytes(item.size)} · {
              item.usedIn.length?'en uso en '+item.usedIn.length+(item.usedIn.length===1?' escena':' escenas'):
              item.protected?'en el historial o un respaldo':'sin uso'}</small>
            <div className="dr-studio-library-actions">
              {!isVideo&&<button type="button" data-testid="studio-library-use-sprite" onClick={()=>onUse(item,'sprite')}>＋ Sprite</button>}
              <button type="button" data-testid="studio-library-use-effect" onClick={()=>onUse(item,'effect')}>✦ Efecto</button>
              <button type="button" data-testid="studio-library-use-background" onClick={()=>onUse(item,'background')}>▧ Fondo</button>
              {!isVideo&&canReplace&&<button type="button" data-testid="studio-library-use-replace" onClick={()=>onUse(item,'replace')}>⇄ Reemplazar</button>}
              <button type="button" data-testid="studio-library-delete" disabled={item.protected}
                title={item.protected?'En uso: quítalo de las escenas y guarda para poder eliminarlo':'Eliminar de la biblioteca'}
                onClick={()=>run(()=>studio.deleteMedia(item.id))}>🗑</button>
            </div>
          </div>
        </li>;
      })}
      {items&&!items.length&&<li className="dr-studio-library-empty">Aún no has subido imágenes ni videos.</li>}
    </ul>
  </section>;
}
