import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Server-authoritative PvP ledger. Optional durable JSON path must point to a
 * mounted persistent volume (not Railway's ephemeral application filesystem).
 * Guests are identified by their social secret hash, never by a mutable alias.
 */
export function createMatchLedger(file = '') {
  let records = [];
  if (file && existsSync(file)) {
    const stored = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(stored) || stored.some(item => !item || typeof item.matchId !== 'string'))
      throw new Error('Historial PvP no válido; no se inicia con datos corruptos.');
    records = stored;
  }
  const seen = new Set(records.map(item => item.matchId));
  const durable = Boolean(file);

  function save(next) {
    if (!file) return;
    mkdirSync(dirname(file), { recursive: true });
    const temp = file + '.tmp';
    writeFileSync(temp, JSON.stringify(next), { encoding: 'utf8', mode: 0o600 });
    renameSync(temp, file);
  }

  function record({ matchId, mode, players, winner, turns, reason }) {
    if (typeof matchId !== 'string' || !/^[a-f0-9]{24}$/.test(matchId) ||
      seen.has(matchId) || !['casual', 'ranked'].includes(mode) ||
      !Array.isArray(players) || players.length !== 2 ||
      players.some(p => !p || typeof p.id !== 'string' || !/^[a-f0-9]{24}$/.test(p.id) ||
        typeof p.name !== 'string' || !p.name.trim()) ||
      players[0].id === players[1].id ||
      (winner !== null && winner !== 0 && winner !== 1)) return false;
    // An authoritative match is persisted once. Duplicated final snapshots do nothing.
    const next = [...records, {
      matchId, mode, players: players.map(p => ({ id: p.id, name: p.name.slice(0, 24) })),
      winner, turns: Number.isInteger(turns) ? Math.max(1, turns) : 1,
      reason: ['combate', 'rendicion', 'desconexion', 'agotamiento'].includes(reason) ? reason : 'combate',
      at: Date.now(),
    }];
    save(next); // Ranked play is disabled without configured durable storage.
    records = next;
    seen.add(matchId);
    return true;
  }

  function ratings() {
    const table = new Map();
    for (const match of records) {
      if (match.mode !== 'ranked') continue;
      const [a, b] = match.players;
      if (!table.has(a.id)) table.set(a.id, { id: a.id, name: a.name, rating: 1000, played: 0, wins: 0, losses: 0, draws: 0 });
      if (!table.has(b.id)) table.set(b.id, { id: b.id, name: b.name, rating: 1000, played: 0, wins: 0, losses: 0, draws: 0 });
      const ra = table.get(a.id), rb = table.get(b.id);
      ra.name = a.name; rb.name = b.name;
      const scoreA = match.winner === null ? 0.5 : match.winner === 0 ? 1 : 0;
      const expectedA = 1 / (1 + 10 ** ((rb.rating - ra.rating) / 400));
      const delta = Math.round(32 * (scoreA - expectedA));
      ra.rating += delta; rb.rating -= delta;
      ra.played++; rb.played++;
      if (scoreA === 1) { ra.wins++; rb.losses++; }
      else if (scoreA === 0) { ra.losses++; rb.wins++; }
      else { ra.draws++; rb.draws++; }
    }
    return table;
  }

  function snapshot(id) {
    const board = [...ratings().values()].sort((a, b) =>
      b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name, 'es'));
    const rank = board.findIndex(item => item.id === id);
    const own = records.filter(item => item.players.some(p => p.id === id));
    let wins = 0, losses = 0, draws = 0, streak = 0, bestStreak = 0;
    const rivals = new Map();
    const history = [];
    for (const item of own) {
      const seat = item.players[0].id === id ? 0 : 1;
      const other = item.players[1 - seat];
      const outcome = item.winner === null ? 'draw' : item.winner === seat ? 'win' : 'loss';
      if (outcome === 'win') { wins++; streak++; bestStreak = Math.max(bestStreak, streak); }
      else { streak = 0; if (outcome === 'loss') losses++; else draws++; }
      const vs = rivals.get(other.id) || { id: other.id, name: other.name, matches: 0,
        wins: 0, losses: 0, draws: 0, lastAt: 0 };
      vs.name = other.name; vs.matches++; vs.lastAt = item.at;
      if (outcome === 'win') vs.wins++;
      else if (outcome === 'loss') vs.losses++;
      else vs.draws++;
      rivals.set(other.id, vs);
      history.push({ matchId: item.matchId, opponentId: other.id, opponent: other.name,
        outcome, mode: item.mode, turns: item.turns, reason: item.reason, at: item.at });
    }
    const rankEntry = board[rank];
    return {
      type: 'records:summary', persistent: durable, rankedEnabled: durable,
      totals: { played: own.length, wins, losses, draws, streak, bestStreak,
        winRate: own.length ? Math.round(100 * wins / own.length) : 0 },
      ranked: { rating: rankEntry?.rating ?? 1000, played: rankEntry?.played ?? 0,
        wins: rankEntry?.wins ?? 0, losses: rankEntry?.losses ?? 0,
        draws: rankEntry?.draws ?? 0, position: rank >= 0 ? rank + 1 : null },
      history: history.slice(-100).reverse(),
      rivals: [...rivals.values()].sort((a, b) => b.matches - a.matches || b.lastAt - a.lastAt).slice(0,20),
      leaderboard: board.slice(0,50).map((entry, i) => ({
        position: i + 1, name: entry.name, rating: entry.rating, played: entry.played,
        wins: entry.wins, losses: entry.losses,
      })),
    };
  }
  return { record, snapshot, durable };
}
