/** Client-side statistics inferred only from ordered, server-confirmed snapshots.
 * A reconnect or missed revision makes cumulative counters unknown, never invented.
 * No value here authorizes a combat move or influences the WebSocket protocol. */
export type PvpStatsView = Readonly<{
  revision: number;
  status: 'playing' | 'finished';
  turnNumber: number;
  me: Readonly<{ hp: number; impact: number }>;
  opponent: Readonly<{ hp: number }>;
}>;
export type PvpStats = Readonly<{
  startedAt: number;
  durationMs: number;
  healthRecovered: number;
  damageDealt: number;
  impactsSummoned: number;
  complete: boolean;
  stopped: boolean;
}>;

export function advancePvpStats(
  stats: PvpStats | null,
  previous: PvpStatsView | null,
  next: PvpStatsView,
  now = Date.now(),
): PvpStats {
  if (!stats || !previous) {
    return {
      startedAt: now, durationMs: 0, healthRecovered: 0, damageDealt: 0,
      impactsSummoned: 0, stopped: next.status === 'finished',
      complete: next.turnNumber === 1 && next.status === 'playing',
    };
  }
  if (next.revision <= previous.revision || stats.stopped) return stats;
  const ordered = next.revision === previous.revision + 1;
  return {
    startedAt: stats.startedAt,
    durationMs: Math.max(0, now - stats.startedAt),
    healthRecovered: stats.healthRecovered + Math.max(0, next.me.hp - previous.me.hp),
    damageDealt: stats.damageDealt + Math.max(0, previous.opponent.hp - next.opponent.hp),
    impactsSummoned: stats.impactsSummoned + Math.max(0, next.me.impact - previous.me.impact),
    complete: stats.complete && ordered,
    stopped: next.status === 'finished',
  };
}

/** A10 draw animations correspond to accepted changes of either deck. */
export function confirmedPvpDraws(previous: PvpStatsView & {
  me: { deckCount: number; hp: number; impact: number };
  opponent: { deckCount: number; hp: number };
} | null, next: PvpStatsView & {
  me: { deckCount: number; hp: number; impact: number };
  opponent: { deckCount: number; hp: number };
}): Array<{ side: 'PLAYER' | 'OPPONENT'; count: number }> {
  if (!previous || next.revision <= previous.revision) return [];
  // Never replay a burst of unobserved turns as a misleading single draw.
  if (next.revision > previous.revision + 1) return [];
  const draws: Array<{ side: 'PLAYER' | 'OPPONENT'; count: number }> = [];
  const mine = previous.me.deckCount - next.me.deckCount;
  const theirs = previous.opponent.deckCount - next.opponent.deckCount;
  if (mine > 0) draws.push({ side: 'PLAYER', count: mine });
  if (theirs > 0) draws.push({ side: 'OPPONENT', count: theirs });
  return draws;
}
