import React from 'react';
import {GUIDED_STEPS} from '../../campaign/guidedOpeningDuel';
import {createGuidedAVTimeline,avEventLeft,avEventWidth,type AVLane} from '../../campaign/studio/avTimeline';
import {AUDIO_MUSIC_CUE_MODES,AUDIO_TIMING_PRESETS} from '../../campaign/studio/audioTimeline';
import {STUDIO_NARRATIVE_SOUND_CUES,STUDIO_NARRATIVE_MUSIC_MODES} from '../../campaign/studio/narrativeAudio';
import {STUDIO_NARRATIVE_TONES,STUDIO_PORTRAIT_MOTIONS,
  type StudioNarrativeCard, type StudioNarrativeTone, type StudioPortraitMotion} from '../../campaign/studio/schema';
import {withDialogue,withNarrativeCard} from '../../campaign/studio/ops';
import {useStudio} from './StudioContext';

type Props={selectedIndex:number;onSelect:(index:number)=>void};
const LANES:readonly {key:AVLane;label:string}[]=[
  {key:'dialogue',label:'Diálogo'},
  {key:'portrait',label:'Personaje'},
  {key:'music',label:'Música'},
  {key:'effect',label:'Efecto'},
  {key:'action',label:'Acción'},
];
const fmt=(ms:number)=>(ms/1000).toLocaleString('es-EC',{maximumFractionDigits:2})+' s';

/** Vista conjunta del primer duelo: la escala es relativa a CADA intervención.
 * Los pasos se recorren manualmente; el cálculo de lectura no es un temporizador.
 */
export function StudioGuidedAVTimeline({selectedIndex,onSelect}:Props){
  const studio=useStudio();
  const beats=React.useMemo(()=>createGuidedAVTimeline(GUIDED_STEPS,studio.doc),[studio.doc]);
  const [filter,setFilter]=React.useState<'all'|'action'|'audio'>('all');
  const beat=beats[selectedIndex]??beats[0];
  const step=GUIDED_STEPS[selectedIndex]??GUIDED_STEPS[0];
  const sceneKey='tutorial/'+step.id;
  const narrative=studio.doc.scenes[sceneKey]?.narrative;
  const patch=(data:Parameters<typeof withNarrativeCard>[2])=>
    studio.apply(doc=>withNarrativeCard(doc,sceneKey,data),'Dirección audiovisual actualizada');
  const shown=beats.filter(item=>filter==='all'||
    filter==='action'&&Boolean(item.actionLabel)||
    filter==='audio'&&(item.soundLabel!=='none'||item.cueMode!=='change'||
      Boolean(studio.doc.scenes['tutorial/'+item.stepId]?.narrative?.musicAssetId)));
  const audioAssets=Object.entries(studio.doc.assets??{}).filter(([,meta])=>meta.mime.startsWith('audio/'));
  const timing=narrative??{};
  const previous=()=>onSelect(Math.max(0,selectedIndex-1));
  const next=()=>onSelect(Math.min(GUIDED_STEPS.length-1,selectedIndex+1));
  return <details className="dr-studio-av-timeline" data-testid="studio-av-timeline">
    <summary><strong>Línea audiovisual · {beats.length} intervenciones</strong>
      <span>Diálogo, personajes, música y efectos en una sola vista</span></summary>
    <div className="dr-studio-av-body">
      <p>Vista editorial del prólogo. Cada escala comienza en 0 s al aparecer su diálogo.
        La lectura es estimada; <b>el jugador sigue avanzando manualmente</b> y el combate conserva sus acciones.</p>
      <div className="dr-studio-av-nav">
        <button type="button" data-testid="studio-av-prev" disabled={selectedIndex===0}
          onClick={previous}>‹ Anterior</button>
        <strong>Intervención {selectedIndex+1} de {beats.length}</strong>
        <button type="button" data-testid="studio-av-next" disabled={selectedIndex===beats.length-1}
          onClick={next}>Siguiente ›</button>
      </div>
      <label className="dr-studio-label">Mostrar intervenciones
        <select data-testid="studio-av-filter" value={filter}
          onChange={e=>setFilter(e.target.value as typeof filter)}>
          <option value="all">Las 32 intervenciones</option>
          <option value="action">Solo acciones del combate</option>
          <option value="audio">Con indicaciones sonoras</option>
        </select>
      </label>
      <div className="dr-studio-av-sequence" data-testid="studio-av-sequence"
        role="group" aria-label="Elegir intervención audiovisual">
        {shown.map(item=><button key={item.stepId} type="button"
          className={'dr-studio-av-step'+(item.index===selectedIndex?' is-current':'')}
          data-testid="studio-av-step" data-step={item.stepId}
          aria-current={item.index===selectedIndex?'step':undefined}
          onClick={()=>onSelect(item.index)}>
          <b>{String(item.index+1).padStart(2,'0')}</b>
          {item.spritePath?<img src={import.meta.env.BASE_URL+item.spritePath} loading="lazy"
            alt="" aria-hidden="true"/>:<span className="dr-studio-av-no-sprite">◈</span>}
          <small>{item.speaker}</small>
          <span>{item.soundLabel!=='none'?'♪ ':''}{item.actionLabel?'⚔ ':''}{item.tone}</span>
        </button>)}
      </div>
      <section className="dr-studio-av-inspector" data-testid="studio-av-inspector"
        aria-label="Pistas de la intervención seleccionada">
        <header>
          <strong>{beat.speaker} · paso {selectedIndex+1}</strong>
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
            'Sin retrato grande durante esta intervención'}.
          La duración del diálogo es una estimación de lectura y no provoca avance automático.
        </small>
      </section>
      <section className="dr-studio-av-quick" data-testid="studio-av-quick-edit">
        <strong>Editar esta intervención</strong>
        <label className="dr-studio-label">Diálogo
          <textarea rows={3} maxLength={600} data-testid="studio-av-dialogue"
            value={beat.text} onFocus={studio.begin} onBlur={studio.commit}
            onChange={e=>studio.preview(doc=>withDialogue(doc,sceneKey,{text:e.target.value}))}/>
        </label>
        <div className="dr-studio-av-quick-grid">
          <label className="dr-studio-label">Emoción
            <select data-testid="studio-av-tone" value={narrative?.tone??'neutral'}
              onChange={e=>patch({tone:e.target.value as StudioNarrativeTone})}>
              {STUDIO_NARRATIVE_TONES.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Entrada del personaje
            <select data-testid="studio-av-enter" value={narrative?.enterMotion??'fade'}
              onChange={e=>patch({enterMotion:e.target.value as StudioPortraitMotion})}>
              {STUDIO_PORTRAIT_MOTIONS.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Música
            <select data-testid="studio-av-music-track" value={narrative?.musicAssetId??''}
              onChange={e=>patch({musicAssetId:e.target.value||null})}>
              <option value="">Pista habitual</option>
              {audioAssets.map(([id,meta])=><option value={id} key={id}>{meta.name}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Intensidad
            <select data-testid="studio-av-music-mode" value={narrative?.musicMode??'normal'}
              onChange={e=>patch({musicMode:e.target.value as NonNullable<StudioNarrativeCard['musicMode']>})}>
              {STUDIO_NARRATIVE_MUSIC_MODES.map(v=><option value={v} key={v}>{
                {normal:'Normal',soft:'Suave',silent:'Silencio'}[v]}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Acción de música
            <select data-testid="studio-av-music-cue-mode" value={narrative?.musicCueMode??'change'}
              onChange={e=>patch({musicCueMode:e.target.value as NonNullable<StudioNarrativeCard['musicCueMode']>})}>
              <option value="change">Cambiar pista</option>
              <option value="continue">Continuar anterior</option>
              <option value="stop">Detener</option>
            </select>
          </label>
          <label className="dr-studio-label">Efecto
            <select data-testid="studio-av-sound" value={narrative?.soundCue??'none'}
              onChange={e=>patch({soundCue:e.target.value as NonNullable<StudioNarrativeCard['soundCue']>})}>
              {STUDIO_NARRATIVE_SOUND_CUES.map(v=><option value={v} key={v}>{v}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Retraso música
            <select data-testid="studio-av-music-delay" value={timing.musicStartDelayMs??0}
              onChange={e=>patch({musicStartDelayMs:Number(e.target.value)})}>
              {AUDIO_TIMING_PRESETS.musicStartDelayMs.map(v=><option value={v} key={v}>{fmt(v)}</option>)}
            </select>
          </label>
          <label className="dr-studio-label">Retraso efecto
            <select data-testid="studio-av-effect-delay" value={timing.soundDelayMs??0}
              onChange={e=>patch({soundDelayMs:Number(e.target.value)})}>
              {AUDIO_TIMING_PRESETS.soundDelayMs.map(v=><option value={v} key={v}>{fmt(v)}</option>)}
            </select>
          </label>
        </div>
        <small>La ficha completa, situada debajo, conserva los demás parámetros (salida, duración y recursos).
          Los cambios de esta vista también admiten Deshacer y se guardan en el mismo documento.</small>
      </section>
    </div>
  </details>;
}
