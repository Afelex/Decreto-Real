import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AccountStore, verifyFirebaseToken } from './accounts.mjs';

test('accounts persist across server restarts without mixing duelists', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dr-accounts-'));
  try {
    const file = join(dir, 'accounts.json');
    const first = new AccountStore(file);
    first.saveDuelist('uid-A', { active: 0, slots: [{
      name: 'Alfredito', appearance: { portrait: 'xervias', entrance: 'clasica',
        back: 'sol', nameFx: 'clasico' } }] });
    first.saveSocial('uid-A', { name: 'Alfredito', friends: ['friend-2'], blocked: [],
      requests: [{ from: 'friend-3', name: 'Otro duelista' }] });
    const afterRestart = new AccountStore(file);
    assert.equal(afterRestart.getDuelist('uid-A').slots[0].name, 'Alfredito');
    assert.deepEqual(afterRestart.getSocial('uid-A').friends, ['friend-2']);
    assert.equal(afterRestart.getSocial('uid-A').requests.length, 1);
    assert.notEqual(afterRestart.getDuelist('uid-B').slots[0].name, 'Alfredito');
    // Untrusted clients cannot award themselves victories or progress.
    afterRestart.saveDuelist('uid-A', { active: 0, slots: [{ name: 'Alfredo' }],
      progress: { matches: 500, wins: 500, impacts: 500 } });
    assert.equal(afterRestart.getDuelist('uid-A').progress.wins, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a finished match is recorded once per authenticated player', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dr-matches-'));
  try {
    const store = new AccountStore(join(dir, 'accounts.json'));
    const match = {
      matchId: 'a'.repeat(24), randomQueue: false,
      seats: [{ name: 'A', accountId: 'uid-A' }, { name: 'B', accountId: 'uid-B' }],
      match: { status: 'finished', winner: 0, turnNumber: 8 },
    };
    assert.equal(store.recordMatch(match), true);
    assert.equal(store.recordMatch(match), false);
    assert.equal(store.getDuelist('uid-A').progress.wins, 1);
    assert.equal(store.getDuelist('uid-A').progress.matches, 1);
    assert.equal(store.getDuelist('uid-B').progress.matches, 1);
    assert.equal(store.getDuelist('uid-B').progress.wins, 0);
    assert.equal(new AccountStore(join(dir, 'accounts.json')).getHistory('uid-B')[0].result, 'derrota');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unverified email or unsigned token never becomes an authenticated session', async () => {
  await assert.rejects(verifyFirebaseToken('someone@example.com'), /Token inválido/);
  const payload = Buffer.from(JSON.stringify({
    aud: 'peruanistas-531e5', iss: 'https://securetoken.google.com/peruanistas-531e5',
    sub: 'random-id', email: 'person@example.com', email_verified: false,
    exp: Math.floor(Date.now() / 1000) + 100, iat: 1, auth_time: 1,
  })).toString('base64url');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'untrusted' })).toString('base64url');
  await assert.rejects(verifyFirebaseToken(header + '.' + payload + '.unsigned'), /Cuenta no verificada/);
});
