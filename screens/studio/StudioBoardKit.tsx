import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { layerOrDefault, withLayer, withoutLayer } from '../../campaign/studio/ops';
import { defaultLayerTransform, type StudioLayer } from '../../campaign/studio/schema';
import { copyTransform, formatTransform, parseTransform, type CopiedTransform } from '../../campaign/studio/transformClipboard';
import { StudioProvider, useStudio } from './StudioContext';
import { useStudioDrag } from './useStudioDrag';
import '../decreto-real-studio.css';

/**
 * Studio · Tablero: ajustar la posición, escala, rotación, capa y visibilidad
 * de los elementos visuales del duelo (retratos, mazos, marcadores, mano,
 * rótulos de turno y botones) SIN cambiar las reglas ni las zonas de juego.
 *
 * Los ajustes se guardan por perfil de pantalla (`tablero/movil`,
 * `tablero/horizontal`, `tablero/escritorio`), porque un tablero no se
 * comporta igual en cada formato. Se aplican con las propiedades CSS
 * individuales `translate`, `scale` y `rotate`, que se suman a las
 * transformaciones propias de cada elemento en lugar de reemplazarlas.
 */
export const BOARD_ELEMENTS:readonly {id:string;label:string}[] = [
  {id:'native-tablero-retrato-rival',label:'Retrato del rival'},
  {id:'native-tablero-mazo-rival',label:'Mazo del rival'},
  {id:'native-tablero-mano-rival',label:'Mano del rival (cartas ocultas)'},
  {id:'native-tablero-progreso-rival',label:'Impactos del rival'},
  {id:'native-tablero-impactos',label:'Tus impactos'},
  {id:'native-tablero-mano-jugador',label:'Tu mano (cartas)'},
  {id:'native-tablero-turno-jugador',label:'Etiqueta «Tu Turno»'},
  {id:'native-tablero-turno-rival',label:'Etiqueta «Turno del Oponente»'},
  {id:'native-tablero-retrato-jugador',label:'Tu retrato'},
  {id:'native-tablero-mazo-jugador',label:'Tu mazo y sonido'},
  {id:'native-tablero-fin-turno',label:'Botón «Fin de turno»'},
  {id:'native-tablero-menu',label:'Botón de menú'},
];
export type BoardProfile = 'movil'|'horizontal'|'escritorio';
const PROFILE_LABELS:Record<BoardProfile,string>={movil:'Móvil vertical',horizontal:'Horizontal',escritorio:'Escritorio'};
export function boardProfileFor(width:number,height:number):BoardProfile {
  if(width>=1180)return 'escritorio';
  return width>height?'horizontal':'movil';
}
function useBoardProfile():BoardProfile {
  const read=()=>typeof window==='undefined'?'movil':boardProfileFor(window.innerWidth,window.innerHeight);
  const [profile,setProfile]=React.useState<BoardProfile>(read);
  React.useEffect(()=>{
    const onResize=()=>setProfile(read());
    window.addEventListener('resize',onResize);
    return ()=>window.removeEventListener('resize',onResize);
  },[]);
  return profile;
}

/** Envuelve el tablero: aplica lo publicado y, en QA con `?studio=1`, permite editarlo. */
export const StudioBoardProvider=({children}:{children:React.ReactNode})=><StudioProvider blocking={false}>{children}</StudioProvider>;

const NATIVE_Z=defaultLayerTransform('native').z;
/** Estilo que se suma a las transformaciones propias del elemento. */
function boardStyle(layer:StudioLayer):React.CSSProperties {
  return {
    translate:'calc('+layer.x+' * var(--dr-board-w, 100vw) / 100) calc('+layer.y+' * var(--dr-board-h, 100dvh) / 100)',
    scale:layer.mirror?(-layer.scale)+' '+layer.scale:String(layer.scale),
    rotate:layer.rotation+'deg',
    ...(layer.z!==NATIVE_Z?{zIndex:layer.z}:{}),
    ...(layer.opacity<1?{opacity:layer.opacity}:{}),
  } as React.CSSProperties;
}

/** Ajustes del tablero para el perfil actual: atributos para cada elemento editable. */
export function useBoardStudio(layoutRef:React.RefObject<HTMLElement|null>){
  const studio=useStudio();
  const profile=useBoardProfile();
  const sceneKey='tablero/'+profile;
  const drag=useStudioDrag(sceneKey,layoutRef);
  React.useEffect(()=>{
    const el=layoutRef.current;
    if(!el)return;
    const apply=()=>{const r=el.getBoundingClientRect();
      el.style.setProperty('--dr-board-w',r.width+'px');el.style.setProperty('--dr-board-h',r.height+'px');};
    apply();
    window.addEventListener('resize',apply);
    return ()=>window.removeEventListener('resize',apply);
  },[layoutRef]);
  const scene=studio.viewScene(sceneKey);
  const attrs=(id:string,className:string)=>{
    const layer=scene?.layers?.find(l=>l.id===id);
    // La mano debe seguir visible para poder jugar, incluso si un documento importado la oculta.
    const gameplayCritical=id==='native-tablero-mano-jugador';
    const hiddenForAudience=!gameplayCritical&&Boolean(layer&&(!studio.visibleTo(layer.devOnly)||(!studio.editing&&layer.visible===false)));
    return {
      className:className+(layer?' dr-board-adjusted':'')+
        (studio.editing&&studio.selected===id?' dr-board-selected':'')+
        (hiddenForAudience?' dr-board-hidden':'')+
        (studio.editing&&layer&&(layer.visible===false||layer.devOnly)?' dr-board-dimmed':''),
      style:layer?boardStyle(layer):undefined,
      'data-studio-actor':studio.editing?id:undefined,
      ...drag(id),
    };
  };
  return {editing:studio.editing,sceneKey,profile,attrs};
}

/** Lo último copiado en el tablero (se conserva entre perfiles). */
let copiedBoardTransform:CopiedTransform|null=null;

/** Panel de Studio · Tablero. Mientras se edita, la partida queda congelada. */
export function StudioBoardPanel({sceneKey,profile}:{sceneKey:string;profile:BoardProfile}){
  const studio=useStudio();
  const navigate=useNavigate();
  const location=useLocation();
  const [expanded,setExpanded]=React.useState(true);
  const [hasCopy,setHasCopy]=React.useState(()=>copiedBoardTransform!==null);
  if(!studio.editing)return null;
  const selected=BOARD_ELEMENTS.some(e=>e.id===studio.selected)?studio.selected:null;
  const layer=selected?layerOrDefault(studio.doc,sceneKey,selected):null;
  const patch=(part:Partial<StudioLayer>,text='Cambios sin guardar')=>{
    if(!selected)return;
    studio.apply(d=>withLayer(d,sceneKey,{...(layerOrDefault(d,sceneKey,selected) as StudioLayer),...part} as StudioLayer),text);
  };
  const n=(label:string,testid:string,value:number,on:(v:number)=>void)=><label className="dr-studio-number">{label}
    <input type="text" inputMode="decimal" data-testid={testid} defaultValue={String(value)} key={testid+':'+selected+':'+value}
      onBlur={e=>{const v=Number(e.currentTarget.value.replace(',','.'));if(Number.isFinite(v)&&v!==value)on(v);}}
      onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
  const exit=()=>{
    studio.commit();if(studio.dirty&&!studio.save())return;
    const q=new URLSearchParams(location.search);q.delete('studio');
    navigate(location.pathname+(q.toString()?'?'+q:''));
  };
  return <section className={'dr-studio-panel dr-studio-screen-panel dr-studio-board-panel'+(expanded?'':' dr-studio-collapsed')}
    data-testid="dr-studio" aria-label="Decreto Real Studio · Tablero">
    <header className="dr-studio-heading">
      <div><small>STUDIO · TABLERO · {PROFILE_LABELS[profile].toUpperCase()}</small><strong>Decreto Real Studio <em>v3</em></strong></div>
      <div className="dr-studio-heading-actions">
        <button type="button" data-testid="studio-scenes-catalog" title="Otras pantallas" onClick={()=>{exit();navigate('/studio/escenas');}}>☷</button>
        <button type="button" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Contraer editor':'Abrir editor'}>{expanded?'−':'＋'}</button>
      </div>
    </header>
    {expanded&&<div className="dr-studio-body">
      <p className="dr-studio-tip" data-testid="studio-board-profile">La partida está congelada mientras editas. Los ajustes son para «{PROFILE_LABELS[profile]}»: los demás formatos se editan aparte (cambia el tamaño de la ventana o gira el móvil).</p>
      <label className="dr-studio-label">Elemento a editar (también puedes tocarlo)
        <select data-testid="studio-actor-select" value={selected??''} onChange={e=>studio.select(e.target.value||null)}>
          <option value="">Seleccionar elemento</option>
          {BOARD_ELEMENTS.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}
        </select></label>
      {layer&&selected&&<div className="dr-studio-properties">
        <div className="dr-studio-two">
          {n('X (% tablero)','studio-x',layer.x,x=>patch({x}))}
          {n('Y (% tablero)','studio-y',layer.y,y=>patch({y}))}
          {n('Escala (%)','studio-scale-number',Math.round(layer.scale*100),v=>patch({scale:v/100}))}
          {n('Rotación (°)','studio-rotation',layer.rotation,rotation=>patch({rotation}))}
          {n('Capa','studio-layer',layer.z,z=>patch({z}))}
          {n('Opacidad (%)','studio-opacity',Math.round(layer.opacity*100),v=>patch({opacity:v/100}))}
        </div>
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-mirror" aria-pressed={layer.mirror} onClick={()=>patch({mirror:!layer.mirror})}>⇄ Espejar</button>
          <button type="button" data-testid="studio-visible" aria-pressed={!layer.visible} disabled={selected==='native-tablero-mano-jugador'}
            onClick={()=>patch({visible:!layer.visible},layer.visible?'Oculto para todos':'Visible')}>{layer.visible?'◉ Visible':'◌ Oculto'}</button>
          <button type="button" data-testid="studio-dev-only" aria-pressed={Boolean(layer.devOnly)} disabled={selected==='native-tablero-mano-jugador'}
            onClick={()=>patch({devOnly:!layer.devOnly},layer.devOnly?'Visible para todos':'Solo para desarrolladores')}>{layer.devOnly?'🛠 Solo dev':'👁 Todos'}</button>
        </div>
        {selected==='native-tablero-mano-jugador'&&<p className="dr-studio-tip">La mano se puede mover y escalar; permanece visible y jugable durante la partida.</p>}
        <div className="dr-studio-actions">
          <button type="button" data-testid="studio-copy-transform" onClick={()=>{
            copiedBoardTransform=copyTransform(layer);setHasCopy(true);
            void navigator.clipboard?.writeText(formatTransform(copiedBoardTransform)).catch(()=>{});
            studio.setStatus('Copiado: X '+layer.x+' · Y '+layer.y+' · escala '+Math.round(layer.scale*100)+' %');
          }}>📋 Copiar posición</button>
          <button type="button" data-testid="studio-paste-transform" disabled={!hasCopy} onClick={async()=>{
            let c=copiedBoardTransform;
            try{const t=await navigator.clipboard?.readText();const p=t?parseTransform(t):null;if(p)c=p;}catch{/* sin permiso */}
            if(c)patch(c,'Transformación pegada');
          }}>📥 Pegar posición</button>
        </div>
        <button type="button" data-testid="studio-restore" onClick={()=>studio.apply(d=>withoutLayer(d,sceneKey,selected),'Elemento restaurado')}>↺ Restaurar este elemento</button>
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
