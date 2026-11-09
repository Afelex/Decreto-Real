import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { createMatch, act, viewFor } from './engine.mjs';

const port = Number(process.env.PORT || 3001);
const origins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(item => item.trim()).filter(Boolean));
const rooms = new Map();
const REJOIN_MS = 120_000;
const ROOM_TTL_MS = 30 * 60_000;
const HISTORY_LIMIT = 100;
const MAX_ROOMS = 1000;
let waitingRandom = null;

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ok: true, service: 'decreto-real-pvp' }));
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
  do { code = randomBytes(5).toString('hex').toUpperCase(); } while (rooms.has(code));
  return code;
}
function token() { return randomBytes(24).toString('hex'); }
function createRoom(name, randomQueue = false) {
  const room = { code: roomCode(), seats: [{ name, token: token() }], sockets: [null, null],
    match: null, randomQueue, lastUsed: Date.now(), disconnected: [null, null], actionIds: [new Set(), new Set()] };
  rooms.set(room.code, room);
  return room;
}
function broadcast(room) {
  for (let slot = 0; slot < room.seats.length; slot++) {
    const ws = room.sockets[slot];
    if (!ws) continue;
    if (!room.match) {
      send(ws, { type: 'waiting', code: room.code, randomQueue: room.randomQueue,
        players: room.seats.map(seat => seat.name) });
    } else {
      send(ws, { type: 'state', code: room.code, view: viewFor(room.match, slot,
        room.sockets.map(client => client?.readyState === WebSocket.OPEN)) });
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
  send(ws, { type: 'session', code: room.code, token: room.seats[slot].token,
    slot, name: room.seats[slot].name, randomQueue: room.randomQueue });
  broadcast(room);
}
function enter(ws, room, name) {
  if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
  if (room.seats.length !== 1 || room.match) return fail(ws, 'La sala ya está completa.');
  if (room.sockets[0]?.readyState !== WebSocket.OPEN) return fail(ws, 'El creador de la sala está desconectado.');
  room.seats.push({ name, token: token() });
  room.sockets.push(null);
  room.match = createMatch(room.seats.map(seat => seat.name));
  if (waitingRandom === room.code) waitingRandom = null;
  attach(ws, room, 1);
}
function onDisconnect(ws) {
  if (!ws.seat) return;
  const { code, slot } = ws.seat;
  ws.seat = null;
  const room = rooms.get(code);
  if (!room || room.sockets[slot] !== ws) return;
  room.sockets[slot] = null;
  room.lastUsed = Date.now();
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
  ws.on('close', () => onDisconnect(ws));
  ws.on('message', payload => {
    if (Date.now() - ws.rateWindow > 1000) { ws.rateWindow = Date.now(); ws.messageCount = 0; }
    if (++ws.messageCount > 20) { ws.close(4008, 'Límite de mensajes'); return; }
    let msg;
    try { msg = JSON.parse(payload.toString()); }
    catch { return fail(ws, 'Mensaje JSON inválido.'); }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return fail(ws, 'Mensaje inválido.');
    if (msg.type === 'create' || msg.type === 'queue') {
      if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
      const name = nameOf(msg.name);
      if (!name) return fail(ws, 'El apodo debe tener de 2 a 24 caracteres.');
      if (msg.type === 'queue' && waitingRandom) {
        const existing = rooms.get(waitingRandom);
        if (existing?.sockets[0]?.readyState === WebSocket.OPEN && !existing.match) {
          enter(ws, existing, name); return;
        }
        waitingRandom = null;
      }
      if (rooms.size >= MAX_ROOMS) return fail(ws, 'Servidor ocupado. Intenta más tarde.');
      const room = createRoom(name, msg.type === 'queue');
      if (msg.type === 'queue') waitingRandom = room.code;
      attach(ws, room, 0);
      return;
    }
    if (msg.type === 'join') {
      const name = nameOf(msg.name), code = typeof msg.code === 'string' ? msg.code.trim().toUpperCase() : '';
      if (!name) return fail(ws, 'El apodo debe tener de 2 a 24 caracteres.');
      const room = rooms.get(code);
      if (!room || room.randomQueue) return fail(ws, 'No existe una sala privada con ese código.');
      enter(ws, room, name); return;
    }
    if (msg.type === 'resume') {
      if (ws.seat) return fail(ws, 'Ya perteneces a una sala.');
      const room = rooms.get(typeof msg.code === 'string' ? msg.code.toUpperCase() : '');
      const slot = room?.seats.findIndex(seat => seat.token === msg.token);
      if (slot === undefined || slot < 0) return fail(ws, 'Sesión caducada. Abre una nueva partida.');
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
  for (const [code, room] of rooms) {
    if (now - room.lastUsed < ROOM_TTL_MS) continue;
    for (const timer of room.disconnected) if (timer) clearTimeout(timer);
    for (const ws of room.sockets) ws?.close(4000, 'Sala expirada');
    rooms.delete(code);
    if (waitingRandom === code) waitingRandom = null;
  }
}, 30_000);
server.on('close', () => clearInterval(heartbeat));
server.listen(port, '0.0.0.0', () => console.log('Decreto Real PvP en puerto ' + port));
