import { describe, expect, it } from 'vitest';
import {
  resolveBattleScenery,
  STANDARD_BATTLE_POSTER,
  STANDARD_BATTLE_VIDEO,
} from './battleScenery';

describe('battle scenery', () => {
  it('uses the introductory loop only for the standard free-play battle', () => {
    expect(resolveBattleScenery()).toEqual({
      poster: STANDARD_BATTLE_POSTER,
      video: STANDARD_BATTLE_VIDEO,
    });
  });

  it('does not replace campaign mission backgrounds with the standard loop', () => {
    expect(resolveBattleScenery({ background: '/Decreto-Real/escenarios/mision-2.webp' }))
      .toEqual({ poster: '/Decreto-Real/escenarios/mision-2.webp' });
  });

  it('accepts independent videos and posters for future missions', () => {
    expect(resolveBattleScenery({
      background: '/Decreto-Real/escenarios/mision-2.webp',
      backgroundVideo: '/Decreto-Real/escenarios/mision-2.mp4',
    })).toEqual({
      poster: '/Decreto-Real/escenarios/mision-2.webp',
      video: '/Decreto-Real/escenarios/mision-2.mp4',
    });
  });

  it('can explicitly disable the intro animation', () => {
    expect(resolveBattleScenery({ backgroundVideo: null }))
      .toEqual({ poster: STANDARD_BATTLE_POSTER });
  });
});
