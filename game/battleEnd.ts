/** Motivos reales de cierre de partida. Separar presentación de las reglas. */
export type BattleEndReason =
  | 'RIVAL_HP_ZERO'
  | 'PLAYER_HP_ZERO'
  | 'PLAYER_FINAL_DECREE'
  | 'OPPONENT_FINAL_DECREE';

export type BattleEndResult = Readonly<{
  phase: 'VICTORY' | 'DEFEAT';
  reason: BattleEndReason;
  title: 'Victoria' | 'Derrota';
  message: string;
}>;

export type BattleEndSnapshot = Readonly<{
  playerHP: number;
  opponentHP: number;
  playerImpactLevel: number;
  opponentImpactLevel: number;
}>;

/** Priorizar Decreto Final si su último Impacto también redujo la vida a cero. */
export function resolveBattleEnd(state: BattleEndSnapshot): BattleEndResult | null {
  if (state.playerImpactLevel >= 4)
    return { phase: 'VICTORY', reason: 'PLAYER_FINAL_DECREE', title: 'Victoria', message: 'Victoria por Decreto Final' };
  if (state.opponentImpactLevel >= 4)
    return { phase: 'DEFEAT', reason: 'OPPONENT_FINAL_DECREE', title: 'Derrota', message: 'Tu rival invocó el Decreto Final' };
  if (state.playerHP <= 0)
    return { phase: 'DEFEAT', reason: 'PLAYER_HP_ZERO', title: 'Derrota', message: 'Tus puntos de vida llegaron a 0' };
  if (state.opponentHP <= 0)
    return { phase: 'VICTORY', reason: 'RIVAL_HP_ZERO', title: 'Victoria', message: 'Los puntos de vida de tu rival llegaron a 0' };
  return null;
}
