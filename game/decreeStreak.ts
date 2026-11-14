import type { CardType } from '../types';

/** The latest decree badge shows the actual consecutive-card streak that
 * drives the ×2/×3 combo, capped at 3. This is presentation-only logic,
 * shared with the existing battle gauge to avoid a misleading multiplier. */
export function nextDecreeStreak(previousType: CardType | null, previousLevel: number, type: CardType): 1 | 2 | 3 {
  return previousType === type ? Math.min(3, previousLevel + 1) as 1 | 2 | 3 : 1;
}
