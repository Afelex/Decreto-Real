import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './combat-prototype.css';
import { CARD_LABELS, type Card, type CardKind } from '../game/cards';
import { applyCombatAction, invalidAction, playBlockReason, type CombatAction, type CombatState, type Difficulty } from '../game/combatEngine';
import { BLOCK_LABELS, blockText, currentMessage, historyLines } from '../game/combatText';
import { clearSave, writePreference, writeSave, type StorageLike } from '../game/combatSave';

type Kind = CardKind;

const CardArt: React.FC<{ kind: Kind; rank?: number; className?: string }> = ({ kind, rank, className }) => {
  const common = { className, viewBox: '0 0 120 100', role: 'img' as const, 'aria-hidden': true as const };
  if (kind === 'attack') return <svg {...common}><defs><linearGradient id="blade" x1="0" x2="1"><stop stopColor="#fff0c2"/><stop offset="1" stopColor="#c58a45"/></linearGradient></defs><path d="M31 77 78 20q7-8 15-5l-2 14-48 52-12 3z" fill="url(#blade)" stroke="#552b20" strokeWidth="3"/><path d="m25 71 24 19M34 64l-15 15m23-23-9-9" stroke="#e6bd72" strokeWidth="7" strokeLinecap="round"/><path d="m69 29 18 17" stroke="#fff7db" strokeWidth="3"/><circle cx="79" cy="75" r="24" fill="#8e2d30" opacity=".35"/></svg>;
  if (kind === 'defense') return <svg {...common}><path d="M60 12 96 25v27c0 21-16 34-36 43C40 86 24 73 24 52V25z" fill="#2f7180" stroke="#d4bd78" strokeWidth="5"/><path d="M60 22v61M34 35h52M39 57h42" stroke="#cce2d8" strokeWidth="4" opacity=".9"/><path d="m48 52 9 9 18-22" fill="none" stroke="#f5dfa0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="60" cy="51" r="45" fill="none" stroke="#e6cb82" strokeWidth="2" opacity=".55"/></svg>;
  if (kind === 'impact') return <svg {...common}><circle cx="60" cy="48" r="34" fill="#b88738" stroke="#ffdf8a" strokeWidth="5"/><circle cx="60" cy="48" r="24" fill="none" stroke="#f5e3b0" strokeWidth="3"/><path d="M60 26v44M38 48h44M45 33l30 30m0-30L45 63" stroke="#fff0be" strokeWidth="3"/><path d="m42 78 18 13 18-13" fill="#6f421e" stroke="#e7be63" strokeWidth="3"/><text x="60" y="56" textAnchor="middle" fontSize="22" fontFamily="serif" fontWeight="bold" fill="#68421e">{rank ?? 1}</text></svg>;
  return <svg {...common}><path d="M31 15v70m29-70v70m29-70v70" stroke="#e9d29b" strokeWidth="4"/><path d="M26 31h10m19 15h10m19-22h10M26 63h10m19 13h10m19-27h10" stroke="#b97d48" strokeWidth="8" strokeLinecap="round"/><circle cx="31" cy="31" r="7" fill="#cfaa61"/><circle cx="60" cy="46" r="7" fill="#72aab0"/><circle cx="89" cy="22" r="7" fill="#d9a55c"/><path d="M20 88h80" stroke="#cfaa61" strokeWidth="3"/></svg>;
};

const impactRank = (card: Card) => card.effect.type === 'impact' ? card.effect.rank : undefined;

const Portrait: React.FC<{ rival?: boolean }> = ({ rival = false }) => rival
  ? <svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="coat-r" x2="0" y2="1"><stop stopColor="#a3483e"/><stop offset="1" stopColor="#40222b"/></linearGradient></defs><path d="M8 100Q12 61 37 57h26q27 7 30 43" fill="url(#coat-r)"/><path d="m38 59 12 17 12-17 8 41H30z" fill="#efe2c8"/><path d="M37 41V31q0-19 13-20 16 1 16 20v12q-2 18-16 19-13-2-13-21" fill="#cf9b6d"/><path d="M31 37q-7-22 6-29l5 5q4-12 12-9 2 7 10 7 8 10 2 27l-4-8-3-8q-12 12-27 7z" fill="#e4e0d2"/><path d="M45 42h2m12 0h2" stroke="#3c2826" strokeWidth="2.5" strokeLinecap="round"/><path d="M46 51q5 4 10 0" fill="none" stroke="#713f36" strokeWidth="2" strokeLinecap="round"/><path d="m45 76 5 7 5-7m-5 7v17" fill="none" stroke="#c79e54" strokeWidth="2.5"/></svg>
  : <svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="coat-p" x2="0" y2="1"><stop stopColor="#28727b"/><stop offset="1" stopColor="#192c3d"/></linearGradient></defs><path d="M6 100q4-38 29-44h31q25 8 28 44" fill="url(#coat-p)"/><path d="m34 58 16 18 16-18 8 42H26z" fill="#f3e4c5"/><path d="M34 40q0-22 16-23 17 2 17 23v12q-3 17-17 18-13-2-16-18z" fill="#a96748"/><path d="M30 42q-4-26 12-31 16-6 27 6 7 8 2 28l-8-10-3-12q-12 11-29 8z" fill="#211a1a"/><path d="M41 45h2m14 0h2" stroke="#20191a" strokeWidth="2.6" strokeLinecap="round"/><path d="M44 56q6 4 12 0" fill="none" stroke="#743c36" strokeWidth="2" strokeLinecap="round"/><path d="m34 63 32 28M66 63 34 91" stroke="#e5b64f" strokeWidth="4"/><path d="m48 75 4 6 4-6m-4 6v16" fill="none" stroke="#f5e9ca" strokeWidth="2"/></svg>;


export const DIFFICULTY_KEY = 'decreto-difficulty';
export type SaveStatus = 'off' | 'pending' | 'saved' | 'quota' | 'unavailable';
export type GuideMove = { kind: 'select' | 'play'; cardId: string } | { kind: 'end_turn' };
/** Optional tutorial layer: it can only narrow what the player may do; the engine still decides. */
export type BoardGuide = { allows: (move: GuideMove) => boolean; target: string | null; panel: React.ReactNode; refusal: string };

const SAVE_TEXT: Record<SaveStatus, string> = {
  off: '', pending: '', saved: '✓ Guardado',
  quota: '⚠ Sin guardar', unavailable: '⚠ Sin guardar',
};
export const SAVE_DETAIL: Record<SaveStatus, string> = {
  off: 'Esta partida no se guarda.',
  pending: 'Se guardará en este navegador después de tu primera jugada.',
  saved: 'Se guarda en este navegador después de cada jugada; podrás continuarla al volver.',
  quota: 'No hay espacio de almacenamiento para guardar. Puedes seguir jugando, pero esta partida no se recuperará si cierras la página.',
  unavailable: 'Este navegador no permite guardar (por ejemplo, en modo privado o con el almacenamiento bloqueado). Puedes jugar, pero la partida no se recuperará al recargar.',
};

type BoardProps = {
  initial: CombatState;
  /** Storage for the duel save; omit (tutorial) to keep the game in memory only. */
  storage?: StorageLike | null;
  restored?: boolean;
  onNewGame?: () => void;
  onExit?: () => void;
  onStateChange?: (state: CombatState) => void;
  onSelect?: (cardId: string | null) => void;
  guide?: BoardGuide;
  headerAction?: React.ReactNode;
  /** Campaign-only visible rival name, without changing engine state or rules. */
  opponentName?: string;
};

export const DuelBoard: React.FC<BoardProps> = ({ initial, storage, restored = false, onNewGame, onExit, onStateChange, onSelect, guide, headerAction, opponentName = 'Virrey estratega' }) => {
  const navigate = useNavigate();
  const exit = onExit ?? (() => navigate('/'));
  const [combat, dispatch] = React.useReducer((state: CombatState, action: CombatAction) => applyCombatAction(state, action).state, initial);
  const { drawPile, discard, hand, mana, playerHp, enemyHp, shield, enemyShield,
    seals, enemySeals, turn, lastPlay, difficulty, streak } = combat;
  const persist = storage !== undefined;
  const busy = combat.phase === 'rival';
  const gameOver = combat.phase === 'finished';
  const playerWon = combat.winner === 'player';
  const showPause = combat.paused;
  const setShowPause = (paused: boolean) => dispatch({ type: paused ? 'pause' : 'resume' });
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoredNotice, setRestoredNotice] = useState(restored);
  const [save, setSave] = useState<SaveStatus>(!persist ? 'off' : storage ? 'pending' : 'unavailable');
  const [saveWarningSeen, setSaveWarningSeen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pileView, setPileView] = useState<'draw' | 'discard' | null>(null);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const resultRef = React.useRef<HTMLHeadingElement>(null);
  const handRef = React.useRef<HTMLElement>(null);
  const [handOverflow, setHandOverflow] = useState(false);

  // Save after each accepted action (journal growth). A failed save never blocks play.
  React.useEffect(() => {
    onStateChange?.(combat);
    if (!persist || combat.journal.length === 0) return;
    if (combat.phase === 'finished') { clearSave(storage); return; }
    const result = writeSave(storage, combat);
    setSave(result.ok === true ? 'saved' : result.problem);
  }, [combat]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { onSelect?.(selected); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const journalLength = combat.journal.length;
  React.useEffect(() => { if (journalLength > initial.journal.length) { setNotice(null); setRestoredNotice(false); } }, [journalLength, initial.journal.length]);
  React.useEffect(() => { if (gameOver) resultRef.current?.focus(); }, [gameOver]);

  React.useEffect(() => {
    const open = showHelp || showDifficulty || showPause || pileView || showHistory;
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.dr-overlay [role="dialog"]');
    if (!dialog) return;
    const controls = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, select, textarea, [tabindex="0"]')];
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showHelp) setShowHelp(false);
        if (showDifficulty) setShowDifficulty(false);
        if (showPause) dispatch({ type: 'resume' });
        if (pileView) setPileView(null);
        if (showHistory) setShowHistory(false);
      } else if (event.key === 'Tab') {
        const items = controls();
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [showHelp, showDifficulty, showPause, pileView, showHistory]);

  // Tell the player when the hand is wider than the screen; jsdom has no ResizeObserver or layout.
  React.useEffect(() => {
    const element = handRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => setHandOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [hand.length, gameOver]);
  React.useEffect(() => {
    if (guide?.target) document.querySelector<HTMLElement>('.dr-guide-target')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [guide?.target]);

  // Time and presentation belong to React; the response itself is an atomic engine action.
  React.useEffect(() => {
    if (!busy || showPause) return;
    const timer = window.setTimeout(() => dispatch({ type: 'resolve_rival' }), 700);
    return () => window.clearTimeout(timer);
  }, [busy, showPause]);

  const chosen = hand.find(card => card.id === selected);
  const label = CARD_LABELS;
  const renameOpponent = (text: string) => opponentName === 'Virrey estratega' ? text : text.replaceAll('El Virrey estratega', opponentName).replaceAll('El Virrey', opponentName);
  const message = renameOpponent(currentMessage(combat));
  const history = historyLines(combat).map(renameOpponent);
  if (history.length === 0) history.push('Turno 1: la partida comienza.');
  const guideAllows = (move: GuideMove) => !guide || guide.allows(move);
  const target = (id: string) => guide?.target === id ? ' dr-guide-target' : '';

  const choose = (card: Card) => {
    if (busy) return;
    const block = playBlockReason(combat, card.id);
    if (block) { setSelected(null); setNotice(`${card.name}: ${blockText(combat, block, card)}`); return; }
    if (!guideAllows({ kind: 'select', cardId: card.id })) { setNotice(guide!.refusal); return; }
    setNotice(null); setSelected(card.id);
  };
  const play = (card: Card) => {
    const error = invalidAction(combat, { type: 'play', cardId: card.id });
    if (error || !guideAllows({ kind: 'play', cardId: card.id })) { setNotice(error ?? guide!.refusal); return; }
    dispatch({ type: 'play', cardId: card.id });
    setSelected(null);
  };
  const endTurn = () => {
    const error = invalidAction(combat, { type: 'end_turn' });
    if (error || !guideAllows({ kind: 'end_turn' })) { setNotice(error ?? guide!.refusal); return; }
    dispatch({ type: 'end_turn' });
    setSelected(null);
  };
  const setDifficulty = (value: Difficulty) => { dispatch({ type: 'difficulty', value }); writePreference(storage ?? null, DIFFICULTY_KEY, value); };
  const pips = (count: number) => <div aria-hidden="true">{[0, 1, 2, 3].map(i => <span className={i < count ? 'filled' : ''} key={i}>✦</span>)}</div>;
  const saveWarning = (save === 'quota' || save === 'unavailable') && !saveWarningSeen;

  return <main className={`dr-game${guide ? ' tutorial' : ''}`}>
    <header className="dr-top"><button className="dr-back" onClick={exit}>‹ <span>{guide ? 'Salir' : 'Menú'}</span></button><div><small>{guide ? 'TUTORIAL' : 'DUELO DE PRUEBA'} · TURNO {turn}</small><h1>Decreto Real</h1>{SAVE_TEXT[save] && <span className={`dr-save ${save}`} title={SAVE_DETAIL[save]}>{SAVE_TEXT[save]}</span>}</div>{headerAction ?? <button className="dr-iconbtn" onClick={() => setShowHelp(true)} aria-label="Reglas del prototipo">?</button>}</header>
    {saveWarning && <div className="dr-banner" role="status"><span>{SAVE_DETAIL[save]}</span><button onClick={() => setSaveWarningSeen(true)}>Entendido</button></div>}
    {restoredNotice && !saveWarning && <div className="dr-banner restored" role="status"><span>Partida recuperada en el turno {initial.turn}.</span><button onClick={() => setRestoredNotice(false)} aria-label="Cerrar aviso">×</button></div>}
    <section className="dr-rival" aria-label="Rival"><div className="dr-avatar rival"><Portrait rival/></div><div className="dr-person"><strong>{opponentName}</strong>{guide ? <small className="dr-difficulty-label">IA · {difficulty}</small> : <button className="dr-difficulty" onClick={() => setShowDifficulty(true)}>IA · {difficulty}　⌄</button>}<div className="dr-health"><span style={{ width: `${enemyHp * 5}%` }} /></div><b aria-label={`Vida del rival ${enemyHp} de 20, escudo ${enemyShield}`}>♥ {enemyHp}<i>/20</i>　🛡 {enemyShield}</b></div><div className="dr-seals" aria-label={`Impactos del rival: ${enemySeals} de 4`}>IMPACTOS <strong>{enemySeals}/4</strong>{pips(enemySeals)}</div></section>
    <section className={`dr-arena${guide ? ' coaching' : ''}`}>{guide ? guide.panel : <><div className="dr-map" aria-hidden="true">✥<small>CAMPO DE BATALLA</small></div>{lastPlay && <div key={`${lastPlay.side}-${lastPlay.name}-${journalLength}`} className={`dr-played ${lastPlay.side}`}><span aria-hidden="true">{lastPlay.icon}</span><b>{lastPlay.name}</b><small>{lastPlay.side === 'player' ? 'Tu jugada' : 'Jugada del rival'}</small></div>}<button className="dr-log" onClick={() => setShowHistory(true)} aria-label="Ver historial de jugadas">✦　{message} <small>· Historial</small></button></>}</section>
    <section className="dr-player" aria-label="Tu monarca"><div className="dr-avatar"><Portrait/></div><div className="dr-person"><strong>Tu monarca</strong><small>Investigador de Peruanistas</small><div className="dr-health"><span style={{ width: `${playerHp * 5}%` }} /></div><b aria-label={`Tu vida ${playerHp} de 20, escudo ${shield}`}>♥ {playerHp}<i>/20</i>　🛡 {shield}</b></div><div className="dr-seals player" aria-label={`Tus Impactos: ${seals} de 4`}>IMPACTOS <strong>{seals}/4</strong>{pips(seals)}</div><div className="dr-mana"><strong>{mana}<small>/3</small></strong><span>Mando</span><small className="dr-streak">Racha {streak}/3</small></div></section>
    {gameOver ? <section className="dr-result" aria-labelledby="dr-result-title"><small>FIN DEL DUELO</small><h2 id="dr-result-title" ref={resultRef} tabIndex={-1}>{playerWon ? '¡Victoria!' : 'Derrota'}</h2><p>{seals >= 4 ? 'Completaste los cuatro Impactos.' : enemySeals >= 4 ? '{opponentName} completó los cuatro Impactos.' : enemyHp <= 0 ? 'El rival se quedó sin vida.' : playerHp <= 0 ? 'Tu monarca se quedó sin vida.' : playerWon ? 'El reino recuerda tu decreto.' :  `${opponentName} ha prevalecido esta vez.`}</p><div className="dr-result-stats"><div><b>{turn}</b><small>Turno</small></div><div><b>{playerHp}</b><small>Tu vida</small></div><div><b>{seals}/4</b><small>Impactos</small></div></div><button onClick={onNewGame ?? (() => window.location.reload())}>Jugar otra vez</button><button className="dr-result-menu" onClick={() => navigate('/')}>Volver al menú</button></section> : <>
      <div className="dr-prompt" role="status" aria-live="polite">{chosen ? <><b>{chosen.name}</b> · {chosen.text}<button onClick={() => setSelected(null)}>Cancelar</button><button className={`dr-confirm${guide?.target === 'confirm' ? ' dr-guide-target' : ''}`} disabled={!!invalidAction(combat, { type: 'play', cardId: chosen.id })} onClick={() => play(chosen)}>Jugar carta</button></> : notice ? <span className="dr-notice">{notice}</span> : busy ? <>TURNO DEL RIVAL<span>Preparando respuesta…</span></> : <>TU TURNO <b>· {mana} de mando</b><span>Selecciona una carta</span></>}</div>
      <div className="dr-hand-meta"><span>Mano {hand.length}/6</span>{handOverflow && <span aria-hidden="true">Desliza para ver todas →</span>}</div>
      <section className="dr-hand" ref={handRef} aria-label={`Tu mano: ${hand.length} de 6 cartas`}>{hand.map(card => {
        const block = playBlockReason(combat, card.id);
        const locked = !!block;
        const specific = block === 'mana' || block === 'impact_order' || block === 'impact_used';
        const dim = !locked && !!guide && !guide.allows({ kind: 'select', cardId: card.id });
        return <button key={card.id} type="button" className={`dr-card ${card.kind} ${selected === card.id ? 'active' : ''} ${locked ? 'disabled' : ''}${dim ? ' dim' : ''}${target(card.id)}`} aria-disabled={locked} aria-pressed={selected === card.id} aria-label={`${card.name}, coste ${card.cost}. ${card.text}${specific ? ` Bloqueada: ${blockText(combat, block, card)}` : ''}`} onClick={() => choose(card)}><span className="dr-cost" aria-hidden="true">{card.cost}</span><small>{label[card.kind]}{impactRank(card) ? ` · ${impactRank(card)}/4` : ''}</small><span className="dr-art"><CardArt kind={card.kind} rank={impactRank(card)}/></span><strong>{card.name}</strong><p>{card.text}</p>{specific && <span className="dr-lock">{BLOCK_LABELS[block].short}</span>}</button>;
      })}</section>
      <footer className="dr-actions"><button onClick={() => setPileView('draw')}>▤ <span>Mazo {drawPile.length}</span></button><button className={`dr-end${target('end_turn')}`} onClick={endTurn} disabled={busy}>TERMINAR TURNO　→</button>{!guide && <button onClick={() => setShowPause(true)} disabled={busy} aria-label="Pausar partida">Ⅱ <span>Pausa</span></button>}</footer>
    </>}
    {showHelp && <div className="dr-overlay" role="presentation" onClick={() => setShowHelp(false)}><section className="dr-help" role="dialog" aria-modal="true" aria-labelledby="dr-help-title" onClick={(event) => event.stopPropagation()}><button className="dr-help-close" onClick={() => setShowHelp(false)} aria-label="Cerrar ayuda">×</button><small>GUÍA RÁPIDA</small><h2 id="dr-help-title">Cómo se juega</h2><ol><li><b>Usa tu mando.</b> Cada turno tienes 3 puntos. El coste aparece en la esquina de cada carta.</li><li><b>Ataca o protégete.</b> El escudo absorbe el daño antes que la vida.</li><li><b>Prepara los Impactos.</b> Juega I, II, III y Final en orden. Solo uno por turno.</li><li><b>Busca una racha.</b> Tres cartas seguidas de Ataque añaden daño; tres de Defensa añaden escudo.</li><li><b>Gana el duelo.</b> Reduce la vida rival a cero o completa los cuatro Impactos.</li></ol><p>La mano admite hasta seis cartas. La IA también puede avanzar sus Impactos.</p><button className="dr-pause-menu" onClick={() => navigate('/duelo-v1/tutorial')}>Ver tutorial guiado</button><button className="dr-help-ok" onClick={() => setShowHelp(false)}>Entendido</button></section></div>}
    {showDifficulty && <div className="dr-overlay" role="presentation" onClick={() => setShowDifficulty(false)}><section className="dr-help dr-difficulties" role="dialog" aria-modal="true" aria-labelledby="dr-difficulty-title" onClick={(event) => event.stopPropagation()}><button className="dr-help-close" onClick={() => setShowDifficulty(false)} aria-label="Cerrar dificultad">×</button><small>AJUSTA EL DESAFÍO</small><h2 id="dr-difficulty-title">Rival de IA</h2><p>La dificultad cambia la frecuencia con que ataca y prepara sus Impactos.</p>{(['Aprendiz', 'Estratega', 'Maestro'] as const).map((level) => <button key={level} className={`dr-level ${difficulty === level ? 'selected' : ''}`} aria-pressed={difficulty === level} onClick={() => { setDifficulty(level); setShowDifficulty(false); }}><b>{level}</b><small>{level === 'Aprendiz' ? 'Da más oportunidades para aprender.' : level === 'Estratega' ? 'Combina ataque, defensa e Impactos.' : 'Presiona cuando detecta una posible victoria.'}</small></button>)}</section></div>}
    {showPause && <div className="dr-overlay" role="presentation" onClick={() => setShowPause(false)}><section className="dr-help dr-pause" role="dialog" aria-modal="true" aria-labelledby="dr-pause-title" onClick={(event) => event.stopPropagation()}><small>PARTIDA EN CURSO</small><h2 id="dr-pause-title">Pausa</h2><p>Turno {turn} · {playerHp} de vida · {seals}/4 Impactos</p><p className="dr-save-detail">{SAVE_DETAIL[save]}</p><button className="dr-help-ok" onClick={() => setShowPause(false)}>Continuar partida</button><button className="dr-pause-menu" onClick={exit}>Salir al menú</button></section></div>}
    {pileView && <div className="dr-overlay" role="presentation" onClick={() => setPileView(null)}><section className="dr-pile" role="dialog" aria-modal="true" aria-labelledby="dr-pile-title" onClick={(event) => event.stopPropagation()}><button className="dr-help-close" onClick={() => setPileView(null)} aria-label="Cerrar mazo">×</button><small>INFORMACIÓN DE PARTIDA</small><h2 id="dr-pile-title">Tus cartas</h2><div className="dr-pile-tabs"><button className={pileView === 'draw' ? 'selected' : ''} aria-pressed={pileView === 'draw'} onClick={() => setPileView('draw')}>Mazo · {drawPile.length}</button><button className={pileView === 'discard' ? 'selected' : ''} aria-pressed={pileView === 'discard'} onClick={() => setPileView('discard')}>Descarte · {discard.length}</button></div><div className="dr-pile-list">{(pileView === 'draw' ? drawPile : discard).length === 0 ? <p className="dr-empty">{pileView === 'draw' ? 'No quedan cartas por robar.' : 'Aún no has jugado cartas.'}</p> : (pileView === 'draw' ? drawPile : discard).map((card) => <div className={`dr-pile-row ${card.kind}`} key={card.id}><span aria-hidden="true">{card.icon}</span><div><b>{card.name}</b><small>{label[card.kind]}{impactRank(card) ? ` · Impacto ${impactRank(card)}/4` : ''}</small></div><strong>{card.cost} ◈</strong></div>)}</div><button className="dr-help-ok" onClick={() => setPileView(null)}>Volver a la partida</button></section></div>}
    {showHistory && <div className="dr-overlay" role="presentation" onClick={() => setShowHistory(false)}><section className="dr-pile" role="dialog" aria-modal="true" aria-labelledby="dr-history-title" onClick={(event) => event.stopPropagation()}><button className="dr-help-close" onClick={() => setShowHistory(false)} aria-label="Cerrar historial">×</button><small>CRÓNICA DEL DUELO</small><h2 id="dr-history-title">Últimas jugadas</h2><ol className="dr-history">{history.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol><button className="dr-help-ok" onClick={() => setShowHistory(false)}>Volver a la partida</button></section></div>}
  </main>;
};
