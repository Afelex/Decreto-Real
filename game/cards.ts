export type CardKind = 'attack' | 'defense' | 'impact' | 'support';
export type CardEffect =
  | { type: 'damage'; amount: number }
  | { type: 'shield'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'impact'; rank: number };

export type Card = {
  id: string;
  name: string;
  kind: CardKind;
  cost: number;
  text: string;
  icon: string;
  effect: CardEffect;
};

export const CARD_LABELS: Record<CardKind, string> = {
  attack: 'ATAQUE',
  defense: 'DEFENSA',
  impact: 'IMPACTO',
  support: 'APOYO',
};

const CARD_POOL: Omit<Card, 'id'>[] = [
  ...Array.from({ length: 7 }, (_, i) => ({
    name: i % 2 ? 'Golpe preciso' : 'Asedio',
    kind: 'attack' as const,
    cost: i % 2 ? 1 : 2,
    text: i % 2 ? 'Inflige 3 de daño.' : 'Inflige 5 de daño.',
    icon: i % 2 ? '⚔' : '✦',
    effect: { type: 'damage' as const, amount: i % 2 ? 3 : 5 },
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    name: i % 2 ? 'Bastión' : 'Guardia real',
    kind: 'defense' as const,
    cost: i % 2 ? 1 : 2,
    text: i % 2 ? 'Obtén 4 de escudo.' : 'Obtén 7 de escudo.',
    icon: i % 2 ? '⬟' : '♜',
    effect: { type: 'shield' as const, amount: i % 2 ? 4 : 7 },
  })),
  ...Array.from({ length: 6 }, () => ({
    name: 'Inspiración', kind: 'support' as const, cost: 1,
    text: 'Roba una carta.', icon: '✧', effect: { type: 'draw' as const, amount: 1 },
  })),
  ...[1, 2, 3, 4].map((rank) => ({
    name: `Impacto ${['I', 'II', 'III', 'Final'][rank - 1]}`,
    kind: 'impact' as const,
    cost: 2,
    text: rank === 4 ? 'Sella el Decreto Final.' : `Sella el decreto ${rank}.`,
    icon: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][rank - 1],
    effect: { type: 'impact' as const, rank },
  })),
];

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const createDeck = (random: () => number = Math.random): Card[] => shuffle(
  CARD_POOL.map((card, index) => ({
    ...card,
    effect: { ...card.effect },
    id: `carta-${index}`,
  })),
  random,
);
