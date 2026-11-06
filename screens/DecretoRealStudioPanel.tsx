import React from 'react';
import type {StudioActor,StudioTransform} from '../campaign/studioLayout';
import './decreto-real-studio.css';

type Props={
  sceneIndex:number;total:number;title:string;sceneKey:string;
  actors:readonly StudioActor[];
  selected:StudioActor|null;
  transform:StudioTransform|null;
  dirty:boolean;status:string;
  onSelect:(actor:StudioActor)=>void;
  onChange:(value:StudioTransform)=>void;
  onSave:()=>void;
  onUndo:()=>void;
  canUndo:boolean;
  onRestore:()=>void;
  onPrev:()=>void;
  onNext:()=>void;
  onExport:()=>void;
  onImport:(file:File)=>Promise<void>;
  onExit:()=>void;
};
/** Editor UI only; its canvas is the real CampaignOpening renderer underneath. */
export default function DecretoRealStudioPanel(props:Props){
  const [expanded,setExpanded]=React.useState(true);
  const [importing,setImporting]=React.useState(false);
  const file=React.useRef<HTMLInputElement>(null);
  const t=props.transform;
  const update=(part:Partial<StudioTransform>)=>{
    if(t)props.onChange({...t,...part});
  };
  const number=(value:number)=>Number(value.toFixed(2));
  return <section className={'dr-studio-panel'+(expanded?' dr-studio-expanded':' dr-studio-collapsed')}
    data-testid="dr-studio" aria-label="Decreto Real Studio">
    <header className="dr-studio-heading">
      <div><small>HERRAMIENTA QA · BORRADOR LOCAL</small><strong>Decreto Real Studio <em>v1</em></strong></div>
      <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}
        aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
    </header>
    {expanded&&<div className="dr-studio-body">
      <div className="dr-studio-scene">
        <button type="button" onClick={props.onPrev} disabled={props.sceneIndex<=0} aria-label="Escena anterior">‹</button>
        <div><span>Escena {props.sceneIndex+1} de {props.total}</span><strong>{props.title}</strong></div>
        <button type="button" onClick={props.onNext} disabled={props.sceneIndex>=props.total-1} aria-label="Escena siguiente">›</button>
      </div>
      <label className="dr-studio-label" htmlFor="dr-studio-actor">Seleccionar elemento (o tocarlo sobre la escena)</label>
      <select id="dr-studio-actor" data-testid="studio-actor-select"
        value={props.selected??''} onChange={e=>props.onSelect(e.target.value as StudioActor)}>
        <option value="" disabled>Selecciona un personaje</option>
        {props.actors.map(actor=><option key={actor} value={actor}>{actor}</option>)}
      </select>
      {t&&props.selected?<div className="dr-studio-properties">
        <div className="dr-studio-inline">
          <strong>{props.selected}</strong>
          <button type="button" onClick={()=>update({mirror:!t.mirror})}
            aria-pressed={t.mirror} data-testid="studio-mirror">⇄ Espejar</button>
          <button type="button" onClick={()=>update({visible:!t.visible})}
            aria-pressed={!t.visible}>{t.visible?'◉ Visible':'◌ Oculto'}</button>
        </div>
        <div className="dr-studio-slider">
          <label htmlFor="studio-scale">Tamaño <output>{Math.round(t.scale*100)}%</output></label>
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
          <label>Capa<input aria-label="Orden de capa" type="number" min="1" max="30"
            step="1" value={t.layer} onChange={e=>update({layer:+e.target.value})}/></label>
        </div>
        <div className="dr-studio-arrows" role="group" aria-label="Ajuste fino de posición">
          <button type="button" onClick={()=>update({x:t.x-.5})} aria-label="Mover a la izquierda">←</button>
          <button type="button" onClick={()=>update({y:t.y-.5})} aria-label="Mover arriba">↑</button>
          <button type="button" onClick={()=>update({y:t.y+.5})} aria-label="Mover abajo">↓</button>
          <button type="button" onClick={()=>update({x:t.x+.5})} aria-label="Mover a la derecha">→</button>
          <button type="button" onClick={props.onRestore}>Restaurar elemento</button>
        </div>
      </div>:<p className="dr-studio-tip">Selecciona al personaje que quieres modificar. Después arrástralo con el dedo o ajusta sus controles.</p>}
      <div className="dr-studio-actions">
        <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>↶ Deshacer</button>
        <button type="button" className="dr-studio-save" data-testid="studio-save" onClick={props.onSave}>
          {props.dirty?'● Guardar borrador':'✓ Guardado'}
        </button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" onClick={props.onExport}>⇩ Exportar JSON</button>
        <button type="button" onClick={()=>file.current?.click()} disabled={importing}>⇧ Importar JSON</button>
        <input hidden type="file" accept=".json,application/json" ref={file}
          aria-label="Archivo de composición JSON"
          onChange={async e=>{
            const chosen=e.currentTarget.files?.[0];
            if(chosen){setImporting(true);try{await props.onImport(chosen)}finally{setImporting(false);}}
            e.currentTarget.value='';
          }}/>
      </div>
      <div className="dr-studio-bottom">
        <span role="status">{props.status || (props.dirty?'Cambios pendientes de guardar':'Borrador en este dispositivo')}</span>
        <button type="button" onClick={props.onExit}>Salir del editor</button>
      </div>
      <p className="dr-studio-footnote">Guarda en este navegador, no en GitHub. Exporta el JSON como respaldo. Solo se aplica en QA de este dispositivo.</p>
    </div>}
  </section>;
}
