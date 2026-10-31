import { createDeck, type Card, type CardKind } from './cards.ts';
import { drawFromPile, GAME_RULES, nextComboStreak, resolveAttack, resolveImpact } from './rules.ts';
import { isBossId, selectBossMove, type BossId } from './bossTactics.ts';

/**
 * Record compatibility policy (see docs/DR-01-motor.md):
 * - The version names rules, RNG, action semantics and the event *data* schema. Texts are not part of it.
 * - Events are data only; player-facing messages are derived in combatText.ts and may change freely.
 * - Older versions listed in LEGACY_VERSIONS are replayed with the current rules and checked by projection:
 *   same event count, type, turn and every legacy data field. Their stored messages are ignored.
 */
export const ENGINE_VERSION = 'dr-combat-3';
export const LEGACY_VERSIONS = ['dr-combat-1', 'dr-combat-2'] as const;
export type Difficulty = 'Aprendiz' | 'Estratega' | 'Maestro';
export type CombatAction =
  | { type: 'play'; cardId: string }
  | { type: 'end_turn' }
  | { type: 'resolve_rival'; bossId?: BossId }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'difficulty'; value: Difficulty };
export type CombatEvent = {
  type: 'card' | 'attack' | 'shield' | 'impact' | 'draw' | 'turn' | 'result' | 'pause' | 'difficulty';
  turn: number;
  data: Record<string, string | number | boolean | string[]>;
};
export type JournalEntry = { readonly action: CombatAction; readonly events: readonly CombatEvent[] };
export type CombatRecord = { version: string; seed: number; difficulty: Difficulty; journal: JournalEntry[] };
export type CombatState = {
  version: string; seed: number; rng: number; initialDifficulty: Difficulty; difficulty: Difficulty;
  hand: Card[]; drawPile: Card[]; discard: Card[];
  mana: number; playerHp: number; enemyHp: number; shield: number; enemyShield: number;
  seals: number; enemySeals: number; impactPlayed: boolean; streak: number; lastKind: CardKind | null;
  turn: number; phase: 'player' | 'rival' | 'finished'; paused: boolean;
  winner: 'player' | 'rival' | null;
  lastPlay: { side: 'player' | 'rival'; name: string; icon: string } | null;
  /** Entries are frozen and shared between successive states, so each action costs O(1) cloning. */
  journal: readonly JournalEntry[];
};
export type PlayBlock = 'finished' | 'paused' | 'not_your_turn' | 'not_in_hand' | 'impact_order' | 'impact_used' | 'mana';
export const DIFFICULTIES: readonly Difficulty[] = ['Aprendiz', 'Estratega', 'Maestro'];
const isDifficulty = (value: unknown): value is Difficulty => DIFFICULTIES.includes(value as Difficulty);

/** Mulberry32: state and all random consumption are explicit and serializable. */
function randomStep(state: number): [number, number] {
  const next = (state + 0x6D2B79F5) >>> 0;
  let value = Math.imul(next ^ (next >>> 15), next | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [((value ^ (value >>> 14)) >>> 0) / 4294967296, next];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

export function createCombat(seed: number, difficulty: Difficulty = 'Estratega'): CombatState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff || !isDifficulty(difficulty)) throw new Error('Invalid combat configuration');
  let rng = seed;
  const deck = createDeck(() => { const [value, next] = randomStep(rng); rng = next; return value; });
  return {
    version: ENGINE_VERSION, seed, rng, initialDifficulty: difficulty, difficulty,
    hand: deck.slice(0, 4), drawPile: deck.slice(4), discard: [], mana: GAME_RULES.startingMana,
    playerHp: 20, enemyHp: 20, shield: 0, enemyShield: 0, seals: 0, enemySeals: 0,
    impactPlayed: false, streak: 0, lastKind: null, turn: 1, phase: 'player', paused: false,
    winner: null, lastPlay: null, journal: [],
  };
}

/** Copies only the fields each action defines; anything else in an external object is dropped. */
export function canonicalAction(action: unknown): CombatAction | null {
  if (!action || typeof action !== 'object') return null;
  const { type, cardId, value, bossId } = action as Record<string, unknown>;
  if (type === 'play') return typeof cardId === 'string' ? { type, cardId } : null;
  if (type === 'difficulty') return isDifficulty(value) ? { type, value } : null;
  if (type === 'resolve_rival') {
    if (bossId === undefined) return { type };
    return isBossId(bossId) ? { type, bossId } : null;
  }
  if (type === 'end_turn' || type === 'pause' || type === 'resume') return { type };
  return null;
}

/** Structured reason a card cannot be played now, shared by validation and the interface. */
export function playBlockReason(state: CombatState, cardId: string): PlayBlock | null {
  if (state.phase === 'finished') return 'finished';
  if (state.paused) return 'paused';
  if (state.phase !== 'player') return 'not_your_turn';
  const card = state.hand.find(item => item.id === cardId);
  if (!card) return 'not_in_hand';
  if (card.effect.type === 'impact' && card.effect.rank !== state.seals + 1) return 'impact_order';
  if (card.effect.type === 'impact' && state.impactPlayed) return 'impact_used';
  if (card.cost > state.mana) return 'mana';
  return null;
}

const blockMessages: Record<PlayBlock, string> = {
  finished: 'La partida ha terminado.', paused: 'La partida está en pausa.', not_your_turn: 'No es tu turno.',
  not_in_hand: 'La carta no está en tu mano.', impact_order: 'Los Impactos se juegan en orden.',
  impact_used: 'Ya jugaste un Impacto este turno.', mana: 'Falta mando.',
};

export function invalidAction(state: CombatState, input: CombatAction): string | null {
  if (state.version !== ENGINE_VERSION) return 'Versión de reglas incompatible.';
  if (state.phase === 'finished') return 'La partida ha terminado.';
  const action = canonicalAction(input);
  if (!action) return (input as { type?: unknown } | null)?.type === 'difficulty' ? 'Dificultad inválida.' : 'Acción desconocida.';
  if (action.type === 'pause') return state.paused ? 'La partida ya está en pausa.' : null;
  if (action.type === 'resume') return state.paused ? null : 'La partida no está en pausa.';
  if (state.paused) return 'La partida está en pausa.';
  if (action.type === 'difficulty') return null;
  if (action.type === 'resolve_rival') return state.phase === 'rival' ? null : 'No es el turno del rival.';
  if (state.phase !== 'player') return 'No es tu turno.';
  if (action.type === 'end_turn') return null;
  const block = playBlockReason(state, action.cardId);
  return block ? blockMessages[block] : null;
}

/** Invalid actions preserve the input reference and never consume RNG or append a log. */
export function applyCombatAction(state: CombatState, input: CombatAction): { state: CombatState; events: readonly CombatEvent[]; error: string | null } {
  const error = invalidAction(state, input);
  if (error) return { state, events: [], error };
  const action = canonicalAction(input)!;
  const { journal, ...rest } = state;
  const next: CombatState = { ...structuredClone(rest), journal };
  const events: CombatEvent[] = [];
  const emit = (type: CombatEvent['type'], data: CombatEvent['data']) => { events.push({ type, turn: next.turn, data }); };
  const draw = (count: number) => {
    const result = drawFromPile(next.hand, next.drawPile, count, GAME_RULES.maxHand);
    next.hand = result.hand; next.drawPile = result.drawPile;
    // Empty pile is a no-op; fatigue/turn limit awaits a design decision.
    emit('draw', { requested: count, ids: result.drawn.map(card => card.id) });
  };
  const random = () => { const [value, rng] = randomStep(next.rng); next.rng = rng; return value; };
  if (action.type === 'pause' || action.type === 'resume') {
    next.paused = action.type === 'pause'; emit('pause', { paused: next.paused });
  } else if (action.type === 'difficulty') {
    next.difficulty = action.value; emit('difficulty', { value: action.value });
  } else if (action.type === 'end_turn') {
    next.phase = 'rival'; emit('turn', { phase: 'rival' });
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
      emit('attack', { side: 'player', ...result, bonus });
    } else if (card.effect.type === 'shield') {
      const amount = card.effect.amount + bonus;
      const before = next.shield; next.shield = Math.min(12, next.shield + amount);
      emit('shield', { side: 'player', gained: next.shield - before, bonus, amount, shield: next.shield });
    } else if (card.effect.type === 'impact') {
      next.impactPlayed = true;
      const result = resolveImpact(next.seals, next.playerHp);
      const healing = result.health - next.playerHp;
      next.seals = result.seals; next.playerHp = result.health;
      next.enemyHp = result.wins ? 0 : Math.max(0, next.enemyHp - result.damage);
      emit('impact', { side: 'player', seals: result.seals, healing, damage: result.damage });
    } else {
      draw(card.effect.amount);
    }
  } else if (action.type === 'resolve_rival') {
    // The optional boss style is carried by the canonical action. Saved records
    // and replays reproduce exactly the same decision with the seeded RNG.
    // Unstyled duels still execute their original decision tree unchanged.
    const bossMove = action.bossId ? selectBossMove(action.bossId, next, random()) : null;
    const danger = next.playerHp + next.shield;
    const shouldAttack = bossMove ? bossMove === 'attack' : next.difficulty === 'Aprendiz'
      ? danger <= 5 || next.enemyHp <= 4 || random() > 0.7
      : next.difficulty === 'Maestro'
        ? danger <= 12 || next.enemyHp <= 10 || next.enemyShield >= 3 || random() > 0.2
        : danger <= 8 || next.enemyHp <= 8 || next.enemyShield >= 5 || random() > 0.45;
    if (next.enemySeals >= 3) {
      next.lastPlay = { side: 'rival', name: 'Decreto Final', icon: 'Ⅳ' }; next.enemySeals = 4;
      emit('impact', { side: 'rival', seals: 4 });
    } else if (shouldAttack) {
      next.lastPlay = { side: 'rival', name: 'Ofensiva real', icon: '⚔' };
      const incoming = 3 + (next.enemyHp <= 8 ? 1 : 0);
      const result = resolveAttack(incoming, next.shield);
      next.shield = result.remainingShield; next.playerHp = Math.max(0, next.playerHp - result.damageDealt);
      emit('attack', { side: 'rival', ...result, incoming });
    } else if (bossMove === 'impact' || (bossMove === null && random() < (next.difficulty === 'Aprendiz' ? 0.2 : next.difficulty === 'Maestro' ? 0.7 : 0.45))) {
      next.lastPlay = { side: 'rival', name: `Impacto ${next.enemySeals + 1}`, icon: '✦' };
      const hp = next.playerHp, enemyHp = next.enemyHp;
      next.enemySeals++; next.playerHp = Math.max(0, next.playerHp - 1); next.enemyHp = Math.min(20, next.enemyHp + 1);
      emit('impact', { side: 'rival', seals: next.enemySeals, damage: hp - next.playerHp, healing: next.enemyHp - enemyHp });
    } else {
      next.lastPlay = { side: 'rival', name: 'Guardia del Virrey', icon: '⬟' };
      const before = next.enemyShield; next.enemyShield = Math.min(10, next.enemyShield + 3);
      emit('shield', { side: 'rival', shield: next.enemyShield, gained: next.enemyShield - before });
    }
    // Preserve the prototype's round count and end-of-response draw, including lethal replies.
    next.turn++; next.mana = 3; next.impactPlayed = false; draw(1); next.phase = 'player';
    emit('turn', { phase: 'player' });
  }
  if (next.playerHp <= 0 || next.enemySeals >= 4 || next.enemyHp <= 0 || next.seals >= 4) {
    next.winner = next.playerHp <= 0 || next.enemySeals >= 4 ? 'rival' : 'player';
    next.phase = 'finished'; emit('result', { winner: next.winner });
  }
  const entry = deepFreeze({ action, events });
  next.journal = [...journal, entry];
  return { state: next, events: entry.events, error: null };
}

export function exportCombat(state: CombatState): CombatRecord {
  return structuredClone({ version: state.version, seed: state.seed, difficulty: state.initialDifficulty, journal: [...state.journal] });
}

/** Shape check for records from outside the process (storage, files). Returns a reason or null. */
export function invalidRecord(input: unknown): string | null {
  if (!input || typeof input !== 'object') return 'El registro no es un objeto.';
  const record = input as Partial<Record<keyof CombatRecord, unknown>>;
  if (record.version !== ENGINE_VERSION && !LEGACY_VERSIONS.includes(record.version as typeof LEGACY_VERSIONS[number])) return 'Versión de registro incompatible.';
  if (!Number.isInteger(record.seed) || (record.seed as number) < 0 || (record.seed as number) > 0xffffffff) return 'Semilla inválida.';
  if (!isDifficulty(record.difficulty)) return 'Dificultad inválida.';
  if (!Array.isArray(record.journal)) return 'Falta el registro de acciones.';
  for (const entry of record.journal) {
    if (!entry || typeof entry !== 'object' || !canonicalAction(entry.action) || !Array.isArray(entry.events)) return 'Entrada de registro inválida.';
    for (const event of entry.events) if (!event || typeof event !== 'object' || typeof event.type !== 'string' || !Number.isInteger(event.turn) || !event.data || typeof event.data !== 'object') return 'Evento de registro inválido.';
  }
  return null;
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Legacy events must match on type, turn and each field they stored; new fields and old messages are ignored. */
const legacyMatch = (current: readonly CombatEvent[], stored: readonly CombatEvent[]) => current.length === stored.length
  && current.every((event, index) => event.type === stored[index].type && event.turn === stored[index].turn
    && Object.entries(stored[index].data).every(([key, value]) => sameJson(event.data[key], value)));

/** Rebuilds the state from the seed; rejects unknown versions, illegal actions and divergent events. */
export function replayCombat(input: CombatRecord): CombatState {
  const reason = invalidRecord(input);
  if (reason) throw new Error(reason);
  const legacy = input.version !== ENGINE_VERSION;
  let state = createCombat(input.seed, input.difficulty);
  for (const entry of input.journal) {
    const result = applyCombatAction(state, entry.action);
    const matches = legacy ? legacyMatch(result.events, entry.events) : sameJson(result.events, entry.events);
    if (result.error || !matches) throw new Error('Invalid or divergent combat record');
    state = result.state;
  }
  return state;
}
