/** Primeras señales de audio del director narrativo.
 * La música existente del combate sigue siendo la única pista disponible.
 * Normal/suave/silencio controlan únicamente esa pista y respetan el ajuste
 * global de música del jugador. Sin URLs inventadas o archivos inexistentes.
 */
import type {StudioNarrativeCard} from './schema.ts';

export const STUDIO_NARRATIVE_MUSIC_MODES=['normal','soft','silent'] as const;
export type StudioNarrativeMusicMode=(typeof STUDIO_NARRATIVE_MUSIC_MODES)[number];
export const STUDIO_NARRATIVE_SOUND_CUES=[
  'none','CLICK','FLIP','ATTACK','DEFENSE','IMPACT',
] as const;
export type StudioNarrativeSoundCue=(typeof STUDIO_NARRATIVE_SOUND_CUES)[number];
export type NarrativeAudioCue={music:StudioNarrativeMusicMode;sound:StudioNarrativeSoundCue};
export function resolveNarrativeAudio(card:StudioNarrativeCard|undefined):NarrativeAudioCue {
  return {music:card?.musicMode??'normal',sound:card?.soundCue??'none'};
}

/** Cues modestos solo sobre texto no interactivo; las cartas tienen sus
 * propios sonidos y nunca se duplican automáticamente desde esta función. */
export const INITIAL_TUTORIAL_AUDIO:Readonly<Record<string,NarrativeAudioCue>>={
  g00:{music:'soft',sound:'CLICK'},
  g01:{music:'soft',sound:'none'},
  g02:{music:'soft',sound:'none'},
  g06:{music:'normal',sound:'CLICK'},
  g11:{music:'soft',sound:'none'},
  g17:{music:'soft',sound:'none'},
  g23:{music:'soft',sound:'none'},
  g28:{music:'soft',sound:'none'},
  g29:{music:'soft',sound:'none'},
  g31:{music:'silent',sound:'none'},
};
