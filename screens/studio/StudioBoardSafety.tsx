import React from 'react';
import {getLayer,layerOrDefault,tutorialLayoutKey,withLayer,type TutorialLayoutProfile} from '../../campaign/studio/ops';
import {analyzeNarrativeLayout,suggestClearance,type NarrativeBox,type SafetyZone,
  type SafetyFinding,type SafetyRect} from '../../campaign/studio/tutorialOverlap';
import {useStudio} from './StudioContext';

/** Mediciones reales del HUD; nunca modifica reglas ni datos de la partida. */
type VisualAudit={
  stage:SafetyRect;zones:SafetyZone[];subjects:NarrativeBox[];
  findings:SafetyFinding[];cropped:string[];
};
const zoneSelectors=[
  {id:'mano',name:'tu mano de cartas',selector:'.dr-royal-player-hand',weight:5,threshold:.10},
  {id:'impactos',name:'tus Impactos',selector:'.dr-royal-impact-track',weight:5,threshold:.12},
  {id:'activar',name:'campo de activación',selector:'.dr-royal-activation-target',weight:4,threshold:.19},
  {id:'fin',name:'Fin de turno',selector:'.dr-royal-finish',weight:6,threshold:.07},
  {id:'vida',name:'indicadores de vida',selector:'.dr-royal-hp',weight:5,threshold:.25},
  {id:'opciones',name:'elección de combo',selector:'.dr-event-choice',weight:8,threshold:.06},
  {id:'moneda',name:'lanzamiento de moneda',selector:'.dr-event-coin-panel',weight:8,threshold:.08},
] as const;
const subjectSelectors=[
  {id:'native-tablero-tutorial-dialogo',name:'Ventana narrativa',selector:'.dr-royal-story-coach'},
  {id:'native-tablero-tutorial-rival',name:'Ilustración de Domingo',selector:'.dr-royal-guided-actor.is-rival'},
  {id:'native-tablero-tutorial-jugador',name:'Ilustración de Xervias',selector:'.dr-royal-guided-actor.is-player'},
  {id:'native-tablero-combo',name:'Indicador COMBO',selector:'.dr-royal-combo'},
] as const;
const toRect=(r:DOMRect):SafetyRect=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom});
const rectVisible=(el:Element|null):el is HTMLElement=>{
  if(!(el instanceof HTMLElement))return false;
  const style=getComputedStyle(el);
  return el.getClientRects().length>0&&style.display!=='none'&&style.visibility!=='hidden'&&
    !el.classList.contains('dr-board-hidden');
};
function screenAudit(root:HTMLElement):VisualAudit {
  const stage=toRect(root.getBoundingClientRect());
  const zones:SafetyZone[]=[];
  for(const spec of zoneSelectors){
    root.querySelectorAll(spec.selector).forEach(el=>{
      if(rectVisible(el))zones.push({id:spec.id,name:spec.name,rect:toRect(el.getBoundingClientRect()),
        weight:spec.weight,threshold:spec.threshold});
    });
  }
  const subjects:NarrativeBox[]=[];
  const cropped:string[]=[];
  for(const spec of subjectSelectors){
    const el=root.querySelector(spec.selector);
    if(!rectVisible(el))continue;
    const rect=toRect(el.getBoundingClientRect());
    subjects.push({id:spec.id,name:spec.name,rect});
    // La zona del inspector está deliberadamente excluida del análisis.
    if(rect.left<stage.left-5||rect.right>stage.right+5||
      rect.top<stage.top-5||rect.bottom>stage.bottom+5)cropped.push(spec.name);
  }
  const findings=analyzeNarrativeLayout(subjects,zones).filter(f=>f.zoneId!==f.subjectId);
  return {stage,zones,subjects,findings,cropped};
}

export function StudioBoardSafety({stepId,profile,layoutRef,onPlayerPreview}:{
  stepId:string;profile:TutorialLayoutProfile;
  layoutRef:React.RefObject<HTMLDivElement|null>;
  onPlayerPreview:()=>void;
}){
  const studio=useStudio();
  const [audit,setAudit]=React.useState<VisualAudit|null>(null);
  const stageRoot=React.useCallback(()=>layoutRef.current?.closest<HTMLElement>('.dr-royal-screen')??null,[layoutRef]);
  const refresh=React.useCallback(()=>{
    const root=stageRoot();
    if(root)setAudit(screenAudit(root));
  },[stageRoot]);
  React.useEffect(()=>{
    if(!studio.editing)return;
    const frame=requestAnimationFrame(refresh);
    return ()=>cancelAnimationFrame(frame);
  },[studio.editing,studio.doc,stepId,profile,refresh]);
  const problematic=(audit?.findings.length??0)+(audit?.cropped.length??0);
  const autoFix=()=>{
    if(!audit)return;
    const stage=audit.stage;
    const width=stage.right-stage.left,height=stage.bottom-stage.top;
    if(width<=0||height<=0)return;
    let best:{id:string;dx:number;dy:number;benefit:number}|null=null;
    for(const subject of audit.subjects){
      const relevant=audit.findings.some(f=>f.subjectId===subject.id)||
        audit.cropped.includes(subject.name);
      if(!relevant)continue;
      const suggested=suggestClearance(subject.rect,audit.zones,stage);
      if(!suggested)continue;
      const benefit=suggested.before-suggested.after;
      if(!best||benefit>best.benefit)best={id:subject.id,dx:suggested.dx,dy:suggested.dy,benefit};
    }
    if(!best){
      studio.setStatus('No hay un desplazamiento automático seguro. Ajusta tamaño o ubicación manualmente.');
      return;
    }
    const move=best;
    const key=tutorialLayoutKey(stepId,profile);
    studio.apply(doc=>{
      const layer=getLayer(doc,key,move.id)??getLayer(doc,'tablero/'+profile,move.id)??
        layerOrDefault(doc,key,move.id);
      return withLayer(doc,key,{...layer,x:Math.round((layer.x+move.dx/width*100)*100)/100,
        y:Math.round((layer.y+move.dy/height*100)*100)/100});
    },'Despeje automático del tutorial: puedes pulsar Deshacer');
    studio.select(move.id);
  };
  return <section className="dr-studio-visual-audit" data-testid="studio-visual-audit"
    aria-label="Revisión de legibilidad y solapamientos">
    <div className="dr-studio-audit-heading">
      <strong>Revisión de legibilidad</strong>
      <span data-testid="studio-overlap-count" role="status">
        {!audit?'Midiendo escena…':problematic===0?'Sin solapamientos detectados':
          problematic+' posibles problemas'}
      </span>
    </div>
    <p>Se comparan las posiciones visibles con cartas, Impactos y botones. Es una comprobación geométrica: revisa también la lectura del texto.</p>
    {audit&&problematic>0&&<div className="dr-studio-audit-findings">
      {audit.findings.slice(0,5).map((finding,i)=>
        <button key={finding.subjectId+'-'+finding.zoneId+'-'+i} type="button"
          data-testid="studio-overlap-warning" onClick={()=>studio.select(finding.subjectId)}>
          <strong>{finding.subjectName}</strong> tapa {Math.round(finding.fraction*100)} % de {finding.zoneName}
        </button>)}
      {audit.cropped.map((name,i)=><small key={'crop'+i}>Fuera del encuadre: {name}</small>)}
    </div>}
    <div className="dr-studio-audit-buttons">
      <button type="button" data-testid="studio-audit-refresh" onClick={refresh}>↻ Revisar escena</button>
      <button type="button" data-testid="studio-audit-fix" disabled={!audit||problematic===0}
        onClick={autoFix}>✧ Despejar automáticamente</button>
      <button type="button" data-testid="studio-preview-player" onClick={onPlayerPreview}>
        <span aria-hidden="true">◉ </span>Ver como jugador
      </button>
    </div>
    <small>«Despejar» mueve un elemento por vez y permite deshacer; nunca cambia cartas, vida o turnos.</small>
  </section>;
}
