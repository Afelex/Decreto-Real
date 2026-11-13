import React from 'react';
import { useNavigate } from 'react-router-dom';
import './multiplayer.css';
import { MultiplayerCinematicCue } from './MultiplayerCinematicCue';
import { multiplayerCueFromState, type MultiplayerCue } from '../game/multiplayerPresentation';

type Card = { id: string; type: 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'ORDER'; rank?: number };
type Player = { name: string; hp: number; impact: number; connected: boolean; deckCount: number; discarded: number;
  hand?: Card[]; handCount?: number; impactThisTurn?: boolean; comboType?: string | null; comboCount?: number };
type View = { revision: number; ruleset: string; status: 'playing' | 'finished'; isMyTurn: boolean; turnNumber: number;
  pendingCombo: 2 | 3 | null; winner: 'me' | 'opponent' | 'draw' | null; me: Player & { hand: Card[]; impactThisTurn: boolean };
  opponent: Player & { handCount: number }; lastEvent: string };
type Session = { code: string; token: string; slot: number; name: string; randomQueue?: boolean };
const SESSION_KEY = 'decreto-real.pvp.session.v1';
const NAME_KEY = 'decreto-real.pvp.nickname.v1';
const configuredUrl = import.meta.env.VITE_MULTIPLAYER_WS_URL as string | undefined;
const SOCKET_URL = configuredUrl || (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'ws://localhost:3001' : '');
const CARD_IMAGES: Record<Card['type'],string> = {
  ATTACK: import.meta.env.BASE_URL + 'cartas/decreto-ataque.webp',
  DEFENSE: import.meta.env.BASE_URL + 'cartas/decreto-defensa.webp',
  ORDER: import.meta.env.BASE_URL + 'cartas/decreto-orden.webp',
  IMPACT: import.meta.env.BASE_URL + 'cartas/decreto-impacto.webp',
};
const LABELS = { ATTACK: 'Ataque', DEFENSE: 'Defensa', ORDER: 'Orden', IMPACT: 'Impacto' };
function getStored<T>(key: string): T | null {
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
}
function storeSession(session: Session) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* private mode */ }
}

export default function MultiplayerScreen() {
  const navigate = useNavigate();
  const [nickname, setNickname] = React.useState(() => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } });
  const [joinCode, setJoinCode] = React.useState(() => new URLSearchParams(window.location.search).get('sala') || '');
  const [showJoinCode, setShowJoinCode] = React.useState(() => Boolean(new URLSearchParams(window.location.search).get('sala')));
  const [editingName, setEditingName] = React.useState(() => !nickname.trim());
  const inviteOnLoad = React.useRef(new URLSearchParams(window.location.search).get('sala') || '');
  const autoJoinAttempted = React.useRef(false);
  const [session, setSession] = React.useState<Session | null>(() => getStored(SESSION_KEY));
  const sessionRef = React.useRef<Session | null>(session);
  const socketRef = React.useRef<WebSocket | null>(null);
  const pendingRef = React.useRef<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [online, setOnline] = React.useState(false);
  const [view, setView] = React.useState<View | null>(null);
  const [waiting, setWaiting] = React.useState(false);
  const [error, setError] = React.useState('');
  const previousView = React.useRef<View | null>(null);
  const activeCue = React.useRef<MultiplayerCue | null>(null);
  const queuedCues = React.useRef<MultiplayerCue[]>([]);
  const [cinematicCue, setCinematicCue] = React.useState<MultiplayerCue | null>(null);
  const enqueueCue = (next: MultiplayerCue) => {
    if (activeCue.current) queuedCues.current.push(next);
    else { activeCue.current = next; setCinematicCue(next); }
  };
  const finishCue = () => {
    const next = queuedCues.current.shift() ?? null;
    activeCue.current = next;
    setCinematicCue(next);
  };

  React.useEffect(() => {
    if (!SOCKET_URL) return;
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    function connect() {
      const socket = new WebSocket(SOCKET_URL);
      socketRef.current = socket;
      socket.addEventListener('open', () => {
        if (!active) return;
        setOnline(true); setError('');
        if (sessionRef.current) socket.send(JSON.stringify({ type: 'resume', ...sessionRef.current }));
        else if (/^[0-9a-f]{10}$/i.test(inviteOnLoad.current) && !autoJoinAttempted.current && nickname.trim().length >= 2) {
          autoJoinAttempted.current = true;
          socket.send(JSON.stringify({ type: 'join', name: nickname.trim(), code: inviteOnLoad.current.toUpperCase() }));
        }
      });
      socket.addEventListener('message', event => {
        if (!active) return;
        let msg: any;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (msg.type === 'session' && typeof msg.token === 'string') {
          const next: Session = { code: msg.code, token: msg.token, slot: msg.slot, name: msg.name, randomQueue: Boolean(msg.randomQueue) };
          sessionRef.current = next; setSession(next); storeSession(next);
          if (inviteOnLoad.current) {
            const url = new URL(window.location.href);
            url.searchParams.delete('sala');
            window.history.replaceState(null, '', url.toString());
            inviteOnLoad.current = '';
          }
        } else if (msg.type === 'waiting') {
          setWaiting(true); setView(null);
        } else if (msg.type === 'state') {
          const latest = msg.view as View;
          const animation = multiplayerCueFromState(previousView.current, latest);
          previousView.current = latest;
          setWaiting(false); setView(latest);
          if (animation) enqueueCue(animation);
          pendingRef.current = null; setPending(false);
        } else if (msg.type === 'ack' && msg.id === pendingRef.current) {
          pendingRef.current = null; setPending(false);
        } else if (msg.type === 'error') {
          setError(msg.reason || 'No se pudo completar la acción.');
          if (msg.id === pendingRef.current) { pendingRef.current = null; setPending(false); }
          if (msg.reason?.includes('Sesión caducada')) {
            sessionRef.current = null; setSession(null); setView(null); setWaiting(false);
            try { sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
          }
        }
      });
      socket.addEventListener('close', () => {
        if (!active) return;
        setOnline(false); pendingRef.current = null; setPending(false);
        retry = setTimeout(connect, 1800);
      });
      socket.addEventListener('error', () => { if (active) setError('No se pudo conectar con el servidor de partidas.'); });
    }
    connect();
    return () => { active = false; clearTimeout(retry); socketRef.current?.close(); };
  }, []);

  const send = (data: object) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) { setError('Esperando conexión con el servidor.'); return false; }
    ws.send(JSON.stringify(data)); return true;
  };
  const enter = (type: 'create' | 'join' | 'queue') => {
    if (session) return;
    if (nickname.trim().length < 2 || nickname.trim().length > 24) { setError('Escribe un apodo de 2 a 24 caracteres.'); return; }
    try { localStorage.setItem(NAME_KEY, nickname.trim()); } catch { /* private mode */ }
    setEditingName(false);
    setError('');
    send({ type, name: nickname.trim(), ...(type === 'join' ? { code: joinCode.trim().toUpperCase() } : {}) });
  };
  const action = (move: object) => {
    if (!view || pendingRef.current) return;
    const id = crypto.randomUUID(); pendingRef.current = id; setPending(true); setError('');
    if (!send({ type: 'action', id, revision: view.revision, action: move })) {
      pendingRef.current = null; setPending(false);
    }
  };
  const activeTurn = Boolean(online && view?.isMyTurn && view.status === 'playing' && view.opponent.connected && !pending);
  const canPlay = (card: Card) => !!view && activeTurn && !view.pendingCombo &&
    (card.type !== 'IMPACT' || (card.rank === view.me.impact + 1 && !view.me.impactThisTurn));
  const resetSession = () => {
    sessionRef.current = null; setSession(null); setView(null); setWaiting(false); setError('');
    pendingRef.current = null; setPending(false);
    previousView.current = null;
    queuedCues.current = [];
    activeCue.current = null;
    setCinematicCue(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
    socketRef.current?.close(4000, 'Salir de la sala');
  };
  const copyRoom = async () => {
    if (!session) return;
    const link = window.location.origin + window.location.pathname + '?sala=' + session.code + '#/multijugador';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Decreto Real', text: 'Te desafío a un duelo en Decreto Real', url: link });
        return;
      } catch (err) { if ((err as Error)?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(link); }
    catch { setError('No se pudo copiar el enlace. Comparte el código que aparece debajo.'); }
  };

  return <main className={'dr-pvp' + (view ? ' dr-pvp-playing' : ' dr-pvp-home')}>
    <img className="dr-pvp-backdrop" alt="" aria-hidden="true"
      src={import.meta.env.BASE_URL + 'portada/portada-poster.jpg'} draggable={false}/>
    <div className="dr-pvp-vignette" aria-hidden="true"/>
    <header className="dr-pvp-header">
      <button className="dr-pvp-back" type="button" onClick={() => navigate('/')} aria-label="Volver al menú principal">‹</button>
      <div className="dr-pvp-header-brand"><span className="dr-pvp-crown" aria-hidden="true">♛</span><span>DECRETO REAL <span aria-hidden="true">·</span> MULTIJUGADOR</span></div>
      <span className={online ? 'dr-pvp-online' : 'dr-pvp-offline'} role="status"><span className="dr-pvp-status-dot" aria-hidden="true"/>{online ? 'Conectado' : 'Sin conexión'}</span>
    </header>
    {!view && <div className="dr-pvp-hero" aria-hidden="true">
      <h1>Duelo <em>multijugador</em></h1>
      <div className="dr-pvp-hero-rule"><span>✦</span></div>
    </div>}
    {!SOCKET_URL && <p className="dr-pvp-alert" role="alert">El servidor multijugador aún no está configurado. Se necesita VITE_MULTIPLAYER_WS_URL.</p>}
    {error && <p className="dr-pvp-alert" role="alert">{error}</p>}

    {!session && <section className="dr-pvp-lobby" aria-label="Opciones de juego en línea">
      <h2>{inviteOnLoad.current ? 'Te invitaron a un duelo' : '¿Cómo quieres jugar?'}</h2>
      <div className="dr-pvp-ornament" aria-hidden="true"><span>✦</span></div>
      {editingName
        ? <label className="dr-pvp-name-field">Tu apodo (solo la primera vez)<input value={nickname} maxLength={24}
            onChange={e => setNickname(e.target.value)} placeholder="Elige tu nombre de jugador" /></label>
        : <div className="dr-pvp-identity">
            <span className="dr-pvp-identity-symbol" aria-hidden="true">▣</span>
            <span className="dr-pvp-identity-copy"><small>Juegas como</small><strong>{nickname}</strong></span>
            <button type="button" onClick={() => setEditingName(true)} aria-label="Cambiar apodo">✎</button>
          </div>}
      {!inviteOnLoad.current && <>
        <button type="button" className="dr-pvp-primary dr-pvp-feature-button" disabled={!online}
          onClick={() => enter('queue')}><span aria-hidden="true">⚔</span>Jugar ahora</button>
        <button type="button" className="dr-pvp-secondary dr-pvp-feature-button" disabled={!online}
          onClick={() => enter('create')}><span aria-hidden="true">♟</span>Invitar a un amigo</button>
        <button type="button" className="dr-pvp-minor" onClick={() => setShowJoinCode(current => !current)}>
          <span aria-hidden="true">↗</span>Tengo un código de invitación</button>
      </>}
      {showJoinCode && <div className="dr-pvp-code-join">
        {!inviteOnLoad.current && <label>Código recibido<input value={joinCode} maxLength={10}
          onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Código de 10 caracteres" /></label>}
        <button type="button" className={inviteOnLoad.current ? 'dr-pvp-primary dr-pvp-feature-button' : 'dr-pvp-secondary'}
          disabled={!online || !/^[0-9a-f]{10}$/i.test(joinCode.trim())}
          onClick={() => enter('join')}>{inviteOnLoad.current ? 'Aceptar desafío' : 'Unirme al duelo'}</button>
      </div>}
      <p className="dr-pvp-tip"><span aria-hidden="true">ⓘ</span>
        Puedes invitar a un amigo compartiendo un enlace de la sala.</p>
    </section>}

    {session && waiting && <section className="dr-pvp-lobby dr-pvp-waiting">
      <h2>{session.randomQueue ? 'Buscando rival…' : 'Esperando al rival'}</h2>
      <div className="dr-pvp-ornament" aria-hidden="true"><span>✦</span></div>
      <p>La partida comenzará cuando estén conectados los dos jugadores.</p>
      {!session.randomQueue && <>
        <button type="button" className="dr-pvp-primary dr-pvp-feature-button" onClick={() => { void copyRoom(); }}>
          <span aria-hidden="true">↗</span>Compartir invitación</button>
        <details><summary>Compartir código de sala</summary><div className="dr-pvp-code">{session.code}</div></details>
      </>}
      <button type="button" className="dr-pvp-secondary" onClick={resetSession}>Cancelar espera</button>
    </section>}

    {session && !waiting && !view && <section className="dr-pvp-lobby"><h2>Restableciendo la partida</h2>
      <p>Reconectando con la sala {session.code}…</p><div className="dr-pvp-ornament" aria-hidden="true"><span>✦</span></div></section>}

    {view && <section className="dr-pvp-duel" aria-label="Tablero de duelo en línea">
      <div className="dr-pvp-rival dr-pvp-player">
        <div><strong>{view.opponent.name}</strong><small>{view.opponent.connected ? 'En línea' : 'Reconectando…'}</small></div>
        <b>{view.opponent.hp}<small>/20 PV</small></b>
      </div>
      <div className="dr-pvp-impacts" aria-label="Impactos del rival">{[1,2,3,4].map(i => <span key={i} className={view.opponent.impact >= i ? 'done' : ''}>{i === 4 ? 'FINAL' : i}</span>)}</div>
      <div className="dr-pvp-opponent-hand">Rival: {view.opponent.handCount} cartas en mano · {view.opponent.deckCount} en mazo</div>
      <div className="dr-pvp-center"><strong>{view.status === 'finished'
        ? view.winner === 'me' ? '¡VICTORIA!' : view.winner === 'opponent' ? 'DERROTA' : 'EMPATE'
        : !view.opponent.connected ? 'Esperando reconexión' : view.isMyTurn ? 'TU TURNO' : 'TURNO DEL RIVAL'}</strong>
        <small>Turno {view.turnNumber} · {view.lastEvent}</small></div>
      <div className="dr-pvp-impacts" aria-label="Tus Impactos">{[1,2,3,4].map(i => <span key={i} className={view.me.impact >= i ? 'done' : ''}>{i === 4 ? 'FINAL' : i}</span>)}</div>
      <div className="dr-pvp-player"><div><strong>{view.me.name}</strong><small>Mazo: {view.me.deckCount} · Combo: ×{view.me.comboCount || 0}</small></div>
        <b>{view.me.hp}<small>/20 PV</small></b></div>
      {view.pendingCombo && <div className="dr-pvp-combo"><h2>Combo ×{view.pendingCombo}</h2>
        <button disabled={!activeTurn} onClick={() => action({type:'combo',choice:'DAMAGE'})}>Ataque −{view.pendingCombo === 3 ? 3 : 1} PV</button>
        <button disabled={!activeTurn} onClick={() => action({type:'combo',choice:'HEAL'})}>Curación +{view.pendingCombo === 3 ? 3 : 1} PV</button>
      </div>}
      <div className="dr-pvp-hand" role="group" aria-label="Tu mano de cartas">
        {view.me.hand.map(card => <button type="button" key={card.id} disabled={!canPlay(card)}
          onClick={() => action({ type: 'play', cardId: card.id })} aria-label={'Jugar Decreto de ' + LABELS[card.type] + (card.rank ? ' ' + card.rank : '')}>
          <img alt="" src={CARD_IMAGES[card.type]} draggable={false}/>
          <strong>{card.type === 'IMPACT' ? 'Impacto ' + (card.rank === 4 ? 'Final' : card.rank) : LABELS[card.type]}</strong>
        </button>)}
      </div>
      <footer className="dr-pvp-controls">
        <button type="button" className="dr-pvp-primary" disabled={!activeTurn || Boolean(view.pendingCombo)} onClick={() => action({ type: 'end_turn' })}>Fin de turno</button>
        {view.status === 'playing' && <button type="button" onClick={() => {
          if (window.confirm('¿Rendirte? La partida contará como derrota.')) action({type:'surrender'});
        }} disabled={!online || pending}>Rendirse</button>}
        {view.status === 'finished' && <button type="button" onClick={resetSession}>Nueva partida</button>}
        {view.status === 'finished' && <button type="button" onClick={() => navigate('/')}>Volver al menú</button>}
      </footer>
    </section>}
    {cinematicCue && <MultiplayerCinematicCue cue={cinematicCue} onEnded={finishCue} />}
  </main>;
}
