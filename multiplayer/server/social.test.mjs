import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialHub } from './social.mjs';

function harness() {
  const logs = new Map();
  const send = (ws, data) => { if (!logs.has(ws)) logs.set(ws, []); logs.get(ws).push(data); };
  const hub = createSocialHub({
    send, fail: (ws, reason) => send(ws, { type: 'error', reason }),
    onChallenge: () => '27KP',
    onAcceptChallenge: () => true,
    onDeclineChallenge: () => {},
  });
  const connect = (name, secret, status = 'hidden') => {
    const ws = {};
    hub.handle(ws, { type: 'social:hello', name, secret, status, portrait: 'xervias' });
    return ws;
  };
  const of = (ws, type) => (logs.get(ws) || []).filter(msg => msg.type === type);
  return { hub, connect, of, logs };
}

test('identities are private by default, reconnect using secret, and roster is opt-in', () => {
  const h = harness();
  const first = h.connect('Alfredo');
  const token = h.of(first, 'social:identity')[0];
  assert.match(token.secret, /^[0-9a-f]{64}$/);
  assert.equal(h.of(first, 'social:roster').at(-1).total, 0);
  const second = h.connect('Dayra');
  assert.equal(h.of(first, 'social:roster').at(-1).total, 0);
  h.hub.handle(second, { type: 'social:status', status: 'available' });
  assert.equal(h.of(first, 'social:roster').at(-1).total, 1);
  assert.equal(h.of(first, 'social:roster').at(-1).peers[0].status, 'available');
  const newConnection = h.connect('Alfredito', token.secret);
  assert.equal(h.of(newConnection, 'social:identity')[0].id, token.id);
  assert.equal(h.of(newConnection, 'social:identity')[0].secret, token.secret);
  h.hub.handle(second, { type: 'social:status', status: 'hidden' });
  assert.equal(h.of(newConnection, 'social:roster').at(-1).total, 0);
});

test('friend request requires acceptance; chat is private, validated and rate-limited', () => {
  const h = harness();
  const alice = h.connect('Alfredo', undefined, 'available');
  const bob = h.connect('Dayra', undefined, 'available');
  const a = h.of(alice, 'social:identity')[0].id, b = h.of(bob, 'social:identity')[0].id;
  h.hub.handle(alice, { type: 'social:chat', to: b, message: 'Antes de amistad' });
  assert.match(h.of(alice, 'error').at(-1).reason, /amigos/);
  h.hub.handle(alice, { type: 'social:friend_request', to: b });
  assert.equal(h.of(bob, 'social:friend_request').at(-1).name, 'Alfredo');
  h.hub.handle(bob, { type: 'social:friend_reply', from: a, accept: true });
  assert.equal(h.of(alice, 'social:friend_added').at(-1).id, b);
  assert.equal(h.of(bob, 'social:friend_added').at(-1).id, a);
  h.hub.handle(alice, { type: 'social:chat', to: b, message: '<saludo>' });
  assert.equal(h.of(bob, 'social:chat').at(-1).message, '<saludo>');
  for (let i = 0; i < 6; i++)
    h.hub.handle(alice, { type: 'social:chat', to: b, message: 'Texto ' + i });
  assert.match(h.of(alice, 'error').at(-1).reason, /mensajes/);
  h.hub.handle(bob, { type: 'social:block', to: a });
  h.hub.handle(alice, { type: 'social:chat', to: b, message: 'Bloqueado' });
  assert.match(h.of(alice, 'error').at(-1).reason, /amigos/);
  assert.ok(h.of(alice, 'social:roster').at(-1).peers.every(p => p.id !== b));
});

test('direct challenge is only addressed to a visible participant', () => {
  const h = harness();
  const one = h.connect('Alfredo', undefined, 'available');
  const two = h.connect('Dayra', undefined, 'available');
  const id = h.of(two, 'social:identity')[0].id;
  h.hub.handle(one, { type: 'social:challenge', to: id });
  assert.equal(h.of(two, 'social:incoming_challenge').at(-1).code, '27KP');
  h.hub.handle(two, { type: 'social:status', status: 'hidden' });
  h.hub.handle(one, { type: 'social:challenge', to: id });
  assert.match(h.of(one, 'error').at(-1).reason, /puede recibir/);
});
