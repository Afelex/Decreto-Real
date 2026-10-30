import type { Card } from './cards.ts';
import type { CombatState, JournalEntry, PlayBlock } from './combatEngine.ts';

/** Player-facing texts derived from event data. They are not stored in records, so they can change freely. */
export const OPENING_MESSAGE = 'Elige una carta para comenzar tu jugada.';

export const BLOCK_LABELS: Record<PlayBlock, { short: string; long: string }> = {
  finished: { short: 'Partida terminada', long: 'La partida ha terminado.' },
  paused: { short: 'En pausa', long: 'La partida está en pausa.' },
  not_your_turn: { short: 'Turno rival', long: 'Espera a que el rival termine su respuesta.' },
  not_in_hand: { short: 'No disponible', long: 'La carta ya no está en tu mano.' },
  impact_order: { short: 'Fuera de orden', long: 'Los Impactos se juegan en orden: I, II, III y Final.' },
  impact_used: { short: 'Uno por turno', long: 'Ya jugaste un Impacto este turno.' },
  mana: { short: 'Falta mando', long: 'No tienes mando suficiente este turno.' },
};

export function blockText(state: CombatState, block: PlayBlock, card?: Card) {
  if (block === 'mana' && card) return `Te faltan ${card.cost - state.mana} de mando.`;
  if (block === 'impact_order') return `Primero debes sellar el Impacto ${['I', 'II', 'III', 'Final'][state.seals] ?? ''}.`;
  return BLOCK_LABELS[block].long;
}

export const cardLookup = (state: CombatState) => {
  const cards = new Map<string, Card>();
  for (const card of [...state.hand, ...state.drawPile, ...state.discard]) cards.set(card.id, card);
  return cards;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** One entry can produce several lines (for example, an attack and the resulting victory). */
export function describeEntry(entry: JournalEntry, cards: Map<string, Card>): string[] {
  const lines: string[] = [];
  let name = '';
  for (const event of entry.events) {
    const d = event.data;
    const player = d.side === 'player';
    if (event.type === 'card') name = cards.get(String(d.id))?.name ?? 'Carta';
    else if (event.type === 'attack' && player) lines.push(`${name}: ${d.damageDealt} de daño; el escudo rival bloquea ${d.damageBlocked}.${d.bonus ? ' ¡Combo de ataque!' : ''}`);
    else if (event.type === 'attack') lines.push(`El rival ataca por ${d.incoming}. Tu escudo bloquea ${d.damageBlocked} y pierdes ${d.damageDealt} de vida.`);
    else if (event.type === 'shield' && player) {
      const lost = Number(d.amount) - Number(d.gained);
      lines.push(`${name}: obtienes ${d.gained} de escudo${lost > 0 ? ` (tope 12; ${lost} sin efecto)` : ''}.${d.bonus ? ' ¡Combo de defensa!' : ''}`);
    } else if (event.type === 'shield') {
      lines.push(Number(d.gained) > 0
        ? `El Virrey se protege: obtiene ${d.gained} de escudo${Number(d.gained) < 3 ? ' (tope 10)' : ''}.`
        : 'El Virrey intenta protegerse, pero su escudo ya está al máximo (10).');
    } else if (event.type === 'impact' && player) {
      lines.push(Number(d.seals) >= 4 ? '¡Decreto Final! Has sellado los cuatro decretos y ganado.'
        : `Impacto sellado: ${d.seals} de 4. El rival pierde ${d.damage} de vida y recuperas ${d.healing}.`);
    } else if (event.type === 'impact') {
      lines.push(Number(d.seals) >= 4 ? 'El Virrey ejecuta el Decreto Final.'
        : `El Virrey sella su Impacto ${d.seals}/4: pierdes ${d.damage} de vida y él recupera ${d.healing}.`);
    } else if (event.type === 'draw' && entry.action.type === 'play') {
      const drawn = (d.ids as string[]).length;
      lines.push(drawn ? `Inspiración: robas ${plural(drawn, 'carta')}.` : 'Inspiración: no hay cartas para robar o tu mano está llena.');
    } else if (event.type === 'turn' && d.phase === 'rival') lines.push('El Virrey estratega prepara su respuesta…');
    else if (event.type === 'difficulty') lines.push(`Dificultad cambiada a ${d.value}.`);
  }
  return lines;
}

/** Latest meaningful line, matching the board's single status message. */
export function currentMessage(state: CombatState) {
  const cards = cardLookup(state);
  for (let index = state.journal.length - 1; index >= 0; index--) {
    const lines = describeEntry(state.journal[index], cards);
    if (lines.length) return lines[lines.length - 1];
  }
  return OPENING_MESSAGE;
}

/** Most recent lines first, excluding the transient "rival prepares" notice. */
export function historyLines(state: CombatState, limit = 12) {
  const cards = cardLookup(state);
  const lines: string[] = [];
  for (let index = state.journal.length - 1; index >= 0 && lines.length < limit; index--) {
    const entry = state.journal[index];
    if (entry.action.type === 'end_turn') continue;
    const turn = entry.events[0]?.turn ?? state.turn;
    lines.push(...describeEntry(entry, cards).reverse().map(line => `Turno ${turn}: ${line}`));
  }
  return lines.slice(0, limit);
}
