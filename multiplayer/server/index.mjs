import { createServer } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { WebSocket, WebSocketServer } from 'ws';
import { createMatch, act, viewFor } from './engine.mjs';
import { createSocialHub } from './social.mjs';
import { createMatchLedger } from './matchLedger.mjs';

const port = Number(process.env.PORT || 3001);
const origins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://afelex.github.io,https://decreto-real-production.up.railway.app')
  .split(',').map(item => item.trim()).filter(Boolean));
const rooms = new Map();
const REJOIN_MS = 120_000;
const ROOM_TTL_MS = 30 * 60_000;
const HISTORY_LIMIT = 100;
const MAX_ROOMS = 1000;
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const failedJoinAttempts = new Map();
let waitingRandom = null;
let waitingRanked = null;
const ledger = createMatchLedger(process.env.DR_PVP_RECORD_FILE || '');

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
function createRoom(name, appearance, randomQueue = false, ranked = false, ownerId = null) {
  const room = { code: roomCode(), matchId: randomBytes(12).toString('hex'),
    seats: [{ name, appearance, id: ownerId, token: token() }], sockets: [null, null],
    match: null, randomQueue, ranked, lastUsed: Date.now(), disconnected: [null, null], actionIds: [new Set(), new Set()] };
  rooms.set(room.code, room);
  return room;
}
function sendRecords(ws) {
  if (ws?.social?.id) send(ws, ledger.snapshot(ws.social.id));
}
function commitResult(room) {
  if (room.recorded || room.match?.status !== 'finished' || room.seats.length !== 2) return;
  // Legacy standalone clients may still duel casually without a social profile.
  // Their result cannot be attached to a stable identity.
  if (room.seats.some(seat => !seat.id)) return;
  try {
    const ok = ledger.record({ matchId: room.matchId,
      mode: room.ranked ? 'ranked' : 'casual',
      players: room.seats.map(seat => ({ id: seat.id, name: seat.name })),
      winner: room.match.winner, turns: room.match.turnNumber,
      reason: room.match.lastEvent.includes('desconexión') ? 'desconexion'
        : room.match.lastEvent.includes('rindió') ? 'rendicion'
        : room.match.winner === null ? 'agotamiento' : 'combate' });
    if (!ok) { console.warn('[pvp-ledger] Partida omitida:', room.matchId); return; }
    room.recorded = true;
    for (const ws of room.sockets) sendRecords(ws);
  } catch (error) {
    console.error('[pvp-ledger] No se pudo guardar el duelo:', error);
    for (const ws of room.sockets) send(ws, { type: 'records:error', reason: 'El resultado no pudo guardarse.' });
  }
}
function broadcast(room) {
  for (let slot = 0; slot < room.seats.length; slot++) {
    const ws = room.sockets[slot];
    if (!ws) continue;
    if (!room.match) {
      send(ws, { type: 'waiting', code: room.code, randomQueue: room.randomQueue,
        players: room.seats.map(seat => seat.name) });
    } else {
      const view = viewFor(room.match, slot,
        room.sockets.map(client => client?.readyState === WebSocket.OPEN));
      view.mode = room.ranked ? 'ranked' : 'casual';
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
  sendRecords(ws);
}
function enter(ws, room, name, appearance) {
  if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
  if (room.invitedId && room.invitedId !== ws.social?.id)
    return fail(ws, 'Esta sala está reservada para el duelista invitado.');
  if (room.inviteExpires && Date.now() > room.inviteExpires)
    return fail(ws, 'Esta invitación ha caducado.');
  if (room.seats.length !== 1 || room.match) return fail(ws, 'La sala ya está completa.');
  if (ws.social?.id && room.seats[0].id === ws.social.id)
    return fail(ws, 'No puedes combatir contra tu propio perfil.');
  if (room.sockets[0]?.readyState !== WebSocket.OPEN) return fail(ws, 'El creador de la sala está desconectado.');
  room.seats.push({ name, appearance, id: ws.social?.id || null, token: token() });
  room.match = createMatch(room.seats.map(seat => seat.name));
  if (waitingRandom === room.code) waitingRandom = null;
  if (waitingRanked === room.code) waitingRanked = null;
  attach(ws, room, 1);
}
const social = createSocialHub({
  send, fail,
  onChallenge(ws, other) {
    if (rooms.size >= MAX_ROOMS) { fail(ws, 'Servidor ocupado. Intenta más tarde.'); return null; }
    const room = createRoom(ws.social.name, appearanceOf({ portrait: ws.social.portrait }), false, false, ws.social.id);
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
    commitResult(room);
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
    if (social.handle(ws, msg)) {
      if (msg.type === 'social:hello') sendRecords(ws);
      return;
    }
    if (msg.type === 'records:get') { sendRecords(ws); return; }
    if (msg.type === 'create' || msg.type === 'queue') {
      if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
      const ranked = msg.type === 'queue' && msg.ranked === true;
      if (ranked && !ws.social?.id) return fail(ws, 'Conecta tu perfil para jugar Ranked.');
      if (ranked && !ledger.durable) return fail(ws, 'Ranked requiere almacenamiento permanente en el servidor.');
      const name = nameOf(msg.name);
      if (!name) return fail(ws, 'El apodo debe tener de 2 a 24 caracteres.');
      const waitingCode = ranked ? waitingRanked : waitingRandom;
      if (msg.type === 'queue' && waitingCode) {
        const existing = rooms.get(waitingCode);
        if (existing?.sockets[0]?.readyState === WebSocket.OPEN && !existing.match) {
          enter(ws, existing, name, appearanceOf(msg.appearance)); return;
        }
        if (ranked) waitingRanked = null;
        else waitingRandom = null;
      }
      if (rooms.size >= MAX_ROOMS) return fail(ws, 'Servidor ocupado. Intenta más tarde.');
      const room = createRoom(name, appearanceOf(msg.appearance), msg.type === 'queue', ranked, ws.social?.id || null);
      if (msg.type === 'queue') {
        if (ranked) waitingRanked = room.code;
        else waitingRandom = room.code;
      }
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
      if (slot === undefined || slot < 0) return fail(ws, 'Sesión caducada. Abre una nueva partida.');
      if (room.seats[slot].id && room.seats[slot].id !== ws.social?.id)
        return fail(ws, 'El perfil actual no corresponde a esta sesión.');
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
      const error = act(room.match, slot, msg.action);
      if (error) return fail(ws, error, msg.id);
      room.actionIds[slot].add(msg.id);
      if (room.actionIds[slot].size > HISTORY_LIMIT) room.actionIds[slot].delete(room.actionIds[slot].values().next().value);
      room.lastUsed = Date.now();
      send(ws, { type: 'ack', id: msg.id });
      commitResult(room);
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
    if (waitingRanked === code) waitingRanked = null;
  }
}, 30_000);
server.on('close', () => clearInterval(heartbeat));
server.listen(port, '0.0.0.0', () => console.log('Decreto Real PvP en puerto ' + server.address().port));
