import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveBattleScenery,
  STANDARD_BATTLE_POSTER,
  STANDARD_BATTLE_VIDEO,
  STANDARD_BATTLE_VIDEO_POSTER,
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

test('battle video URL matches the deployment output, not its removed source MP4', () => {
  const prefix='/Decreto-Real/';
  assert.ok(STANDARD_BATTLE_VIDEO.startsWith(prefix));
  const relative=STANDARD_BATTLE_VIDEO.slice(prefix.length);
  const workflow=readFileSync('.github/workflows/deploy.yml','utf8');
  assert.ok(workflow.includes('optimized_video="dist/' + relative + '"'),
    'The referenced background must match the actual Pages output filename');
  assert.ok(workflow.includes('test -s "$optimized_video"'),
    'The release must fail if it cannot produce the background MP4');
  assert.ok(existsSync(join(process.cwd(),'public','escenarios','gemini_generated_video_b8059a5c.mp4')),
    'The source film for optimization must remain in source control');
});

test('the poster is made from the SAME loop and loaded before React mounts', () => {
  const workflow=readFileSync('.github/workflows/deploy.yml','utf8');
  const document=readFileSync('index.html','utf8');
  const component=readFileSync('screens/BattleSceneryLayer.tsx','utf8');
  assert.ok(STANDARD_BATTLE_VIDEO_POSTER.startsWith('/Decreto-Real/escenarios/'));
  assert.ok(workflow.includes('poster_image="dist/escenarios/partida-inicial-poster.jpg"'));
  assert.ok(workflow.includes('test -s "$poster_image"'));
  assert.ok(workflow.includes('-ss 0.6 -i "$optimized_video"'));
  assert.ok(document.includes('rel="preload" as="image" href="' + STANDARD_BATTLE_VIDEO_POSTER + '"'));
  assert.ok(component.includes('onPlaying={() => setPlaying(true)}'));
  assert.ok(!component.includes('plaza-arcilla-estandar.webp'));
});
