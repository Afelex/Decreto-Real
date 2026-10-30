import { createDeck, type Card, type CardKind } from './cards.ts';
import { drawFromPile, GAME_RULES, nextComboStreak, resolveAttack, resolveImpact } from './rules.ts';

export const ENGINE_VERSION = 'dr-combat-1';
export type Difficulty = 'Aprendiz' | 'Estratega' | 'Maestro';
export type CombatAction =
  | { type: 'play'; cardId: string }
  | { type: 'end_turn' }
  | { type: 'resolve_rival' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'difficulty'; value: Difficulty };
export type CombatEvent = {
  type: 'card' | 'attack' | 'shield' | 'impact' | 'draw' | 'turn' | 'result' | 'pause' | 'difficulty';
  turn: number;
  message?: string;
  data: Record<string, string | number | boolean | string[]>;
};
export type JournalEntry = { action: CombatAction; events: CombatEvent[] };
export type CombatRecord = { version: string; seed: number; difficulty: Difficulty; journal: JournalEntry[] };
export type CombatState = {
  version: string; seed: number; rng: number; initialDifficulty: Difficulty; difficulty: Difficulty;
  hand: Card[]; drawPile: Card[]; discard: Card[];
  mana: number; playerHp: number; enemyHp: number; shield: number; enemyShield: number;
  seals: number; enemySeals: number; impactPlayed: boolean; streak: number; lastKind: CardKind | null;
  turn: number; phase: 'player' | 'rival' | 'finished'; paused: boolean;
  winner: 'player' | 'rival' | null; message: string;
  lastPlay: { side: 'player' | 'rival'; name: string; icon: string } | null;
  journal: JournalEntry[];
};
const difficulties = ['Aprendiz', 'Estratega', 'Maestro'];

/** Mulberry32: state and all random consumption are explicit and serializable. */
function randomStep(state: number): [number, number] {
  const next = (state + 0x6D2B79F5) >>> 0;
  let value = Math.imul(next ^ (next >>> 15), next | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [((value ^ (value >>> 14)) >>> 0) / 4294967296, next];
}

export function createCombat(seed: number, difficulty: Difficulty = 'Estratega'): CombatState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff || !difficulties.includes(difficulty)) throw new Error('Invalid combat configuration');
  let rng = seed;
  const deck = createDeck(() => { const [value, next] = randomStep(rng); rng = next; return value; });
  return {
    version: ENGINE_VERSION, seed, rng, initialDifficulty: difficulty, difficulty,
    hand: deck.slice(0, 4), drawPile: deck.slice(4), discard: [], mana: GAME_RULES.startingMana,
    playerHp: 20, enemyHp: 20, shield: 0, enemyShield: 0, seals: 0, enemySeals: 0,
    impactPlayed: false, streak: 0, lastKind: null, turn: 1, phase: 'player', paused: false,
    winner: null, message: 'Elige una carta para comenzar tu jugada.', lastPlay: null, journal: [],
  };
}

export function invalidAction(state: CombatState, action: CombatAction): string | null {
  if (state.version !== ENGINE_VERSION) return 'Versión de reglas incompatible.';
  if (state.phase === 'finished') return 'La partida ha terminado.';
  if (!action || typeof action !== 'object') return 'Acción desconocida.';
  if (action.type === 'pause') return state.paused ? 'La partida ya está en pausa.' : null;
  if (action.type === 'resume') return state.paused ? null : 'La partida no está en pausa.';
  if (state.paused) return 'La partida está en pausa.';
  if (action.type === 'difficulty') return difficulties.includes(action.value) ? null : 'Dificultad inválida.';
  if (action.type === 'resolve_rival') return state.phase === 'rival' ? null : 'No es el turno del rival.';
  if (action.type !== 'play' && action.type !== 'end_turn') return 'Acción desconocida.';
  if (state.phase !== 'player') return 'No es tu turno.';
  if (action.type === 'end_turn') return null;
  const card = state.hand.find(item => item.id === action.cardId);
  if (!card) return 'La carta no está en tu mano.';
  if (card.cost > state.mana) return 'Falta mando.';
  if (card.effect.type === 'impact' && (state.impactPlayed || card.effect.rank !== state.seals + 1)) return 'Impacto no permitido.';
  return null;
}

/** Invalid actions preserve the input reference and never consume RNG or append a log. */
export function applyCombatAction(state: CombatState, action: CombatAction): { state: CombatState; events: CombatEvent[]; error: string | null } {
  const error = invalidAction(state, action);
  if (error) return { state, events: [], error };
  const next = structuredClone(state);
  const events: CombatEvent[] = [];
  const emit = (type: CombatEvent['type'], data: CombatEvent['data'], message?: string) => {
    events.push({ type, turn: next.turn, data, ...(message ? { message } : {}) });
    if (message) next.message = message;
  };
  const draw = (count: number) => {
    const result = drawFromPile(next.hand, next.drawPile, count, GAME_RULES.maxHand);
    next.hand = result.hand; next.drawPile = result.drawPile;
    // Empty pile is a no-op; fatigue/turn limit awaits a design decision.
    emit('draw', { requested: count, ids: result.drawn.map(card => card.id) });
    return result.drawn.length;
  };
  const random = () => { const [value, rng] = randomStep(next.rng); next.rng = rng; return value; };
  if (action.type === 'pause' || action.type === 'resume') {
    next.paused = action.type === 'pause'; emit('pause', { paused: next.paused });
  } else if (action.type === 'difficulty') {
    next.difficulty = action.value;
    emit('difficulty', { value: action.value }, `Dificultad cambiada a ${action.value}.`);
  } else if (action.type === 'end_turn') {
    next.phase = 'rival'; emit('turn', { phase: 'rival' }, 'El Virrey estratega prepara su respuesta…');
  } else if (action.type === 'play') {
    const card = next.hand.find(item => item.id === action.cardId)!;
    next.mana -= card.cost; next.hand = next.hand.filter(item => item.id !== card.id); next.discard.push(card);
    next.lastPlay = { side: 'player', name: card.name, icon: card.icon };
    emit('card', { id: card.id, cost: card.cost });
    const combo = nextComboStreak(next.lastKind, next.streak, card.kind);
    next.lastKind = card.kind; next.streak = combo.count;
    const bonus = combo.triggered ? 2 : 0;
    if (card.effect.type === 'damage') {
      const result = resolveAttack(card.effect.amount, next.enemyShield, bonus);
      next.enemyHp = Math.max(0, next.enemyHp - result.damageDealt); next.enemyShield = result.remainingShield;
      emit('attack', { side: 'player', ...result, bonus }, `${card.name}: ${result.damageDealt} de daño; el escudo rival bloquea ${result.damageBlocked}.${bonus ? ' ¡Combo de ataque!' : ''}`);
    } else if (card.effect.type === 'shield') {
      const amount = card.effect.amount + bonus;
      const before = next.shield; next.shield = Math.min(12, next.shield + amount);
      emit('shield', { side: 'player', gained: next.shield - before, bonus }, `${card.name}: obtienes ${amount} de escudo.${bonus ? ' ¡Combo de defensa!' : ''}`);
    } else if (card.effect.type === 'impact') {
      next.impactPlayed = true;
      const result = resolveImpact(next.seals, next.playerHp);
      const healing = result.health - next.playerHp;
      next.seals = result.seals; next.playerHp = result.health;
      next.enemyHp = result.wins ? 0 : Math.max(0, next.enemyHp - result.damage);
      emit('impact', { side: 'player', seals: result.seals, healing, damage: result.damage }, result.wins ? '¡Decreto Final! Has sellado los cuatro decretos y ganado.' : `Impacto sellado: ${result.seals} de 4. Recuperas ${healing} de vida.`);
    } else {
      const drawn = draw(card.effect.amount);
      events[events.length - 1].message = next.message = drawn ? `Inspiración: robas ${drawn} carta${drawn === 1 ? '' : 's'}.` : 'Inspiración: no hay cartas para robar o tu mano está llena.';
    }
  } else if (action.type === 'resolve_rival') {
    const danger = next.playerHp + next.shield;
    const shouldAttack = next.difficulty === 'Aprendiz'
      ? danger <= 5 || next.enemyHp <= 4 || random() > 0.7
      : next.difficulty === 'Maestro'
        ? danger <= 12 || next.enemyHp <= 10 || next.enemyShield >= 3 || random() > 0.2
        : danger <= 8 || next.enemyHp <= 8 || next.enemyShield >= 5 || random() > 0.45;
    if (next.enemySeals >= 3) {
      next.lastPlay = { side: 'rival', name: 'Decreto Final', icon: 'Ⅳ' }; next.enemySeals = 4;
      emit('impact', { side: 'rival', seals: 4 }, 'El Virrey ejecuta el Decreto Final.');
    } else if (shouldAttack) {
      next.lastPlay = { side: 'rival', name: 'Ofensiva real', icon: '⚔' };
      const incoming = 3 + (next.enemyHp <= 8 ? 1 : 0);
      const result = resolveAttack(incoming, next.shield);
      next.shield = result.remainingShield; next.playerHp = Math.max(0, next.playerHp - result.damageDealt);
      emit('attack', { side: 'rival', ...result }, `El rival ataca por ${incoming}. Tu escudo bloquea ${result.damageBlocked}.`);
    } else if (random() < (next.difficulty === 'Aprendiz' ? 0.2 : next.difficulty === 'Maestro' ? 0.7 : 0.45)) {
      next.lastPlay = { side: 'rival', name: `Impacto ${next.enemySeals + 1}`, icon: '✦' };
      next.enemySeals++; next.playerHp = Math.max(0, next.playerHp - 1); next.enemyHp = Math.min(20, next.enemyHp + 1);
      emit('impact', { side: 'rival', seals: next.enemySeals }, `El Virrey sella su Impacto ${next.enemySeals}/4 y recupera 1 de vida.`);
    } else {
      next.lastPlay = { side: 'rival', name: 'Guardia del Virrey', icon: '⬟' }; next.enemyShield = Math.min(10, next.enemyShield + 3);
      emit('shield', { side: 'rival', shield: next.enemyShield }, 'El Virrey se protege: obtiene 3 de escudo.');
    }
    // Preserve the prototype's round count and end-of-response draw, including lethal replies.
    next.turn++; next.mana = 3; next.impactPlayed = false; draw(1); next.phase = 'player';
    emit('turn', { phase: 'player' });
  }
  if (next.playerHp <= 0 || next.enemySeals >= 4 || next.enemyHp <= 0 || next.seals >= 4) {
    next.winner = next.playerHp <= 0 || next.enemySeals >= 4 ? 'rival' : 'player';
    next.phase = 'finished'; emit('result', { winner: next.winner });
  }
  next.journal.push({ action: structuredClone(action), events: structuredClone(events) });
  return { state: next, events, error: null };
}

export function exportCombat(state: CombatState): CombatRecord {
  return structuredClone({ version: state.version, seed: state.seed, difficulty: state.initialDifficulty, journal: state.journal });
}

export function replayCombat(record: CombatRecord): CombatState {
  if (record.version !== ENGINE_VERSION) throw new Error('Unsupported combat version');
  let state = createCombat(record.seed, record.difficulty);
  for (const entry of record.journal) {
    const result = applyCombatAction(state, entry.action);
    if (result.error || JSON.stringify(result.events) !== JSON.stringify(entry.events)) throw new Error('Invalid or divergent combat record');
    state = result.state;
  }
  return state;
}
