import type { CardData } from '../types';

/** Dos líneas de texto visibles en la carta: nombre corto y efecto resumido.
 * Las descripciones originales se conservan para lógica, accesibilidad y avisos. */
export function getRoyalCardText(card: Pick<CardData, 'type' | 'rank'>, attackDamage = 2): {
  title: string;
  effect: string;
} {
  switch (card.type) {
    case 'ATTACK':
      return { title: 'Ataque', effect: `-${attackDamage} Vida rival` };
    case 'DEFENSE':
      return { title: 'Defensa', effect: '+1 Vida' };
    case 'ORDER':
      return { title: 'Orden', effect: 'Roba 1 carta' };
    case 'IMPACT': {
      const rankLabel = card.rank === 4 ? 'FINAL' : ['I', 'II', 'III'][Math.max(0, (card.rank ?? 1) - 1)] ?? 'I';
      return { title: `Impacto ${rankLabel}`, effect: card.rank === 4 ? 'Victoria' : 'Drena 1' };
    }
  }
}
