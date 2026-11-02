import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveBattleScenery,
  STANDARD_BATTLE_POSTER,
  STANDARD_BATTLE_VIDEO,
} from './battleScenery.ts';

test('standard free-play match uses only the introductory video', () => {
  assert.deepEqual(resolveBattleScenery(), {
    poster: STANDARD_BATTLE_POSTER,
    video: STANDARD_BATTLE_VIDEO,
  });
});

test('campaign mission does not inherit the standard loop', () => {
  assert.deepEqual(
    resolveBattleScenery({ background: '/Decreto-Real/escenarios/mision-2.webp' }),
    { poster: '/Decreto-Real/escenarios/mision-2.webp' },
  );
});

test('later missions may select their own scene and video', () => {
  assert.deepEqual(resolveBattleScenery({
    background: '/Decreto-Real/escenarios/mision-2.webp',
    backgroundVideo: '/Decreto-Real/escenarios/mision-2.mp4',
  }), {
    poster: '/Decreto-Real/escenarios/mision-2.webp',
    video: '/Decreto-Real/escenarios/mision-2.mp4',
  });
});

test('introductory video can be disabled explicitly', () => {
  assert.deepEqual(
    resolveBattleScenery({ backgroundVideo: null }),
    { poster: STANDARD_BATTLE_POSTER },
  );
});
