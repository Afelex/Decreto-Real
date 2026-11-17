import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMatchLedger } from './matchLedger.mjs';

const ALFA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const BETA = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const GAMMA = 'cccccccccccccccccccccccc';
const players = (other = BETA, name = 'Rival') =>
  [{ id: ALFA, name: 'Xervias' }, { id: other, name }];

test('no duplica resultados ni permite registrarlos con un rival idéntico', () => {
  const ledger = createMatchLedger();
  const data = { matchId: '111111111111111111111111', mode: 'casual', players: players(),
    winner: 0, turns: 11, reason: 'combate' };
  assert.equal(ledger.record(data), true);
  assert.equal(ledger.record(data), false);
  assert.equal(ledger.record({ ...data, matchId: '222222222222222222222222',
    players: players(ALFA) }), false);
  assert.equal(ledger.snapshot(ALFA).totals.wins, 1);
  assert.equal(ledger.snapshot(BETA).totals.losses, 1);
});

test('acumula victorias, derrotas, empates y rivales por identidad aunque cambie el apodo', () => {
  const ledger = createMatchLedger();
  const matches = [
    ['111111111111111111111111', 0, players(), 'casual'],
    ['222222222222222222222222', 0, players(BETA, 'Otro apodo'), 'casual'],
    ['333333333333333333333333', 1, players(GAMMA, 'Tercer rival'), 'casual'],
    ['444444444444444444444444', null, players(BETA, 'Otro apodo'), 'casual'],
  ];
  for (const [matchId, winner, seats, mode] of matches) {
    assert.equal(ledger.record({ matchId, mode, players: seats, winner, turns: 7 }), true);
  }
  const mine = ledger.snapshot(ALFA);
  assert.deepEqual(mine.totals, { played: 4, wins: 2, losses: 1, draws: 1,
    streak: 0, bestStreak: 2, winRate: 50 });
  assert.equal(mine.rivals[0].id, BETA);
  assert.equal(mine.rivals[0].matches, 3);
  assert.equal(mine.rivals[0].name, 'Otro apodo');
  assert.equal(mine.rivals[0].wins, 2);
  assert.equal(mine.rivals[0].draws, 1);
});

test('solo ranked ajusta RP; un resultado simétrico conserva la suma', () => {
  const ledger = createMatchLedger();
  ledger.record({ matchId: '111111111111111111111111', mode: 'casual', players: players(),
    winner: 0, turns: 3 });
  assert.equal(ledger.snapshot(ALFA).ranked.rating, 1000);
  ledger.record({ matchId: '222222222222222222222222', mode: 'ranked', players: players(),
    winner: 0, turns: 4 });
  assert.equal(ledger.snapshot(ALFA).ranked.rating, 1016);
  assert.equal(ledger.snapshot(BETA).ranked.rating, 984);
  assert.equal(ledger.snapshot(ALFA).ranked.position, 1);
  assert.equal(ledger.snapshot(ALFA).ranked.played, 1);
  assert.equal(ledger.snapshot(ALFA).ranked.wins, 1);
});

test('recupera los registros desde el volumen, y no permite ranked sin él', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dr-pvp-ledger-'));
  try {
    const path = join(dir, 'record.json');
    const ledger = createMatchLedger(path);
    assert.equal(ledger.snapshot(ALFA).rankedEnabled, true);
    ledger.record({ matchId: '111111111111111111111111', mode: 'ranked',
      players: players(), winner: 1, turns: 13, reason: 'rendicion' });
    const loaded = createMatchLedger(path);
    assert.equal(loaded.snapshot(ALFA).ranked.rating, 984);
    assert.equal(loaded.snapshot(ALFA).history[0].reason, 'rendicion');
    assert.equal(loaded.record({ matchId: '111111111111111111111111',
      mode: 'ranked', players: players(), winner: 0 }), false);
    assert.equal(createMatchLedger().snapshot(ALFA).rankedEnabled, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
