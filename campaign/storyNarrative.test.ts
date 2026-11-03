import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORY_CHAPTERS, STORY_STAGES, chapterForStage, stagesForChapter } from './story.ts';

test('la crónica conserva 38 misiones y sus diez capítulos en el orden canónico', () => {
  assert.equal(STORY_STAGES.length, 38);
  assert.deepEqual(STORY_STAGES.map(stage => stage.id),
    Array.from({ length: 38 }, (_, index) => String(index + 1).padStart(2, '0')));
  assert.deepEqual(STORY_CHAPTERS.map(chapter => chapter.id), ['p', '1', '2', '3', '4', '5', '6', '7', '8', 'f']);
  assert.equal(stagesForChapter('p').length, 2);
  for (const chapterId of ['1', '2', '3', '4', '5', '6', '7', '8']) {
    assert.equal(stagesForChapter(chapterId).length, 4);
  }
  assert.equal(stagesForChapter('f').length, 4);
});

test('cada misión presenta un conflicto y consecuencias legibles en móvil', () => {
  for (const stage of STORY_STAGES) {
    assert.ok(chapterForStage(stage.id), `Sin capítulo: ${stage.id}`);
    assert.match(stage.openingLine, /^OBJETIVO: /, `No se explica el objetivo de ${stage.id}`);
    assert.ok(stage.description.length <= 175, `Contexto demasiado largo: ${stage.id}`);
    for (const field of ['title', 'description', 'openingLine', 'victoryLine', 'defeatLine'] as const) {
      assert.ok(stage[field].trim().length >= 12, `Falta texto en ${stage.id} / ${field}`);
      assert.ok(stage[field].length <= 230, `Texto demasiado largo en ${stage.id} / ${field}`);
    }
  }
});

test('todos los capítulos tienen un resumen claro y breve', () => {
  for (const chapter of STORY_CHAPTERS) {
    assert.ok(chapter.summary.length >= 55, `Falta contexto: ${chapter.id}`);
    assert.ok(chapter.summary.length <= 190, `Resumen largo: ${chapter.id}`);
  }
});

test('los ocho generales y el desenlace conservan los hechos canónicos', () => {
  assert.equal(STORY_STAGES.filter(stage => stage.kind === 'boss').length, 8);
  assert.equal(STORY_STAGES.find(stage => stage.id === '22')?.opponent, 'Fantasma de la Selva');
  assert.match(STORY_STAGES.find(stage => stage.id === '36')!.victoryLine, /Zhinchi.*desaparece/);
  assert.match(STORY_STAGES.find(stage => stage.id === '38')!.victoryLine, /Sigumán muere/);
  assert.match(STORY_STAGES.find(stage => stage.id === '38')!.victoryLine, /San Jerónimo/);
  const prose = JSON.stringify([STORY_STAGES, STORY_CHAPTERS]);
  assert.doesNotMatch(prose, /Sigmar|Zerión|Nayra/);
});
