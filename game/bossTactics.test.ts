import assert from 'node:assert/strict';
import test from 'node:test';
import { BOSS_IDS, BOSS_STYLES, isBossId, selectBossMove, type BossSnapshot } from './bossTactics.ts';

const sample: BossSnapshot = {
  turn: 3, playerHp: 17, shield: 2, enemyHp: 15, enemyShield: 2, enemySeals: 1, difficulty: 'Estratega',
};

test('all eight generals have a legal, distinct, documented style', () => {
  assert.equal(BOSS_IDS.length, 8);
  assert.equal(new Set(BOSS_IDS.map(id => BOSS_STYLES[id].name)).size, 8);
  assert.equal(new Set(BOSS_IDS.map(id => BOSS_STYLES[id].title)).size, 8);
  for (const id of BOSS_IDS) {
    assert.equal(isBossId(id), true);
    assert.ok(BOSS_STYLES[id].hint.length > 15);
    assert.equal(BOSS_STYLES[id].id, id);
    for (const roll of [0, .05, .3, .5, .75, .999]) {
      assert.ok(['attack', 'shield', 'impact'].includes(selectBossMove(id, sample, roll)));
      assert.equal(selectBossMove(id, sample, roll), selectBossMove(id, sample, roll));
    }
  }
  for (const fake of ['', '0', '9', 1, null, undefined, {}]) assert.equal(isBossId(fake), false);
  for (const bad of [-1, 1, Infinity, NaN]) assert.throws(() => selectBossMove('1', sample, bad));
});

test('the offensive, defensive and Impact-focused generals differ measurably', () => {
  const count = (id: '1' | '2' | '3' | '6', move: 'attack' | 'shield' | 'impact') =>
    Array.from({ length: 1000 }, (_, i) => selectBossMove(id, sample, (i + .5) / 1000)).filter(m => m === move).length;
  assert.ok(count('2', 'attack') > count('1', 'attack') + 150, 'Jinete attacks more than Almirante');
  assert.ok(count('6', 'shield') > count('2', 'shield') + 200, 'Dama defends more than Jinete');
  assert.ok(count('3', 'impact') > count('1', 'impact') + 200, 'Señor pursues Impact more than Almirante');
});

test('tactics react to battle conditions using existing effects only', () => {
  const count = (id: '4' | '7' | '8', s: BossSnapshot, move: 'attack' | 'shield') =>
    Array.from({length: 1000}, (_, i) => selectBossMove(id, s, (i+.5)/1000)).filter(m => m === move).length;
  assert.ok(count('4', {...sample, shield: 0}, 'attack') > count('4', {...sample, shield: 10}, 'attack'));
  assert.ok(count('7', {...sample, playerHp: 5}, 'attack') > count('7', {...sample, playerHp: 20}, 'attack'));
  assert.ok(count('8', {...sample, enemyHp: 5}, 'shield') > count('8', {...sample, enemyHp: 20}, 'shield'));
  assert.notEqual(selectBossMove('6', { ...sample, enemyShield: 10 }, .5), 'shield', 'guard at shield cap must not waste a move');
});
