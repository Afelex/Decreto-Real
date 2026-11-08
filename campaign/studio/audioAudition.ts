/** Audición manual de una intervención de DRStudio.
 * Reutiliza los mismos relojes que el duelo guiado. Un solo gesto del editor
 * inicia la secuencia; toda salida restablece la música del juego. */
import {scheduleNarrativeMusic,scheduleNarrativeSound,
  type AudioTimelineTimer,type NarrativeTiming} from './audioTimeline.ts';
import type {NarrativeAudioCue,StudioNarrativeMusicMode,
  StudioNarrativeSoundCue} from './narrativeAudio.ts';

export const NARRATIVE_AUDITION_WINDOW_MS=8000;

export type NarrativeAuditionActions={
  /** El URL viene exclusivamente de la biblioteca validada de Studio. */
  selectTrack:(url:string|null)=>void;
  setMusicMode:(mode:StudioNarrativeMusicMode)=>void;
  playEffect:(cue:StudioNarrativeSoundCue)=>void|(()=>void);
  /** Vuelve al sonido habitual del juego sin modificar las preferencias. */
  restore:()=>void;
  event?:(event:'music'|'music-stop'|'effect'|'effect-stop'|'finished')=>void;
};

/** Devuelve un botón de parada idempotente. Limita toda audición a ocho
 * segundos aunque la pista sea más larga; el juego real no tiene este límite.
 * No inicia audio por sí solo y no toca el avance del motor de combate.
 */
export function startNarrativeAudition<T>(
  cue:NarrativeAudioCue,timing:NarrativeTiming,trackUrl:string|null,
  actions:NarrativeAuditionActions,timers:AudioTimelineTimer<T>,
  onFinished?:()=>void,
):()=>void{
  let playing=true;
  let finishId:T|undefined;
  let stopEffect:undefined|(()=>void);
  const cancelMusic=scheduleNarrativeMusic(timing,{
    start:()=>{
      actions.event?.('music');
      if(timing.musicCueMode==='stop'){
        actions.setMusicMode('silent');
        return;
      }
      if(timing.musicCueMode==='change')actions.selectTrack(trackUrl);
      actions.setMusicMode(cue.music);
    },
    stop:()=>{
      actions.event?.('music-stop');
      actions.setMusicMode('silent');
    },
  },timers);
  const cancelSound=scheduleNarrativeSound(cue.sound,timing,{
    start:()=>{
      if(cue.sound==='none')return;
      actions.event?.('effect');
      const cancel=actions.playEffect(cue.sound);
      if(typeof cancel!=='function')return;
      let stopped=false;
      stopEffect=()=>{
        if(stopped)return;
        stopped=true;
        actions.event?.('effect-stop');
        cancel();
      };
      return stopEffect;
    },
  },timers);
  const stop=()=>{
    if(!playing)return;
    playing=false;
    cancelMusic();
    cancelSound();
    stopEffect?.(); // También recorta los efectos sin duración máxima.
    if(finishId!==undefined)timers.cancel(finishId);
    actions.restore();
  };
  finishId=timers.after(NARRATIVE_AUDITION_WINDOW_MS,()=>{
    stop();
    actions.event?.('finished');
    onFinished?.();
  });
  return stop;
}
