import React from 'react';
import type {StudioTransform} from '../campaign/studioLayout';
import './decreto-real-studio.css';

type Props={
  sceneIndex:number;total:number;title:string;sceneKey:string;
  sceneOptions:readonly {label:string}[];
  onJump:(index:number)=>void;
  actors:readonly string[];
  actorLabels:Record<string,string>;
  selected:string|null;
  transform:StudioTransform|null;
  dirty:boolean;status:string;
  bubbleVisible:boolean;titleVisible:boolean;
  onSelect:(actor:string)=>void;
  onChange:(value:StudioTransform)=>void;
  onSave:()=>void;onUndo:()=>void;canUndo:boolean;
  onRestore:()=>void;onRemove:()=>void;
  onPrev:()=>void;onNext:()=>void;
  onExport:()=>Promise<void>|void;
  onImport:(file:File)=>Promise<void>;
  onReplace:(file:File)=>Promise<void>;
  onAdd:(file:File,kind:'image'|'effect')=>Promise<void>;
  onBackdrop:(file:File)=>Promise<void>;
  onClearBackdrop:()=>void;
  onToggleBubble:()=>void;onToggleTitle:()=>void;
  onPreview:()=>void;onExit:()=>void;
};
/** Real-scene editor inspector: all elements are composed by CampaignOpening. */
export default function DecretoRealStudioPanel(props:Props){
  const [expanded,setExpanded]=React.useState(true);
  const [busy,setBusy]=React.useState(false);
  const inputs=React.useRef<Record<string,HTMLInputElement|null>>({});
  const t=props.transform;
  const update=(part:Partial<StudioTransform>)=>{if(t)props.onChange({...t,...part});};
  const number=(value:number)=>Number(value.toFixed(2));
  const pick=(key:string)=>inputs.current[key]?.click();
  const upload=async(key:string,file:File)=>{
    setBusy(true);
    try{
      if(key==='replace')await props.onReplace(file);
      if(key==='add')await props.onAdd(file,'image');
      if(key==='effect')await props.onAdd(file,'effect');
      if(key==='background')await props.onBackdrop(file);
      if(key==='project')await props.onImport(file);
    }finally{setBusy(false);}
  };
  const files=[
    {id:'replace',accept:'image/png,image/jpeg,image/webp,image/gif'},
    {id:'add',accept:'image/png,image/jpeg,image/webp,image/gif'},
    {id:'effect',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
    {id:'background',accept:'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'},
    {id:'project',accept:'.json,application/json'},
  ];
  return <section className={'dr-studio-panel'+(expanded?' dr-studio-expanded':' dr-studio-collapsed')}
    data-testid="dr-studio" aria-label="Decreto Real Studio">
    <header className="dr-studio-heading">
      <div><small>HERRAMIENTA QA · BORRADOR LOCAL</small><strong>Decreto Real Studio <em>v2</em></strong></div>
      <div className="dr-studio-heading-actions">
        <button type="button" data-testid="studio-preview-top" onClick={props.onPreview}>▶ Historia</button>
        <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}
          aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
      </div>
    </header>
    {files.map(file=><input key={file.id} hidden type="file" accept={file.accept}
      aria-label={'Archivo '+file.id}
      ref={node=>{inputs.current[file.id]=node;}}
      onChange={async e=>{
        const chosen=e.currentTarget.files?.[0];e.currentTarget.value='';
        if(chosen)await upload(file.id,chosen);
      }}/>)}
    {expanded&&<div className="dr-studio-body">
      <div className="dr-studio-scene">
        <button type="button" onClick={props.onPrev} disabled={props.sceneIndex<=0} aria-label="Escena anterior">‹</button>
        <div><span>Intervención {props.sceneIndex+1} / {props.total}</span><strong>{props.title}</strong></div>
        <button type="button" onClick={props.onNext} disabled={props.sceneIndex>=props.total-1} aria-label="Escena siguiente">›</button>
      </div>
      <label className="dr-studio-label" htmlFor="dr-studio-step">Ir a cualquier intervención</label>
      <select id="dr-studio-step" data-testid="studio-step-select" value={props.sceneIndex}
        onChange={e=>props.onJump(Number(e.target.value))}>
        {props.sceneOptions.map((item,index)=><option key={index} value={index}>{index+1}. {item.label}</option>)}
      </select>
      <label className="dr-studio-label" htmlFor="dr-studio-actor">Elemento a editar (también puedes tocarlo en pantalla)</label>
      <select id="dr-studio-actor" data-testid="studio-actor-select"
        value={props.selected??''} onChange={e=>props.onSelect(e.target.value)}>
        <option value="">Seleccionar elemento</option>
        {props.actors.map(actor=><option key={actor} value={actor}>{props.actorLabels[actor]??actor}</option>)}
      </select>
      {t&&props.selected?<div className="dr-studio-properties">
        <div className="dr-studio-inline">
          <strong>{props.actorLabels[props.selected]??props.selected}</strong>
          <button type="button" onClick={()=>update({mirror:!t.mirror})}
            aria-pressed={t.mirror} data-testid="studio-mirror">⇄ Espejar</button>
          <button type="button" onClick={()=>update({visible:!t.visible})}
            aria-pressed={!t.visible}>{t.visible?'◉ Visible':'◌ Oculto'}</button>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-scale">Escala <output>{Math.round(t.scale*100)}%</output></label>
          <input id="studio-scale" data-testid="studio-scale" type="range" min=".35" max="2.75"
            step=".01" value={t.scale} onChange={e=>update({scale:number(+e.target.value)})}/>
        </div>
        <div className="dr-studio-two">
          <label>X (%)<input aria-label="Posición horizontal" data-testid="studio-x"
            type="number" min="-100" max="100" step=".5" value={t.x}
            onChange={e=>update({x:number(+e.target.value)})}/></label>
          <label>Y (%)<input aria-label="Posición vertical" data-testid="studio-y"
            type="number" min="-100" max="100" step=".5" value={t.y}
            onChange={e=>update({y:number(+e.target.value)})}/></label>
          <label>Capa<input aria-label="Orden de capa" data-testid="studio-layer"
            type="number" min="1" max="30" step="1" value={t.layer}
            onChange={e=>update({layer:+e.target.value})}/></label>
        </div>
        <div className="dr-studio-arrows" role="group" aria-label="Ajuste fino de posición">
          <button type="button" onClick={()=>update({x:t.x-.5})} aria-label="Mover a la izquierda">←</button>
          <button type="button" onClick={()=>update({y:t.y-.5})} aria-label="Mover arriba">↑</button>
          <button type="button" onClick={()=>update({y:t.y+.5})} aria-label="Mover abajo">↓</button>
          <button type="button" onClick={()=>update({x:t.x+.5})} aria-label="Mover a la derecha">→</button>
        </div>
        <div className="dr-studio-actions">
          <button type="button" onClick={()=>pick('replace')} disabled={busy} data-testid="studio-replace">⇄ Reemplazar imagen</button>
          <button type="button" onClick={props.onRemove} data-testid="studio-delete">🗑 Quitar de escena</button>
        </div>
        <button type="button" onClick={props.onRestore}>↺ Restaurar este elemento</button>
      </div>:<p className="dr-studio-tip">Elige cualquier personaje o imagen añadida. Puedes ajustar sus propiedades o moverla directamente con el dedo.</p>}
      <div className="dr-studio-divider">Añadir a esta intervención</div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>pick('add')} data-testid="studio-add">＋ Sprite PNG / WebP</button>
        <button type="button" disabled={busy} onClick={()=>pick('effect')} data-testid="studio-add-effect">✦ GIF / video / efecto</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>pick('background')} data-testid="studio-background">▧ Cambiar fondo</button>
        <button type="button" onClick={props.onClearBackdrop}>↺ Fondo original</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" onClick={props.onToggleBubble} data-testid="studio-bubble">
          {props.bubbleVisible?'◉ Ocultar globo':'◌ Mostrar globo'}
        </button>
        <button type="button" onClick={props.onToggleTitle} data-testid="studio-title">
          {props.titleVisible?'◉ Ocultar título':'◌ Mostrar título'}
        </button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>↶ Deshacer</button>
        <button type="button" className="dr-studio-save" data-testid="studio-save" onClick={props.onSave}>
          {props.dirty?'● Guardar borrador':'✓ Guardado'}
        </button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" disabled={busy} onClick={()=>void props.onExport()}>⇩ Exportar proyecto</button>
        <button type="button" disabled={busy} onClick={()=>pick('project')}>⇧ Importar proyecto</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" className="dr-studio-preview" data-testid="studio-preview"
          onClick={props.onPreview}>▶ Ver esta escena en Historia</button>
        <button type="button" onClick={props.onExit}>Salir del editor</button>
      </div>
      <div className="dr-studio-bottom">
        <span role="status">{props.status || (props.dirty?'Cambios pendientes de guardar':'Borrador de este dispositivo')}</span>
      </div>
      <p className="dr-studio-footnote">Los PNG, GIF y videos se guardan localmente. Exporta el proyecto para respaldarlos. Los ajustes no se publican a otros jugadores.</p>
    </div>}
  </section>;
}
