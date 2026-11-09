import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

const base = 'https://decreto-real-production.up.railway.app';
const socketUrl = base.replace('https://', 'wss://');
const timeoutMs = 9000;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForPreview() {
  const deadline = Date.now() + 150_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const health = await fetch(base + '/health?ci=1', { signal: AbortSignal.timeout(timeoutMs) });
      const preview = await fetch(base + '/prueba?ci=1', { signal: AbortSignal.timeout(timeoutMs) });
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { ok: true, service: 'decreto-real-pvp' });
      assert.equal(preview.status, 200);
      const page = await preview.text();
      assert.match(page, /Duelo multijugador/);
      assert.match(page, /¿Cómo quieres jugar\?/);
      assert.match(page, /Invitar a un amigo/);
      assert.match(page, /Aceptar desafío/);
      return;
    } catch (err) { lastError = err; await pause(3000); }
  }
  throw new Error('Railway aún no publica /prueba: ' + (lastError?.message ?? 'desconocido'));
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl, { origin: base, handshakeTimeout: timeoutMs });
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('Timeout WebSocket WSS')); }, timeoutMs);
    ws.once('open', () => { clearTimeout(timer); resolve(ws); });
    ws.once('error', err => { clearTimeout(timer); reject(err); });
  });
}

function waitMessage(ws, type, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off('message', receive); reject(new Error('Timeout de mensaje ' + type)); }, timeoutMs);
    function receive(raw) {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type !== type || !predicate(msg)) return;
      clearTimeout(timer);
      ws.off('message', receive);
      resolve(msg);
    }
    ws.on('message', receive);
  });
}
function send(ws, obj) { ws.send(JSON.stringify(obj)); }

async function testOnlineDuel() {
  let first, second;
  try {
    first = await connect();
    second = await connect();
    const sessionOne = waitMessage(first, 'session');
    const waitingOne = waitMessage(first, 'waiting');
    send(first, { type: 'create', name: 'PruebaAutomatica1' });
    const { code } = await sessionOne;
    await waitingOne;
    assert.match(code, /^[A-F0-9]{10}$/);

    const aStatePromise = waitMessage(first, 'state');
    const bStatePromise = waitMessage(second, 'state');
    const sessionTwo = waitMessage(second, 'session');
    send(second, { type: 'join', name: 'PruebaAutomatica2', code });
    await sessionTwo;
    const [a, b] = await Promise.all([aStatePromise, bStatePromise]);
    assert.equal(a.view.me.hand.length, b.view.opponent.handCount);
    assert.equal(b.view.opponent.hand, undefined);
    assert.equal(a.view.opponent.hand, undefined);

    const turnOwner = a.view.isMyTurn ? first : second;
    const other = turnOwner === first ? second : first;
    const rev = a.view.revision;
    const aNext = waitMessage(first, 'state', msg => msg.view.revision === rev + 1);
    const bNext = waitMessage(second, 'state', msg => msg.view.revision === rev + 1);
    const ack = waitMessage(turnOwner, 'ack');
    send(turnOwner, { type: 'action', id: 'smoke-turn', revision: rev, action: { type: 'end_turn' } });
    await ack;
    const [nextA,nextB] = await Promise.all([aNext,bNext]);
    assert.equal(nextA.view.isMyTurn, !a.view.isMyTurn);
    assert.equal(nextB.view.isMyTurn, !b.view.isMyTurn);

    const finishedA = waitMessage(first, 'state', msg => msg.view.status === 'finished');
    const finishedB = waitMessage(second, 'state', msg => msg.view.status === 'finished');
    send(first, { type: 'action', id: 'smoke-surrender', revision: nextA.view.revision, action: { type: 'surrender' } });
    const [resultA,resultB] = await Promise.all([finishedA,finishedB]);
    assert.equal(resultA.view.winner, 'opponent');
    assert.equal(resultB.view.winner, 'me');
    console.log('PASS: prueba remota Railway HTTPS + WSS, sala privada, manos ocultas, turno y resultado');
  } finally {
    first?.close();
    second?.close();
  }
}

await waitForPreview();
await testOnlineDuel();
