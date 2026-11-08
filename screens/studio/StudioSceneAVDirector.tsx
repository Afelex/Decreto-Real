import React from 'react';
import {createSceneAVBeat} from '../../campaign/studio/avTimeline';
import {AUDIO_MUSIC_CUE_MODES,AUDIO_TIMING_PRESETS} from '../../campaign/studio/audioTimeline';
import {STUDIO_NARRATIVE_SOUND_CUES,STUDIO_NARRATIVE_MUSIC_MODES,
  type StudioNarrativeSoundCue,type StudioNarrativeMusicMode} from '../../campaign/studio/narrativeAudio';
import {STUDIO_NARRATIVE_TONES,STUDIO_PORTRAIT_MOTIONS,STUDIO_PORTRAIT_DURATION,
  type StudioNarrativeCard,type StudioPortraitMotion,type StudioNarrativeTone} from '../../campaign/studio/schema';
import {withAsset,withDialogue,withNarrativeCard} from '../../campaign/studio/ops';
import {useOptionalAudio} from '../../contexts/AudioContext';
import {useStudio} from './StudioContext';
import {StudioAVTracks} from './StudioAVTracks';

type Props={sceneKey:string;originalText:string;defaultSpeaker?:string;label:string};

/** Dirección audiovisual de cualquier escena con una clave de texto estable.
 * Es una herramienta de autoría: reproducir cues en escenas de campaña es
 * otra integración separada de este panel, y no debe simularse como terminada.
 */
export function StudioSceneAVDirector({sceneKey,originalText,defaultSpeaker='Narrador',label}:Props){
  const studio=useStudio();
  const audio=useOptionalAudio();
  const scene=studio.scene(sceneKey);
  const card=scene?.narrative;
  const patch=(fields:Parameters<typeof withNarrativeCard>[2])=>
    studio.apply(doc=>withNarrativeCard(doc,sceneKey,fields),
      'Dirección audiovisual de esta intervención actualizada');
  const beat=createSceneAVBeat({sceneKey,stepId:sceneKey,index:0,
    speaker:defaultSpeaker,text:originalText},studio.doc);
  const assets=Object.entries(studio.doc.assets??{}).filter(([,asset])=>asset.mime.startsWith('audio/'));
  const importMusic=async(file:File)=>{
    try{
      const stored=await studio.storeMedia(file);
      if(!stored.mime.startsWith('audio/'))throw new Error('Elige un archivo MP3 o WAV válido.');
      studio.apply(doc=>withNarrativeCard(withAsset(doc,stored.id,{
        name:stored.name,mime:stored.mime}),sceneKey,{musicAssetId:stored.id}),
        'Canción disponible y asociada a esta intervención');
    }catch(error){
      studio.setStatus(error instanceof Error?error.message:'No se pudo importar la canción.');
    }
  };
  const timelineFields=([
    ['musicStartDelayMs','Comenzar música'],
    ['musicStopAfterMs','Duración de música'],
    ['soundDelayMs','Comenzar efecto'],
    ['soundMaxDurationMs','Duración del efecto'],
  ] as const);
  return <div className="dr-studio-board-panel dr-studio-campaign-av-host"
    data-testid="studio-campaign-av-host">
    <details className="dr-studio-av-timeline" data-testid="studio-campaign-av">
      <summary>
        <strong>Director audiovisual · {label}</strong>
        <span>Diálogo, personajes, música y efectos</span>
      </summary>
      <div className="dr-studio-av-body">
        <p>Prepara esta intervención de la campaña con el mismo formato del tutorial.
          La duración de lectura es estimada; los tiempos aquí son instrucciones
          editoriales, <b>no activan todavía la reproducción automática en estas escenas</b>.</p>
        <StudioAVTracks beat={beat} context="campaign" heading={beat.speaker+' · '+label}/>
        <section className="dr-studio-av-quick" data-testid="studio-campaign-av-fields">
          <strong>Dirección de esta intervención</strong>
          <label className="dr-studio-label">Texto de diálogo
            <textarea rows={3} maxLength={600} data-testid="studio-campaign-av-text"
              value={beat.text} onFocus={studio.begin} onBlur={studio.commit}
              onChange={e=>studio.preview(doc=>withDialogue(doc,sceneKey,{
                text:e.target.value===originalText?null:e.target.value}))}/>
          </label>
          <div className="dr-studio-av-quick-grid">
            <label className="dr-studio-label">Personaje (ficha editorial)
              <input data-testid="studio-campaign-av-speaker"
                value={card?.speaker??defaultSpeaker} maxLength={80}
                onChange={e=>patch({speaker:e.target.value})}/>
            </label>
            <label className="dr-studio-label">Emoción
              <select data-testid="studio-campaign-av-tone"
                value={card?.tone??'neutral'}
                onChange={e=>patch({tone:e.target.value as StudioNarrativeTone})}>
                {STUDIO_NARRATIVE_TONES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Entrada
              <select data-testid="studio-campaign-av-enter"
                value={card?.enterMotion??'fade'}
                onChange={e=>patch({enterMotion:e.target.value as StudioPortraitMotion})}>
                {STUDIO_PORTRAIT_MOTIONS.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Salida
              <select data-testid="studio-campaign-av-exit"
                value={card?.exitMotion??'fade'}
                onChange={e=>patch({exitMotion:e.target.value as StudioPortraitMotion})}>
                {STUDIO_PORTRAIT_MOTIONS.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Duración transición
              <select data-testid="studio-campaign-av-motion"
                value={card?.motionDurationMs??STUDIO_PORTRAIT_DURATION.default}
                onChange={e=>patch({motionDurationMs:Number(e.target.value)})}>
                {[120,200,320,450,600,900,1200].map(v=><option key={v} value={v}>{v} ms</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Canción
              <select data-testid="studio-campaign-av-track"
                value={card?.musicAssetId??''}
                onChange={e=>patch({musicAssetId:e.target.value||null})}>
                <option value="">Pista habitual</option>
                {assets.map(([id,meta])=><option key={id} value={id}>{meta.name}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Intensidad
              <select data-testid="studio-campaign-av-volume"
                value={card?.musicMode??'normal'}
                onChange={e=>patch({musicMode:e.target.value as StudioNarrativeMusicMode})}>
                {STUDIO_NARRATIVE_MUSIC_MODES.map(v=><option key={v} value={v}>{
                  {normal:'Normal',soft:'Suave',silent:'Silencio'}[v]}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Música anterior
              <select data-testid="studio-campaign-av-music-action"
                value={card?.musicCueMode??'change'}
                onChange={e=>patch({musicCueMode:e.target.value as NonNullable<StudioNarrativeCard['musicCueMode']>})}>
                {AUDIO_MUSIC_CUE_MODES.map(v=><option key={v} value={v}>{
                  {change:'Cambiar canción',continue:'Continuar',stop:'Detener'}[v]}</option>)}
              </select>
            </label>
            <label className="dr-studio-label">Efecto
              <select data-testid="studio-campaign-av-sound"
                value={card?.soundCue??'none'}
                onChange={e=>patch({soundCue:e.target.value as StudioNarrativeSoundCue})}>
                {STUDIO_NARRATIVE_SOUND_CUES.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            {timelineFields.map(([key,title])=><label className="dr-studio-label" key={key}>
              {title}
              <select data-testid={'studio-campaign-av-'+key} value={card?.[key]??0}
                onChange={e=>patch({[key]:Number(e.target.value)})}>
                {AUDIO_TIMING_PRESETS[key].map(v=><option key={v} value={v}>{
                  v===0?'0 s':(v/1000).toLocaleString('es-EC')+' s'}</option>)}
              </select>
            </label>)}
          </div>
          <label className="dr-studio-label">Importar canción real (MP3 / WAV)
            <input type="file" data-testid="studio-campaign-av-upload"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={e=>{
                const file=e.currentTarget.files?.[0];
                e.currentTarget.value='';
                if(file)void importMusic(file);
              }}/>
          </label>
          {card?.musicAssetId&&studio.mediaUrls[card.musicAssetId]&&audio?.musicEnabled&&
            <audio controls preload="none" data-testid="studio-campaign-av-preview"
              src={studio.mediaUrls[card.musicAssetId]}/>}
          {card?.soundCue&&card.soundCue!=='none'&&
            <button type="button" data-testid="studio-campaign-av-preview-effect"
              disabled={!audio?.sfxEnabled}
              onClick={()=>audio?.playSound(card.soundCue!)}>
              ▶ Escuchar efecto
            </button>}
          <label className="dr-studio-label">Notas de dirección (solo editor)
            <textarea rows={2} data-testid="studio-campaign-av-direction" maxLength={360}
              value={card?.direction??''}
              onFocus={studio.begin} onBlur={studio.commit}
              onChange={e=>studio.preview(doc=>withNarrativeCard(doc,sceneKey,{
                direction:e.target.value}))}/>
          </label>
          <small>Los ajustes se guardan y exportan con tu documento v3. La escena continúa
            usando sus retratos y animaciones actuales; su conexión con el reproductor de
            historia será una integración posterior.</small>
        </section>
      </div>
    </details>
  </div>;
}
