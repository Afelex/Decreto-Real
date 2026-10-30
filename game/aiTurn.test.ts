import assert from 'node:assert/strict';
import test from 'node:test';
import { AiTurnController, runOpponentTurn } from './aiTurn.ts';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const card = (id: string, type: 'ATTACK' | 'DEFENSE' | 'IMPACT', rank?: number) => ({ id, type, rank });

test('consecutive turns read the current hand, health and Impact level', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const played: string[] = [];
  let state = { hand: [card('impact1', 'IMPACT', 1)], health: 5, impactLevel: 0 };
  let finished = 0;
  const play = (c: ReturnType<typeof card>) => {
    played.push(c.id);
    state.hand = state.hand.filter(item => item.id !== c.id);
    if (c.type === 'IMPACT') { state.impactLevel++; state.health++; }
    if (c.type === 'DEFENSE') state.health++;
  };
  const first = runOpponentTurn(new AiTurnController(), () => state, play, () => finished++);
  t.mock.timers.tick(1000); await flush();
  t.mock.timers.tick(1500); await first;
  state = { hand: [card('impact2', 'IMPACT', 2), card('heal', 'DEFENSE'), card('attack', 'ATTACK')], health: 4, impactLevel: 1 };
  const second = runOpponentTurn(new AiTurnController(), () => state, play, () => finished++);
  t.mock.timers.tick(1000); await flush();
  t.mock.timers.tick(1500); await flush();
  t.mock.timers.tick(1500); await second;
  // The Impact raised current health to five: the old snapshot would play heal.
  assert.deepEqual(played, ['impact1', 'impact2', 'attack']);
  assert.equal(finished, 2);
  assert.equal(state.hand[0].id, 'heal');
});

test('pause preserves remaining delay and resume performs each action once', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  const state = { hand: [card('a', 'ATTACK'), card('b', 'ATTACK')], health: 10, impactLevel: 0 };
  const played: string[] = [];
  let finished = 0;
  const run = runOpponentTurn(controller, () => state, c => {
    played.push(c.id); state.hand = state.hand.filter(item => item.id !== c.id);
  }, () => finished++);
  t.mock.timers.tick(400); controller.pause();
  t.mock.timers.tick(10000); await flush();
  assert.deepEqual(played, []);
  controller.resume(); t.mock.timers.tick(599); await flush();
  assert.deepEqual(played, []);
  t.mock.timers.tick(1); await flush();
  assert.deepEqual(played, ['a']);
  controller.pause(); t.mock.timers.tick(10000); await flush();
  assert.deepEqual(played, ['a']);
  controller.resume(); t.mock.timers.tick(1500); await flush();
  t.mock.timers.tick(1500); await run;
  assert.deepEqual(played, ['a', 'b']); assert.equal(finished, 1);
});

test('cancelling a paused turn cancels cards, deferred abilities and turn completion', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  let actions = 0;
  const run = runOpponentTurn(controller, () => ({ hand: [card('a', 'ATTACK')], health: 10, impactLevel: 0 }), () => actions++, () => actions++);
  const ability = controller.wait(800).then(active => { if (active) actions++; });
  controller.pause(); controller.cancel(); controller.resume();
  t.mock.timers.tick(20000); await Promise.all([run, ability]);
  assert.equal(actions, 0); assert.equal(await controller.wait(1), false);
});

test('cancellation after a card prevents later actions and finish', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  let count = 0;
  const run = runOpponentTurn(controller, () => ({ hand: [card('a', 'ATTACK')], health: 10, impactLevel: 0 }), () => count++, () => count++);
  t.mock.timers.tick(1000); await flush(); assert.equal(count, 1);
  controller.cancel(); t.mock.timers.tick(10000); await run;
  assert.equal(count, 1);
});
