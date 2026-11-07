import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseRichText, toggleBold } from '../../campaign/studio/richText';
import {
  sceneLayers, withAsset, withDialogue, withLayer, withSceneSettings, withoutLayer,
} from '../../campaign/studio/ops';
import { defaultLayerTransform, type StudioLayer, type StudioMediaLayer } from '../../campaign/studio/schema';
import { StudioProvider, useStudio } from './StudioContext';
import { studioLayerStyle } from './StageComposer';
import { useStudioDrag } from './useStudioDrag';
import { StudioTextArea } from './StudioTextArea';
import '../decreto-real-studio.css';

/**
 * Kit de Studio para las pantallas narrativas fuera del prólogo
 * (conversaciones tras victoria, regiones, crónica, epílogo y créditos).
 *
 * Cada texto editable tiene su propia clave estable `pantalla/elemento`
 * (p. ej. `victoria-03/xervias-01`, `epilogo/pagina-1-p2`). En esas claves
 * se guardan el texto propio (`dialogue.text`, con **negrita**), el rótulo
 * (`title`), «solo desarrollador» (`devOnly`), el fondo y las capas añadidas.
 * Los retratos y tarjetas nativos de cada pantalla conservan su distribución.
 */

/** Envuelve una pantalla narrativa: no la bloquea mientras carga lo publicado. */
export const StudioScreenProvider=({children}:{children:React.ReactNode})=>
  <StudioProvider blocking={false}>{children}</StudioProvider>;

const Rich=({text}:{text:string})=><>{parseRichText(text).segments.map((s,i)=>
  s.bold?<strong key={i}>{s.text}</strong>:<React.Fragment key={i}>{s.text}</React.Fragment>)}</>;

/** Texto editable (con negrita). Devuelve null si está oculto a la audiencia actual. */
export function StudioText({k,original}:{k:string;original:string}){
  const studio=useStudio();
  const scene=studio.viewScene(k);
  if(!studio.visibleTo(scene?.devOnly))return null;
  return <span data-studio-text={studio.editing?k:undefined}
    className={'dr-studio-rich'+(studio.editing&&scene?.devOnly?' dr-studio-text-devonly':'')}>
    <Rich text={scene?.dialogue?.text??original}/></span>;
}
/** Rótulo editable de la escena (clave visual). */
export function useStudioTitle(k:string,original:string):string|null {
  const studio=useStudio();
  const scene=studio.viewScene(k);
  if(!studio.visibleTo(scene?.titleDevOnly))return null;
  return scene?.title??original;
}
/** Fondo propio de la escena o el original. */
export function useStudioBackground(k:string,original:string):string {
  const studio=useStudio();
  const id=studio.viewScene(k)?.background?.assetId;
  return id&&studio.mediaUrls[id]&&!studio.doc.assets?.[id]?.mime.startsWith('video/')?studio.mediaUrls[id]:original;
}

/** Capas añadidas (sprites y efectos) sobre toda la pantalla, en % de la pantalla. */
export function StudioScreenLayers({sceneKey}:{sceneKey:string}){
  const studio=useStudio();
  const ref=React.useRef<HTMLDivElement|null>(null);
  const handlers=useStudioDrag(sceneKey,ref);
  React.useEffect(()=>{
    const el=ref.current;
    if(!el||!studio.active)return;
    const apply=()=>{const r=el.getBoundingClientRect();
      el.style.setProperty('--dr-stage-w',r.width+'px');el.style.setProperty('--dr-stage-h',r.height+'px');};
    apply();
    window.addEventListener('resize',apply);
    return ()=>window.removeEventListener('resize',apply);
  },[studio.active]);
  const layers=(studio.viewScene(sceneKey)?.layers??[])
    .filter((l):l is StudioMediaLayer=>(l.kind==='image'||l.kind==='effect')&&studio.visibleTo(l.devOnly));
  if(!layers.length&&!studio.editing)return null;
  return <div ref={ref} className={'dr-studio-screen-layers'+(studio.editing?' dr-studio-screen-editing':'')}
    data-testid="studio-screen-layers" aria-hidden="true">
    {layers.map(layer=>{
      const url=studio.mediaUrls[layer.assetId];
      const video=studio.doc.assets?.[layer.assetId]?.mime.startsWith('video/');
      return <div key={layer.id} style={studioLayerStyle(layer)}
        className={'dr-studio-screen-extra'+(studio.editing&&studio.selected===layer.id?' dcop-studio-extra-selected':'')+
          (!layer.visible?' dcop-studio-hidden':'')+(studio.editing&&layer.devOnly?' dcop-studio-devonly':'')}
        data-testid="studio-added-layer" data-studio-actor={studio.editing?layer.id:undefined}
        {...handlers(layer.id)}>
        {url&&(video?<video src={url} autoPlay muted loop playsInline/>:<img src={url} alt=""/>)}
      </div>;
    })}
  </div>;
}

export type StudioScreenText={key:string;label:string;original:string};
type PanelProps={
  /** Nombre de la pantalla, p. ej. «Conversación · misión 3». */
  label:string;
  /** Clave visual: rótulo, fondo y capas. */
  sceneKey:string;
  originalTitle?:string;
  /** Textos editables visibles en esta vista. */
  texts:readonly StudioScreenText[];
};

/** Panel compacto de Studio para pantallas narrativas. */
export function StudioScreenPanel({label,sceneKey,originalTitle,texts}:PanelProps){
  const studio=useStudio();
  const navigate=useNavigate();
  const location=useLocation();
  const [expanded,setExpanded]=React.useState(true);
  const [textKey,setTextKey]=React.useState(texts[0]?.key??'');
  const field=React.useRef<HTMLTextAreaElement|null>(null);
  const files=React.useRef<Record<string,HTMLInputElement|null>>({});
  const textOptions=texts.map(t=>t.key).join('|');
  React.useEffect(()=>{if(!textOptions.split('|').includes(textKey))setTextKey(texts[0]?.key??'');},[textOptions]);// eslint-disable-line react-hooks/exhaustive-deps
  if(!studio.editing)return null;
  const text=texts.find(t=>t.key===textKey)??texts[0];
  const textScene=text?studio.scene(text.key):undefined;
  const scene=studio.scene(sceneKey);
  const media=sceneLayers(studio.doc,sceneKey).filter((l):l is StudioMediaLayer=>l.kind==='image'||l.kind==='effect');
  const selected=media.find(l=>l.id===studio.selected)??null;
  const patch=(part:Partial<StudioLayer>)=>{if(selected)studio.apply(d=>withLayer(d,sceneKey,{...selected,...part} as StudioLayer),'Cambios sin guardar');};
  const setText=(value:string)=>{if(text)studio.preview(d=>withDialogue(d,text.key,{text:value===text.original?null:value}));};
  const bold=()=>{
    const el=field.current;if(!el||!text)return;
    const next=toggleBold(el.value,el.selectionStart??0,el.selectionEnd??0);
    studio.apply(d=>withDialogue(d,text.key,{text:next.text===text.original?null:next.text}),'Negrita aplicada');
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(next.start,next.end);});
  };
  const upload=async(kind:'image'|'effect'|'background',file:File)=>{
    try{
      const stored=await studio.storeMedia(file);
      if(kind!=='effect'&&!stored.mime.startsWith('image/'))throw new Error('Usa una imagen PNG, JPG, WebP o GIF.');
      const register=(d:typeof studio.doc)=>withAsset(d,stored.id,{name:stored.name,mime:stored.mime});
      if(kind==='background'){studio.apply(d=>withSceneSettings(register(d),sceneKey,{background:{assetId:stored.id}}),'Fondo cambiado en esta pantalla.');return;}
      const layer:StudioMediaLayer={id:'extra-'+crypto.randomUUID(),kind,name:stored.name,assetId:stored.id,...defaultLayerTransform(kind)};
      studio.apply(d=>withLayer(register(d),sceneKey,layer),kind==='effect'?'Efecto añadido.':'Sprite añadido.');
      studio.select(layer.id);
    }catch(err){studio.setStatus(err instanceof Error?err.message:'No se pudo usar el archivo.');}
  };
  const pick=(id:string)=>files.current[id]?.click();
  const exit=()=>{
    studio.commit();if(studio.dirty&&!studio.save())return;
    const q=new URLSearchParams(location.search);q.delete('studio');
    navigate(location.pathname+(q.toString()?'?'+q:''));
  };
  const n=(label:string,testid:string,value:number,on:(v:number)=>void)=><label className="dr-studio-number">{label}
    <input type="text" inputMode="decimal" data-testid={testid} defaultValue={String(value)} key={testid+value}
      onBlur={e=>{const v=Number(e.currentTarget.value.replace(',','.'));if(Number.isFinite(v)&&v!==value)on(v);}}
      onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
  return <section className={'dr-studio-panel dr-studio-screen-panel'+(expanded?'':' dr-studio-collapsed')}
    data-testid="dr-studio" aria-label="Decreto Real Studio">
    <header className="dr-studio-heading">
      <div><small>STUDIO · {label.toUpperCase()}</small><strong>Decreto Real Studio <em>v3</em></strong></div>
      <div className="dr-studio-heading-actions">
        <button type="button" data-testid="studio-scenes-catalog" title="Otras pantallas" onClick={()=>{exit();navigate('/studio/escenas');}}>☷</button>
        <button type="button" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
      </div>
    </header>
    {(['image','effect','background'] as const).map(kind=><input key={kind} hidden type="file" aria-label={'Archivo '+kind}
      accept={kind==='image'?'image/*':'image/*,video/mp4,video/webm'} ref={el=>{files.current[kind]=el;}}
      onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';if(f)void upload(kind,f);}}/>)}
    {expanded&&<div className="dr-studio-body">
      {text&&<>
        {texts.length>1&&<label className="dr-studio-label">Texto a editar
          <select data-testid="studio-screen-text-select" value={text.key} onChange={e=>setTextKey(e.target.value)}>
            {texts.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
          </select></label>}
        <div className="dr-studio-bold-row"><span className="dr-studio-label">{text.label}</span>
          <button type="button" data-testid="studio-bold" aria-label="Negrita" onMouseDown={e=>e.preventDefault()} onClick={bold}><b>B</b></button></div>
        <StudioTextArea ref={field} rows={4} maxLength={600} testid="studio-dialogue-text" key={text.key}
          value={textScene?.dialogue?.text??text.original} original={text.original}
          onFocus={studio.begin} onBlur={studio.commit} onLive={setText}/>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-dialogue-reset" disabled={!textScene?.dialogue?.text}
            onClick={()=>studio.apply(d=>withDialogue(d,text.key,{text:null}),'Texto original restaurado')}>↺ Texto original</button>
          <button type="button" data-testid="studio-text-devonly" aria-pressed={Boolean(textScene?.devOnly)}
            onClick={()=>studio.apply(d=>withSceneSettings(d,text.key,{devOnly:!textScene?.devOnly}),
              textScene?.devOnly?'Texto visible para todos':'Texto solo para desarrolladores')}>
            {textScene?.devOnly?'🛠 Texto solo dev':'👁 Texto para todos'}</button>
        </div>
      </>}
      {originalTitle!==undefined&&<>
        <label className="dr-studio-label">Rótulo
          <input type="text" maxLength={80} data-testid="studio-title-text" value={scene?.title??originalTitle}
            onFocus={studio.begin} onBlur={studio.commit}
            onChange={e=>studio.preview(d=>withSceneSettings(d,sceneKey,{title:e.target.value===originalTitle?null:e.target.value}))}/></label>
        <button type="button" data-testid="studio-title-devonly" aria-pressed={Boolean(scene?.titleDevOnly)}
          onClick={()=>studio.apply(d=>withSceneSettings(d,sceneKey,{titleDevOnly:!scene?.titleDevOnly}),'Visibilidad del rótulo cambiada')}>
          {scene?.titleDevOnly?'🛠 Rótulo solo dev':'👁 Rótulo para todos'}</button>
      </>}
      <div className="dr-studio-divider">Capas y fondo</div>
      <div className="dr-studio-actions">
        <button type="button" data-testid="studio-add" onClick={()=>pick('image')}>＋ Sprite</button>
        <button type="button" data-testid="studio-add-effect" onClick={()=>pick('effect')}>✦ Efecto</button>
        <button type="button" data-testid="studio-background" onClick={()=>pick('background')}>▧ Fondo</button>
        <button type="button" disabled={!scene?.background} onClick={()=>studio.apply(d=>withSceneSettings(d,sceneKey,{background:null}),'Fondo original restaurado.')}>↺ Fondo original</button>
      </div>
      {media.length>0&&<label className="dr-studio-label">Capa
        <select data-testid="studio-actor-select" value={selected?.id??''} onChange={e=>studio.select(e.target.value||null)}>
          <option value="">Seleccionar capa</option>
          {media.map(m=><option key={m.id} value={m.id}>{m.name+' · '+(m.kind==='effect'?'Efecto':'Sprite')}</option>)}
        </select></label>}
      {selected&&<div className="dr-studio-properties">
        <div className="dr-studio-two">
          {n('X (%)','studio-x',selected.x,x=>patch({x}))}
          {n('Y (%)','studio-y',selected.y,y=>patch({y}))}
          {n('Escala (%)','studio-scale-number',Math.round(selected.scale*100),v=>patch({scale:v/100}))}
          {n('Capa','studio-layer',selected.z,z=>patch({z}))}
        </div>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-dev-only" aria-pressed={Boolean(selected.devOnly)} onClick={()=>patch({devOnly:!selected.devOnly})}>
            {selected.devOnly?'🛠 Solo dev':'👁 Todos'}</button>
          <button type="button" data-testid="studio-delete" onClick={()=>{studio.apply(d=>withoutLayer(d,sceneKey,selected.id),'Capa retirada');studio.select(null);}}>🗑 Quitar</button>
        </div>
      </div>}
      <div className="dr-studio-actions dr-studio-history">
        <button type="button" onClick={studio.undo} disabled={!studio.canUndo}>↶ Deshacer</button>
        <button type="button" onClick={studio.redo} disabled={!studio.canRedo}>↷ Rehacer</button>
        <button type="button" className="dr-studio-save" data-testid="studio-save" onClick={()=>{studio.commit();studio.save();}}>
          {studio.dirty?'● Guardar borrador':'✓ Guardado'}</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" onClick={()=>void studio.exportProject()}>⇩ Exportar proyecto (.zip)</button>
        <button type="button" data-testid="studio-exit" onClick={exit}>Salir del editor</button>
      </div>
      <div className="dr-studio-bottom"><span role="status">{studio.status||(studio.dirty?'Cambios pendientes de guardar':'Borrador de este dispositivo')}</span></div>
    </div>}
  </section>;
}
