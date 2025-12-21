export type CardType = "ATTACK" | "DEFENSE" | "IMPACT";

export interface CardData {
  id: string; // Changed to string for unique instances
  type: CardType;
  name: string;
  description: string;
  rank?: number; // 1, 2, 3, 4 for Impacts
  cost: number; // Keep for UI, even if logic says "any amount"
  img: string;
  rot?: string; // Visual rotation
  ty?: string; // Visual offset
}

export type GamePhase = 'INIT' | 'COIN_TOSS' | 'START_BANNER' | 'TURN_BANNER' | 'PLAYER_TURN' | 'OPPONENT_TURN' | 'VICTORY' | 'DEFEAT';
