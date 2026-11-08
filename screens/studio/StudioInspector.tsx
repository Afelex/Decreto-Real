import React from 'react';
import {
  alignBoxes, gridStep, nudgeDelta, type AlignMode, type AlignReference,
} from '../../campaign/studio/grid';
import {
  copyScene, effectiveDialogueStyle, layerOrDefault, withAsset, sceneLayers, withBackgroundFrame, withDialogue,
  withDialogueDefaults, withLayer, withLayerPatch, withSceneSettings, withoutLayer,
} from '../../campaign/studio/ops';
import { toggleBold } from '../../campaign/studio/richText';
import StudioTimeline, { type TimelineItem } from './StudioTimeline';
import StudioLibrary, { formatBytes, type LibraryUse } from './StudioLibrary';
import {
  STUDIO_ACTORS, STUDIO_BACKGROUND_SCALE, STUDIO_DIALOGUE_BOX_SCALE, STUDIO_DIALOGUE_TEXT_SCALE, STUDIO_LIMITS, actorLayerId, defaultLayerTransform, isBackgroundLocked,
  type StudioLayer, type StudioLayerTransform, type StudioMediaLayer,
} from '../../campaign/studio/schema';
import { BACKGROUND_ID, layerBoxes } from './stageGeometry';
import { actionTargets, moveLayersUpdate } from './studioActions';
import { useStudio } from './StudioContext';
import { StudioTextArea } from './StudioTextArea';
import { copyTransform, formatTransform, parseTransform, type CopiedTransform } from '../../campaign/studio/transformClipboard';

/** Lo último copiado en Studio: se conserva al cambiar de intervención. */
let copiedTransform:CopiedTransform|null=null;
import '../decreto-real-studio.css';

const NATIVE_LABELS:Record<string,string>={
  ...Object.fromEntries(STUDIO_ACTORS.map(actor=>[actorLayerId(actor),actor])),
  bubble:'Globo de texto',
  [BACKGROUND_ID]:'Fondo',
  'native-pergamino-arte':'Ilustración del pergamino',
  'native-pergamino-carta':'Tarjeta «Por orden de la Corona»',
  'native-versus-marco':'VS · Marco completo',
  'native-versus-rival':'VS · Franja de Domingo',
  'native-versus-nombre-rival':'VS · Nombre de Domingo',
  'native-versus-vs':'VS · Marca «VS»',
  'native-versus-jugador':'VS · Franja de Xervias',
  'native-versus-nombre-jugador':'VS · Nombre de Xervias',
};
const FILE_INPUTS=[
  {id:'replace',accept:'image/png,image/jpeg,image/webp,image/gif'},
  {id:'add',accept:'image/png,image/jpeg,image/webp,image/gif'},
  {id:'effect',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
  {id:'background',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
  {id:'project',accept:'.zip,.json,application/zip,application/json'},
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
  stageRef:React.RefObject<HTMLElement|null>;
  /** Texto y rótulo originales del guion (para restaurar y comparar). */
  originalText:string;originalTitle:string;
  /** Claves de las intervenciones de la misma escena (incluida la actual) y de la anterior. */
  sceneGroupKeys:readonly string[];previousKey:string|null;
  timeline:readonly TimelineItem[];
  /** Quien habla en la intervención (para las etiquetas). */
  speaker?:string;
  onNavigate:(index:number)=>void;
  onPreview:()=>void;
  onExit:()=>void;
};

const round2=(n:number)=>Math.round(n*100)/100;
const formatNumber=(n:number)=>String(round2(n));
/** Acepta coma o punto decimal; null mientras el texto no es un número completo ("-", "", "1."). */
export function parseStudioNumber(text:string):number|null {
  const t=text.trim().replace(',','.');
  if(!/^-?\d+(\.\d+)?$/.test(t))return null;
  const n=Number(t);
  return Number.isFinite(n)?n:null;
}

type NumberFieldProps={
  label:string;ariaLabel:string;testid:string;value:number;step:number;min:number;max:number;
  onLive:(value:number)=>void;onBegin:()=>void;onCommit:()=>void;
  /** En táctil, los botones +/- se bloquean al desplazarse por el inspector. */
  controlsUnlocked?:boolean;
};
/**
 * Campo numérico exacto: mientras se escribe, el texto vive en un borrador
 * local («-», «-1», vacío son válidos) y solo se aplica cuando es un número.
 * Se confirma con Enter o al salir del campo. Los valores escritos no se imantan.
 */
function NumberField(p:NumberFieldProps){
  const [text,setText]=React.useState(formatNumber(p.value));
  const focused=React.useRef(false);
  React.useEffect(()=>{if(!focused.current)setText(formatNumber(p.value));},[p.value]);
  const clamp=(n:number)=>Math.min(p.max,Math.max(p.min,n));
  const live=(n:number)=>p.onLive(round2(clamp(n)));
  const bump=(delta:number)=>{p.onBegin();live(p.value+delta);p.onCommit();};
  return <label className="dr-studio-number">{p.label}
    <span className="dr-studio-number-row">
      <button type="button" tabIndex={-1} disabled={p.controlsUnlocked===false} aria-label={p.ariaLabel+': restar'} onClick={()=>bump(-p.step)}>−</button>
      <input type="text" inputMode="decimal" aria-label={p.ariaLabel} data-testid={p.testid}
        value={text}
        onFocus={()=>{focused.current=true;p.onBegin();}}
        onBlur={()=>{focused.current=false;setText(formatNumber(p.value));p.onCommit();}}
        onKeyDown={e=>{if(e.key==='Enter')(e.currentTarget as HTMLInputElement).blur();}}
        onChange={e=>{
          setText(e.target.value);
          const n=parseStudioNumber(e.target.value);
          if(n!==null)live(n);
        }}/>
      <button type="button" tabIndex={-1} disabled={p.controlsUnlocked===false} aria-label={p.ariaLabel+': sumar'} onClick={()=>bump(p.step)}>+</button>
    </span>
  </label>;
}

/** Inspector de Decreto Real Studio v3: lee y escribe el documento a través del contexto. */
export default function StudioInspector(props:Props){
  const studio=useStudio();
  const {sceneKey,stageRef}=props;
  const [expanded,setExpanded]=React.useState(true);
  // No modificar valores al deslizar el dedo sobre controles del inspector.
  // Los campos de texto siguen editables; se desbloquean rangos y +/- a demanda.
  const [controlsUnlocked,setControlsUnlocked]=React.useState(()=>
    typeof window==='undefined'||!window.matchMedia('(pointer: coarse)').matches);
  const [busy,setBusy]=React.useState(false);
  const [alignRef,setAlignRef]=React.useState<'auto'|AlignReference>('auto');
  const [timelineOpen,setTimelineOpen]=React.useState(false);
  const [hasCopy,setHasCopy]=React.useState(()=>copiedTransform!==null);
  const [libraryOpen,setLibraryOpen]=React.useState(false);
  const [dialogueScope,setDialogueScope]=React.useState<'beat'|'all'>('beat');
  const dialogueRef=React.useRef<HTMLTextAreaElement|null>(null);
  const inputs=React.useRef<Partial<Record<FileInputId,HTMLInputElement|null>>>({});
  const scene=studio.scene(sceneKey);
  const media=sceneLayers(studio.doc,sceneKey).filter((l):l is StudioMediaLayer=>l.kind==='image'||l.kind==='effect');
  const bubbleLayerRaw=sceneLayers(studio.doc,sceneKey).find(l=>l.kind==='bubble');
  const customBubble=!props.nativeBubbleText&&bubbleLayerRaw?.kind==='bubble'&&bubbleLayerRaw.text!==undefined;
  const options=[...props.nativeLayerIds,...(customBubble?['bubble']:[]),...media.map(m=>m.id),BACKGROUND_ID];
  const labels:Record<string,string>={
    ...NATIVE_LABELS,
    ...Object.fromEntries(media.map(m=>[m.id,m.name+' · '+(m.kind==='effect'?'Efecto':'Sprite')])),
  };
  const optionKey=options.join('|');

  // Al cambiar de intervención se conserva la selección si el elemento sigue presente.
  // Actualización funcional: nunca pisa una selección hecha justo antes por el usuario.
  const {select,clearGroup}=studio;
  React.useEffect(()=>{
    const available=optionKey?optionKey.split('|'):[];
    select(previous=>previous&&available.includes(previous)?previous:available[0]??null);
  },[sceneKey,optionKey,select]);
  React.useEffect(()=>{clearGroup();},[sceneKey,clearGroup]);

  const selected=studio.selected&&options.includes(studio.selected)?studio.selected:null;
  const isBackground=selected===BACKGROUND_ID;
  const current:StudioLayer|null=selected&&!isBackground?layerOrDefault(studio.doc,sceneKey,selected):null;
  const background=scene?.background;
  const bubbleLayer=layerOrDefault(studio.doc,sceneKey,'bubble');
  const bubbleVisible=bubbleLayer?.visible!==false;
  const titleVisible=scene?.titleVisible!==false;
  const bubbleText=bubbleLayer?.kind==='bubble'&&bubbleLayer.text!==undefined?bubbleLayer.text:props.nativeBubbleText??'';
  const hasBubble=Boolean(props.nativeBubbleText)||customBubble;
  const bubbleSide=(bubbleLayer?.kind==='bubble'?bubbleLayer.side:undefined)??'left';
  const dialogueStyle=effectiveDialogueStyle(studio.doc,sceneKey);
  const dialogueText=scene?.dialogue?.text??props.originalText;
  const targets=actionTargets(selected,studio.group.filter(id=>options.includes(id)));

  const patch=(part:Partial<StudioLayerTransform>&{locked?:boolean})=>(doc:typeof studio.doc)=>{
    if(selected===BACKGROUND_ID){
      const {x,y,scale,locked}=part;
      return withBackgroundFrame(doc,sceneKey,{
        ...(x!==undefined?{x}:{}),...(y!==undefined?{y}:{}),...(scale!==undefined?{scale}:{}),
        ...(locked!==undefined?{locked}:{}),
      });
    }
    const base=selected?layerOrDefault(doc,sceneKey,selected):null;
    if(!base)throw new Error('Selecciona primero un elemento.');
    return withLayer(doc,sceneKey,{...base,...part} as StudioLayer);
  };
  /** Cambio inmediato: una entrada de deshacer. */
  const change=(part:Partial<StudioLayerTransform>&{locked?:boolean},text='Cambios sin guardar')=>studio.apply(patch(part),text);
  /** Cambio continuo (deslizador, campo numérico): una entrada por gesto. */
  const live=(part:Partial<StudioLayerTransform>)=>{studio.preview(patch(part));studio.setStatus('Cambios sin guardar');};
  const gesture={onFocus:studio.begin,onBlur:studio.commit,onPointerDown:studio.begin,onPointerUp:studio.commit};

  const stageRect=()=>stageRef.current?.getBoundingClientRect();
  const nudge=(dir:'left'|'right'|'up'|'down')=>{
    const rect=stageRect();
    const step=rect&&rect.width&&rect.height?gridStep(rect,studio.prefs.columns):{x:.5,y:.5};
    const {dx,dy}=nudgeDelta(dir,studio.prefs.snap,step);
    studio.apply(moveLayersUpdate(sceneKey,targets.map(id=>({id,dx,dy}))),'Elemento movido');
  };
  const align=(mode:AlignMode,reference?:AlignReference)=>{
    const stage=stageRef.current;
    if(!stage||!targets.length)return;
    const boxes=layerBoxes(stage,targets);
    const ids=targets.filter(id=>boxes[id]);
    const ref=reference??(alignRef==='auto'?(ids.length>1?'selection':'stage'):alignRef);
    const deltas=alignBoxes(ids.map(id=>boxes[id]),mode,ref);
    studio.apply(moveLayersUpdate(sceneKey,ids.map((id,i)=>({id,...deltas[i]}))),
      reference?'Suelo igualado':'Elementos alineados');
  };

  /**
   * Coloca un archivo de la biblioteca en la intervención: como sprite, efecto,
   * fondo o reemplazo del elemento seleccionado. Una sola entrada de deshacer.
   */
  const placeMedia=(use:LibraryUse,media:{id:string;name:string;mime:string},note='')=>{
    const register=(doc:typeof studio.doc)=>withAsset(doc,media.id,{name:media.name,mime:media.mime});
    const isImage=media.mime.startsWith('image/');
    if((use==='replace'||use==='sprite')&&!isImage)
      throw new Error(use==='sprite'?'Un sprite debe ser PNG, WebP, JPG o GIF.':'Un personaje requiere una imagen PNG, WebP, JPG o GIF.');
    if(use==='replace'){
      if(!selected||selected==='bubble'||isBackground)throw new Error('Selecciona primero un personaje o un sprite.');
      const target=selected;
      studio.apply(doc=>{
        const next=register(doc);
        const base=layerOrDefault(next,sceneKey,target);
        if(!base)throw new Error('El elemento ya no existe.');
        return base.kind==='actor'?withLayer(next,sceneKey,{...base,assetId:media.id,visible:true}):
          withLayerPatch(next,sceneKey,target,{assetId:media.id} as Partial<StudioMediaLayer>);
      },'Imagen reemplazada.'+note+' Guarda el borrador para conservarla.');
    }else if(use==='sprite'||use==='effect'){
      const kind=use==='effect'?'effect':'image';
      const layer:StudioMediaLayer={id:'extra-'+crypto.randomUUID(),kind,name:media.name.slice(0,100),
        assetId:media.id,...defaultLayerTransform(kind)};
      studio.apply(doc=>withLayer(register(doc),sceneKey,layer),
        (kind==='effect'?'Efecto añadido.':'Sprite añadido.')+note+' Puedes moverlo y escalarlo.');
      studio.select(layer.id);
    }else{
      studio.apply(doc=>withSceneSettings(register(doc),sceneKey,{background:{assetId:media.id}}),
        'Fondo cambiado solo en esta intervención.'+note);
    }
  };
  const withFile=async(id:FileInputId,file:File)=>{
    setBusy(true);
    try{
      if(id==='project'){await studio.importProject(file);return;}
      if(id==='replace'&&(!selected||selected==='bubble'||isBackground))throw new Error('Selecciona primero un personaje o un sprite.');
      const stored=await studio.storeMedia(file);
      const use:LibraryUse=id==='add'?'sprite':id==='effect'?'effect':id==='background'?'background':'replace';
      placeMedia(use,stored,stored.reused?' (archivo ya existente en la biblioteca: no se duplicó)':'');
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
  // ——— Copiar y pegar transformaciones (entre elementos e intervenciones) ———
  const copyCurrent=async()=>{
    const source=isBackground?{...defaultLayerTransform('native'),x:background?.x??0,y:background?.y??0,scale:background?.scale??1}:current;
    if(!source)return;
    const copied=copyTransform(source);
    copiedTransform=copied;
    try{await navigator.clipboard?.writeText(formatTransform(copied));}catch{/* sin permiso: queda en Studio */}
    setHasCopy(true);
    studio.setStatus('Copiado: X '+copied.x+' · Y '+copied.y+' · escala '+Math.round(copied.scale*100)+' %');
  };
  const pasteCurrent=async()=>{
    let copied=copiedTransform;
    try{const text=await navigator.clipboard?.readText();const parsed=text?parseTransform(text):null;if(parsed)copied=parsed;}catch{/* sin permiso */}
    if(!copied){studio.setStatus('Primero copia un elemento.');return;}
    const c=copied;
    if(isBackground)studio.apply(d=>withBackgroundFrame(d,sceneKey,{x:c.x,y:c.y,scale:c.scale}),'Posición y escala pegadas en el fondo');
    else studio.apply(patch(c),'Transformación pegada');
  };
  const restore=()=>{
    if(isBackground){
      studio.apply(doc=>withBackgroundFrame(doc,sceneKey,{x:0,y:0,scale:1}),'Encuadre del fondo restaurado');
      return;
    }
    if(!current)return;
    studio.apply(doc=>current.kind==='image'||current.kind==='effect'||(current.kind==='bubble'&&customBubble)
      ? withLayer(doc,sceneKey,{...current,...defaultLayerTransform(current.kind)})
      : withoutLayer(doc,sceneKey,current.id),'Elemento restaurado');
  };
  // ——— Globo en cualquier intervención ———
  const addBubble=()=>{
    studio.apply(doc=>withLayer(doc,sceneKey,{id:'bubble',kind:'bubble',...defaultLayerTransform('bubble'),text:'¡…!'}),
      'Globo añadido. Escribe su texto.');
    studio.select('bubble');
  };
  // ——— Diálogo y textos ———
  const setDialogueText=(text:string)=>{
    studio.preview(doc=>withDialogue(doc,sceneKey,{text:text===props.originalText?null:text}));
    studio.setStatus('Texto del diálogo modificado');
  };
  const bold=()=>{
    const field=dialogueRef.current;
    if(!field)return;
    const next=toggleBold(field.value,field.selectionStart??0,field.selectionEnd??0);
    studio.apply(doc=>withDialogue(doc,sceneKey,{text:next.text===props.originalText?null:next.text}),'Negrita aplicada');
    requestAnimationFrame(()=>{field.focus();field.setSelectionRange(next.start,next.end);});
  };
  /** Ocultar a los jugadores el nombre, el progreso o el rótulo (esta intervención o todas). */
  const toggleChrome=(field:'hideNameplate'|'hideProgress'|'hideTitle')=>{
    const next=!dialogueStyle[field];
    studio.apply(doc=>dialogueScope==='all'
      ? withDialogue(withDialogueDefaults(doc,{[field]:next||null}),sceneKey,{[field]:null})
      : withDialogue(doc,sceneKey,{[field]:next||null}),
      next?'Oculto para los jugadores (visible para desarrolladores)':'Visible para todos');
  };
  const setDialogueSize=(field:'textScale'|'boxScale'|'boxWidth',value:number)=>{
    studio.preview(doc=>dialogueScope==='all'
      ? withDialogue(withDialogueDefaults(doc,{[field]:value}),sceneKey,{[field]:null})
      : withDialogue(doc,sceneKey,{[field]:value}));
    studio.setStatus(dialogueScope==='all'?'Tamaño aplicado a todas las intervenciones':'Tamaño aplicado a esta intervención');
  };
  // ——— Composición entre intervenciones ———
  const applyToScene=()=>{
    const targets=props.sceneGroupKeys.filter(key=>key!==sceneKey);
    if(!targets.length){studio.setStatus('Esta escena tiene una sola intervención.');return;}
    studio.apply(doc=>copyScene(doc,sceneKey,targets),
      'Composición aplicada a '+targets.length+' intervenciones de la escena (puedes deshacerlo).');
  };
  const copyPrevious=()=>{
    if(!props.previousKey)return;
    studio.apply(doc=>copyScene(doc,props.previousKey!,[sceneKey]),'Composición copiada de la intervención anterior.');
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

  const locked=isBackground?isBackgroundLocked(background):Boolean(current?.locked);
  const position={x:isBackground?background?.x??0:current?.x??0,y:isBackground?background?.y??0:current?.y??0};
  const scale=isBackground?background?.scale??1:current?.scale??1;
  const scaleLimits=isBackground?STUDIO_BACKGROUND_SCALE:STUDIO_LIMITS.scale;
  const numeric={onBegin:studio.begin,onCommit:studio.commit,controlsUnlocked};
  const status=studio.status||(studio.dirty?'Cambios pendientes de guardar':'Borrador de este dispositivo');
  return <>
  {libraryOpen&&<StudioLibrary canReplace={Boolean(current&&selected!=='bubble')}
    onClose={()=>setLibraryOpen(false)}
    onUse={(item,use)=>{
      try{placeMedia(use,item);}
      catch(err){studio.setStatus(err instanceof Error?err.message:'No se pudo usar el archivo.');}
    }}/>}
  {timelineOpen&&<StudioTimeline items={props.timeline} current={props.sceneIndex}
    onNavigate={index=>props.onNavigate(index)} onClose={()=>setTimelineOpen(false)}/>}
  <section className={'dr-studio-panel'+(expanded?' dr-studio-expanded':' dr-studio-collapsed')+
    (studio.prefs.dock==='bottom'?' dr-studio-dock-bottom':'')}
    data-testid="dr-studio" aria-label="Decreto Real Studio">
    <header className="dr-studio-heading">
      <div><small>HERRAMIENTA QA · BORRADOR LOCAL</small><strong>Decreto Real Studio <em>v3</em></strong></div>
      <div className="dr-studio-heading-actions">
        <button type="button" data-testid="studio-preview-top" onClick={props.onPreview}>▶ Historia</button>
        <button type="button" data-testid="studio-scenes-catalog" aria-label="Otras pantallas de la historia"
          title="Otras pantallas de la historia" onClick={()=>{props.onExit();window.location.hash='#/studio/escenas';}}>☷</button>
        <button type="button" data-testid="studio-library-toggle" aria-expanded={libraryOpen}
          aria-label="Biblioteca multimedia" title="Biblioteca multimedia"
          onClick={()=>{setLibraryOpen(v=>!v);setTimelineOpen(false);}}>🖼</button>
        <button type="button" data-testid="studio-timeline-toggle" aria-expanded={timelineOpen}
          aria-label="Línea de tiempo" title="Línea de tiempo" onClick={()=>{setTimelineOpen(v=>!v);setLibraryOpen(false);}}>☰</button>
        <button type="button" data-testid="studio-dock" className="dr-studio-dock-button"
          aria-label={studio.prefs.dock==='top'?'Mover el panel abajo':'Mover el panel arriba'}
          title="Mover el panel" onClick={()=>studio.setPrefs({dock:studio.prefs.dock==='top'?'bottom':'top'})}>⇅</button>
        <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}
          aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
      </div>
    </header>
    {expanded&&<nav className="dr-studio-quick-actions" aria-label="Acciones rápidas de Studio">
      <button type="button" data-testid="studio-undo-quick" disabled={!studio.canUndo}
        onClick={studio.undo}>↶ Deshacer</button>
      <button type="button" className="dr-studio-save" data-testid="studio-save-quick"
        onClick={()=>{studio.commit();studio.save();}}>{studio.dirty?'● Guardar':'✓ Guardado'}</button>
      <button type="button" data-testid="studio-controls-lock" aria-pressed={controlsUnlocked}
        onClick={()=>setControlsUnlocked(v=>!v)}>
        {controlsUnlocked?'🔓 Bloquear +/- y barras':'🔒 Desbloquear ajustes'}</button>
      <button type="button" data-testid="studio-publish-quick" onClick={()=>void studio.exportProject(true)}>
        ⇪ Exportar publicación</button>
    </nav>}
    {FILE_INPUTS.map(file=><input key={file.id} hidden type="file" accept={file.accept}
      aria-label={'Archivo '+file.id}
      ref={node=>{inputs.current[file.id]=node;}}
      onChange={async e=>{
        const chosen=e.currentTarget.files?.[0];e.currentTarget.value='';
        if(chosen)await withFile(file.id,chosen);
      }}/>)}
    {expanded&&<div className="dr-studio-body" data-testid="studio-inspector-scroll">
      <p className="dr-studio-mobile-hint">Desliza aquí para recorrer opciones. Los controles de arrastre están bloqueados por defecto; puedes escribir valores exactos.</p>
      {studio.pendingImport&&<div className="dr-studio-import" role="alertdialog" aria-label="Confirmar importación"
        data-testid="studio-import-dialog">
        <strong>Importar «{studio.pendingImport.fileName}»</strong>
        <span>{studio.pendingImport.scenes} escenas editadas · {studio.pendingImport.media} archivos ({formatBytes(studio.pendingImport.bytes)})
          {studio.pendingImport.format==='json'?' · respaldo antiguo (JSON)':''}</span>
        <span>{studio.pendingImport.overlapping
          ?studio.pendingImport.overlapping+' de esas escenas ya tienen cambios en tu borrador.'
          :'Ninguna escena coincide con tu borrador.'}{studio.pendingImport.dropped?' '+studio.pendingImport.dropped+' intervenciones ya no existen y se omitirán.':''}</span>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-import-merge" onClick={()=>void studio.confirmImport('merge')}
            title="Conserva tu borrador; las escenas importadas reemplazan solo a las que coinciden">⊕ Fusionar</button>
          <button type="button" data-testid="studio-import-replace" className="dr-studio-danger"
            onClick={()=>void studio.confirmImport('replace')}
            title={'Sustituye todo tu borrador ('+studio.pendingImport.currentScenes+' escenas)'}>⟲ Reemplazar todo</button>
        </div>
        <button type="button" data-testid="studio-import-cancel" onClick={studio.cancelImport}>Cancelar</button>
        <small>Puedes deshacer la importación con ↶ Deshacer.</small>
      </div>}
      {studio.recovery&&<div className="dr-studio-recovery" role="alert" data-testid="studio-recovery">
        <span>Hay cambios sin guardar de una sesión anterior{studio.recovery.savedAt?' ('+new Date(studio.recovery.savedAt).toLocaleString('es-PE')+')':''}.</span>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-recover" onClick={studio.recover}>↺ Recuperar</button>
          <button type="button" data-testid="studio-discard-recovery" onClick={studio.discardRecovery}>Descartar</button>
        </div>
      </div>}
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
        value={selected??''} onChange={e=>{studio.select(e.target.value||null);studio.clearGroup();}}>
        <option value="">Seleccionar elemento</option>
        {options.map(id=><option key={id} value={id}>{labels[id]??id}</option>)}
      </select>
      {selected&&(current||isBackground)?<div className="dr-studio-properties">
        <div className="dr-studio-inline">
          <strong>{labels[selected]??selected}</strong>
          {current&&<button type="button" onClick={()=>change({mirror:!current.mirror})}
            aria-pressed={current.mirror} data-testid="studio-mirror">⇄ Espejar</button>}
          {current&&<button type="button" onClick={()=>change({visible:!current.visible})}
            aria-pressed={!current.visible}>{current.visible?'◉ Visible':'◌ Oculto'}</button>}
          {current&&<button type="button" aria-pressed={Boolean(current.devOnly)} data-testid="studio-dev-only"
            title="Solo desarrollador: se oculta en la versión publicada"
            onClick={()=>change({devOnly:!current.devOnly} as Partial<StudioLayerTransform>,
              current.devOnly?'Visible para todos':'Solo desarrollador: oculto a los jugadores')}>
            {current.devOnly?'🛠 Solo dev':'👁 Todos'}</button>}
          <button type="button" aria-pressed={locked} data-testid="studio-lock"
            onClick={()=>change({locked:!locked},locked?'Desbloqueado: se puede arrastrar':'Bloqueado en el lienzo')}>
            {locked?'🔒 Bloqueado':'🔓 Libre'}</button>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-scale">Escala <output>{Math.round(scale*100)}%</output></label>
          <input id="studio-scale" data-testid="studio-scale" type="range" disabled={!controlsUnlocked}
            min={scaleLimits.min} max={scaleLimits.max} step=".01" value={scale} {...gesture}
            onChange={e=>live({scale:round2(+e.target.value)})}/>
        </div>
        <div className="dr-studio-two">
          <NumberField label="X (% escenario)" ariaLabel="Posición horizontal" testid="studio-x"
            value={position.x} step={.5} min={-100} max={100} onLive={x=>live({x})} {...numeric}/>
          <NumberField label="Y (% escenario)" ariaLabel="Posición vertical" testid="studio-y"
            value={position.y} step={.5} min={-100} max={100} onLive={y=>live({y})} {...numeric}/>
          <NumberField label="Escala (%)" ariaLabel="Escala en porcentaje" testid="studio-scale-number"
            value={round2(scale*100)} step={5} min={scaleLimits.min*100} max={scaleLimits.max*100}
            onLive={n=>live({scale:round2(n/100)})} {...numeric}/>
          {current&&<>
            <NumberField label="Capa (1–100)" ariaLabel="Orden de capa" testid="studio-layer"
              value={current.z} step={1} min={1} max={100} onLive={z=>live({z:Math.round(z)})} {...numeric}/>
            <NumberField label="Rotación (°)" ariaLabel="Rotación" testid="studio-rotation"
              value={current.rotation} step={5} min={-180} max={180} onLive={rotation=>live({rotation})} {...numeric}/>
            <NumberField label="Opacidad (%)" ariaLabel="Opacidad" testid="studio-opacity"
              value={round2(current.opacity*100)} step={10} min={0} max={100}
              onLive={n=>live({opacity:round2(n/100)})} {...numeric}/>
          </>}
        </div>
        <div className="dr-studio-arrows" role="group" aria-label="Ajuste fino de posición">
          <button type="button" onClick={()=>nudge('left')} aria-label="Mover a la izquierda">←</button>
          <button type="button" onClick={()=>nudge('up')} aria-label="Mover arriba">↑</button>
          <button type="button" onClick={()=>nudge('down')} aria-label="Mover abajo">↓</button>
          <button type="button" onClick={()=>nudge('right')} aria-label="Mover a la derecha">→</button>
        </div>
        {selected==='bubble'&&<label className="dr-studio-bubble-text">
          Texto del globo
          <input type="text" maxLength={140} value={bubbleText} data-testid="studio-bubble-text"
            onFocus={studio.begin} onBlur={studio.commit}
            onChange={e=>setBubbleText(e.target.value)}/>
          <small>Usa **así** para poner palabras en negrita.</small>
          <button type="button" data-testid="studio-bubble-side"
            onClick={()=>change({side:bubbleSide==='left'?'right':'left'} as Partial<StudioLayerTransform>)}>
            {bubbleSide==='left'?'⇥ Pasar a la derecha':'⇤ Pasar a la izquierda'}</button>
        </label>}
        <div className="dr-studio-actions">
          {current&&selected!=='bubble'&&current.kind!=='native'&&<button type="button" onClick={()=>pick('replace')}
            disabled={busy} data-testid="studio-replace">⇄ Reemplazar imagen</button>}
          {current&&<button type="button" onClick={remove} data-testid="studio-delete">🗑 Quitar de escena</button>}
        </div>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-copy-transform" onClick={()=>void copyCurrent()}
            title="Copia posición, escala, rotación, capa, opacidad y espejado">📋 Copiar posición</button>
          <button type="button" data-testid="studio-paste-transform" disabled={!hasCopy} onClick={()=>void pasteCurrent()}
            title="Aplica lo copiado a este elemento">📥 Pegar posición</button>
        </div>
        <button type="button" onClick={restore}>{isBackground?'↺ Restaurar encuadre':'↺ Restaurar este elemento'}</button>
      </div>:<p className="dr-studio-tip">Elige cualquier personaje o imagen añadida. Puedes ajustar sus propiedades o moverla directamente con el dedo.</p>}
      <div className="dr-studio-divider">Alinear</div>
      <div className="dr-studio-align" role="group" aria-label="Alinear selección">
        <button type="button" onClick={()=>align('top')} disabled={!targets.length} data-testid="studio-align-top" title="Arriba">⤒<small>Arriba</small></button>
        <button type="button" onClick={()=>align('middle')} disabled={!targets.length} data-testid="studio-align-middle" title="Centro vertical">⇕<small>Centro</small></button>
        <button type="button" onClick={()=>align('bottom')} disabled={!targets.length} data-testid="studio-align-bottom" title="Abajo">⤓<small>Abajo</small></button>
        <button type="button" onClick={()=>align('left')} disabled={!targets.length} data-testid="studio-align-left" title="Izquierda">⇤<small>Izq.</small></button>
        <button type="button" onClick={()=>align('center')} disabled={!targets.length} data-testid="studio-align-center" title="Centro horizontal">⇔<small>Centro</small></button>
        <button type="button" onClick={()=>align('right')} disabled={!targets.length} data-testid="studio-align-right" title="Derecha">⇥<small>Der.</small></button>
      </div>
      <label className="dr-studio-label">Respecto a
        <select data-testid="studio-align-ref" value={alignRef} onChange={e=>setAlignRef(e.target.value as typeof alignRef)}>
          <option value="auto">Automático (selección o escenario)</option>
          <option value="stage">Escenario</option>
          <option value="safe">Zona segura</option>
          <option value="selection">Selección</option>
        </select>
      </label>
      <div className="dr-studio-actions">
        <button type="button" aria-pressed={studio.multiMode} data-testid="studio-multi"
          onClick={()=>studio.setMultiMode(!studio.multiMode)}>
          {studio.multiMode?'☑ Seleccionando varios':'☐ Seleccionar varios'}</button>
        <button type="button" onClick={()=>align('bottom','selection')} disabled={targets.length<2}
          data-testid="studio-align-floor">⎯ Igualar suelo</button>
      </div>
      <p className="dr-studio-tip" data-testid="studio-selection-count">
        {targets.length>1?targets.length+' elementos seleccionados':'Shift + clic o «Seleccionar varios» para alinear varios elementos.'}
      </p>
      <div className="dr-studio-divider">Composición entre intervenciones</div>
      <div className="dr-studio-actions">
        <button type="button" data-testid="studio-apply-scene" disabled={props.sceneGroupKeys.length<2}
          onClick={applyToScene}>⧉ Aplicar a toda la escena</button>
        <button type="button" data-testid="studio-copy-previous" disabled={!props.previousKey}
          onClick={copyPrevious}>⤺ Copiar de la anterior</button>
      </div>
      <details className="dr-studio-dialogue" open data-testid="studio-dialogue-section">
        <summary>Diálogo y textos</summary>
        <div className="dr-studio-bold-row">
          <label className="dr-studio-label" htmlFor="studio-dialogue-text">Texto del bloque inferior</label>
          <button type="button" data-testid="studio-bold" aria-label="Negrita" title="Negrita (selecciona el texto)"
            onMouseDown={e=>e.preventDefault()} onClick={bold}><b>B</b></button>
        </div>
        <StudioTextArea id="studio-dialogue-text" ref={dialogueRef} rows={4} maxLength={600}
          testid="studio-dialogue-text" value={dialogueText} original={props.originalText}
          onFocus={studio.begin} onBlur={studio.commit} onLive={setDialogueText}/>
        <small className="dr-studio-hint">Enter crea una línea nueva.</small>
        <small className="dr-studio-hint">Selecciona palabras y pulsa <b>B</b>, o escribe **así**, para ponerlas en negrita.</small>
        <button type="button" data-testid="studio-dialogue-reset" disabled={!scene?.dialogue?.text}
          onClick={()=>studio.apply(doc=>withDialogue(doc,sceneKey,{text:null}),'Texto original restaurado')}>↺ Texto original</button>
        <label className="dr-studio-label">Aplicar tamaños a
          <select data-testid="studio-dialogue-scope" value={dialogueScope} onChange={e=>setDialogueScope(e.target.value as 'beat'|'all')}>
            <option value="beat">Solo esta intervención</option>
            <option value="all">Todas las intervenciones</option>
          </select>
        </label>
        <div className="dr-studio-slider">
          <label htmlFor="studio-dialogue-text-scale">Tamaño del texto <output>{Math.round(dialogueStyle.textScale*100)}%</output></label>
          <input id="studio-dialogue-text-scale" data-testid="studio-dialogue-text-scale" type="range" disabled={!controlsUnlocked} step=".05"
            min={STUDIO_DIALOGUE_TEXT_SCALE.min} max={STUDIO_DIALOGUE_TEXT_SCALE.max} value={dialogueStyle.textScale}
            {...gesture} onChange={e=>setDialogueSize('textScale',+e.target.value)}/>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-dialogue-box-scale">Alto del bloque <output>{Math.round(dialogueStyle.boxScale*100)}%</output></label>
          <input id="studio-dialogue-box-scale" data-testid="studio-dialogue-box-scale" type="range" disabled={!controlsUnlocked} step=".05"
            min={STUDIO_DIALOGUE_BOX_SCALE.min} max={STUDIO_DIALOGUE_BOX_SCALE.max} value={dialogueStyle.boxScale}
            {...gesture} onChange={e=>setDialogueSize('boxScale',+e.target.value)}/>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-dialogue-box-width">Ancho del bloque <output>{Math.round(dialogueStyle.boxWidth*100)}%</output></label>
          <input id="studio-dialogue-box-width" data-testid="studio-dialogue-box-width" type="range" disabled={!controlsUnlocked} step=".05"
            min={.5} max={1} value={dialogueStyle.boxWidth}
            {...gesture} onChange={e=>setDialogueSize('boxWidth',+e.target.value)}/>
        </div>
        <span className="dr-studio-label">Visible solo para desarrolladores</span>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-hide-nameplate" aria-pressed={dialogueStyle.hideNameplate}
            onClick={()=>toggleChrome('hideNameplate')}>{dialogueStyle.hideNameplate?'🛠 Nombre solo dev':'👁 Nombre («'+(props.speaker||'Crónica')+'»)'}</button>
          <button type="button" data-testid="studio-hide-progress" aria-pressed={dialogueStyle.hideProgress}
            onClick={()=>toggleChrome('hideProgress')}>{dialogueStyle.hideProgress?'🛠 Progreso solo dev':'👁 Progreso («ESCENA n/21»)'}</button>
          <button type="button" data-testid="studio-hide-title-all" aria-pressed={dialogueStyle.hideTitle}
            onClick={()=>toggleChrome('hideTitle')}>{dialogueStyle.hideTitle?'🛠 Rótulo solo dev':'👁 Rótulo «Decreto Real · Prólogo»'}</button>
        </div>
        <small className="dr-studio-hint">Respeta «Aplicar tamaños a»: esta intervención o todas.</small>
        <label className="dr-studio-label" htmlFor="studio-title-text">Rótulo de la escena</label>
        <input id="studio-title-text" type="text" maxLength={80} data-testid="studio-title-text"
          value={scene?.title??props.originalTitle}
          onFocus={studio.begin} onBlur={studio.commit}
          onChange={e=>{studio.preview(doc=>withSceneSettings(doc,sceneKey,{title:e.target.value===props.originalTitle?null:e.target.value}));}}/>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-title-devonly" aria-pressed={Boolean(scene?.titleDevOnly)}
            onClick={()=>studio.apply(doc=>withSceneSettings(doc,sceneKey,{titleDevOnly:!scene?.titleDevOnly}),
              scene?.titleDevOnly?'Rótulo visible para todos':'Rótulo solo para desarrolladores')}>
            {scene?.titleDevOnly?'🛠 Rótulo solo dev':'👁 Rótulo para todos'}</button>
          <button type="button" data-testid="studio-beat-devonly" aria-pressed={Boolean(scene?.devOnly)}
            onClick={()=>studio.apply(doc=>withSceneSettings(doc,sceneKey,{devOnly:!scene?.devOnly}),
              scene?.devOnly?'La intervención vuelve a verse en la versión publicada':'Intervención oculta a los jugadores (solo desarrollador)')}>
            {scene?.devOnly?'🛠 Intervención solo dev':'👁 Intervención publicada'}</button>
        </div>
      </details>
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
        {!hasBubble&&<button type="button" onClick={addBubble} data-testid="studio-add-bubble">💬 ＋ Globo</button>}
        <button type="button" onClick={toggleBubble} disabled={!hasBubble} data-testid="studio-bubble">
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
        <button type="button" disabled={busy} onClick={()=>void studio.exportProject(true)}>⇪ Exportar para publicar</button>
        <button type="button" disabled={busy} onClick={studio.startPublished}>Partir de lo publicado</button>
        <button type="button" disabled={busy} onClick={()=>void studio.exportProject()}>⇩ Exportar proyecto (.zip)</button>
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
      <p className="dr-studio-footnote" data-testid="studio-footnote">Los PNG, GIF y videos se guardan localmente. Exporta el proyecto para respaldarlos. Los ajustes no se publican a otros jugadores. Atajos: Ctrl+Z, Ctrl+Shift+Z, Ctrl+S, G, flechas, Alt (sin ajuste).</p>
    </div>}
  </section>
  </>;
}
