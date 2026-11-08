/**
 * Director narrativo / Fase 1: composición inicial reproducible para cada
 * intervención del tutorial. No altera cartas, acciones, vida ni turnos.
 *
 * Una propuesta es un borrador visual; el editor permite perfeccionarla y
 * sobrescribir solo la intervención y el perfil seleccionados.
 */
import { GUIDED_STEPS, type GuidedStep } from '../guidedOpeningDuel.ts';
import { defaultLayerTransform, type StudioDocumentV3, type StudioLayer, type StudioNarrativeCard } from './schema.ts';
import { getLayer, tutorialLayoutKey, withLayer, type TutorialLayoutProfile } from './ops.ts';

export type TutorialCompositionMood='dialogo'|'accion'|'combo'|'moneda'|'replica'|'desenlace';
export function tutorialCompositionMood(step:GuidedStep):TutorialCompositionMood {
  if(step.id==='g31')return 'desenlace';
  if(step.action==='coin')return 'moneda';
  if(step.action?.startsWith('combo'))return 'combo';
  if(step.action?.startsWith('rival'))return 'replica';
  if(step.action)return 'accion';
  return 'dialogo';
}

const native=(id:string,x:number,y:number,scale:number,z=10):StudioLayer=>({
  id,kind:'native',...defaultLayerTransform('native'),x,y,scale,z,
});
const round=(v:number)=>Math.round(v*100)/100;

/** Predeterminados legibles, ajustables por separado para móvil, horizontal y PC. */
export function proposeTutorialComposition(step:GuidedStep,profile:TutorialLayoutProfile,
  card?:StudioNarrativeCard):StudioLayer[] {
  const mood=tutorialCompositionMood(step);
  const speaker=card?.speaker??step.speaker;
  const rival=speaker==='Domingo Quispe';
  const dramatic=card?.tone==='enojado'||card?.tone==='sorprendido';
  const compact=mood==='accion'||mood==='combo'||mood==='moneda'||mood==='replica';
  const base={
    movil:{dialogY:-4,actionY:-9,dialogScale:.85,actionScale:.77,portraitScale:1.08},
    horizontal:{dialogY:-2,actionY:-4,dialogScale:.91,actionScale:.83,portraitScale:1.03},
    escritorio:{dialogY:-2,actionY:-4,dialogScale:.96,actionScale:.88,portraitScale:1.12},
  }[profile];
  const dialogX=rival&&!compact?-7:compact?0:2;
  const dialogScale=round((compact?base.actionScale:base.dialogScale)*(rival&&!compact?.92:1));
  const dialogY=mood==='desenlace'?base.dialogY+1:(compact?base.actionY:base.dialogY);
  const layers:StudioLayer[]=[
    native('native-tablero-tutorial-dialogo',dialogX,dialogY,dialogScale,48),
  ];
  // Las ilustraciones amplias acompañan pausas narrativas, nunca una acción
  // donde se deba tocar la mano, el campo, la moneda o Fin de turno.
  if(mood==='dialogo'&&speaker!=='Sistema'){
    const id=rival?'native-tablero-tutorial-rival':'native-tablero-tutorial-jugador';
    const portraitScale=round(base.portraitScale*(dramatic?1.07:1));
    layers.push(native(id,rival?2:-2,rival?-1:0,portraitScale,47));
  }
  if(mood==='combo'){
    layers.push(native('native-tablero-combo',0,profile==='movil'?-4:-2,.9,20));
    layers.push(native('native-tablero-combo-menu',0,profile==='movil'?-3:0,.94,54));
  }
  if(mood==='moneda')layers.push(native('native-tablero-moneda',0,0,.94,54));
  return layers;
}

/** Semilla de todas las intervenciones: nunca sobrescribe una edición local.
 * La opción "reemplazar" se usa solo por acción explícita del editor. */
export function withProposedTutorialComposition(doc:StudioDocumentV3,step:GuidedStep,
  profile:TutorialLayoutProfile,replace=false):StudioDocumentV3 {
  const key=tutorialLayoutKey(step.id,profile);
  let next=doc;
  for(const layer of proposeTutorialComposition(step,profile,doc.scenes['tutorial/'+step.id]?.narrative)){
    if(replace||!getLayer(next,key,layer.id))next=withLayer(next,key,layer);
  }
  return next;
}
export function withMissingTutorialCompositions(doc:StudioDocumentV3,
  profile:TutorialLayoutProfile):StudioDocumentV3 {
  return GUIDED_STEPS.reduce((next,step)=>withProposedTutorialComposition(next,step,profile),doc);
}
