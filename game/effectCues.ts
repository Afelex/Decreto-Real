import type { CardType } from '../types';

/** Video durations are measured from the supplied source clips, not UI animation guesses.
 * Each file is a transparent VP9/WebM built from the approved MP4 effect. */
export type EffectCue = { file: string | null; durationMs: number };

/** Each card activation is presented as two strictly consecutive stages:
 * 1.5 seconds of the colored banner AND its caption, then 1.5 seconds of
 * the transparent effect video, when that decree has an effect asset.
 * The media playback rate is adjusted to fit the stage rather than ending
 * the stage early when the source clip is shorter.
 */
export const DECREE_BANNER_DURATION_MS = 1500;
export const DECREE_EFFECT_DURATION_MS = 1500;

/** Keep the complete supplied clip visible for the requested duration.
 * Metadata may not be available yet; fallback to normal speed until it loads. */
export function syncCueVideoRate(video: HTMLVideoElement, durationMs: number): void {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  video.playbackRate = Math.max(0.25, Math.min(4, video.duration * 1000 / durationMs));
}

const CARD_CUES: Record<CardType, EffectCue> = {
  ATTACK: { file: 'efectos/ataque.webm', durationMs: 1680 },
  DEFENSE: { file: 'efectos/defensa.webm', durationMs: 1000 },
  ORDER: { file: 'efectos/orden.webm', durationMs: 1000 },
  // No replacement Impact footage was provided; keep the original banner.
  IMPACT: { file: null, durationMs: 2500 },
  MYSTIC: { file: null, durationMs: 700 },
};

const COMBO_CUES: Record<'DAMAGE' | 'HEAL', Record<2 | 3, EffectCue>> = {
  DAMAGE: {
    2: { file: 'efectos/combo-ataque-x2.webm', durationMs: 1000 },
    3: { file: 'efectos/combo-ataque-x3.webm', durationMs: 1680 },
  },
  HEAL: {
    2: { file: 'efectos/combo-defensa-x2.webm', durationMs: 1167 },
    3: { file: 'efectos/combo-defensa-x3.webm', durationMs: 1000 },
  },
};

export const cardEffectCue = (type: CardType): EffectCue => CARD_CUES[type];
export const comboEffectCue = (ability: 'DAMAGE' | 'HEAL', level: 2 | 3): EffectCue => COMBO_CUES[ability][level];
