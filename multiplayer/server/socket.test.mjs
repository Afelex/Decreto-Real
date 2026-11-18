import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WebSocket } from 'ws';

let child;
let dataDir;
let endpoint;
const ORIGIN = 'https://afelex.github.io';
const timeoutMs = 7000;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'dr-pvp-socket-'));
  const childProcess = spawn(process.execPath, ['index.mjs'], {
    cwd: import.meta.dirname,
    env: { ...process.env, PORT: '0', ALLOWED_ORIGINS: ORIGIN,
      DR_DATA_FILE: join(dataDir, 'accounts.json'), DR_REQUIRE_EMAIL_ACCOUNTS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child = childProcess;
  endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Servidor WebSocket no inició')), timeoutMs);
    let output = '';
    childProcess.stdout.setEncoding('utf8');
    childProcess.stdout.on('data', chunk => {
      output += chunk;
      const found = /Decreto Real PvP en puerto (\d+)/.exec(output);
      if (found) { clearTimeout(timer); resolve('ws://127.0.0.1:' + found[1]); }
    });
    childProcess.once('error', err => { clearTimeout(timer); reject(err); });
    childProcess.once('exit', code => { clearTimeout(timer); reject(new Error('Servidor salió: ' + code)); });
  });
});

after(() => {
  if (child && !child.killed) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint, { origin: ORIGIN });
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('Timeout de conexión')); }, timeoutMs);
    ws.once('open', () => { clearTimeout(timer); resolve(ws); });
    ws.once('error', err => { clearTimeout(timer); reject(err); });
  });
}
function waitMessage(ws, type, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off('message', receive); reject(new Error('Timeout esperando ' + type)); }, timeoutMs);
    function receive(raw) {
      let m;
      try { m = JSON.parse(raw.toString()); } catch { return; }
      if (m.type !== type || !predicate(m)) return;
      clearTimeout(timer);
      ws.off('message', receive);
      resolve(m);
    }
    ws.on('message', receive);
  });
}
function send(ws, payload) { ws.send(JSON.stringify(payload)); }

test('salas privadas, manos ocultas, turnos y rechazo de jugadas ilegales', async () => {
  const a = await connect(), b = await connect();
  try {
    const s1Promise = waitMessage(a, 'session');
    const waitingPromise = waitMessage(a, 'waiting');
    send(a, { type: 'create', name: 'Jugador Uno' });
    const s1 = await s1Promise;
    await waitingPromise;
    assert.match(s1.code, /^[0-9]{2}[A-HJ-NP-Z]{2}$/);
    assert.match(s1.matchId, /^[0-9a-f]{24}$/);
    const aStatePromise = waitMessage(a, 'state');
    const s2Promise = waitMessage(b, 'session');
    const bStatePromise = waitMessage(b, 'state');
    send(b, { type: 'join', code: s1.code, name: 'Jugador Dos' });
    const s2 = await s2Promise;
    const [aState, bState] = await Promise.all([aStatePromise, bStatePromise]);
    assert.equal(s2.code, s1.code);
    assert.equal(aState.view.me.hand.length, bState.view.opponent.handCount);
    assert.equal(bState.view.me.hand.length, aState.view.opponent.handCount);
    assert.equal(aState.view.opponent.hand, undefined, 'No filtrar mano rival');
    assert.equal(bState.view.opponent.hand, undefined, 'No filtrar mano rival');
    assert.equal(aState.view.me.deck, undefined, 'No filtrar orden del mazo');

    const actor = aState.view.isMyTurn ? a : b;
    const other = actor === a ? b : a;
    const current = actor === a ? aState.view : bState.view;
    const wrongClient = actor === a ? bState.view : aState.view;
    const wrong = waitMessage(other, 'error');
    send(other, { type: 'action', id: 'other1', revision: wrongClient.revision, action: { type: 'end_turn' } });
    assert.match((await wrong).reason, /turno/);

    const invalid = waitMessage(actor, 'error');
    send(actor, { type: 'action', id: 'invalid1', revision: current.revision, action: { type: 'play', cardId: 'not-owned' } });
    assert.match((await invalid).reason, /mano/);

    const ack = waitMessage(actor, 'ack', m => m.id === 'valid1');
    const actorView = waitMessage(actor, 'state', m => m.view.revision === current.revision + 1);
    const otherView = waitMessage(other, 'state', m => m.view.revision === current.revision + 1);
    send(actor, { type: 'action', id: 'valid1', revision: current.revision, action: { type: 'end_turn' } });
    await ack;
    const [updatedA, updatedB] = await Promise.all([actorView, otherView]);
    assert.equal(updatedA.view.isMyTurn, false);
    assert.equal(updatedB.view.isMyTurn, true);
    assert.equal(updatedA.view.revision, current.revision + 1);
  } finally {
    a.close(); b.close();
  }
});

test('un invitado puede reanudar su sala cuando el almacenamiento persistente de cuentas está activo', async () => {
  const first = await connect();
  let second;
  try {
    const created = waitMessage(first, 'session');
    const waiting = waitMessage(first, 'waiting');
    send(first, { type: 'create', name: 'Invitado Uno' });
    const session = await created;
    await waiting;
    await new Promise(resolve => { first.once('close', resolve); first.close(); });

    second = await connect();
    const resumed = waitMessage(second, 'session');
    const waitingAgain = waitMessage(second, 'waiting');
    send(second, { type: 'resume', code: session.code, token: session.token,
      slot: session.slot, name: session.name });
    const restored = await resumed;
    await waitingAgain;
    assert.equal(restored.code, session.code);
    assert.equal(restored.token, session.token);
    assert.equal(restored.slot, session.slot);
  } finally {
    first.close();
    second?.close();
  }
});

test('HTTP de salud y página de prueba responden sin alterar la API', async () => {
  const base = endpoint.replace(/^ws:/, 'http:');
  const healthy = await fetch(base + '/health?utm_source=chatgpt.com');
  assert.equal(healthy.status, 200);
  assert.deepEqual(await healthy.json(), { ok: true, service: 'decreto-real-pvp' });
  const preview = await fetch(base + '/prueba?sala=ABC123');
  assert.equal(preview.status, 200);
  assert.match(preview.headers.get('content-type'), /text\/html/);
  assert.match(await preview.text(), /Duelo\s*(?:<em>)?multijugador/);
  assert.match(preview.headers.get('content-security-policy'), /frame-ancestors/);
  const redirect = await fetch(base + '/', { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/prueba');
});

test('rechaza el origen WebSocket no autorizado', async () => {
  await assert.rejects(() => new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint, { origin: 'https://unexpected.example.com' });
    ws.once('open', () => { ws.close(); resolve(); });
    ws.once('error', reject);
  }), /403/);
});
