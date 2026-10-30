import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './combat-prototype.css';
import { createCombat, type CombatState, type Difficulty } from '../game/combatEngine';
import { browserStorage, clearSave, loadSave, readPreference, writePreference, type SaveProblem, type StorageLike } from '../game/combatSave';
import { DIFFICULTY_KEY, DuelBoard } from './DuelBoard';

export const TUTORIAL_KEY = 'decreto-real.duelo-v1.tutorial';

type Session =
  | { view: 'resume'; saved: CombatState }
  | { view: 'problem'; problem: Exclude<SaveProblem, 'unavailable'> }
  | { view: 'welcome' }
  | { view: 'board'; key: number; initial: CombatState; restored: boolean };

const PROBLEM_TEXT: Record<Exclude<SaveProblem, 'unavailable'>, string> = {
  corrupt: 'La partida guardada está dañada o incompleta y no se puede recuperar.',
  version: 'La partida guardada se creó con una versión incompatible del juego y no se puede recuperar.',
};

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function preferredDifficulty(storage: StorageLike | null): Difficulty {
  const saved = readPreference(storage, DIFFICULTY_KEY);
  return saved === 'Aprendiz' || saved === 'Maestro' ? saved : 'Estratega';
}
const freshBoard = (storage: StorageLike | null, key = 0): Session => ({ view: 'board', key, initial: createCombat(randomSeed(), preferredDifficulty(storage)), restored: false });

/** Every entry into /duelo-v1 checks for a recoverable game before creating a new one. */
function initialSession(storage: StorageLike | null): Session {
  const loaded = loadSave(storage);
  if (loaded.status === 'ready') return { view: 'resume', saved: loaded.state };
  if (loaded.status === 'invalid' && loaded.problem !== 'unavailable') return { view: 'problem', problem: loaded.problem };
  if (storage && loaded.status === 'empty' && !readPreference(storage, TUTORIAL_KEY)) return { view: 'welcome' };
  return freshBoard(storage);
}

const Lobby: React.FC<{ eyebrow: string; title: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => {
  const navigate = useNavigate();
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => { ref.current?.querySelector<HTMLElement>('.dr-lobby-primary')?.focus(); }, []);
  return <main className="dr-game">
    <header className="dr-top"><button className="dr-back" onClick={() => navigate('/')}>‹ <span>Menú</span></button><div><small>DUELO DE PRUEBA</small><h1>Decreto Real</h1></div><span/></header>
    <section className="dr-lobby" ref={ref} aria-labelledby="dr-lobby-title"><small>{eyebrow}</small><h2 id="dr-lobby-title">{title}</h2>{children}</section>
  </main>;
};

const CombatPrototype: React.FC = () => {
  const navigate = useNavigate();
  const [storage] = useState(browserStorage);
  const [session, setSession] = useState<Session>(() => initialSession(storage));
  const nextKey = session.view === 'board' ? session.key + 1 : 0;
  const newGame = () => setSession(freshBoard(storage, nextKey));

  if (session.view === 'resume') {
    const { saved } = session;
    return <Lobby eyebrow="PARTIDA GUARDADA" title="¿Continuar el duelo?">
      <p>Turno {saved.turn} · Tu vida {saved.playerHp}/20 · Rival {saved.enemyHp}/20 · Impactos {saved.seals}/4 frente a {saved.enemySeals}/4 · IA {saved.difficulty}</p>
      {saved.phase === 'rival' && <p>El rival estaba preparando su respuesta: se resolverá una sola vez al continuar.</p>}
      {saved.paused && <p>La partida estaba en pausa.</p>}
      <div className="dr-lobby-actions">
        <button className="dr-lobby-primary" onClick={() => setSession({ view: 'board', key: nextKey, initial: saved, restored: true })}>Continuar partida</button>
        <button onClick={newGame}>Nueva partida</button>
      </div>
      <p className="dr-lobby-note">Si empiezas una nueva, la guardada se reemplazará con tu primera jugada. El guardado vive solo en este navegador: no se sincroniza entre dispositivos.</p>
    </Lobby>;
  }
  if (session.view === 'problem') return <Lobby eyebrow="PARTIDA GUARDADA" title="No se pudo recuperar">
    <p role="alert">{PROBLEM_TEXT[session.problem]}</p>
    <div className="dr-lobby-actions"><button className="dr-lobby-primary" onClick={() => { clearSave(storage); newGame(); }}>Descartar y empezar una nueva</button></div>
    <p className="dr-lobby-note">Solo se borra la partida guardada de este duelo; no se tocan otros datos del navegador.</p>
  </Lobby>;
  if (session.view === 'welcome') return <Lobby eyebrow="BIENVENIDA" title="¿Primera vez en el duelo?">
    <p>Un tutorial breve te enseña a jugar cartas, atacar, defenderte, sellar Impactos y reconocer la respuesta del rival.</p>
    <div className="dr-lobby-actions">
      <button className="dr-lobby-primary" onClick={() => { writePreference(storage, TUTORIAL_KEY, 'visto'); navigate('/duelo-v1/tutorial'); }}>Aprender a jugar</button>
      <button onClick={() => { writePreference(storage, TUTORIAL_KEY, 'omitido'); newGame(); }}>Ir directamente al duelo</button>
    </div>
    <p className="dr-lobby-note">Puedes abrir el tutorial más tarde desde la ayuda (?).</p>
  </Lobby>;
  return <DuelBoard key={session.key} initial={session.initial} restored={session.restored} storage={storage} onNewGame={newGame}/>;
};

export default CombatPrototype;
