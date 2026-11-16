import type { CardData } from '../types';

/** Presentación exclusivamente visual; nunca altera el estado del duelo. */
export function resolveDecreeFX(
  card: Pick<CardData, 'type' | 'rank'>,
  isPlayer: boolean,
): string | null {
  switch (card.type) {
    case 'ATTACK': return isPlayer ? 'A01' : 'A02';
    case 'DEFENSE': return 'A03';
    case 'ORDER': return 'A09';
    case 'IMPACT': return ({ 1: 'A05', 2: 'A06', 3: 'A07', 4: 'A08' } as Record<number, string>)[card.rank ?? 1] ?? 'A05';
    case 'MYSTIC': return 'D07'; // Plantilla común; habilidades específicas quedan para la próxima iteración.
    default: return null;
  }
}
