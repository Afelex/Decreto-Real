import React from 'react';
import {avEventLeft,avEventWidth,type AVLane,type GuidedAVBeat} from '../../campaign/studio/avTimeline';

const LANES:readonly {key:AVLane;label:string}[]=[
  {key:'dialogue',label:'Diálogo'},
  {key:'portrait',label:'Personaje'},
  {key:'music',label:'Música'},
  {key:'effect',label:'Efecto'},
  {key:'action',label:'Acción'},
];
const fmt=(ms:number)=>(ms/1000).toLocaleString('es-EC',{maximumFractionDigits:2})+' s';

/** Una sola visualización para tutorial, prólogo y capítulos.
 * Todos los tiempos son editoriales y no hacen avanzar la partida. */
export function StudioAVTracks({beat,heading,context='guided'}:{
  beat:GuidedAVBeat;heading:string;context?:'guided'|'campaign';
}){
  return <section className="dr-studio-av-inspector" data-testid={context==='guided'?
    'studio-av-inspector':'studio-campaign-av-inspector'}
    aria-label="Pistas de la intervención seleccionada">
    <header>
      <strong>{heading}</strong>
      <span>{beat.actionLabel?'Acción: '+beat.actionLabel:'Pausa narrativa / continuar'}</span>
    </header>
    <div className="dr-studio-av-time-axis" aria-hidden="true">
      {[0,.25,.5,.75,1].map(f=><span key={f}>{fmt(beat.windowMs*f)}</span>)}
    </div>
    <div className="dr-studio-av-lanes">
      {LANES.map(lane=><div key={lane.key} className={'dr-studio-av-lane is-'+lane.key}
        data-testid={'studio-av-lane-'+lane.key}>
        <strong>{lane.label}</strong>
        <div className="dr-studio-av-track">
          {beat.events.filter(e=>e.lane===lane.key).map((event,i)=><span
            key={event.label+'-'+i}
            className={'dr-studio-av-event'+(event.approximate?' is-estimate':'')+
              (event.untilAdvance?' is-until-advance':'')}
            style={{left:avEventLeft(event,beat.windowMs)+'%',
              width:avEventWidth(event,beat.windowMs)+'%'}}
            title={event.label+' · '+fmt(event.startMs)} data-testid="studio-av-event">
            <span>{event.label}</span>
          </span>)}
        </div>
      </div>)}
    </div>
    <small className="dr-studio-av-notes" data-testid="studio-av-notes">
      {beat.portraitVisible?'Entrada: '+beat.enterMotion+' · Salida al avanzar: '+beat.exitMotion:
        'El retrato se gestiona con la composición visual de esta escena'}.
      La lectura es aproximada y no provoca avance automático.
    </small>
  </section>;
}
