import React from 'react';
import { getLayer, layerOrDefault, tutorialLayoutKey, withLayer } from '../../campaign/studio/ops';
import {
  layoutCollisions,suggestDialogueShift,type AuditObstacle,type AuditRect,type DialogueShift,
} from '../../campaign/studio/layoutAudit';
import { useStudio } from './StudioContext';
import type { BoardProfile } from './StudioBoardKit';

type SceneAudit={
  collisions:ReturnType<typeof layoutCollisions>;
  tooSmall:boolean;
  overflowing:boolean;
  shift:DialogueShift;
  stageHeight:number;
};
const rect=(r:DOMRect):AuditRect=>({x:r.x,y:r.y,width:r.width,height:r.height});
const targets=[
  ['.dr-royal-player-hand','Cartas de tu mano'],
  ['.dr-royal-finish','Fin de turno'],
  ['.dr-royal-impact-track','Impactos del jugador'],
  ['.dr-royal-rival-progress','Impactos del rival'],
  ['.dr-royal-activation-target','Zona para activar cartas'],
  ['.dr-royal-combo','Indicador de combo'],
  ['.dr-event-coin-panel','Panel de moneda'],
  ['.dr-event-choice','Elección de combo'],
  ['.dr-royal-guided-actor','Ilustración del personaje'],
] as const;
function visible(el:HTMLElement):boolean {
  const style=getComputedStyle(el);
  const r=el.getBoundingClientRect();
  return style.display!=='none'&&style.visibility!=='hidden'&&
    Number(style.opacity)>.06&&r.height>1&&r.width>1;
}
export function inspectTutorialScene(root:HTMLElement):SceneAudit|null {
  const dialogue=root.querySelector<HTMLElement>('.dr-royal-story-coach');
  if(!dialogue||!visible(dialogue))return null;
  const d=rect(dialogue.getBoundingClientRect());
  const obstacles:AuditObstacle[]=targets.flatMap(([selector,label])=>
    Array.from(root.querySelectorAll<HTMLElement>(selector))
      .filter(visible).map((el,i)=>({id:selector+'-'+i,label,rect:rect(el.getBoundingClientRect())})));
  const paragraph=dialogue.querySelector<HTMLElement>('p');
  const fontSize=paragraph?parseFloat(getComputedStyle(paragraph).fontSize):13;
  const tooSmall=Boolean(paragraph&&fontSize<11);
  const overflowing=Boolean(dialogue.scrollHeight>dialogue.clientHeight+6||
    (paragraph&&paragraph.scrollHeight>paragraph.clientHeight+6));
  const stage=rect(root.getBoundingClientRect());
  return {
    collisions:layoutCollisions(d,obstacles),
    tooSmall,overflowing,stageHeight:stage.height,
    shift:suggestDialogueShift(d,obstacles,stage),
  };
}

export function StudioTutorialAudit({rootRef,stepId,stepIndex,profile}:{
  rootRef:React.RefObject<HTMLDivElement|null>;
  stepId:string;
  stepIndex:number;
  profile:BoardProfile;
}){
  const studio=useStudio();
  const [audit,setAudit]=React.useState<SceneAudit|null>(null);
  const inspect=React.useCallback(()=>{
    if(rootRef.current)setAudit(inspectTutorialScene(rootRef.current));
  },[rootRef]);
  React.useEffect(()=>{
    const id=requestAnimationFrame(inspect);
    window.addEventListener('resize',inspect);
    return ()=>{cancelAnimationFrame(id);window.removeEventListener('resize',inspect);};
  },[inspect,stepId,profile,studio.doc]);
  const key=tutorialLayoutKey(stepId,profile);
  const fix=()=>{
    if(!audit?.shift.improved||!audit.stageHeight)return;
    const percent=100*audit.shift.dy/audit.stageHeight;
    studio.apply(doc=>{
      const id='native-tablero-tutorial-dialogo';
      const layer=getLayer(doc,key,id)??getLayer(doc,'tablero/'+profile,id)??
        layerOrDefault(doc,key,id);
      return withLayer(doc,key,{...layer,y:Math.round((layer.y+percent)*100)/100});
    },'Diálogo reubicado en el paso '+(stepIndex+1)+'; puedes deshacerlo');
  };
  const issues=(audit?.collisions.length??0)+(audit?.overflowing?1:0)+(audit?.tooSmall?1:0);
  return <section className="dr-studio-tutorial-audit" data-testid="studio-layout-audit"
    aria-label="Revisión automática de legibilidad">
    <div className="dr-studio-audit-heading">
      <strong>Revisión de legibilidad</strong>
      <span data-testid="studio-audit-count">{audit?issues===0?'Sin alertas':issues+' alertas':'Midiendo…'}</span>
    </div>
    {audit&&<div className="dr-studio-audit-findings" aria-live="polite">
      {issues===0?<small>El cuadro narrativo no invade las zonas críticas visibles.</small>:<>
        {audit.collisions.slice(0,4).map(hit=><small key={hit.id}>• El diálogo se superpone a: {hit.label}</small>)}
        {audit.overflowing&&<small>• Parte del texto parece recortarse.</small>}
        {audit.tooSmall&&<small>• Texto demasiado pequeño para lectura cómoda.</small>}
      </>}
    </div>}
    <div className="dr-studio-auto-compose-actions">
      <button type="button" onClick={inspect} data-testid="studio-audit-refresh">↻ Comprobar escena</button>
      <button type="button" onClick={fix} data-testid="studio-audit-fix"
        disabled={!audit?.shift.improved}
        title="Solo mueve el diálogo de esta intervención; las demás no cambian">
        ✦ Corregir posición
      </button>
    </div>
    <small>Se mide la escena visible en este dispositivo. La corrección afecta solo al texto de este paso; no mueve cartas ni cambia reglas. Es una sugerencia que puedes deshacer.</small>
  </section>;
}
