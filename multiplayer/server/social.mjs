import { createHash, randomBytes } from 'node:crypto';

// Signed-in identities are stable across devices. Legacy guests remain available
// in isolated unit tests, but the live hub requires an authenticated account.
const VALID_STATES = new Set(['available', 'busy', 'hidden']);
const HEX_SECRET = /^[0-9a-f]{64}$/i;

function identityFromSecret(secret) {
  return createHash('sha256').update(Buffer.from(secret, 'hex')).digest('hex').slice(0, 24);
}
function safeName(value) {
  if (typeof value !== 'string') return 'Duelista';
  const name = value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 24);
  return name.length >= 2 ? name : 'Duelista';
}
function textContent(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 500);
}

export function createSocialHub({ send, fail, onChallenge, onAcceptChallenge, onDeclineChallenge,
  accountStore = null, requireAccount = false }) {
  const profiles = new Map(); // Presence is ephemeral; friends/blocks/requests are durable.
  const active = new Map();   // One active social socket per guest identity.
  const requests = new Map();
  const MAX_PEERS = 100;
  const LIMIT_CONTACTS = 100;

  function remember(profile) {
    if (!profile?.ownerUid || !accountStore) return;
    accountStore.saveSocial(profile.ownerUid, {
      name: profile.name, portrait: profile.portrait,
      friends: [...profile.friends], blocked: [...profile.blocked],
      requests: [...(requests.get(profile.id)?.values() || [])],
    });
  }
  function rememberRequest(owner) {
    const account = active.get(owner)?.social;
    if (account) remember(account);
  }

  function visiblePeers(profile) {
    return [...active.entries()]
      .filter(([id, ws]) => id !== profile.id && ws.social && ws.social.status !== 'hidden'
        && !profile.blocked.has(id) && !ws.social.blocked.has(profile.id))
      .map(([id, ws]) => ({
        id, name: ws.social.name, status: ws.seat ? 'busy' : ws.social.status,
        portrait: ws.social.portrait, friend: profile.friends.has(id),
      }))
      .sort((a, b) => Number(a.status === 'busy') - Number(b.status === 'busy') ||
        a.name.localeCompare(b.name, 'es'));
  }

  function roster(ws) {
    if (!ws?.social) return;
    const peers = visiblePeers(ws.social);
    send(ws, { type: 'social:roster', peers: peers.slice(0, MAX_PEERS), total: peers.length });
  }

  function broadcast() {
    for (const ws of active.values()) roster(ws);
  }

  function alertTo(id, message) {
    const recipient = active.get(id);
    if (recipient) send(recipient, message);
  }

  function handleHello(ws, msg) {
    if (requireAccount && !ws.account?.uid) return fail(ws, 'Debes verificar tu correo para entrar al multijugador.');
    const uid = ws.account?.uid || null;
    const secret = !uid && typeof msg.secret === 'string' && HEX_SECRET.test(msg.secret)
      ? msg.secret.toLowerCase() : !uid ? randomBytes(32).toString('hex') : null;
    const id = uid ? createHash('sha256').update('decreto-real:' + uid).digest('hex').slice(0, 24)
      : identityFromSecret(secret);
    let profile = profiles.get(id);
    if (!profile) {
      const saved = uid && accountStore ? accountStore.getSocial(uid) : null;
      profile = { id, ownerUid: uid, name: saved?.name || safeName(msg.name),
        portrait: saved?.portrait || 'xervias', status: 'hidden',
        friends: new Set(saved?.friends || []), blocked: new Set(saved?.blocked || []),
        lastChat: [], lastRequest: [] };
      profiles.set(id, profile);
      if (saved?.requests?.length) requests.set(id, new Map(saved.requests.map(item => [item.from, item])));
    }
    if (ws.social && ws.social.id !== id) return fail(ws, 'Esta conexión ya tiene un perfil social.');
    const previous = active.get(id);
    if (previous && previous !== ws) previous.social = null;
    ws.social = profile;
    profile.name = safeName(msg.name || profile.name);
    profile.portrait = typeof msg.portrait === 'string' && /^[a-z]{2,20}$/.test(msg.portrait)
      ? msg.portrait : profile.portrait;
    // Private by default on each new page; explicit reconnect may restore a selected state.
    profile.status = VALID_STATES.has(msg.status) ? msg.status : 'hidden';
    active.set(id, ws);
    remember(profile);
    send(ws, { type: 'social:identity', id, ...(secret ? { secret } : {}),
      friends: [...profile.friends],
      requests: [...(requests.get(id)?.values() || [])] });
    broadcast();
  }

  function handle(ws, msg) {
    if (msg.type === 'social:hello') { handleHello(ws, msg); return true; }
    if (!msg.type?.startsWith?.('social:')) return false;
    const me = ws.social;
    if (!me || active.get(me.id) !== ws) {
      fail(ws, 'Debes conectar tu perfil de duelista.'); return true;
    }
    switch (msg.type) {
      case 'social:profile': {
        me.name = safeName(msg.name);
        if (typeof msg.portrait === 'string' && /^[a-z]{2,20}$/.test(msg.portrait))
          me.portrait = msg.portrait;
        remember(me);
        broadcast();
        break;
      }
      case 'social:status': {
        if (!VALID_STATES.has(msg.status)) return fail(ws, 'Estado no válido.'), true;
        me.status = msg.status;
        broadcast();
        break;
      }
      case 'social:friend_request': {
        const target = typeof msg.to === 'string' ? msg.to : '';
        const other = active.get(target)?.social;
        if (!other || other.status === 'hidden' || target === me.id ||
          me.blocked.has(target) || other.blocked.has(me.id)) {
          fail(ws, 'El duelista no está disponible para solicitudes.'); break;
        }
        if (me.friends.has(target)) break;
        if (me.friends.size >= LIMIT_CONTACTS || other.friends.size >= LIMIT_CONTACTS) {
          fail(ws, 'La lista de amigos ha alcanzado el límite.'); break;
        }
        const now = Date.now();
        me.lastRequest = me.lastRequest.filter(at => now - at < 60_000);
        if (me.lastRequest.length >= 5) { fail(ws, 'Demasiadas solicitudes. Espera un minuto.'); break; }
        const inbox = requests.get(target) || new Map();
        if (inbox.size >= 20) { fail(ws, 'El duelista tiene demasiadas solicitudes pendientes.'); break; }
        if (inbox.has(me.id)) break;
        me.lastRequest.push(now);
        const request = { from: me.id, name: me.name };
        inbox.set(me.id, request);
        requests.set(target, inbox);
        rememberRequest(target);
        send(ws, { type: 'social:request_sent', to: target });
        alertTo(target, { type: 'social:friend_request', ...request });
        break;
      }
      case 'social:friend_reply': {
        const from = typeof msg.from === 'string' ? msg.from : '';
        const inbox = requests.get(me.id);
        if (!inbox?.has(from)) { fail(ws, 'La solicitud ya no está disponible.'); break; }
        inbox.delete(from);
        remember(me);
        send(ws, { type: 'social:request_closed', from });
        if (msg.accept === true) {
          const other = profiles.get(from);
          if (!other || other.blocked.has(me.id) || me.blocked.has(from)) break;
          me.friends.add(from); other.friends.add(me.id);
          remember(me); remember(other);
          send(ws, { type: 'social:friend_added', id: from });
          alertTo(from, { type: 'social:friend_added', id: me.id });
          broadcast();
        } else alertTo(from, { type: 'social:request_declined', from: me.id });
        break;
      }
      case 'social:chat': {
        const to = typeof msg.to === 'string' ? msg.to : '';
        const other = active.get(to);
        const message = textContent(msg.message);
        if (!other?.social || other.social.blocked.has(me.id) || me.blocked.has(to)
          || !me.friends.has(to) || !other.social.friends.has(me.id)) {
          fail(ws, 'Solo puedes conversar con amigos conectados.'); break;
        }
        if (!message) { fail(ws, 'Escribe un mensaje.'); break; }
        const now = Date.now();
        me.lastChat = me.lastChat.filter(at => now - at < 10_000);
        if (me.lastChat.length >= 6) { fail(ws, 'Demasiados mensajes. Espera unos segundos.'); break; }
        me.lastChat.push(now);
        const data = { type: 'social:chat', from: me.id, to, name: me.name,
          message, at: now };
        send(ws, data); send(other, data);
        break;
      }
      case 'social:block': {
        const id = typeof msg.to === 'string' ? msg.to : '';
        if (!id || id === me.id) break;
        me.blocked.add(id); me.friends.delete(id);
        profiles.get(id)?.friends.delete(me.id);
        requests.get(me.id)?.delete(id);
        requests.get(id)?.delete(me.id);
        remember(me); remember(profiles.get(id));
        send(ws, { type: 'social:blocked', id });
        broadcast();
        break;
      }
      case 'social:report': {
        const id = typeof msg.to === 'string' ? msg.to : '';
        const reason = ['acoso', 'spam', 'suplantacion', 'otro'].includes(msg.reason)
          ? msg.reason : 'otro';
        if (id && id !== me.id) {
          // Operational logging only; production moderation requires a durable report queue.
          console.warn('[social-report]', JSON.stringify({ from: me.id, target: id, reason, at: Date.now() }));
          send(ws, { type: 'social:report_received' });
        }
        break;
      }
      case 'social:challenge': {
        const to = typeof msg.to === 'string' ? msg.to : '';
        const other = active.get(to);
        if (!other?.social || other.social.status === 'hidden' ||
          me.blocked.has(to) || other.social.blocked.has(me.id) ||
          other.seat || ws.seat) { fail(ws, 'El duelista no puede recibir un desafío ahora.'); break; }
        const code = onChallenge(ws, other);
        if (code) {
          send(other, { type: 'social:incoming_challenge', from: me.id, name: me.name, code });
          send(ws, { type: 'social:challenge_sent', to, code });
          broadcast();
        }
        break;
      }
      case 'social:accept_challenge': {
        if (typeof msg.code !== 'string') break;
        if (onAcceptChallenge(ws, msg.code)) broadcast();
        break;
      }
      case 'social:decline_challenge': {
        if (typeof msg.code !== 'string') break;
        onDeclineChallenge(ws, msg.code);
        break;
      }
      default: fail(ws, 'Acción social desconocida.');
    }
    return true;
  }

  function disconnected(ws) {
    const me = ws.social;
    if (me && active.get(me.id) === ws) {
      active.delete(me.id);
      broadcast();
    }
    ws.social = null;
  }

  return { handle, disconnected, broadcast };
}
