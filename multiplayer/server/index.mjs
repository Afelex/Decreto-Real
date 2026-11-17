import { createServer } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { WebSocket, WebSocketServer } from 'ws';
import { createMatch, act, viewFor } from './engine.mjs';
import { createSocialHub } from './social.mjs';
import { AccountStore, verifyFirebaseToken } from './accounts.mjs';

const port = Number(process.env.PORT || 3001);
const origins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://afelex.github.io,https://decreto-real-production.up.railway.app')
  .split(',').map(item => item.trim()).filter(Boolean));
// Roll out email accounts only when a persistent Railway volume is configured.
// Without DR_DATA_FILE the existing guest PvP remains fully functional.
const accounts = process.env.DR_DATA_FILE ? new AccountStore(process.env.DR_DATA_FILE) : null;
const rooms = new Map();
const REJOIN_MS = 120_000;
const ROOM_TTL_MS = 30 * 60_000;
const HISTORY_LIMIT = 100;
const MAX_ROOMS = 1000;
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const failedJoinAttempts = new Map();
let waitingRandom = null;

const previewHtml = readFileSync(new URL('./pvp-preview.html', import.meta.url));
const server = createServer((req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ok: true, service: 'decreto-real-pvp' }));
  } else if (pathname === '/prueba' && req.method === 'GET') {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://afelex.github.io data:; connect-src 'self' wss: ws:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    });
    res.end(previewHtml);
  } else if (pathname === '/' && req.method === 'GET') {
    res.writeHead(302, { location: '/prueba', 'cache-control': 'no-store' });
    res.end();
  } else { res.writeHead(404); res.end(); }
});
const sockets = new WebSocketServer({ noServer: true, maxPayload: 8192, perMessageDeflate: false });
server.on('upgrade', (req, socket, head) => {
  if (!req.headers.origin || !origins.has(req.headers.origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return;
  }
  sockets.handleUpgrade(req, socket, head, ws => sockets.emit('connection', ws));
});

function send(ws, data) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function fail(ws, reason, id) { send(ws, { type: 'error', reason, ...(typeof id === 'string' ? { id } : {}) }); }
function nameOf(input) {
  if (typeof input !== 'string') return null;
  const name = input.trim().replace(/[<>\u0000-\u001f]/g, '').trim();
  return name.length >= 2 && name.length <= 24 ? name : null;
}
function roomCode() {
  let code;
  do { code = String(randomInt(100)).padStart(2, '0') +
    CODE_LETTERS[randomInt(CODE_LETTERS.length)] + CODE_LETTERS[randomInt(CODE_LETTERS.length)];
  } while (rooms.has(code));
  return code;
}
function appearanceOf(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const allowed = { portrait: ['xervias', 'cronista', 'vandalo', 'amaru'],
    entrance: ['clasica', 'estandarte', 'aurea'], back: ['clasico', 'sol', 'carmesi'],
    nameFx: ['clasico', 'brillo', 'particulas'] };
  return Object.fromEntries(Object.entries(allowed).map(([key, values]) =>
    [key, values.includes(input[key]) ? input[key] : values[0]]));
}
function canTryCode(ws) {
  const ip = ws._socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const state = failedJoinAttempts.get(ip);
  if (state && now - state.at < 60_000 && state.count >= 5) return false;
  return true;
}
function registerWrongCode(ws) {
  const ip = ws._socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = failedJoinAttempts.get(ip);
  failedJoinAttempts.set(ip, { at: previous && now - previous.at < 60_000 ? previous.at : now,
    count: previous && now - previous.at < 60_000 ? previous.count + 1 : 1 });
}
function token() { return randomBytes(24).toString('hex'); }
function createRoom(name, appearance, randomQueue = false, accountId = null) {
  const room = { code: roomCode(), matchId: randomBytes(12).toString('hex'),
    seats: [{ name, appearance, token: token(), accountId }], sockets: [null, null],
    impactCounts: [0, 0], match: null, randomQueue, lastUsed: Date.now(), disconnected: [null, null], actionIds: [new Set(), new Set()] };
  rooms.set(room.code, room);
  return room;
}
function broadcast(room) {
  if (accounts && room.match?.status === 'finished' && !room.finishedStored) {
    try {
      if (accounts.recordMatch(room)) for (const player of room.sockets) {
        if (player?.account?.uid) send(player, { type: 'account:history',
          history: accounts.getHistory(player.account.uid),
          profile: accounts.getDuelist(player.account.uid) });
      }
    } catch (error) { console.error('No se pudo guardar el resultado de la partida.', error); }
  }
  for (let slot = 0; slot < room.seats.length; slot++) {
    const ws = room.sockets[slot];
    if (!ws) continue;
    if (!room.match) {
      send(ws, { type: 'waiting', code: room.code, randomQueue: room.randomQueue,
        players: room.seats.map(seat => seat.name) });
    } else {
      const view = viewFor(room.match, slot,
        room.sockets.map(client => client?.readyState === WebSocket.OPEN));
      view.me.appearance = room.seats[slot].appearance;
      view.opponent.appearance = room.seats[1 - slot].appearance;
      send(ws, { type: 'state', code: room.code, matchId: room.matchId, view });
    }
  }
}
function attach(ws, room, slot) {
  if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
  const old = room.sockets[slot];
  if (old && old !== ws) { old.seat = null; old.close(4001, 'Sesión abierta en otro dispositivo'); }
  const timer = room.disconnected[slot];
  if (timer) clearTimeout(timer);
  room.disconnected[slot] = null;
  ws.seat = { code: room.code, slot };
  room.sockets[slot] = ws;
  room.lastUsed = Date.now();
  send(ws, { type: 'session', code: room.code, matchId: room.matchId, token: room.seats[slot].token,
    slot, name: room.seats[slot].name, randomQueue: room.randomQueue });
  broadcast(room);
  social.broadcast();
}
function enter(ws, room, name, appearance) {
  if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
  if (room.invitedId && room.invitedId !== ws.social?.id)
    return fail(ws, 'Esta sala está reservada para el duelista invitado.');
  if (room.inviteExpires && Date.now() > room.inviteExpires)
    return fail(ws, 'Esta invitación ha caducado.');
  if (room.seats.length !== 1 || room.match) return fail(ws, 'La sala ya está completa.');
  if (room.sockets[0]?.readyState !== WebSocket.OPEN) return fail(ws, 'El creador de la sala está desconectado.');
  room.seats.push({ name, appearance, token: token(), accountId: ws.account?.uid });
  room.match = createMatch(room.seats.map(seat => seat.name));
  if (waitingRandom === room.code) waitingRandom = null;
  attach(ws, room, 1);
}
const social = createSocialHub({
  send, fail, accountStore: accounts,
  onChallenge(ws, other) {
    if (rooms.size >= MAX_ROOMS) { fail(ws, 'Servidor ocupado. Intenta más tarde.'); return null; }
    const room = createRoom(ws.social.name, appearanceOf({ portrait: ws.social.portrait }), false, ws.account?.uid || null);
    room.invitedId = other.social.id;
    room.inviteExpires = Date.now() + 90_000;
    attach(ws, room, 0);
    return room.code;
  },
  onAcceptChallenge(ws, code) {
    const room = rooms.get(code.toUpperCase());
    if (!room || room.invitedId !== ws.social?.id || Date.now() > room.inviteExpires) {
      fail(ws, 'La invitación ya no está disponible.'); return false;
    }
    if (ws.seat) { fail(ws, 'Ya estás jugando una partida.'); return false; }
    enter(ws, room, ws.social.name, appearanceOf({ portrait: ws.social.portrait }));
    return Boolean(ws.seat);
  },
  onDeclineChallenge(ws, code) {
    const room = rooms.get(code.toUpperCase());
    if (!room || room.invitedId !== ws.social?.id) return;
    send(room.sockets[0], { type: 'social:challenge_declined', name: ws.social.name, code: room.code });
    room.invitedId = null;
    room.inviteExpires = Date.now();
  },
});

function onDisconnect(ws) {
  if (!ws.seat) return;
  const { code, slot } = ws.seat;
  ws.seat = null;
  const room = rooms.get(code);
  if (!room || room.sockets[slot] !== ws) return;
  room.sockets[slot] = null;
  room.lastUsed = Date.now();
  social.broadcast();
  if (room.randomQueue && room.seats.length === 1 && waitingRandom === code) waitingRandom = null;
  broadcast(room);
  if (room.match?.status !== 'playing') return;
  room.disconnected[slot] = setTimeout(() => {
    room.disconnected[slot] = null;
    if (room.sockets[slot] || room.match?.status !== 'playing') return;
    room.match.status = 'finished';
    room.match.winner = 1 - slot;
    room.match.pendingCombo = null;
    room.match.lastEvent = room.seats[slot].name + ' perdió por desconexión.';
    room.match.revision++;
    room.lastUsed = Date.now();
    broadcast(room);
  }, REJOIN_MS);
}

sockets.on('connection', ws => {
  ws.isAlive = true;
  ws.messageCount = 0;
  ws.rateWindow = Date.now();
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('close', () => { onDisconnect(ws); social.disconnected(ws); });
  ws.on('message', payload => {
    if (Date.now() - ws.rateWindow > 1000) { ws.rateWindow = Date.now(); ws.messageCount = 0; }
    if (++ws.messageCount > 20) { ws.close(4008, 'Límite de mensajes'); return; }
    let msg;
    try { msg = JSON.parse(payload.toString()); }
    catch { return fail(ws, 'Mensaje JSON inválido.'); }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return fail(ws, 'Mensaje inválido.');
    if (msg.type === 'account:hello') {
      if (!accounts) return fail(ws, 'El acceso por correo todavía no está habilitado en el servidor.');
      if (ws.account || ws.authPending) return fail(ws, 'La sesión ya está identificada.');
      ws.authPending = true;
      void verifyFirebaseToken(msg.idToken).then(account => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.account = account;
        send(ws, { type: 'account:ready',
          profile: accounts.getDuelist(account.uid),
          history: accounts.getHistory(account.uid) });
      }).catch(() => fail(ws, 'No se pudo validar el correo. Inicia sesión nuevamente.'))
        .finally(() => { ws.authPending = false; });
      return;
    }
    // No playable or social action can run under a name or an unverified email.
    if (accounts && !ws.account) return fail(ws, 'Inicia sesión con tu correo para jugar.');
    if (msg.type === 'account:save_profile') {
      if (!accounts || !ws.account) return fail(ws, 'Debes verificar tu correo.');
      if (JSON.stringify(msg.profile || {}).length > 4500)
        return fail(ws, 'El perfil es demasiado grande.');
      try { accounts.saveDuelist(ws.account.uid, msg.profile); }
      catch { fail(ws, 'No se pudo guardar tu perfil.'); }
      return;
    }
    if (social.handle(ws, msg)) return;
    if (msg.type === 'create' || msg.type === 'queue') {
      if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
      const name = nameOf(msg.name);
      if (!name) return fail(ws, 'El apodo debe tener de 2 a 24 caracteres.');
      if (msg.type === 'queue' && waitingRandom) {
        const existing = rooms.get(waitingRandom);
        if (existing?.sockets[0]?.readyState === WebSocket.OPEN && !existing.match) {
          enter(ws, existing, name, appearanceOf(msg.appearance)); return;
        }
        waitingRandom = null;
      }
      if (rooms.size >= MAX_ROOMS) return fail(ws, 'Servidor ocupado. Intenta más tarde.');
      const room = createRoom(name, appearanceOf(msg.appearance), msg.type === 'queue', ws.account?.uid || null);
      if (msg.type === 'queue') waitingRandom = room.code;
      attach(ws, room, 0);
      return;
    }
    if (msg.type === 'join') {
      const name = nameOf(msg.name), code = typeof msg.code === 'string' ? msg.code.trim().toUpperCase() : '';
      if (!name) return fail(ws, 'El apodo debe tener de 2 a 24 caracteres.');
      if (!/^[0-9]{2}[A-HJ-NP-Z]{2}$/.test(code)) return fail(ws, 'Introduce un código de 2 números y 2 letras.');
      if (!canTryCode(ws)) return fail(ws, 'Demasiados intentos. Espera un minuto.');
      const room = rooms.get(code);
      if (!room || room.randomQueue) {
        registerWrongCode(ws);
        return fail(ws, 'No existe una sala privada con ese código.');
      }
      enter(ws, room, name, appearanceOf(msg.appearance)); return;
    }
    if (msg.type === 'resume') {
      if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
      const room = rooms.get(typeof msg.code === 'string' ? msg.code.toUpperCase() : '');
      const slot = room?.seats.findIndex(seat => seat.token === msg.token);
      if (slot === undefined || slot < 0 || (accounts && room.seats[slot].accountId !== ws.account.uid))
        return fail(ws, 'Sesión caducada. Abre una nueva partida.');
      attach(ws, room, slot); return;
    }
    if (msg.type === 'action') {
      if (!ws.seat) return fail(ws, 'Debes entrar en una sala.', msg.id);
      const { code, slot } = ws.seat, room = rooms.get(code);
      if (!room?.match || room.sockets[slot] !== ws) return fail(ws, 'La partida no existe.', msg.id);
      if (typeof msg.id !== 'string' || !/^[\w-]{1,80}$/.test(msg.id)) return fail(ws, 'Falta el identificador de acción.');
      if (room.actionIds[slot].has(msg.id)) return send(ws, { type: 'ack', id: msg.id });
      if (room.sockets.some(client => !client || client.readyState !== WebSocket.OPEN) && msg.action?.type !== 'surrender')
        return fail(ws, 'Esperando a que el rival se reconecte.', msg.id);
      if (msg.revision !== room.match.revision) return fail(ws, 'Estado desactualizado; espera la sincronización.', msg.id);
      const impactPlayed = msg.action?.type === 'play' &&
        room.match.players[slot].hand.some(card => card.id === msg.action.cardId && card.type === 'IMPACT');
      const error = act(room.match, slot, msg.action);
      if (error) return fail(ws, error, msg.id);
      if (impactPlayed) room.impactCounts[slot]++;
      room.actionIds[slot].add(msg.id);
      if (room.actionIds[slot].size > HISTORY_LIMIT) room.actionIds[slot].delete(room.actionIds[slot].values().next().value);
      room.lastUsed = Date.now();
      send(ws, { type: 'ack', id: msg.id });
      broadcast(room);
      return;
    }
    fail(ws, 'Mensaje desconocido.');
  });
});

const heartbeat = setInterval(() => {
  for (const ws of sockets.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
  const now = Date.now();
  for (const [ip, state] of failedJoinAttempts) if (now - state.at >= 60_000) failedJoinAttempts.delete(ip);
  for (const [code, room] of rooms) {
    if (now - room.lastUsed < ROOM_TTL_MS) continue;
    for (const timer of room.disconnected) if (timer) clearTimeout(timer);
    for (const ws of room.sockets) ws?.close(4000, 'Sala expirada');
    rooms.delete(code);
    if (waitingRandom === code) waitingRandom = null;
  }
}, 30_000);
server.on('close', () => clearInterval(heartbeat));
server.listen(port, '0.0.0.0', () => console.log('Decreto Real PvP en puerto ' + server.address().port));
