import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// The Firebase project is shared for authentication ONLY. The Peruanistas invitation
// gate remains independent: a Decreto Real account does not grant access to Peruanistas.
const PROJECT = process.env.DR_FIREBASE_PROJECT_ID || 'peruanistas-531e5';
const KEYS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedKeys = null;
let cacheExpiresAt = 0;

export async function verifyFirebaseToken(token, fetcher = fetch) {
  if (typeof token !== 'string' || token.length > 6000) throw Error('Token ausente.');
  const parts = token.split('.');
  if (parts.length !== 3) throw Error('Token inválido.');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw Error('Firma no admitida.');
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== PROJECT || payload.iss !== 'https://securetoken.google.com/' + PROJECT ||
    typeof payload.sub !== 'string' || !/^[\w-]{1,128}$/.test(payload.sub) ||
    !Number.isInteger(payload.exp) || payload.exp <= now ||
    !Number.isInteger(payload.iat) || payload.iat > now ||
    !Number.isInteger(payload.auth_time) || payload.auth_time > now ||
    payload.email_verified !== true || typeof payload.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254)
    throw Error('Cuenta no verificada o sesión caducada.');
  if (!cachedKeys || cacheExpiresAt < Date.now()) {
    const response = await fetcher(KEYS_URL, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw Error('No se pudo consultar la validación de cuentas.');
    const data = await response.json();
    if (!Array.isArray(data.keys)) throw Error('Claves de autenticación inválidas.');
    cachedKeys = data.keys;
    const age = /max-age=(\d+)/.exec(response.headers.get('cache-control') || '');
    cacheExpiresAt = Date.now() + Math.min(Number(age?.[1] || 900), 3600) * 1000;
  }
  const jwk = cachedKeys.find(key => key.kid === header.kid && key.kty === 'RSA' && (!key.use || key.use === 'sig'));
  if (!jwk || !verifySignature('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]),
    createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url')))
    throw Error('No se pudo verificar la firma.');
  return { uid: payload.sub, email: payload.email.toLowerCase() };
}

function safeText(value, max = 24) {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max) : '';
}
function appearance(raw) {
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const choices = { portrait: ['xervias', 'cronista', 'vandalo', 'amaru'],
    entrance: ['clasica', 'estandarte', 'aurea'], back: ['clasico', 'sol', 'carmesi'],
    nameFx: ['clasico', 'brillo', 'particulas'] };
  return Object.fromEntries(Object.entries(choices).map(([key, values]) =>
    [key, values.includes(data[key]) ? data[key] : values[0]]));
}
function makeDuelist(saved = {}, existing = null) {
  const slots = Array.isArray(saved.slots) ? saved.slots.slice(0, 4)
    .filter(item => item && typeof item === 'object')
    .map(item => ({ name: safeText(item.name), appearance: appearance(item.appearance) })) : [];
  const old = existing?.progress || { matches: 0, wins: 0, impacts: 0 };
  const active = Number.isInteger(saved.active) && saved.active >= 0 && saved.active < slots.length ? saved.active : 0;
  return { version: 1, active, slots: slots.length ? slots : [{
    name: '', appearance: appearance({}) }],
    // The browser may edit cosmetics but cannot grant itself statistics or rewards.
    progress: old, rewardedRooms: existing?.rewardedRooms || [] };
}
function socialCopy(entry) {
  return { name: safeText(entry?.name) || 'Duelista',
    portrait: appearance({ portrait: entry?.portrait }).portrait,
    friends: Array.isArray(entry?.friends) ? entry.friends.filter(x => typeof x === 'string').slice(0, 100) : [],
    blocked: Array.isArray(entry?.blocked) ? entry.blocked.filter(x => typeof x === 'string').slice(0, 500) : [],
    requests: Array.isArray(entry?.requests) ? entry.requests.slice(0, 20) : [] };
}

export class AccountStore {
  constructor(file = process.env.DR_DATA_FILE || '/data/decreto-real-accounts.json') {
    this.file = file;
    mkdirSync(dirname(file), { recursive: true });
    if (!existsSync(file)) writeFileSync(file, JSON.stringify({ version: 1, users: {} }), { mode: 0o600, flag: 'wx' });
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (data?.version !== 1 || !data.users || typeof data.users !== 'object')
      throw Error('Archivo de cuentas inválido.');
    this.data = data;
  }
  user(uid) {
    const key = createHash('sha256').update(uid).digest('hex');
    if (!this.data.users[key]) this.data.users[key] = { social: socialCopy(), duelist: makeDuelist(), history: [] };
    return this.data.users[key];
  }
  flush() {
    const tmp = this.file + '.' + process.pid + '.tmp';
    writeFileSync(tmp, JSON.stringify(this.data), { mode: 0o600 });
    renameSync(tmp, this.file);
  }
  getDuelist(uid) { return structuredClone(this.user(uid).duelist); }
  saveDuelist(uid, raw) {
    const user = this.user(uid);
    user.duelist = makeDuelist(raw, user.duelist);
    this.flush();
    return this.getDuelist(uid);
  }
  getSocial(uid) { return socialCopy(this.user(uid).social); }
  saveSocial(uid, raw) { this.user(uid).social = socialCopy(raw); this.flush(); }
  getHistory(uid) { return structuredClone(this.user(uid).history || []); }
  recordMatch(room) {
    if (!room.match || room.match.status !== 'finished' || room.finishedStored) return false;
    const now = new Date().toISOString();
    for (let slot = 0; slot < room.seats.length; slot++) {
      const seat = room.seats[slot];
      if (!seat.accountId) continue;
      const user = this.user(seat.accountId);
      if (user.history.some(match => match.id === room.matchId)) continue;
      const opponent = room.seats[1 - slot];
      const result = room.match.winner === null ? 'empate'
        : room.match.winner === slot ? 'victoria' : 'derrota';
      user.history.unshift({ id: room.matchId, date: now, result,
        opponentId: opponent.accountId || null, opponentName: safeText(opponent.name),
        turns: room.match.turnNumber, mode: room.randomQueue ? 'aleatorio' : 'amistoso' });
      user.history = user.history.slice(0, 250);
      user.duelist.progress.matches++;
      if (result === 'victoria') user.duelist.progress.wins++;
      user.duelist.rewardedRooms = [room.matchId, ...user.duelist.rewardedRooms].slice(0, 80);
    }
    this.flush();
    room.finishedStored = true;
    return true;
  }
}
