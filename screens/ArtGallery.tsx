import React from 'react';
import { importApprovedG2Package } from '../campaign/studio/g2PackageImport.ts';
import { addStudioMedia, deleteStudioMedia, listStudioMedia, loadStudioMediaUrls, revokeStudioMediaUrls, type StudioMediaInfo } from '../campaign/studioMedia';
import './art-gallery.css';

type CatalogEntry={path:string;group:string;name:string;bytes:number;generation?:string;state?:string};
type Catalog={version:number;activeGeneration?:string;items:CatalogEntry[]};
type Art={id:string;name:string;group:string;bytes:number;url:string;kind:'repo'|'local';path:string;ext:string;generation:string;state:string};
type Review={decision?:'aprobada'|'corregir';note?:string};
type Dimension={w:number;h:number};
type Flags=Record<string,'hidden'|'delete'>;
const CURRENT_GENERATION='DR-G2-2026';
const LEGACY_GENERATION='DR-G1';
const LOCAL_GENERATIONS='decreto-real.artes.generaciones-locales.v1';
const FLAGS='decreto-real.artes.estados.v1';
const REVIEWS='decreto-real.artes.revision.v2';
const REPLACEMENTS='decreto-real.artes.reemplazos.v1';
const DIMENSIONS='decreto-real.artes.dimensiones.v1';
const IMPORTABLE=/\.(png|jpe?g|webp|gif|mp4|webm)$/i;
const IMAGES=/\.(png|jpe?g|webp|gif|svg|avif)$/i;
function read<T,>(key:string,fallback:T):T{
  try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}
}
function save(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* almacenamiento limitado */}}
function human(bytes:number){return bytes<1024?bytes+' B':bytes<1048576?(bytes/1024).toFixed(0)+' KB':(bytes/1048576).toFixed(1)+' MB';}
function source(path:string){return path.startsWith('public/')?import.meta.env.BASE_URL+path.slice(7):'https://raw.githubusercontent.com/Afelex/Decreto-Real/main/'+path;}
function aspect(d?:Dimension){if(!d)return 'Dimensiones pendientes de cargar';const ratio=d.w/d.h;return d.w+' × '+d.h+' px · '+(Math.abs(ratio-16/9)<.02?'16:9':Math.abs(ratio-3/2)<.02?'3:2':Math.abs(ratio-2/3)<.02?'2:3':Math.abs(ratio-1)<.02?'1:1':ratio.toFixed(2)+':1');}
function download(name:string,body:string,type:string){
  const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export default function ArtGallery(){
  const [catalog,setCatalog]=React.useState<CatalogEntry[]>([]);
  const [local,setLocal]=React.useState<StudioMediaInfo[]>([]);
  const [urls,setUrls]=React.useState<Record<string,string>>({});
  const urlsRef=React.useRef<Record<string,string>>({});
  const [flags,setFlags]=React.useState<Flags>(()=>read(FLAGS,{}));
  const [localGenerations,setLocalGenerations]=React.useState<Record<string,string>>(()=>read(LOCAL_GENERATIONS,{}));
  const [reviews,setReviews]=React.useState<Record<string,Review>>(()=>read(REVIEWS,{}));
  const [replacements,setReplacements]=React.useState<Record<string,string>>(()=>read(REPLACEMENTS,{}));
  const [dims,setDims]=React.useState<Record<string,Dimension>>(()=>read(DIMENSIONS,{}));
  const [group,setGroup]=React.useState('Todos');
  const [generation,setGeneration]=React.useState('Todas');
  const [query,setQuery]=React.useState('');
  const [showHidden,setShowHidden]=React.useState(false);
  const [selected,setSelected]=React.useState<string|null>(null);
  const [previewMode,setPreviewMode]=React.useState<'original'|'mobile'|'strip'>('original');
  const [message,setMessage]=React.useState('');
  const [busy,setBusy]=React.useState(false);
  const addInput=React.useRef<HTMLInputElement>(null);
  const g2Input=React.useRef<HTMLInputElement>(null);
  const replaceInput=React.useRef<HTMLInputElement>(null);
  const [replaceTarget,setReplaceTarget]=React.useState<string|null>(null);
  const markLocalGeneration=(id:string,gen:string)=>setLocalGenerations(prev=>{
    if(prev[id]===gen)return prev;
    const next={...prev,[id]:gen};save(LOCAL_GENERATIONS,next);return next;
  });
  const refresh=React.useCallback(async()=>{
    const items=await listStudioMedia();
    const newUrls=await loadStudioMediaUrls(items.map(i=>i.id));
    const old=urlsRef.current;urlsRef.current=newUrls;setUrls(newUrls);revokeStudioMediaUrls(old);setLocal(items);
  },[]);
  React.useEffect(()=>{
    let alive=true;
    fetch(import.meta.env.BASE_URL+'artes/catalogo.json',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('No se pudo abrir el catálogo publicado.');return r.json() as Promise<Catalog>;})
      .then(d=>{if(alive&&(d.version===1||d.version===2)&&Array.isArray(d.items))setCatalog(d.items);})
      .catch(e=>{if(alive)setMessage(String(e));});
    void refresh().catch(e=>{if(alive)setMessage('No se pudo leer la biblioteca local: '+String(e));});
    const focus=()=>{void refresh().catch(()=>{});};
    window.addEventListener('focus',focus);
    return ()=>{alive=false;window.removeEventListener('focus',focus);revokeStudioMediaUrls(urlsRef.current);urlsRef.current={};};
  },[refresh]);
  const all=React.useMemo<Art[]>(()=>[
    ...catalog.map(i=>({id:i.path,name:i.name,group:i.group,bytes:i.bytes,url:source(i.path),kind:'repo' as const,path:i.path,ext:i.path.split('.').at(-1)?.toLowerCase()??'',generation:i.generation??LEGACY_GENERATION,state:i.state??'anterior-en-uso'})),
    ...local.filter(i=>!i.mime.startsWith('audio/')).map(i=>({id:i.id,name:i.name,group:i.name.startsWith('DR-G2-2026_')?'G2 · Aprobados en DRStudio':'Subidos desde DRStudio o esta galería',bytes:i.size,url:urls[i.id]??'',kind:'local' as const,path:i.id,ext:i.mime.split('/').at(-1)??'',generation:localGenerations[i.id]??LEGACY_GENERATION,state:'borrador-local'}))
  ],[catalog,local,urls,localGenerations]);
  const groups=['Todos',...new Set(all.map(i=>i.group))];
  const shown=all.filter(i=>(group==='Todos'||i.group===group)&&
    (generation==='Todas'||i.generation===generation)&&
    (showHidden||!flags[i.id])&&
    (!query||[i.name,i.group,i.path].join(' ').toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))));
  const chosen=all.find(i=>i.id===selected)??null;
  const g2Review=Boolean(chosen&&chosen.generation===CURRENT_GENERATION&&IMAGES.test(chosen.path));
  const realUrl=(item:Art)=>replacements[item.id]?urls[replacements[item.id]]??item.url:item.url;
  const showExt=(item:Art)=>replacements[item.id]?'Reemplazo local':item.ext.toUpperCase();
  const changeFlag=(id:string,status:'hidden'|'delete'|null)=>{
    const next={...flags};if(status)next[id]=status;else delete next[id];
    setFlags(next);save(FLAGS,next);
  };
  const changeReview=(id:string,patch:Partial<Review>)=>{
    const next={...reviews,[id]:{...reviews[id],...patch}};setReviews(next);save(REVIEWS,next);
  };
  const measure=(id:string,w:number,h:number)=>{
    if(!w||!h)return;
    setDims(prev=>{if(prev[id]?.w===w&&prev[id]?.h===h)return prev;const next={...prev,[id]:{w,h}};save(DIMENSIONS,next);return next;});
  };
  const putFiles=async(files:File[],target:string|null)=>{
    if(!files.length)return;
    setBusy(true);setMessage('');
    try{
      let done=0,last='';
      for(const file of files){
        const original=target?all.find(i=>i.id===target):undefined;
        if(original){
          const wasVideo=/\.(webm|mp4)$/i.test(original.path);
          if(wasVideo!==file.type.startsWith('video/'))throw new Error('El reemplazo debe conservar el tipo general (imagen o video).');
        }
        const stored=await addStudioMedia(file);
        // Un contenido ya existente conserva su generación; no se reetiqueta por copiarlo.
        if(!stored.reused)markLocalGeneration(stored.id,CURRENT_GENERATION);
        if(target){
          const next={...replacements,[target]:stored.id};
          setReplacements(next);save(REPLACEMENTS,next);
          changeFlag(target,null);
        }
        done++;last=stored.reused?' (ya existía; reutilizada)':'';
      }
      await refresh();
      setMessage(done+' archivo(s) incorporados a la biblioteca local'+last+'. DRStudio puede utilizarlos desde el mismo navegador.');
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  };
  const installG2=async(file:File)=>{
    setBusy(true);setMessage('');
    try{
      const report=await importApprovedG2Package(file,window.localStorage);
      await refresh();
      setMessage('G2 importada: '+report.count+' fondos disponibles en DRStudio; '+report.scenes+' escenas vinculadas. '+report.preserved+' fondos personalizados conservados. Abre de nuevo una escena de Studio para ver el cambio.');
      setGroup('Todos');
    }catch(e){setMessage(e instanceof Error?e.message:'No se pudo importar el lote G2.');}
    finally{setBusy(false);}
  };
  const importForStudio=async(item:Art)=>{
    if(item.kind==='local'||replacements[item.id]){setMessage('Este recurso ya está disponible en la Biblioteca de DRStudio.');return;}
    if(!IMPORTABLE.test(item.path)){setMessage('DRStudio no admite '+item.ext.toUpperCase()+' directamente. Convierte el recurso a PNG, JPG, WebP o GIF y súbelo.');return;}
    setBusy(true);setMessage('');
    try{
      const response=await fetch(item.url);
      if(!response.ok)throw new Error('No se pudo obtener el archivo.');
      const blob=await response.blob();
      const filename=item.path.split('/').at(-1)??'imagen.webp';
      const result=await addStudioMedia(new File([blob],filename,{type:blob.type}));
      if(!result.reused||!localGenerations[result.id])markLocalGeneration(result.id,item.generation);
      await refresh();
      setMessage('“'+item.name+'” está disponible en DRStudio'+(result.reused?' (ya existía).':'.')+' Abre la Biblioteca 🖼 para usarlo.');
    }catch(e){setMessage(e instanceof Error?e.message:'No se pudo incorporar el recurso.');}
    finally{setBusy(false);}
  };
  const removeLocal=async(item:Art)=>{
    if(item.kind!=='local'){changeFlag(item.id,'delete');setMessage('El arte publicado se marcó para eliminación. Exporta las decisiones; el archivo no se borra de GitHub sin revisión.');return;}
    // Conservador: no borrar recursos referenciados en ningún borrador, autoguardado o respaldo local.
    try{
      const used=Object.keys(localStorage).some(key=>/decreto-real.*studio/i.test(key)&&(localStorage.getItem(key)??'').includes(item.id));
      if(used)throw new Error('Este recurso aparece en un borrador o respaldo de DRStudio. Retíralo de las escenas y elimínalo desde la biblioteca de DRStudio.');
      if(!window.confirm('¿Eliminar definitivamente “'+item.name+'” de este navegador? Esta operación no tiene deshacer.'))return;
      await deleteStudioMedia([item.id]);
      setLocalGenerations(prev=>{const next={...prev};delete next[item.id];save(LOCAL_GENERATIONS,next);return next;});
      const next={...replacements};for(const [k,v] of Object.entries(next))if(v===item.id)delete next[k];
      setReplacements(next);save(REPLACEMENTS,next);
      changeFlag(item.id,null);setSelected(null);await refresh();
      setMessage('Archivo local eliminado de este navegador.');
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  };
  const exportPlan=()=>{
    const rows=all.map(item=>({archivo:item.path,nombre:item.name,origen:item.kind,formato:item.ext,generacion:item.generation,estado_generacion:item.state,
      ancho_px:dims[item.id]?.w??'',alto_px:dims[item.id]?.h??'',peso_bytes:item.bytes,
      estado:flags[item.id]??'visible',revision:reviews[item.id]?.decision??'pendiente',
      comentario:reviews[item.id]?.note??'',reemplazo_local:replacements[item.id]??''}));
    download('decreto-real-biblioteca-revision.json',JSON.stringify({version:1,exportado:new Date().toISOString(),items:rows},null,2),'application/json');
  };
  return <main className="dr-art-root">
    <header className="dr-art-header">
      <div><small>DECRETO REAL / DIRECCIÓN ARTÍSTICA</small><h1>Biblioteca central de artes</h1>
        <p>Revisa originales, registra cambios y reutiliza imágenes en DRStudio.</p></div>
      <div className="dr-art-actions">
        <button type="button" onClick={()=>addInput.current?.click()} disabled={busy}>＋ Subir imágenes o videos</button>
        <button type="button" data-testid="g2-package-import" onClick={()=>g2Input.current?.click()} disabled={busy}>▧ Importar lote G2 (25 fondos)</button>
        <button type="button" onClick={exportPlan}>↓ Exportar decisiones</button>
        <a href={import.meta.env.BASE_URL+'?drDev=1#/studio'}>Abrir DRStudio ↗</a>
      </div>
    </header>
    <input ref={g2Input} type="file" accept=".zip,application/zip" hidden aria-label="Paquete G2 de fondos aprobados" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void installG2(file);}}/>
    <input ref={addInput} type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.webm" multiple hidden onChange={e=>{const f:File[]=e.currentTarget.files?Array.from(e.currentTarget.files):[];e.currentTarget.value='';void putFiles(f,null);}}/>
    <input ref={replaceInput} type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.webm" hidden onChange={e=>{const f:File[]=e.currentTarget.files?Array.from(e.currentTarget.files):[];e.currentTarget.value='';void putFiles(f,replaceTarget);}}/>
    <div className="dr-art-notice"><strong>{catalog.length} artes del repositorio</strong> · {all.filter(i=>i.generation===CURRENT_GENERATION).length} G2 nuevos/locales · {all.filter(i=>i.generation===LEGACY_GENERATION).length} G1 anteriores · {local.length} archivos subidos · {Object.values(flags).filter(x=>x==='hidden').length} ocultos · {Object.values(flags).filter(x=>x==='delete').length} por eliminar.
      <p>Generación actual: <strong>DR-G2-2026</strong>. Los G1 siguen en uso hasta sustituir todas sus referencias, y después se archivarán fuera de public para no descargarse. Los G2 locales son borradores hasta publicarse en GitHub. Ocultar aquí no modifica el juego publicado.</p></div>
    {message&&<p className="dr-art-feedback" role="status">{message} <button type="button" onClick={()=>setMessage('')}>×</button></p>}
    <div className="dr-art-toolbar">
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar personaje, nombre o carpeta…" aria-label="Buscar artes"/>
      <select value={group} onChange={e=>setGroup(e.target.value)} aria-label="Filtrar por sección">{groups.map(g=><option value={g} key={g}>{g}</option>)}</select>
      <select value={generation} onChange={e=>setGeneration(e.target.value)} aria-label="Filtrar por generación"><option value="Todas">Todas las generaciones</option><option value={CURRENT_GENERATION}>G2 · Nueva generación</option><option value={LEGACY_GENERATION}>G1 · Arte anterior</option></select>
      <label><input type="checkbox" checked={showHidden} onChange={e=>setShowHidden(e.target.checked)}/> Mostrar ocultos y descartados</label>
      <span>{shown.length} elementos</span>
    </div>
    <div className="dr-art-layout">
      <section aria-label="Artes" className="dr-art-grid">
        {shown.map(item=>{
          const video=/\.(mp4|webm)$/i.test(item.path)||item.kind==='local'&&/^(mp4|webm)$/.test(item.ext);
          const display=realUrl(item);const changed=Boolean(replacements[item.id]);
          return <button type="button" key={item.id} className={'dr-art-card'+(chosen?.id===item.id?' selected':'')+(flags[item.id]?' muted':'')} onClick={()=>setSelected(item.id)}>
            <div className="dr-art-thumb">{video?<video src={display} muted playsInline preload="metadata" onLoadedMetadata={e=>measure(changed?replacements[item.id]:item.id,e.currentTarget.videoWidth,e.currentTarget.videoHeight)}/>:
              <img src={display} loading="lazy" alt="" onLoad={e=>measure(changed?replacements[item.id]:item.id,e.currentTarget.naturalWidth,e.currentTarget.naturalHeight)}/>}
              {flags[item.id]&&<span className="dr-art-chip">{flags[item.id]==='hidden'?'OCULTO':'ELIMINACIÓN PENDIENTE'}</span>}
              {changed&&<span className="dr-art-chip right">REEMPLAZADO</span>}
              <span className="dr-art-chip generation">{item.generation===CURRENT_GENERATION?'G2 · '+(item.kind==='local'?'BORRADOR':'NUEVA'):'G1 · ANTERIOR'}</span></div>
            <div className="dr-art-card-info"><strong>{item.name}</strong><small>{aspect(dims[changed?replacements[item.id]:item.id])}</small><small>{showExt(item)} · {human(item.bytes)}</small></div>
          </button>;
        })}
        {!shown.length&&<p>No se encontraron recursos con estos filtros.</p>}
      </section>
      <aside className="dr-art-inspector" aria-label="Detalles del arte">
      {chosen?<React.Fragment>
        <h2>{chosen.name}</h2>
        {g2Review&&<div className="dr-art-preview-modes" role="group" aria-label="Comparar encuadre G2">
          <button type="button" aria-pressed={previewMode==='original'} onClick={()=>setPreviewMode('original')}>Original</button>
          <button type="button" data-testid="g2-preview-mobile-button" aria-pressed={previewMode==='mobile'} onClick={()=>setPreviewMode('mobile')}>Móvil 390 × 844</button>
          <button type="button" data-testid="g2-preview-strip-button" aria-pressed={previewMode==='strip'} onClick={()=>setPreviewMode('strip')}>Franja de misión</button>
        </div>}
        <div className={'dr-art-preview'+(g2Review&&previewMode!=='original'?' dr-art-preview-'+previewMode:'')}
          data-testid="g2-review-preview" data-preview-mode={g2Review?previewMode:'original'}>{/\.(mp4|webm)$/i.test(chosen.path)||chosen.kind==='local'&&/^(mp4|webm)$/.test(chosen.ext)?
          <video key={realUrl(chosen)} src={realUrl(chosen)} controls playsInline onLoadedMetadata={e=>measure(replacements[chosen.id]??chosen.id,e.currentTarget.videoWidth,e.currentTarget.videoHeight)}/>:
          <img key={realUrl(chosen)} src={realUrl(chosen)} alt={chosen.name} onLoad={e=>measure(replacements[chosen.id]??chosen.id,e.currentTarget.naturalWidth,e.currentTarget.naturalHeight)}/>}
          {g2Review&&previewMode==='mobile'&&<div className="dr-art-preview-guide" aria-hidden="true">
            <span className="dr-art-preview-top-guide">Cabecera orientativa</span>
            <span className="dr-art-preview-bottom-guide">Diálogos y botones</span>
          </div>}
        </div>
        {g2Review&&previewMode!=='original'&&<small className="dr-art-preview-help">
          {previewMode==='mobile'
            ? 'Simulación del recorte a pantalla completa con object-fit: cover. Las bandas de interfaz son orientativas, no una captura exacta del juego.'
            : 'Simulación de la franja estrecha de presentación. El foco G2 está situado al 32 % de la altura para mostrar el paisaje y su arquitectura.'}
        </small>}
        <dl>
          <dt>Dimensiones del arte actual</dt><dd>{aspect(dims[replacements[chosen.id]??chosen.id])}</dd>
          {replacements[chosen.id]&&<><dt>Dimensiones del original</dt><dd>{aspect(dims[chosen.id])}</dd></>}
          <dt>Archivo original</dt><dd className="dr-art-path">{chosen.path}</dd>
          <dt>Categoría</dt><dd>{chosen.group}</dd>
          <dt>Generación</dt><dd>{chosen.generation} · {chosen.state==='borrador-local'?'Borrador local en este navegador':chosen.state==='nueva-generacion'?'Nueva generación publicada':'Arte anterior (en transición)'}</dd>
          <dt>Formato y tamaño</dt><dd>{showExt(chosen)} · {human(chosen.bytes)}</dd>
          <dt>Uso / reemplazo</dt><dd>Usa el mismo ancho, alto y proporción para evitar recortes en el juego. Los archivos nuevos no reemplazan automáticamente un recurso publicado.</dd>
        </dl>
        <div className="dr-art-detail-actions">
          <button type="button" disabled={busy} onClick={()=>void importForStudio(chosen)}>↗ Usar en DRStudio</button>
          <button type="button" disabled={busy} onClick={()=>{setReplaceTarget(chosen.id);replaceInput.current?.click();}}>⇄ Subir reemplazo</button>
          <button type="button" onClick={()=>changeFlag(chosen.id,flags[chosen.id]==='hidden'?null:'hidden')}>{flags[chosen.id]==='hidden'?'Mostrar arte':'Ocultar arte'}</button>
          {flags[chosen.id]&&<button type="button" onClick={()=>changeFlag(chosen.id,null)}>Restaurar visibilidad</button>}
          <button type="button" className="danger" disabled={busy} onClick={()=>void removeLocal(chosen)}>{chosen.kind==='local'?'Eliminar archivo local':'Marcar para eliminar'}</button>
          {chosen.kind==='repo'&&<a href={'https://github.com/Afelex/Decreto-Real/blob/main/'+chosen.path} target="_blank" rel="noopener noreferrer">Ver original en GitHub ↗</a>}
        </div>
        <div className="dr-art-review"><strong>Revisión artística</strong>
          <div><button type="button" aria-pressed={reviews[chosen.id]?.decision==='aprobada'} onClick={()=>changeReview(chosen.id,{decision:'aprobada'})}>✓ Aprobada</button>
          <button type="button" aria-pressed={reviews[chosen.id]?.decision==='corregir'} onClick={()=>changeReview(chosen.id,{decision:'corregir'})}>✎ Corregir</button></div>
          <textarea aria-label="Observaciones de arte" placeholder="Color, anatomía, estilo, detalle, encuadre…" value={reviews[chosen.id]?.note??''} onChange={e=>changeReview(chosen.id,{note:e.target.value})}/></div>
      </React.Fragment>:<p>Selecciona una miniatura para ver sus dimensiones exactas, revisarla, ocultarla, sustituirla o incorporarla a DRStudio.</p>}
      </aside>
    </div>
  </main>;
}
