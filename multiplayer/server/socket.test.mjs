import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

let child;
let endpoint;
const ORIGIN = 'https://afelex.github.io';
const timeoutMs = 7000;

before(async () => {
  const childProcess = spawn(process.execPath, ['index.mjs'], {
    cwd: import.meta.dirname,
    env: { ...process.env, PORT: '0', ALLOWED_ORIGINS: ORIGIN },
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

after(() => { if (child && !child.killed) child.kill('SIGTERM'); });

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
    assert.match(s1.code, /^[0-9A-F]{10}$/);
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

test('rechaza el origen WebSocket no autorizado', async () => {
  await assert.rejects(() => new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint, { origin: 'https://unexpected.example.com' });
    ws.once('open', () => { ws.close(); resolve(); });
    ws.once('error', reject);
  }), /403/);
});
