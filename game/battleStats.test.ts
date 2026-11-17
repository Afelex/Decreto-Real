import assert from 'node:assert/strict';
import test from 'node:test';
import { BattleStatsTracker, formatBattleDuration } from './battleStats.ts';

test('Versus IA contabiliza daño efectivo, curación y cada Impacto del jugador', () => {
  const stats = new BattleStatsTracker();
  stats.start(1000);
  stats.updateHealth('OPPONENT', hp => Math.max(0, hp - 2));
  stats.updateHealth('OPPONENT', hp => Math.max(0, hp - 3));
  stats.updateHealth('PLAYER', hp => Math.max(0, hp - 8));
  stats.updateHealth('PLAYER', hp => Math.min(20, hp + 3));
  stats.updateHealth('PLAYER', hp => Math.min(20, hp + 12)); // solo 5 efectivos
  stats.updateHealth('OPPONENT', hp => Math.max(0, hp - 99)); // no sobrecuenta daño
  stats.summonImpact(true);
  stats.summonImpact(false);
  stats.summonImpact(true);
  stats.stop(123000);
  assert.deepEqual(stats.snapshot(999999), {
    durationMs: 122000, healthRecovered: 8, damageDealt: 20, impactsSummoned: 2,
  });
});

test('el daño autoinfligido del rival no cuenta como daño del jugador', () => {
  const stats = new BattleStatsTracker();
  stats.start(0);
  stats.updateHealth('OPPONENT', hp => hp - 3, false);
  stats.updateHealth('OPPONENT', hp => hp - 2);
  stats.stop(2000);
  assert.equal(stats.snapshot().damageDealt, 2);
});

test('pausa, reanudación y cierre congelan el cronómetro una sola vez', () => {
  const stats = new BattleStatsTracker();
  stats.start(100);
  stats.start(200); // segunda llamada no reinicia
  stats.pause(1100);
  stats.pause(1300);
  stats.resume(6100);
  stats.pause(9100);
  stats.stop(11100);
  stats.stop(15000);
  stats.updateHealth('PLAYER', hp => hp + 2);
  stats.summonImpact(true);
  assert.deepEqual(stats.snapshot(20000), {
    durationMs: 4000, healthRecovered: 0, damageDealt: 0, impactsSummoned: 0,
  });
});

test('formato de tiempo permite resultados antiguos sin valores inventados', () => {
  assert.equal(formatBattleDuration(undefined), '—');
  assert.equal(formatBattleDuration(0), '0:00');
  assert.equal(formatBattleDuration(125000), '2:05');
  assert.equal(formatBattleDuration(3723000), '1:02:03');
});
