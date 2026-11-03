import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORY_STAGES } from './story.ts';
import { combatConversationForMission } from './combatDialogues.ts';
import { enemyForMission } from './characters.ts';

test('cada una de las 38 misiones abre con rival, Xervias, rival e Inicia el combate', () => {
  assert.equal(STORY_STAGES.length, 38);
  for (const mission of STORY_STAGES) {
    const conversation = combatConversationForMission(mission.id);
    assert.ok(conversation, `Falta conversación de ${mission.id}`);
    assert.deepEqual(conversation.intro.map(line => line.speaker), ['opponent', 'player', 'opponent', 'system']);
    assert.equal(conversation.intro[3].text, 'Inicia el combate');
    assert.equal(conversation.critical.length, 1);
    assert.equal(conversation.critical[0].speaker, 'opponent');
    assert.ok(conversation.intro.every(line => line.text.trim().length > 10));
    for (const line of [...conversation.intro, ...conversation.midpoint, ...conversation.critical, ...conversation.victory]) {
      if (line.speaker === 'system') continue;
      assert.ok(line.text.length >= 30, `Diálogo insuficiente en ${mission.id}`);
      assert.ok(line.text.length <= 155, `Diálogo largo para móvil en ${mission.id}`);
    }
    assert.ok(conversation.opponentName.trim().length > 2);
    assert.equal(conversation.opponentRole, enemyForMission(mission.id)?.role);
    assert.ok(conversation.victory.length > 0);
    assert.equal(conversation.victory.at(-1)?.speaker, 'player');
    assert.ok(!/\bduelo\b/i.test(JSON.stringify(conversation)));
  }
});

test('los jefes y subjefes hablan a media vida y al caer, Xervias cierra el intercambio', () => {
  for (const mission of STORY_STAGES) {
    const conversation = combatConversationForMission(mission.id)!;
    const boss = mission.kind === 'subboss' || mission.kind === 'boss' || mission.kind === 'final';
    assert.equal(conversation.isBoss, boss, mission.id);
    assert.equal(conversation.midpoint.length, boss ? 1 : 0);
    if (boss) {
      assert.equal(conversation.midpoint[0].speaker, 'opponent');
      assert.deepEqual(conversation.victory.map(line => line.speaker), ['opponent', 'player']);
      assert.ok(conversation.midpoint[0].text.length > 12);
      assert.ok(conversation.victory[0].text.length > 12);
    } else {
      assert.deepEqual(conversation.victory.map(line => line.speaker), ['player']);
    }
  }
});

test('misiones inexistentes no inventan líneas de historia', () => {
  assert.equal(combatConversationForMission('00'), undefined);
  assert.equal(combatConversationForMission('39'), undefined);
});
