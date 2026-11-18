/** Dificultad del duelo libre frente a la IA. Las misiones de campaña no la utilizan. */
export const VS_IA_BASE_HP = 20;
export type VersusIaDifficulty = 'normal' | 'dificil' | 'extremo';
export const VERSUS_IA_DIFFICULTIES = [
  { id: 'normal', title: 'Normal', hp: 20, description: 'La partida clásica, sin cambios.' },
  { id: 'dificil', title: 'Difícil', hp: 15, description: '25 % menos de vida para el jugador.' },
  { id: 'extremo', title: 'Extremo', hp: 5, description: 'Solo el 25 % de la vida normal.' },
] as const satisfies readonly {
  id: VersusIaDifficulty; title: string; hp: number; description: string;
}[];

/** Entradas desconocidas (enlaces directos /game, QA) conservan el juego original. */
export function versusIaDifficulty(value: unknown): VersusIaDifficulty {
  return value === 'dificil' || value === 'extremo' ? value : 'normal';
}
export function versusIaPlayerHp(value: unknown): number {
  const selected = versusIaDifficulty(value);
  return VERSUS_IA_DIFFICULTIES.find(option => option.id === selected)!.hp;
}
