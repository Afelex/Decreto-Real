import type { CardData } from '../types.ts';
import { canActivateMystic } from './mysticCards.ts';

export type CardDropZone = 'field' | 'impact-1' | 'impact-2' | 'impact-3' | 'impact-4';

/** Presentation-only validation. The original game's attack, healing,
 * combo and Impact effects remain in GameBoard.playCard. */
export function checkCardPlacement(
  card: Pick<CardData, 'type' | 'rank' | 'mysticId'>,
  zone: CardDropZone,
  impactLevel: number,
  impactPlayedThisTurn: boolean,
): { valid: true } | { valid: false; message: string } {
  if (card.type === 'IMPACT') {
    const rank = card.rank;
    if (impactPlayedThisTurn) return { valid: false, message: 'Solo puedes jugar un Impacto por turno.' };
    if (rank !== impactLevel + 1 || !rank || rank > 4) {
      return { valid: false, message: `Primero debes jugar Impacto ${['I', 'II', 'III', 'Final'][impactLevel] ?? 'I'}.` };
    }
    if (zone !== `impact-${rank}`) {
      return { valid: false, message: `Coloca Impacto ${rank === 4 ? 'Final' : ['I','II','III'][rank - 1]} en la casilla ${rank}.` };
    }
    return { valid: true };
  }
  if (card.type === 'MYSTIC' && !canActivateMystic(card.mysticId, impactPlayedThisTurn)) {
    return { valid: false, message: 'Sol Negro también sella un Impacto. Solo puedes sellar uno por turno.' };
  }
  if (zone !== 'field') {
    return { valid: false, message: 'Arrastra Ataque, Defensa, Orden o Mística al centro del campo.' };
  }
  return { valid: true };
}

/** The stone tiles double as visual activation targets for regular cards.
 * This only normalizes the UI hit target; it never changes Impact rank rules. */
export function resolveVisualDropZone(
  card: Pick<CardData, 'type'>,
  zone: CardDropZone,
): CardDropZone {
  return card.type === 'IMPACT' ? zone : 'field';
}

export function cardPlacementPrompt(
  card: Pick<CardData, 'type' | 'name' | 'rank'> | null,
  impactLevel: number,
): string {
  if (!card) return 'Selecciona una carta y arrástrala al campo.';
  if (card.type === 'MYSTIC' && card.mysticId === 'siguman-3') {
    return 'Sol Negro sella un Impacto: arrástralo al centro del campo.';
  }
  if (card.type === 'IMPACT') {
    return card.rank === impactLevel + 1
      ? `Arrastra ${card.name} a la casilla ${card.rank}.`
      : `Necesitas Impacto ${['I', 'II', 'III', 'Final'][impactLevel] ?? 'I'} primero.`;
  }
  return `Arrastra ${card.name} al centro para activarla.`;
}
