import assert from 'node:assert/strict';
import test from 'node:test';
import { STORY_CHAPTERS } from './story.ts';
import { REGION_VISUALS, regionVisual } from './regionVisuals.ts';

test('each of the ten chapters has a unique presentational landmark and a safe color palette', () => {
  assert.equal(STORY_CHAPTERS.length, 10);
  assert.equal(Object.keys(REGION_VISUALS).length, 10);
  assert.equal(new Set(STORY_CHAPTERS.map(chapter => regionVisual(chapter.id).landmark)).size, 10);
  for (const chapter of STORY_CHAPTERS) {
    const visual = regionVisual(chapter.id);
    for (const color of [visual.sky, visual.earth, visual.horizon]) {
      assert.match(color, /^#[0-9a-f]{6}$/i);
    }
    assert.ok(visual.symbol.length > 0);
    assert.ok(visual.title.length > 0);
    assert.ok(visual.atmosphere.length > 0);
  }
});

test('unknown chapter fallback never changes mission or gameplay data', () => {
  assert.deepEqual(regionVisual('unknown'), REGION_VISUALS.p);
  assert.deepEqual(regionVisual(undefined), REGION_VISUALS.p);
  assert.equal(STORY_CHAPTERS.filter(chapter => chapter.general).length, 8);
});
