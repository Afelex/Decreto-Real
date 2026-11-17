import type { CardType } from '../types';

/** Presentation-only HUD state for the IA duel board. It is DERIVED from the
 * existing combat flags; it never drives turns, timers, HP or card rules. */
export type HudMode =
  | 'studio'        // DRStudio edits the board: every piece stays visible.
  | 'entrance'      // Gates and VS presentation.
  | 'coin'          // Deck preparation and coin toss.
  | 'story'         // Campaign dialogue over the board.
  | 'handoff'       // Full-screen "Tu Turno / Turno del Rival" banner.
  | 'player'        // The player may act.
  | 'rival'         // The rival is acting.
  | 'cue'           // A decree banner, effect or combo animation is playing.
  | 'combo-choice'  // Furia Real / Gracia Divina selector.
  | 'result';       // Victory or defeat.

export type HudModeInput = Readonly<{
  editing: boolean;
  entranceActive: boolean;
  finished: boolean;
  storyActive: boolean;
  phase: string;
  choosingCombo: boolean;
  cueActive: boolean;
}>;

/** One ordered decision so two HUD pieces can never disagree about the phase. */
export function resolveHudMode(input: HudModeInput): HudMode {
  if (input.editing) return 'studio';
  if (input.entranceActive) return 'entrance';
  if (input.finished) return 'result';
  if (input.storyActive) return 'story';
  if (input.phase === 'INIT' || input.phase === 'COIN_TOSS') return 'coin';
  if (input.choosingCombo) return 'combo-choice';
  if (input.cueActive) return 'cue';
  if (input.phase === 'TURN_BANNER') return 'handoff';
  return input.phase === 'PLAYER_TURN' ? 'player' : 'rival';
}

/** Four presentation tiers. Durations stay on the approved 1.5 s clock; the
 * tier only scales how much of the table an announcement may claim. */
export type CueTier = 'normal' | 'special' | 'combo2' | 'combo3';

export const cardCueTier = (type: CardType): CueTier =>
  type === 'IMPACT' || type === 'MYSTIC' ? 'special' : 'normal';

export const comboCueTier = (level: 2 | 3): CueTier => level === 3 ? 'combo3' : 'combo2';
