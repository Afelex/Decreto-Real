/** Resumen editorial, no reloj del motor. Los pasos del tutorial avanzan
 * por acciones del jugador: los segundos de lectura son aproximaciones.
 */
import type {GuidedStep} from '../guidedOpeningDuel.ts';
import type {StudioDocumentV3} from './schema.ts';
import {analyzeGuidedReading} from './tutorialReading.ts';
import {resolveNarrativeAudio,resolveNarrativeTiming} from './narrativeAudio.ts';
import {narrativePortraitVisible,resolveNarrativeCardSprite} from './narrativeSprites.ts';
import {STUDIO_PORTRAIT_DURATION} from './schema.ts';

export type AVLane='dialogue'|'portrait'|'music'|'effect'|'action';
export type AVEvent={
  lane:AVLane;
  label:string;
  startMs:number;
  /** 0 = indefinido; la intervención termina mediante el jugador. */
  durationMs:number;
  approximate?:boolean;
  untilAdvance?:boolean;
};
export type GuidedAVBeat={
  stepId:string;index:number;speaker:string;text:string;
  tone:string;spritePath:string|null;
  portraitVisible:boolean;enterMotion:string;exitMotion:string;
  musicLabel:string;musicMode:string;cueMode:string;
  soundLabel:string;actionLabel:string|null;
  estimatedReadingSeconds:number;
  windowMs:number;
  events:AVEvent[];
};

/** La duración de lectura nunca se usa para avanzar diálogos. */
export function createGuidedAVBeat(
  step:GuidedStep,index:number,doc:StudioDocumentV3,
):GuidedAVBeat{
  const scene=doc.scenes['tutorial/'+step.id];
  const card=scene?.narrative;
  const speaker=card?.speaker??step.speaker;
  const text=scene?.dialogue?.text??step.text;
  const reading=analyzeGuidedReading(step,text);
  const tone=card?.tone??'neutral';
  const sprite=resolveNarrativeCardSprite(card,step.speaker);
  const portraitVisible=narrativePortraitVisible(step,card);
  const portraitDuration=card?.motionDurationMs??STUDIO_PORTRAIT_DURATION.default;
  const cue=resolveNarrativeAudio(card),timing=resolveNarrativeTiming(card);
  const musicLabel=card?.musicAssetId?
    doc.assets?.[card.musicAssetId]?.name??'Canción pendiente':'Música habitual';
  const actionLabel=step.action?(step.label??step.action):null;
  const events:AVEvent[]=[
    {lane:'dialogue',label:'Lectura estimada · '+reading.estimatedSeconds+' s',
      startMs:0,durationMs:reading.estimatedSeconds*1000,approximate:true},
  ];
  if(portraitVisible&&sprite){
    events.push({lane:'portrait',label:'Aparecer · '+(card?.enterMotion??'fade'),
      startMs:0,durationMs:portraitDuration});
    events.push({lane:'portrait',label:'Visible hasta avanzar',
      startMs:portraitDuration,durationMs:0,untilAdvance:true});
  }
  if(timing.musicCueMode==='stop'){
    events.push({lane:'music',label:'Detener música',
      startMs:timing.musicStartDelayMs,durationMs:0});
  }else{
    events.push({lane:'music',
      label:timing.musicCueMode==='continue'?'Continuar pista anterior':
        musicLabel+' · '+cue.music,
      startMs:timing.musicStartDelayMs,durationMs:timing.musicStopAfterMs,
      untilAdvance:timing.musicStopAfterMs===0});
  }
  if(cue.sound!=='none'){
    events.push({lane:'effect',label:cue.sound+' · '+(
      timing.soundMaxDurationMs?'máx. '+timing.soundMaxDurationMs/1000+' s':'duración natural'),
      startMs:timing.soundDelayMs,durationMs:timing.soundMaxDurationMs,
      untilAdvance:timing.soundMaxDurationMs===0});
  }
  if(actionLabel)
    events.push({lane:'action',label:actionLabel,startMs:0,durationMs:0,untilAdvance:true});
  const windowMs=Math.min(40000,Math.max(6000,reading.estimatedSeconds*1000,
    portraitDuration+250,
    timing.musicStartDelayMs+Math.max(timing.musicStopAfterMs,250),
    timing.soundDelayMs+Math.max(timing.soundMaxDurationMs,250)));
  return {
    stepId:step.id,index,speaker,text,tone,spritePath:sprite?.path??null,
    portraitVisible,enterMotion:card?.enterMotion??'fade',exitMotion:card?.exitMotion??'fade',
    musicLabel,musicMode:cue.music,cueMode:timing.musicCueMode,
    soundLabel:cue.sound,actionLabel,estimatedReadingSeconds:reading.estimatedSeconds,
    windowMs,events,
  };
}
export const createGuidedAVTimeline=(steps:readonly GuidedStep[],doc:StudioDocumentV3):GuidedAVBeat[]=>
  steps.map((step,index)=>createGuidedAVBeat(step,index,doc));
export const avEventLeft=(event:AVEvent,windowMs:number):number=>
  Math.min(100,Math.max(0,event.startMs/windowMs*100));
export const avEventWidth=(event:AVEvent,windowMs:number):number=>
  event.untilAdvance?
    Math.max(2,100-avEventLeft(event,windowMs)):
    event.durationMs<=0?2:
    Math.min(100-avEventLeft(event,windowMs),Math.max(2,event.durationMs/windowMs*100));
