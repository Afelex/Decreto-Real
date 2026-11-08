/** Temporización declarativa de música y efectos narrativos por intervención.
 * No modifica las acciones del motor de combate ni arranca audio en Studio
 * sin un gesto del usuario.
 */
export const AUDIO_MUSIC_CUE_MODES=['change','continue','stop'] as const;
export type AudioMusicCueMode=(typeof AUDIO_MUSIC_CUE_MODES)[number];

export const AUDIO_TIMING_PRESETS={
  musicStartDelayMs:[0,250,500,1000,1500,3000],
  musicStopAfterMs:[0,2000,5000,10000,15000,30000],
  soundDelayMs:[0,250,500,1000,1500,3000],
  soundMaxDurationMs:[0,250,500,1000,1500,3000],
} as const;
export type AudioTimingKey=keyof typeof AUDIO_TIMING_PRESETS;
export type NarrativeTiming={
  musicCueMode:AudioMusicCueMode;
  musicStartDelayMs:number;
  musicStopAfterMs:number;
  soundDelayMs:number;
  soundMaxDurationMs:number;
};
export const DEFAULT_NARRATIVE_TIMING:NarrativeTiming=Object.freeze({
  musicCueMode:'change',musicStartDelayMs:0,musicStopAfterMs:0,
  soundDelayMs:0,soundMaxDurationMs:0,
});
export const validAudioTime=(key:AudioTimingKey,value:unknown):number|undefined=>
  typeof value==='number'&&
  (AUDIO_TIMING_PRESETS[key] as readonly number[]).includes(value)?value:undefined;

export type AudioTimelineTimer<T>={after:(ms:number,fn:()=>void)=>T;cancel:(id:T)=>void};
export type MusicTimelineActions={start:()=>void;stop:()=>void};
export type SoundTimelineActions={start:()=>void|(()=>void)};

/** Una pista se inicia tras el tiempo indicado, y si hay duración máxima,
 * se silencia solo si seguimos en el mismo paso. El cambio de intervención
 * cancela los temporizadores del paso anterior.
 */
export function scheduleNarrativeMusic<T>(
  timing:NarrativeTiming,actions:MusicTimelineActions,timers:AudioTimelineTimer<T>,
):()=>void{
  let startId:T|undefined,stopId:T|undefined,active=true;
  const begin=()=>{
    if(!active)return;
    actions.start();
    if(timing.musicCueMode!=='stop'&&timing.musicStopAfterMs>0)
      stopId=timers.after(timing.musicStopAfterMs,()=>{if(active)actions.stop();});
  };
  if(timing.musicStartDelayMs===0)begin();
  else startId=timers.after(timing.musicStartDelayMs,begin);
  return ()=>{
    active=false;
    if(startId!==undefined)timers.cancel(startId);
    if(stopId!==undefined)timers.cancel(stopId);
  };
}

/** Efectos de entrada de una intervención: nunca se reproducen más de una
 * vez y se cancelan si el jugador pasa al siguiente texto antes del disparo.
 * Una duración máxima opcional detiene solo el efecto, no la música.
 */
export function scheduleNarrativeSound<T>(
  sound:'none'|string,timing:NarrativeTiming,
  actions:SoundTimelineActions,timers:AudioTimelineTimer<T>,
):()=>void{
  if(sound==='none')return ()=>{};
  let startId:T|undefined,stopId:T|undefined,active=true;
  let stopPlaying:void|(()=>void);
  const begin=()=>{
    if(!active)return;
    stopPlaying=actions.start();
    if(timing.soundMaxDurationMs>0)
      stopId=timers.after(timing.soundMaxDurationMs,()=>{
        if(active&&typeof stopPlaying==='function')stopPlaying();
        stopPlaying=undefined;
      });
  };
  if(timing.soundDelayMs===0)begin();
  else startId=timers.after(timing.soundDelayMs,begin);
  return ()=>{
    active=false;
    if(startId!==undefined)timers.cancel(startId);
    if(stopId!==undefined)timers.cancel(stopId);
    if(timing.soundMaxDurationMs>0&&typeof stopPlaying==='function')stopPlaying();
  };
}
