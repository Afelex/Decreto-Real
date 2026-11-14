import type { CardType } from '../types';

/** Video durations are measured from the supplied source clips, not UI animation guesses.
 * Each file is a transparent VP9/WebM built from the approved MP4 effect. */
export type EffectCue = { file: string | null; durationMs: number };

/** Every decree announcement (player and rival) is visible for exactly two
 * second. The underlying energy clips retain their original source lengths
 * and are cut visually at the end of this presentation window. */
export const DECREE_BANNER_DURATION_MS = 2000;

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
