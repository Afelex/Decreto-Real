/** Dificultad del duelo libre frente a la IA. Las misiones de campaña no la utilizan. */
export const VS_IA_BASE_HP = 20;
export type VersusIaDifficulty = 'normal' | 'dificil' | 'extremo';
export const VERSUS_IA_DIFFICULTIES = [
  { id: 'normal', title: 'Normal', hp: 20, description: 'Comienzas con 20 PV.' },
  { id: 'dificil', title: 'Difícil', hp: 15, description: 'Comienzas con 15 PV; puedes curarte hasta 20.' },
  { id: 'extremo', title: 'Extremo', hp: 8, description: 'Comienzas con 8 PV; puedes curarte hasta 20.' },
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
export function limitVersusIaPlayerHp(hp: number, _value: unknown): number {
  // La dificultad solo modifica los PV iniciales: el máximo siempre es 20.
  return Math.max(0, Math.min(VS_IA_BASE_HP, hp));
}
