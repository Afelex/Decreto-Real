import React from 'react';
import {startNarrativeAudition,NARRATIVE_AUDITION_WINDOW_MS} from '../../campaign/studio/audioAudition.ts';
import type {AudioTimelineTimer,NarrativeTiming} from '../../campaign/studio/audioTimeline.ts';
import type {NarrativeAudioCue} from '../../campaign/studio/narrativeAudio.ts';
import {useOptionalAudio} from '../../contexts/AudioContext';

type Props={
  stepId:string;
  cue:NarrativeAudioCue;
  timing:NarrativeTiming;
  trackUrl:string|null;
  missingTrack:boolean;
};

/** Audición exclusivamente por gesto de usuario. No crea una segunda pista
 * permanente, no cambia preferencias y cancela todo al cambiar de escena. */
export function StudioAudioAudition({stepId,cue,timing,trackUrl,missingTrack}:Props){
  const audio=useOptionalAudio();
  const audioRef=React.useRef(audio);
  audioRef.current=audio;
  const [playing,setPlaying]=React.useState(false);
  const [elapsed,setElapsed]=React.useState(0);
  const [event,setEvent]=React.useState('Listo para escuchar');
  const stopRef=React.useRef<null|(()=>void)>(null);
  const clockRef=React.useRef<number|null>(null);
  const timers=React.useMemo<AudioTimelineTimer<number>>(()=>({
    after:(ms,fn)=>window.setTimeout(fn,ms),
    cancel:id=>window.clearTimeout(id),
  }),[]);
  const cancel=React.useCallback(()=>{
    const stop=stopRef.current;
    stopRef.current=null;
    stop?.();
    if(clockRef.current!==null){window.clearInterval(clockRef.current);clockRef.current=null;}
  },[]);

  // Los cambios de intervención, audio y tiempos invalidan la audición.
  React.useEffect(()=>{
    setPlaying(false);
    setElapsed(0);
    setEvent('Listo para escuchar');
    return cancel;
  },[stepId,cue.music,cue.sound,trackUrl,missingTrack,timing.musicCueMode,
    timing.musicStartDelayMs,timing.musicStopAfterMs,timing.soundDelayMs,
    timing.soundMaxDurationMs,cancel]);

  const stop=()=>{
    cancel();
    setPlaying(false);
    setElapsed(0);
    setEvent('Audición detenida');
  };
  const start=()=>{
    if(!audioRef.current||missingTrack)return;
    cancel();
    const startedAt=performance.now();
    const cancelSession=startNarrativeAudition(cue,timing,trackUrl,{
      selectTrack:url=>audioRef.current?.setNarrativeMusicTrack(url),
      setMusicMode:mode=>audioRef.current?.setNarrativeMusicMode(mode),
      playEffect:sound=>audioRef.current?.playSound(sound),
      restore:()=>{
        audioRef.current?.setNarrativeMusicMode('normal');
        audioRef.current?.setNarrativeMusicTrack(null);
      },
      event:value=>{
        setEvent({
          music:'Señal musical iniciada', 'music-stop':'Música detenida',
          effect:'Efecto disparado','effect-stop':'Efecto finalizado',
          finished:'Audición completa',
        }[value]);
      },
    },timers,()=>{
      stopRef.current=null;
      if(clockRef.current!==null){window.clearInterval(clockRef.current);clockRef.current=null;}
      setPlaying(false);
      setElapsed(NARRATIVE_AUDITION_WINDOW_MS);
    });
    stopRef.current=cancelSession;
    setPlaying(true);
    setElapsed(0);
    setEvent('Audición en curso');
    clockRef.current=window.setInterval(()=>
      setElapsed(Math.min(NARRATIVE_AUDITION_WINDOW_MS,performance.now()-startedAt)),100);
  };
  const muted=audio&&!audio.sfxEnabled&&!audio.musicEnabled;
  return <section className="dr-studio-audio-audition" data-testid="studio-audio-audition">
    <div className="dr-studio-audio-audition-top">
      <strong>Audición de escena</strong>
      <small>Hasta {NARRATIVE_AUDITION_WINDOW_MS/1000} segundos · sin avanzar el duelo</small>
    </div>
    <div className="dr-studio-audio-audition-buttons">
      <button type="button" data-testid="studio-audition-start"
        disabled={playing||!audio||missingTrack} onClick={start}>
        ▶ Escuchar música + efecto
      </button>
      <button type="button" data-testid="studio-audition-stop"
        disabled={!playing} onClick={stop}>■ Detener</button>
    </div>
    <div className="dr-studio-audio-audition-progress" aria-hidden="true">
      <div style={{width:(elapsed/NARRATIVE_AUDITION_WINDOW_MS*100)+'%'}}/>
    </div>
    <small role="status" data-testid="studio-audition-status">
      {event} · {(elapsed/1000).toFixed(1)} s
    </small>
    {missingTrack&&<small>No se encontró la canción elegida en la biblioteca de este dispositivo.</small>}
    {muted&&<small>Música y efectos están desactivados: los tiempos se muestran, pero no se oirá sonido.</small>}
    <small>La música temporal se restaura al detener. Cambiar de paso cancela
      cualquier sonido pendiente; el navegador puede exigir permiso para reproducir audio.</small>
  </section>;
}
