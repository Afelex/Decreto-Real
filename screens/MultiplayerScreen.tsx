import React from 'react';
import { useNavigate } from 'react-router-dom';
import './multiplayer.css';
import { DuelistProfilePanel } from './DuelistProfilePanel';
import { loadDuelistProfile, saveDuelistProfile, rewardMatch, portraitUrl } from '../game/duelistProfile';
import { MultiplayerBattleBoard } from './MultiplayerBattleBoard';
import { useAudio } from '../contexts/AudioContext';
import { freeDuelMusicScene } from '../game/musicScene';
import type { GamePhase } from '../types';
import { advancePvpStats, confirmedPvpDraws, type PvpStats } from '../game/multiplayerStats';
import { multiplayerCueFromState, type MultiplayerCue } from '../game/multiplayerPresentation';

type Card = { id: string; type: 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'ORDER'; rank?: number };
type Player = { name: string; hp: number; impact: number; connected: boolean; deckCount: number; discarded: number;
  hand?: Card[]; handCount?: number; impactThisTurn?: boolean; comboType?: string | null; comboCount?: number;
  appearance?: { portrait: string; entrance: string; back: string; nameFx: string } };
type View = { revision: number; ruleset: string; status: 'playing' | 'finished'; isMyTurn: boolean; turnNumber: number;
  pendingCombo: 2 | 3 | null; winner: 'me' | 'opponent' | 'draw' | null; me: Player & { hand: Card[]; impactThisTurn: boolean };
  opponent: Player & { handCount: number }; lastEvent: string };
type Session = { code: string; matchId?: string; token: string; slot: number; name: string; randomQueue?: boolean };
const SESSION_KEY = 'decreto-real.pvp.session.v1';
const NAME_KEY = 'decreto-real.pvp.nickname.v1';
const configuredUrl = import.meta.env.VITE_MULTIPLAYER_WS_URL as string | undefined;
const SOCKET_URL = configuredUrl || (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'ws://localhost:3001' : '');
function getStored<T>(key: string): T | null {
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
}
function storeSession(session: Session) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* private mode */ }
}

export default function MultiplayerScreen() {
  const navigate = useNavigate();
  const { setMusicScene, playSound } = useAudio();
  const soundRef = React.useRef(playSound);
  soundRef.current = playSound;
  const [duelist, setDuelist] = React.useState(() => loadDuelistProfile());
  const [nickname, setNickname] = React.useState(() => { const p = loadDuelistProfile(); return p.slots[p.active]?.name || ''; });
  const [showProfile, setShowProfile] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState(() => new URLSearchParams(window.location.search).get('sala') || '');
  const [showJoinCode, setShowJoinCode] = React.useState(() => Boolean(new URLSearchParams(window.location.search).get('sala')));
  const [editingName, setEditingName] = React.useState(() => !nickname.trim());
  const inviteOnLoad = React.useRef(new URLSearchParams(window.location.search).get('sala') || '');
  const autoJoinAttempted = React.useRef(false);
  const [session, setSession] = React.useState<Session | null>(() => getStored(SESSION_KEY));
  // A resumed tab must not replay the first-match ceremony.
  const openingSeen = React.useRef(Boolean(session));
  const sessionRef = React.useRef<Session | null>(session);
  const socketRef = React.useRef<WebSocket | null>(null);
  const pendingRef = React.useRef<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [online, setOnline] = React.useState(false);
  const [view, setView] = React.useState<View | null>(null);
  const [waiting, setWaiting] = React.useState(false);
  const [error, setError] = React.useState('');
  const nicknameRef = React.useRef(nickname);
  const cosmeticRef = React.useRef(duelist.slots[duelist.active]?.appearance);
  nicknameRef.current = nickname;
  cosmeticRef.current = duelist.slots[duelist.active]?.appearance;
  React.useEffect(() => {
    saveDuelistProfile(duelist);
    const selectedName = duelist.slots[duelist.active]?.name || '';
    setNickname(selectedName);
    setEditingName(!selectedName.trim());
  }, [duelist]);
  const previousView = React.useRef<View | null>(null);
  const activeCue = React.useRef<MultiplayerCue | null>(null);
  const queuedCues = React.useRef<MultiplayerCue[]>([]);
  const [cinematicCue, setCinematicCue] = React.useState<MultiplayerCue | null>(null);
  const statsRef = React.useRef<PvpStats | null>(null);
  const [stats, setStats] = React.useState<PvpStats | null>(null);
  const drawCounter = React.useRef(0);
  const [drawCues, setDrawCues] = React.useState<Array<{
    id: number; side: 'PLAYER' | 'OPPONENT'; count: number;
  }>>([]);
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
        else if (/^[0-9]{2}[A-HJ-NP-Z]{2}$/i.test(inviteOnLoad.current) && !autoJoinAttempted.current && nicknameRef.current.trim().length >= 2) {
          autoJoinAttempted.current = true;
          socket.send(JSON.stringify({ type: 'join', name: nicknameRef.current.trim(), appearance: cosmeticRef.current,
            code: inviteOnLoad.current.toUpperCase() }));
        }
      });
      socket.addEventListener('message', event => {
        if (!active) return;
        let msg: any;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (msg.type === 'session' && typeof msg.token === 'string') {
          const next: Session = { code: msg.code, matchId: msg.matchId, token: msg.token,
            slot: msg.slot, name: msg.name, randomQueue: Boolean(msg.randomQueue) };
          sessionRef.current = next; setSession(next); storeSession(next);
          if (inviteOnLoad.current) {
            const url = new URL(window.location.href);
            url.searchParams.delete('sala');
            window.history.replaceState(null, '', url.toString());
            inviteOnLoad.current = '';
          }
        } else if (msg.type === 'waiting') {
          setWaiting(true); setView(null);
          previousView.current = null;
          openingSeen.current = false;
          activeCue.current = null; queuedCues.current = []; setCinematicCue(null);
          statsRef.current = null; setStats(null); setDrawCues([]);
        } else if (msg.type === 'state') {
          const latest = msg.view as View;
          const previous = previousView.current;
          const animation = multiplayerCueFromState(previous, latest);
          const updatedStats = advancePvpStats(statsRef.current, previous, latest);
          statsRef.current = updatedStats;
          setStats(updatedStats);
          if (latest.status === 'finished' && latest.winner && sessionRef.current?.matchId) {
            const matchId = sessionRef.current.matchId;
            setDuelist(current => rewardMatch(current, matchId, latest.winner === 'me', updatedStats.impactsSummoned));
          }
          const draws = confirmedPvpDraws(previous, latest);
          if (draws.length) setDrawCues(current => [...current.slice(-6),
            ...draws.map(draw => ({ ...draw, id: ++drawCounter.current }))]);
          previousView.current = latest;
          setWaiting(false); setView(latest);
          // Same 3.55-second DuelEntrance as IA, before the official turn ribbon.
          // Only the first state of a genuinely new match starts the ceremony.
          if (!previous && !openingSeen.current &&
            latest.revision === 1 && latest.turnNumber === 1 && latest.status === 'playing') {
            openingSeen.current = true;
            enqueueCue({ kind: 'intro', id: 0 });
          }
          if (animation) enqueueCue(animation);
          pendingRef.current = null; setPending(false);
        } else if (msg.type === 'ack' && msg.id === pendingRef.current) {
          pendingRef.current = null; setPending(false);
        } else if (msg.type === 'error') {
          setError(msg.reason || 'No se pudo completar la acción.');
          if (msg.id === pendingRef.current) { pendingRef.current = null; setPending(false); }
          if (msg.reason?.includes('Sesión caducada')) {
            sessionRef.current = null; setSession(null); setView(null); setWaiting(false);
            previousView.current = null; statsRef.current = null;
            setStats(null); setDrawCues([]);
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

  // La banda sonora utiliza la misma selección de escenas que Versus IA.
  // No se altera el estado del combate ni la autoridad del servidor.
  React.useEffect(() => {
    if (!view) return;
    const phase: GamePhase = view.status !== 'finished' ? 'PLAYER_TURN'
      : view.winner === 'me' ? 'VICTORY'
      : view.winner === 'opponent' ? 'DEFEAT' : 'PLAYER_TURN';
    setMusicScene(freeDuelMusicScene({
      entranceActive: cinematicCue?.kind === 'intro', phase,
      playerHP: view.me.hp, opponentHP: view.opponent.hp,
    }));
  }, [view?.status, view?.winner, view?.me.hp, view?.opponent.hp, cinematicCue?.kind, setMusicScene]);
  React.useEffect(() => () => setMusicScene(null), [setMusicScene]);
  // Audio is triggered by the PRESENTED effect stage, never on WebSocket receipt.
  const onCinematicEffect = (cue: MultiplayerCue) => {
    if (cue.kind === 'combo') soundRef.current('IMPACT');
    else if (cue.kind === 'card') {
      const sound = { ATTACK: 'ATTACK', DEFENSE: 'DEFENSE', ORDER: 'FLIP', IMPACT: 'IMPACT' } as const;
      soundRef.current(sound[cue.cardType]);
    }
  };


  const send = (data: object) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) { setError('Esperando conexión con el servidor.'); return false; }
    ws.send(JSON.stringify(data)); return true;
  };
  const enter = (type: 'create' | 'join' | 'queue') => {
    if (session) return;
    if (nickname.trim().length < 2 || nickname.trim().length > 24) { setError('Escribe un apodo de 2 a 24 caracteres.'); return; }
    const adjusted = { ...duelist, slots: duelist.slots.map((item, index) =>
      index === duelist.active ? { ...item, name: nickname.trim() } : item) };
    setDuelist(adjusted);
    setEditingName(false);
    setError('');
    send({ type, name: nickname.trim(), appearance: adjusted.slots[adjusted.active].appearance,
      ...(type === 'join' ? { code: joinCode.trim().toUpperCase() } : {}) });
  };
  const action = (move: object) => {
    if (!view || pendingRef.current) return;
    const id = crypto.randomUUID(); pendingRef.current = id; setPending(true); setError('');
    if (!send({ type: 'action', id, revision: view.revision, action: move })) {
      pendingRef.current = null; setPending(false);
    }
  };
  const activeTurn = Boolean(online && view?.isMyTurn && view.status === 'playing' && view.opponent.connected && !pending);
  const resetSession = () => {
    sessionRef.current = null; setSession(null); setView(null); setWaiting(false); setError('');
    pendingRef.current = null; setPending(false);
    previousView.current = null;
    openingSeen.current = false;
    statsRef.current = null; setStats(null); setDrawCues([]);
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
            <span className="dr-pvp-identity-symbol" aria-hidden="true"><img src={portraitUrl(duelist.slots[duelist.active]?.appearance.portrait || 'xervias')} alt=""/></span>
            <span className="dr-pvp-identity-copy"><small>Juegas como</small><strong>{nickname}</strong></span>
            <button type="button" onClick={() => setEditingName(true)} aria-label="Cambiar apodo">✎</button>
          </div>}
      <button type="button" className="dr-pvp-profile-shortcut" onClick={() => setShowProfile(true)}>
        Mi perfil de duelista · Nombres, retratos y recompensas
      </button>
      {!inviteOnLoad.current && <>
        <button type="button" className="dr-pvp-primary dr-pvp-feature-button" disabled={!online}
          onClick={() => enter('queue')}><span aria-hidden="true">⚔</span>Jugar ahora</button>
        <button type="button" className="dr-pvp-secondary dr-pvp-feature-button" disabled={!online}
          onClick={() => enter('create')}><span aria-hidden="true">♟</span>Invitar a un amigo</button>
        <button type="button" className="dr-pvp-minor" onClick={() => setShowJoinCode(current => !current)}>
          <span aria-hidden="true">↗</span>Tengo un código de invitación</button>
      </>}
      {showJoinCode && <div className="dr-pvp-code-join">
        {!inviteOnLoad.current && <label>Código recibido<input value={joinCode} maxLength={4}
          onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Ej. 27KP" /></label>}
        <button type="button" className={inviteOnLoad.current ? 'dr-pvp-primary dr-pvp-feature-button' : 'dr-pvp-secondary'}
          disabled={!online || !/^[0-9]{2}[A-HJ-NP-Z]{2}$/i.test(joinCode.trim())}
          onClick={() => enter('join')}>{inviteOnLoad.current ? 'Aceptar desafío' : 'Unirme al duelo'}</button>
      </div>}
      <p className="dr-pvp-tip"><span aria-hidden="true">ⓘ</span>
        Crea una sala y comparte el código de 2 números y 2 letras.</p>
    </section>}

    {session && waiting && <section className="dr-pvp-lobby dr-pvp-waiting">
      <h2>{session.randomQueue ? 'Buscando rival…' : 'Esperando al rival'}</h2>
      <div className="dr-pvp-ornament" aria-hidden="true"><span>✦</span></div>
      <p>Tu rival puede entrar con el código privado de cuatro caracteres.</p>
      {!session.randomQueue && <>
        <button type="button" className="dr-pvp-primary dr-pvp-feature-button" onClick={() => { void copyRoom(); }}>
          <span aria-hidden="true">↗</span>Compartir invitación</button>
        <div className="dr-pvp-code" aria-label={'Código privado: ' + session.code}>{session.code}</div>
      </>}
      <button type="button" className="dr-pvp-secondary" onClick={resetSession}>Cancelar espera</button>
    </section>}

    {session && !waiting && !view && <section className="dr-pvp-lobby"><h2>Restableciendo la partida</h2>
      <p>Reconectando con la sala {session.code}…</p><div className="dr-pvp-ornament" aria-hidden="true"><span>✦</span></div></section>}

    {!session && showProfile && <DuelistProfilePanel profile={duelist} onChange={setDuelist}
      onClose={() => setShowProfile(false)}/>}
    {view && <MultiplayerBattleBoard view={view} online={online} activeTurn={activeTurn && !cinematicCue}
      cinematicCue={cinematicCue} onCueEnded={finishCue} onCinematicEffect={onCinematicEffect}
      stats={stats} drawCues={drawCues}
      onDrawFinished={id => setDrawCues(current => current.filter(cue => cue.id !== id))}
      onPlayCard={card => action({ type: 'play', cardId: card.id })}
      onEndTurn={() => action({ type: 'end_turn' })}
      onCombo={choice => action({ type: 'combo', choice })}
      onSurrender={() => action({ type: 'surrender' })}
      onNewGame={resetSession}
      onExit={() => { resetSession(); navigate('/'); }}/>}
  </main>;
}
