import React from 'react';
import {
  layerOrDefault, sceneLayers, withLayer, withLayerPatch, withSceneSettings, withoutLayer,
} from '../../campaign/studio/ops';
import {
  STUDIO_ACTORS, actorLayerId, defaultLayerTransform,
  type StudioLayer, type StudioLayerTransform, type StudioMediaLayer,
} from '../../campaign/studio/schema';
import { storeStudioFile, useStudio } from './StudioContext';
import '../decreto-real-studio.css';

const NATIVE_LABELS:Record<string,string>={
  ...Object.fromEntries(STUDIO_ACTORS.map(actor=>[actorLayerId(actor),actor])),
  bubble:'Globo de texto',
};
const FILE_INPUTS=[
  {id:'replace',accept:'image/png,image/jpeg,image/webp,image/gif'},
  {id:'add',accept:'image/png,image/jpeg,image/webp,image/gif'},
  {id:'effect',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
  {id:'background',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
  {id:'project',accept:'.json,application/json'},
] as const;
type FileInputId=typeof FILE_INPUTS[number]['id'];

type Props={
  sceneKey:string;
  sceneIndex:number;total:number;title:string;
  sceneOptions:readonly {label:string}[];
  /** Ids de los elementos nativos presentes (actores, niño, globo). */
  nativeLayerIds:readonly string[];
  /** El texto original del globo de esta intervención, si existe. */
  nativeBubbleText:string|null;
  onNavigate:(index:number)=>void;
  onPreview:()=>void;
  onExit:()=>void;
};

const round2=(n:number)=>Math.round(n*100)/100;

/** Inspector de Decreto Real Studio v3: lee y escribe el documento a través del contexto. */
export default function StudioInspector(props:Props){
  const studio=useStudio();
  const {sceneKey}=props;
  const [expanded,setExpanded]=React.useState(true);
  const [busy,setBusy]=React.useState(false);
  const inputs=React.useRef<Partial<Record<FileInputId,HTMLInputElement|null>>>({});
  const scene=studio.scene(sceneKey);
  const media=sceneLayers(studio.doc,sceneKey).filter((l):l is StudioMediaLayer=>l.kind==='image'||l.kind==='effect');
  const options=[...props.nativeLayerIds,...media.map(m=>m.id)];
  const labels:Record<string,string>={
    ...NATIVE_LABELS,
    ...Object.fromEntries(media.map(m=>[m.id,m.name+' · '+(m.kind==='effect'?'Efecto':'Sprite')])),
  };
  const optionKey=options.join('|');

  // Al cambiar de intervención se conserva la selección si el elemento sigue presente.
  // Actualización funcional: nunca pisa una selección hecha justo antes por el usuario.
  const {select}=studio;
  React.useEffect(()=>{
    const available=optionKey?optionKey.split('|'):[];
    select(previous=>previous&&available.includes(previous)?previous:available[0]??null);
  },[sceneKey,optionKey,select]);

  const selected=studio.selected&&options.includes(studio.selected)?studio.selected:null;
  const current:StudioLayer|null=selected?layerOrDefault(studio.doc,sceneKey,selected):null;
  const bubbleLayer=layerOrDefault(studio.doc,sceneKey,'bubble');
  const bubbleVisible=bubbleLayer?.visible!==false;
  const titleVisible=scene?.titleVisible!==false;
  const bubbleText=bubbleLayer?.kind==='bubble'&&bubbleLayer.text!==undefined?bubbleLayer.text:props.nativeBubbleText??'';

  const patch=(part:Partial<StudioLayerTransform>)=>(doc:typeof studio.doc)=>{
    const base=selected?layerOrDefault(doc,sceneKey,selected):null;
    if(!base)throw new Error('Selecciona primero un elemento.');
    return withLayer(doc,sceneKey,{...base,...part} as StudioLayer);
  };
  /** Cambio inmediato: una entrada de deshacer. */
  const change=(part:Partial<StudioLayerTransform>)=>studio.apply(patch(part),'Cambios sin guardar');
  /** Cambio continuo (deslizador, campo numérico): una entrada por gesto. */
  const live=(part:Partial<StudioLayerTransform>)=>{studio.preview(patch(part));studio.setStatus('Cambios sin guardar');};
  const gesture={onFocus:studio.begin,onBlur:studio.commit,onPointerDown:studio.begin,onPointerUp:studio.commit};

  const withFile=async(id:FileInputId,file:File)=>{
    setBusy(true);
    try{
      if(id==='project'){await studio.importProject(file);return;}
      if((id==='replace'||id==='add')&&!file.type.startsWith('image/'))
        throw new Error(id==='add'?'Un sprite debe ser PNG, WebP, JPG o GIF.':'Un personaje requiere una imagen PNG, WebP, JPG o GIF.');
      if(id==='replace'&&(!selected||selected==='bubble'))throw new Error('Selecciona primero un personaje o un sprite.');
      const {media:stored,register}=await storeStudioFile(studio,file);
      if(id==='replace'){
        const target=selected!;
        studio.apply(doc=>{
          const next=register(doc);
          const base=layerOrDefault(next,sceneKey,target);
          if(!base)throw new Error('El elemento ya no existe.');
          return base.kind==='actor'?withLayer(next,sceneKey,{...base,assetId:stored.id,visible:true}):
            withLayerPatch(next,sceneKey,target,{assetId:stored.id} as Partial<StudioMediaLayer>);
        },'Imagen reemplazada. Guarda el borrador para conservarla.');
      }else if(id==='add'||id==='effect'){
        const kind=id==='effect'?'effect':'image';
        const layer:StudioMediaLayer={id:'extra-'+crypto.randomUUID(),kind,name:file.name.slice(0,100),
          assetId:stored.id,...defaultLayerTransform(kind)};
        studio.apply(doc=>withLayer(register(doc),sceneKey,layer),
          kind==='effect'?'Efecto añadido. Puedes moverlo y escalarlo.':'Sprite añadido. Puedes moverlo y escalarlo.');
        studio.select(layer.id);
      }else{
        studio.apply(doc=>withSceneSettings(register(doc),sceneKey,{background:{assetId:stored.id}}),
          'Fondo cambiado solo en esta intervención.');
      }
    }catch(err){studio.setStatus(err instanceof Error?err.message:'No se pudo usar el archivo.');}
    finally{setBusy(false);}
  };
  const pick=(id:FileInputId)=>inputs.current[id]?.click();

  const remove=()=>{
    if(!current)return;
    if(current.kind==='image'||current.kind==='effect'){
      studio.apply(doc=>withoutLayer(doc,sceneKey,current.id),'Elemento retirado de esta intervención');
      studio.select(null);
    }else studio.apply(doc=>withLayer(doc,sceneKey,{...current,visible:false}),'Elemento oculto en esta intervención');
  };
  const restore=()=>{
    if(!current)return;
    studio.apply(doc=>current.kind==='image'||current.kind==='effect'
      ? withLayer(doc,sceneKey,{...current,...defaultLayerTransform(current.kind)})
      : withoutLayer(doc,sceneKey,current.id),'Elemento restaurado');
  };
  const toggleBubble=()=>{
    if(!bubbleLayer)return;
    studio.apply(doc=>withLayer(doc,sceneKey,{...(layerOrDefault(doc,sceneKey,'bubble') as StudioLayer),visible:!bubbleVisible}),
      bubbleVisible?'Globo oculto':'Globo visible');
  };
  const toggleTitle=()=>studio.apply(doc=>withSceneSettings(doc,sceneKey,{titleVisible:titleVisible?false:null}),
    titleVisible?'Título oculto':'Título visible');
  const setBubbleText=(text:string)=>{
    studio.preview(doc=>withLayer(doc,sceneKey,{...(layerOrDefault(doc,sceneKey,'bubble') as StudioLayer),text:text.slice(0,140)} as StudioLayer));
    studio.setStatus('Texto del globo modificado');
  };

  const status=studio.status||(studio.dirty?'Cambios pendientes de guardar':'Borrador de este dispositivo');
  return <section className={'dr-studio-panel'+(expanded?' dr-studio-expanded':' dr-studio-collapsed')}
    data-testid="dr-studio" aria-label="Decreto Real Studio">
    <header className="dr-studio-heading">
      <div><small>HERRAMIENTA QA · BORRADOR LOCAL</small><strong>Decreto Real Studio <em>v3</em></strong></div>
      <div className="dr-studio-heading-actions">
        <button type="button" data-testid="studio-preview-top" onClick={props.onPreview}>▶ Historia</button>
        <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}
          aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
      </div>
    </header>
    {FILE_INPUTS.map(file=><input key={file.id} hidden type="file" accept={file.accept}
      aria-label={'Archivo '+file.id}
      ref={node=>{inputs.current[file.id]=node;}}
      onChange={async e=>{
        const chosen=e.currentTarget.files?.[0];e.currentTarget.value='';
        if(chosen)await withFile(file.id,chosen);
      }}/>)}
    {expanded&&<div className="dr-studio-body">
      <div className="dr-studio-scene">
        <button type="button" onClick={()=>props.onNavigate(props.sceneIndex-1)} disabled={props.sceneIndex<=0} aria-label="Escena anterior">‹</button>
        <div><span>Intervención {props.sceneIndex+1} / {props.total}</span><strong>{props.title}</strong></div>
        <button type="button" onClick={()=>props.onNavigate(props.sceneIndex+1)} disabled={props.sceneIndex>=props.total-1} aria-label="Escena siguiente">›</button>
      </div>
      <label className="dr-studio-label" htmlFor="dr-studio-step">Ir a cualquier intervención</label>
      <select id="dr-studio-step" data-testid="studio-step-select" value={props.sceneIndex}
        onChange={e=>props.onNavigate(Number(e.target.value))}>
        {props.sceneOptions.map((item,index)=><option key={index} value={index}>{index+1}. {item.label}</option>)}
      </select>
      <label className="dr-studio-label" htmlFor="dr-studio-actor">Elemento a editar (también puedes tocarlo en pantalla)</label>
      <select id="dr-studio-actor" data-testid="studio-actor-select"
        value={selected??''} onChange={e=>studio.select(e.target.value||null)}>
        <option value="">Seleccionar elemento</option>
        {options.map(id=><option key={id} value={id}>{labels[id]??id}</option>)}
      </select>
      {current&&selected?<div className="dr-studio-properties">
        <div className="dr-studio-inline">
          <strong>{labels[selected]??selected}</strong>
          <button type="button" onClick={()=>change({mirror:!current.mirror})}
            aria-pressed={current.mirror} data-testid="studio-mirror">⇄ Espejar</button>
          <button type="button" onClick={()=>change({visible:!current.visible})}
            aria-pressed={!current.visible}>{current.visible?'◉ Visible':'◌ Oculto'}</button>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-scale">Escala <output>{Math.round(current.scale*100)}%</output></label>
          <input id="studio-scale" data-testid="studio-scale" type="range" min=".35" max="2.75"
            step=".01" value={current.scale} {...gesture}
            onChange={e=>live({scale:round2(+e.target.value)})}/>
        </div>
        <div className="dr-studio-two">
          <label>X (% escenario)<input aria-label="Posición horizontal" data-testid="studio-x"
            type="number" min="-100" max="100" step=".5" value={current.x} {...gesture}
            onChange={e=>live({x:round2(+e.target.value)})}/></label>
          <label>Y (% escenario)<input aria-label="Posición vertical" data-testid="studio-y"
            type="number" min="-100" max="100" step=".5" value={current.y} {...gesture}
            onChange={e=>live({y:round2(+e.target.value)})}/></label>
          <label>Capa<input aria-label="Orden de capa" data-testid="studio-layer"
            type="number" min="1" max="100" step="1" value={current.z} {...gesture}
            onChange={e=>live({z:+e.target.value})}/></label>
        </div>
        <div className="dr-studio-arrows" role="group" aria-label="Ajuste fino de posición">
          <button type="button" onClick={()=>change({x:current.x-.5})} aria-label="Mover a la izquierda">←</button>
          <button type="button" onClick={()=>change({y:current.y-.5})} aria-label="Mover arriba">↑</button>
          <button type="button" onClick={()=>change({y:current.y+.5})} aria-label="Mover abajo">↓</button>
          <button type="button" onClick={()=>change({x:current.x+.5})} aria-label="Mover a la derecha">→</button>
        </div>
        {selected==='bubble'&&<label className="dr-studio-bubble-text">
          Texto del globo
          <input type="text" maxLength={140} value={bubbleText} data-testid="studio-bubble-text"
            onFocus={studio.begin} onBlur={studio.commit}
            onChange={e=>setBubbleText(e.target.value)}/>
        </label>}
        <div className="dr-studio-actions">
          {selected!=='bubble'&&<button type="button" onClick={()=>pick('replace')}
            disabled={busy} data-testid="studio-replace">⇄ Reemplazar imagen</button>}
          <button type="button" onClick={remove} data-testid="studio-delete">🗑 Quitar de escena</button>
        </div>
        <button type="button" onClick={restore}>↺ Restaurar este elemento</button>
      </div>:<p className="dr-studio-tip">Elige cualquier personaje o imagen añadida. Puedes ajustar sus propiedades o moverla directamente con el dedo.</p>}
      <div className="dr-studio-divider">Añadir a esta intervención</div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>pick('add')} data-testid="studio-add">＋ Sprite PNG / WebP</button>
        <button type="button" disabled={busy} onClick={()=>pick('effect')} data-testid="studio-add-effect">✦ GIF / video / efecto</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>pick('background')} data-testid="studio-background">▧ Cambiar fondo</button>
        <button type="button" onClick={()=>studio.apply(doc=>withSceneSettings(doc,sceneKey,{background:null}),'Fondo original restaurado.')}>↺ Fondo original</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" onClick={toggleBubble} disabled={!props.nativeBubbleText} data-testid="studio-bubble">
          {bubbleVisible?'◉ Ocultar globo':'◌ Mostrar globo'}
        </button>
        <button type="button" onClick={toggleTitle} data-testid="studio-title">
          {titleVisible?'◉ Ocultar título':'◌ Mostrar título'}
        </button>
      </div>
      <div className="dr-studio-actions dr-studio-history">
        <button type="button" onClick={studio.undo} disabled={!studio.canUndo}>↶ Deshacer</button>
        <button type="button" onClick={studio.redo} disabled={!studio.canRedo}>↷ Rehacer</button>
        <button type="button" className="dr-studio-save" data-testid="studio-save" onClick={()=>{studio.commit();studio.save();}}>
          {studio.dirty?'● Guardar borrador':'✓ Guardado'}
        </button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>void studio.exportProject()}>⇩ Exportar proyecto</button>
        <button type="button" disabled={busy} onClick={()=>pick('project')}>⇧ Importar proyecto</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" className="dr-studio-preview" data-testid="studio-preview"
          onClick={props.onPreview}>▶ Ver esta escena en Historia</button>
        <button type="button" data-testid="studio-exit" onClick={props.onExit}>Salir del editor</button>
      </div>
      <div className="dr-studio-bottom">
        <span role="status">{status}</span>
      </div>
      <p className="dr-studio-footnote">Los PNG, GIF y videos se guardan localmente. Exporta el proyecto para respaldarlos. Los ajustes no se publican a otros jugadores. Atajos: Ctrl+Z, Ctrl+Shift+Z, Ctrl+S.</p>
    </div>}
  </section>;
}
