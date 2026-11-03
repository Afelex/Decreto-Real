import assert from 'node:assert/strict';
import test from 'node:test';
import { ENEMY_ROSTER, MAIN_CHARACTERS, enemyForMission, generalForChapter } from './characters.ts';

test('38 unique challengers have portrait identities', () => {
  assert.equal(ENEMY_ROSTER.length, 38);
  assert.equal(new Set(ENEMY_ROSTER.map(enemy => enemy.missionId)).size, 38);
  assert.equal(new Set(ENEMY_ROSTER.map(enemy => enemy.name)).size, 38);
  for (let i = 1; i <= 38; i++) assert.ok(enemyForMission(String(i).padStart(2, '0'))?.portraitDirection);
});

test('eight named generals and four central names', () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, i) => generalForChapter(String(i + 1))?.name),
    ['Baltasar de Fierro', 'Leandro Valcázar', 'Octavio Argento', 'Jerónimo Arrellano', 'Nayisa de Sombras', 'Isabela Valdierra', 'Aukan del Cóndor', 'Gonzalo de Montes']);
  assert.equal(MAIN_CHARACTERS.hero.name, 'Xervias');
  assert.equal(MAIN_CHARACTERS.hero.role, 'Soldado');
  assert.ok(ENEMY_ROSTER.every(enemy => enemy.role.length >= 5));
  assert.ok(ENEMY_ROSTER.every(enemy => !/protagonista|rival|oponente|adversario/i.test(enemy.role)));
  for (const id of ['06', '10', '14', '18', '22', '26', '30', '34']) {
    assert.equal(enemyForMission(id)?.role, 'General');
  }
  assert.equal(MAIN_CHARACTERS.mentor.name, 'Zhinchi');
  assert.equal(MAIN_CHARACTERS.outlaw.name, 'Vándalo Rojo');
  assert.equal(MAIN_CHARACTERS.antagonist.name, 'Sigumán');
});
