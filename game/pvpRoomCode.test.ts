import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateRoomCode, normalizeRoomCode } from './pvpRoomCode.ts';

test('salas privadas admiten exclusivamente dos dígitos y dos letras permitidas', () => {
  assert.equal(isPrivateRoomCode('27KP'), true);
  assert.equal(isPrivateRoomCode('09ab'), true);
  assert.equal(isPrivateRoomCode(' 52XZ '), true);
  assert.equal(normalizeRoomCode(' 27kp '), '27KP');
  assert.equal(isPrivateRoomCode('FE90D4C545'), false);
  assert.equal(isPrivateRoomCode('27K'), false);
  assert.equal(isPrivateRoomCode('27KPA'), false);
  assert.equal(isPrivateRoomCode('KP27'), false);
  assert.equal(isPrivateRoomCode('27IO'), false);
  assert.equal(isPrivateRoomCode('27#A'), false);
  assert.equal(isPrivateRoomCode(null), false);
});
