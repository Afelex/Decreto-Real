import type { CombatEvent, CombatState } from './combatEngine.ts';

/** Presentation-only battle effect derived from the latest *accepted* engine action.
 * Nothing here changes the combat state, RNG, events, replay or saved records. */
export type BattleCue = Readonly<{
  side: 'player' | 'rival';
  kind: 'attack' | 'shield' | 'impact' | 'draw';
  label: string;
  value: number;
}>;

function eventNumber(event: CombatEvent, key: string): number {
  const value = event.data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function battleCue(state: CombatState): BattleCue | null {
  const entry = state.journal[state.journal.length - 1];
  if (!entry || (entry.action.type !== 'play' && entry.action.type !== 'resolve_rival')) return null;
  const effect = entry.events.find(event =>
    event.type === 'attack' || event.type === 'shield' || event.type === 'impact',
  );
  if (effect && (effect.type === 'attack' || effect.type === 'shield' || effect.type === 'impact')) {
    const side = effect.data.side === 'rival' ? 'rival' : 'player';
    if (effect.type === 'attack') {
      const value = eventNumber(effect, 'damageDealt');
      return { side, kind: 'attack', label: value ? `−${value} vida` : 'Bloqueado', value };
    }
    if (effect.type === 'shield') {
      const value = eventNumber(effect, 'gained');
      return { side, kind: 'shield', label: value ? `+${value} escudo` : 'Escudo al máximo', value };
    }
    const value = eventNumber(effect, 'seals');
    return { side, kind: 'impact', label: `Impacto ${value}/4`, value };
  }
  // A player support card may draw cards without changing health or shield.
  // Do not interpret the routine end-of-rival-turn draw as a player support.
  if (entry.action.type !== 'play') return null;
  const draw = entry.events.find(event => event.type === 'draw');
  if (!draw) return null;
  const ids = draw.data.ids;
  const count = Array.isArray(ids) ? ids.length : 0;
  return { side: 'player', kind: 'draw', label: count ? `+${count} cartas` : 'Mazo sin cartas', value: count };
}
