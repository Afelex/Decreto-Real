import type { GamePhase } from '../types';
import type { MusicSlot } from './audioAssets';

export const IA_CRITICAL_HP_LIMIT = 4; // 20% of 20 HP, same cutoff as the red HUD

/** Pure music selection: the entry cue is short, critical tension follows low HP,
 * and final results always override the regular combat theme. */
export function freeDuelMusicScene(input: {
  entranceActive: boolean;
  phase: GamePhase;
  playerHP: number;
  opponentHP: number;
}): Exclude<MusicSlot,'DEFAULT'> {
  if (input.entranceActive) return 'DUEL_ENTRANCE';
  if (input.phase === 'VICTORY') return 'VICTORY';
  if (input.phase === 'DEFEAT') return 'DEFEAT';
  if (input.playerHP <= IA_CRITICAL_HP_LIMIT || input.opponentHP <= IA_CRITICAL_HP_LIMIT) return 'CRITICAL';
  return 'BATTLE';
}
