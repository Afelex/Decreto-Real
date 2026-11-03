/** Motivos reales de cierre de partida. Separar presentación de las reglas. */
export type BattleEndReason =
  | 'RIVAL_HP_ZERO'
  | 'PLAYER_HP_ZERO'
  | 'PLAYER_FINAL_DECREE'
  | 'OPPONENT_FINAL_DECREE'
  | 'PLAYER_SURRENDER'
  | 'DEVELOPMENT_VICTORY';

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

/** Voluntary surrender always produces a defeat without altering HP or Impactos. */
export function resolveSurrender(): BattleEndResult {
  return { phase: 'DEFEAT', reason: 'PLAYER_SURRENDER', title: 'Derrota', message: 'Te has rendido.' };
}

/** Temporary development-only outcome: not a normal game rule. */
export function resolveDevelopmentVictory(): BattleEndResult {
  return { phase: 'VICTORY', reason: 'DEVELOPMENT_VICTORY', title: 'Victoria', message: 'Victoria automática de prueba.' };
}
