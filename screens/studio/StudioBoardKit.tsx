import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLayer, isTutorialLayoutId, layerOrDefault, tutorialLayoutKey, withDialogue, withNarrativeCard, withLayer, withoutLayer } from '../../campaign/studio/ops';
import { GUIDED_STEPS, type GuidedStep } from '../../campaign/guidedOpeningDuel';
import { defaultLayerTransform, STUDIO_NARRATIVE_TONES, type StudioLayer, type StudioNarrativeTone } from '../../campaign/studio/schema';
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
  {id:'native-tablero-tutorial-dialogo',label:'Tutorial · Ventana de diálogo'},
  {id:'native-tablero-tutorial-rival',label:'Tutorial · Ilustración de Domingo'},
  {id:'native-tablero-tutorial-jugador',label:'Tutorial · Ilustración de Xervias'},
  {id:'native-tablero-combo',label:'Tutorial · COMBO ×2/×3 de Ataque'},
  {id:'native-tablero-moneda',label:'Tutorial · Moneda y encabezado'},
  {id:'native-tablero-combo-menu',label:'Tutorial · Menú de combo'},
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

const GUIDED_ACTION_DESCRIPTIONS:Readonly<Record<string,string>>={
  coin:'Lanzar moneda',attack1:'Primer ataque',attack2:'Segundo ataque',attack3:'Tercer ataque',
  combo2:'Elegir combo ×2',combo3:'Elegir combo ×3',
  end1:'Terminar primer turno',end2:'Terminar segundo turno',end3:'Terminar tercer turno',end4:'Terminar cuarto turno',
  rival1:'Ataque del rival',rival2:'Segundo turno del rival',rival3:'Tercer turno del rival',rival4:'Cuarto turno del rival',
  impact1:'Activar Impacto I',impact2:'Activar Impacto II',impact3:'Activar Impacto III',impact4:'Activar Impacto Final',
  order:'Activar Decreto de Orden',defense:'Activar Defensa',
};
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
export function useBoardStudio(layoutRef:React.RefObject<HTMLElement|null>,guideStepId?:string){
  const studio=useStudio();
  const profile=useBoardProfile();
  const sceneKey='tablero/'+profile;
  const tutorialKey=guideStepId?tutorialLayoutKey(guideStepId,profile):null;
  const drag=useStudioDrag(sceneKey,layoutRef);
  const dragTutorial=useStudioDrag(tutorialKey,layoutRef,sceneKey);
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
  const tutorialScene=studio.viewScene(tutorialKey);
  // Cada intervención mantiene su propio texto y su composición visual.
  // Si no está editada, conserva la posición compartida para el perfil.
  const guideText=(step:GuidedStep)=>studio.viewScene('tutorial/'+step.id)?.dialogue?.text??step.text;
  const guideSpeaker=(step:GuidedStep)=>studio.viewScene('tutorial/'+step.id)?.narrative?.speaker??step.speaker;
  const attrs=(id:string,className:string)=>{
    const individual=Boolean(tutorialKey&&isTutorialLayoutId(id));
    const layer=(individual?tutorialScene?.layers?.find(l=>l.id===id):undefined)??
      scene?.layers?.find(l=>l.id===id);
    // La mano debe seguir visible para poder jugar, incluso si un documento importado la oculta.
    const gameplayCritical=['native-tablero-mano-jugador','native-tablero-tutorial-dialogo',
      'native-tablero-moneda','native-tablero-combo-menu','native-tablero-combo'].includes(id);
    const hiddenForAudience=!gameplayCritical&&Boolean(layer&&(!studio.visibleTo(layer.devOnly)||(!studio.editing&&layer.visible===false)));
    return {
      className:className+(layer?' dr-board-adjusted':'')+
        (studio.editing&&studio.selected===id?' dr-board-selected':'')+
        (hiddenForAudience?' dr-board-hidden':'')+
        (studio.editing&&layer&&(layer.visible===false||layer.devOnly)?' dr-board-dimmed':''),
      style:layer?boardStyle(layer):undefined,
      'data-studio-actor':studio.editing?id:undefined,
      ...(individual?dragTutorial(id):drag(id)),
    };
  };
  return {editing:studio.editing,selected:studio.selected,sceneKey,profile,attrs,guideText,guideSpeaker};
}

/** Lo último copiado en el tablero (se conserva entre perfiles). */
let copiedBoardTransform:CopiedTransform|null=null;

/** Panel de Studio · Tablero. Mientras se edita, la partida queda congelada. */
export function StudioBoardPanel({sceneKey,profile,previewGuideIndex,onPreviewGuideIndex}:{
  sceneKey:string;profile:BoardProfile;previewGuideIndex:number;onPreviewGuideIndex:(index:number)=>void;
}){
  const studio=useStudio();
  const navigate=useNavigate();
  const location=useLocation();
  const [expanded,setExpanded]=React.useState(true);
  const [hasCopy,setHasCopy]=React.useState(()=>copiedBoardTransform!==null);
  if(!studio.editing)return null;
  const selected=BOARD_ELEMENTS.some(e=>e.id===studio.selected)?studio.selected:null;
  const previewGuide=GUIDED_STEPS[previewGuideIndex];
  const individualKey=tutorialLayoutKey(previewGuide.id,profile);
  const editKey=selected&&isTutorialLayoutId(selected)?individualKey:sceneKey;
  const layer=selected?(getLayer(studio.doc,editKey,selected)??
    getLayer(studio.doc,sceneKey,selected)??layerOrDefault(studio.doc,editKey,selected)):null;
  const previewKey='tutorial/'+previewGuide.id;
  const previewText=studio.scene(previewKey)?.dialogue?.text??previewGuide.text;
  const narrative=studio.scene(previewKey)?.narrative;
  const narrativeSpeaker=narrative?.speaker??previewGuide.speaker;
  const narrativeTone=narrative?.tone??'neutral';
  const narrativeIntent=narrative?.intent??'';
  const narrativeDirection=narrative?.direction??'';
  const updateNarrative=(patch:Parameters<typeof withNarrativeCard>[2],message='Ficha narrativa modificada')=>
    studio.apply(d=>withNarrativeCard(d,previewKey,patch),message);
  const editorOnly=selected?.startsWith('native-tablero-tutorial-')||
    selected==='native-tablero-combo'||selected==='native-tablero-moneda'||selected==='native-tablero-combo-menu';
  const cannotHide=selected!==null&&[
    'native-tablero-mano-jugador','native-tablero-tutorial-dialogo',
    'native-tablero-moneda','native-tablero-combo-menu','native-tablero-combo'
  ].includes(selected);
  const patch=(part:Partial<StudioLayer>,text='Cambios sin guardar')=>{
    if(!selected)return;
    studio.apply(d=>withLayer(d,editKey,{...(getLayer(d,editKey,selected)??
      getLayer(d,sceneKey,selected)??layerOrDefault(d,editKey,selected)),...part} as StudioLayer),text);
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
      <label className="dr-studio-label">Vista previa del tutorial · 32 intervenciones
        <select data-testid="studio-guide-step" value={previewGuideIndex}
          onChange={e=>onPreviewGuideIndex(Number(e.target.value))}>
          {GUIDED_STEPS.map((step,index)=><option value={index} key={step.id}>
            {index+1}. {step.speaker} · {step.text.slice(0,46)}
          </option>)}
        </select>
      </label>
      <label className="dr-studio-label">Texto de esta intervención (se publica en el tutorial)
        <textarea className="dr-studio-guide-text" data-testid="studio-guide-text" rows={3} maxLength={600}
          value={previewText} onFocus={studio.begin} onBlur={studio.commit}
          onChange={e=>{studio.preview(d=>withDialogue(d,previewKey,{text:e.target.value}));
            studio.setStatus('Texto del tutorial modificado');}}/>
      </label>
      <details className="dr-studio-narrative-card" data-testid="studio-narrative-card">
        <summary>Ficha narrativa · {narrativeSpeaker} <span>Editar personaje y dirección</span></summary>
        <div className="dr-studio-narrative-fields">
          <label className="dr-studio-label">Personaje que habla
            <select data-testid="studio-narrative-speaker" value={narrativeSpeaker}
              onChange={e=>updateNarrative({speaker:e.target.value})}>
              {![ 'Xervias','Domingo Quispe','Sistema' ].includes(narrativeSpeaker)&&
                <option value={narrativeSpeaker}>{narrativeSpeaker}</option>}
              <option value="Xervias">Xervias</option>
              <option value="Domingo Quispe">Domingo Quispe</option>
              <option value="Sistema">Narrador / Sistema</option>
            </select>
          </label>
          <label className="dr-studio-label">Intención emocional (fase 2: vincular retrato)
            <select data-testid="studio-narrative-tone" value={narrativeTone}
              onChange={e=>updateNarrative({tone:e.target.value as StudioNarrativeTone})}>
              {STUDIO_NARRATIVE_TONES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Objetivo de esta intervención
            <textarea data-testid="studio-narrative-intent" rows={2} maxLength={180}
              value={narrativeIntent} onFocus={studio.begin} onBlur={studio.commit}
              onChange={e=>studio.preview(d=>withNarrativeCard(d,previewKey,{intent:e.target.value}))}
              placeholder="¿Qué debe comprender o sentir el jugador?"/>
          </label>
          <label className="dr-studio-label">Dirección visual y narrativa (solo editor)
            <textarea data-testid="studio-narrative-direction" rows={3} maxLength={360}
              value={narrativeDirection} onFocus={studio.begin} onBlur={studio.commit}
              onChange={e=>studio.preview(d=>withNarrativeCard(d,previewKey,{direction:e.target.value}))}
              placeholder="Posición, ritmo, gestos, aparición de efectos…"/>
          </label>
          <p className="dr-studio-narrative-trigger" data-testid="studio-narrative-trigger">
            <strong>Acción obligatoria:</strong> {previewGuide.action?(previewGuide.label??GUIDED_ACTION_DESCRIPTIONS[previewGuide.action]??previewGuide.action):'Continuar diálogo'}
            <small>La ficha no cambia las acciones de cartas ni el orden de los turnos.</small>
          </p>
        </div>
      </details>
      <p className="dr-studio-tip">El selector cambia solo la vista previa; nunca adelanta ni reinicia tu partida. Los elementos narrativos se ajustan por intervención y por tamaño de pantalla, sin mover los demás pasos.</p>
      <label className="dr-studio-label">Elemento a editar (también puedes tocarlo)
        <select data-testid="studio-actor-select" value={selected??''} onChange={e=>studio.select(e.target.value||null)}>
          <option value="">Seleccionar elemento</option>
          {BOARD_ELEMENTS.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}
        </select></label>
      {layer&&selected&&<div className="dr-studio-properties">
        {isTutorialLayoutId(selected)&&<p className="dr-studio-tip" data-testid="studio-narrative-scope">Composición individual: paso {previewGuideIndex+1}/32 · {PROFILE_LABELS[profile]}. Puedes editar también el texto del paso. Al restaurar, se conserva la posición general del tablero.</p>}
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
          <button type="button" data-testid="studio-visible" aria-pressed={!layer.visible} disabled={cannotHide}
            onClick={()=>patch({visible:!layer.visible},layer.visible?'Oculto para todos':'Visible')}>{layer.visible?'◉ Visible':'◌ Oculto'}</button>
          <button type="button" data-testid="studio-dev-only" aria-pressed={Boolean(layer.devOnly)} disabled={cannotHide}
            onClick={()=>patch({devOnly:!layer.devOnly},layer.devOnly?'Visible para todos':'Solo para desarrolladores')}>{layer.devOnly?'🛠 Solo dev':'👁 Todos'}</button>
        </div>
        {selected==='native-tablero-mano-jugador'&&<p className="dr-studio-tip">La mano se puede mover y escalar; permanece visible y jugable durante la partida.</p>}
        {editorOnly&&<p className="dr-studio-tip">Edita posición y escala sobre la vista previa. Las ventanas y los indicadores siguen visibles y operativos durante el tutorial.</p>}
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
        <button type="button" data-testid="studio-restore" onClick={()=>studio.apply(d=>withoutLayer(d,editKey,selected),'Elemento restaurado')}>↺ Restaurar este elemento</button>
      </div>}
      <div className="dr-studio-actions dr-studio-history">
        <button type="button" onClick={studio.undo} disabled={!studio.canUndo}>↶ Deshacer</button>
        <button type="button" onClick={studio.redo} disabled={!studio.canRedo}>↷ Rehacer</button>
        <button type="button" className="dr-studio-save" data-testid="studio-save" onClick={()=>{studio.commit();studio.save();}}>
          {studio.dirty?'● Guardar borrador':'✓ Guardado'}</button>
      </div>
      <div className="dr-studio-actions">
        <button type="button" data-testid="studio-export-publish" onClick={()=>void studio.exportProject(true)}>⇪ Exportar para publicar</button>
        <button type="button" onClick={()=>void studio.exportProject()}>⇩ Exportar proyecto (.zip)</button>
        <button type="button" data-testid="studio-exit" onClick={exit}>Salir del editor</button>
      </div>
      <div className="dr-studio-bottom"><span role="status">{studio.status||(studio.dirty?'Cambios pendientes de guardar':'Borrador de este dispositivo')}</span></div>
    </div>}
  </section>;
}
