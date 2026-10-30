import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './combat-prototype.css';
import { CARD_LABELS, createDeck, type Card, type CardKind } from '../game/cards';
import { drawFromPile, GAME_RULES, nextComboStreak, resolveAttack, resolveImpact } from '../game/rules';

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

const CombatPrototype: React.FC = () => {
  const navigate = useNavigate();
  const [openingDeck] = useState<Card[]>(() => createDeck());
  const [drawPile, setDrawPile] = useState<Card[]>(() => openingDeck.slice(4));
  const [discard, setDiscard] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>(() => openingDeck.slice(0, 4));
  const [mana, setMana] = useState(GAME_RULES.startingMana);
  const [playerHp, setPlayerHp] = useState(GAME_RULES.maxHealth);
  const [enemyHp, setEnemyHp] = useState(GAME_RULES.maxHealth);
  const [shield, setShield] = useState(0);
  const [enemyShield, setEnemyShield] = useState(0);
  const [seals, setSeals] = useState(0);
  const [enemySeals, setEnemySeals] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState('Elige una carta para comenzar tu jugada.');
  const [history, setHistory] = useState<string[]>(['Turno 1: la partida comienza.']);
  const [showHistory, setShowHistory] = useState(false);
  const [lastPlay, setLastPlay] = useState<{ side: 'player' | 'rival'; name: string; icon: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [pileView, setPileView] = useState<'draw' | 'discard' | null>(null);
  const [difficulty, setDifficulty] = useState<'Aprendiz' | 'Estratega' | 'Maestro'>(() => {
    const saved = localStorage.getItem('decreto-difficulty');
    return saved === 'Aprendiz' || saved === 'Maestro' ? saved : 'Estratega';
  });
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [impactPlayed, setImpactPlayed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastKind, setLastKind] = useState<Kind | null>(null);
  const gameOver = playerHp <= 0 || enemyHp <= 0 || seals >= 4 || enemySeals >= 4;
  const chosen = hand.find((card) => card.id === selected);
  const playerWon = (enemyHp <= 0 || seals >= 4) && !(playerHp <= 0 || enemySeals >= 4);
  const label = CARD_LABELS;

  React.useEffect(() => {
    if (message === 'Elige una carta para comenzar tu jugada.' || message === 'El Virrey estratega prepara su respuesta…') return;
    setHistory((items) => [`Turno ${turn}: ${message}`, ...items].slice(0, 12));
  }, [message]);

  const drawCards = (count: number, currentHand: Card[] = hand) => {
    const result = drawFromPile(currentHand, drawPile, count, GAME_RULES.maxHand);
    if (result.drawn.length === 0) return 0;
    setDrawPile(result.drawPile);
    setHand(result.hand);
    return result.drawn.length;
  };

  const play = (card: Card) => {
    if (busy || gameOver || card.cost > mana || (card.effect.type === 'impact' && (impactPlayed || card.effect.rank !== seals + 1))) return;
    setLastPlay({ side: 'player', name: card.name, icon: card.icon });
    setMana((v) => v - card.cost);
    const handAfterPlay = hand.filter((item) => item.id !== card.id);
    setHand(handAfterPlay);
    setDiscard((cards) => [...cards, card]);
    const combo = nextComboStreak(lastKind, streak, card.kind);
    const triggersCombo = combo.triggered;
    setLastKind(card.kind); setStreak(combo.count);
    setSelected(null);
    if (card.effect.type === 'damage') {
      const bonus = triggersCombo ? 2 : 0;
      const attack = resolveAttack(card.effect.amount, enemyShield, bonus);
      setEnemyHp((v) => Math.max(0, v - attack.damageDealt)); setEnemyShield(attack.remainingShield);
      setMessage(`${card.name}: ${attack.damageDealt} de daño; el escudo rival bloquea ${attack.damageBlocked}.${bonus ? ' ¡Combo de ataque!' : ''}`);
    } else if (card.effect.type === 'shield') {
      const amount = card.effect.amount;
      const bonus = triggersCombo ? 2 : 0;
      setShield((v) => Math.min(GAME_RULES.maxShield, v + amount + bonus)); setMessage(`${card.name}: obtienes ${amount + bonus} de escudo.${bonus ? ' ¡Combo de defensa!' : ''}`);
    } else if (card.effect.type === 'impact') {
      setImpactPlayed(true);
      const impact = resolveImpact(seals, playerHp);
      if (impact.wins) { setSeals(impact.seals); setEnemyHp(0); setMessage('¡Decreto Final! Has sellado los cuatro decretos y ganado.'); }
      else { setSeals(impact.seals); setEnemyHp((v) => Math.max(0, v - impact.damage)); setPlayerHp(impact.health); setMessage(`Impacto sellado: ${impact.seals} de 4. Recuperas ${impact.health - playerHp} de vida.`); }
    } else {
      const drawn = drawCards(card.effect.amount, handAfterPlay);
      setMessage(drawn ? `Inspiración: robas ${drawn} carta${drawn===1?'':'s'}.` : 'Inspiración: no hay cartas para robar o tu mano está llena.');
    }
  };

  const endTurn = () => {
    if (busy || gameOver) return;
    setBusy(true); setSelected(null); setMessage('El Virrey estratega prepara su respuesta…');
    window.setTimeout(() => {
      const danger = playerHp + shield;
      const shouldAttack = difficulty === 'Aprendiz'
        ? danger <= 5 || enemyHp <= 4 || Math.random() > 0.7
        : difficulty === 'Maestro'
          ? danger <= 12 || enemyHp <= 10 || enemyShield >= 3 || Math.random() > 0.2
          : danger <= 8 || enemyHp <= 8 || enemyShield >= 5 || Math.random() > 0.45;
      if (enemySeals >= GAME_RULES.impactCount - 1) {
        setLastPlay({ side: 'rival', name: 'Decreto Final', icon: 'Ⅳ' });
        setEnemySeals(4); setMessage('El Virrey ejecuta el Decreto Final.');
      } else if (shouldAttack) {
        setLastPlay({ side: 'rival', name: 'Ofensiva real', icon: '⚔' });
        const incoming = 3 + (enemyHp <= 8 ? 1 : 0);
        const blocked = Math.min(shield, incoming);
        setShield((v) => v - blocked); setPlayerHp((v) => Math.max(0, v - (incoming - blocked)));
        setMessage(`El rival ataca por ${incoming}. Tu escudo bloquea ${blocked}.`);
      } else if (Math.random() < (difficulty === 'Aprendiz' ? 0.2 : difficulty === 'Maestro' ? 0.7 : 0.45)) {
        setLastPlay({ side: 'rival', name: `Impacto ${enemySeals + 1}`, icon: '✦' });
        setEnemySeals((v) => v + 1); setPlayerHp((v) => Math.max(0, v - 1)); setEnemyHp((v) => Math.min(20, v + 1));
        setMessage(`El Virrey sella su Impacto ${enemySeals + 1}/4 y recupera 1 de vida.`);
      } else { setLastPlay({ side: 'rival', name: 'Guardia del Virrey', icon: '⬟' }); setEnemyShield((v) => Math.min(10, v + 3)); setMessage('El Virrey se protege: obtiene 3 de escudo.'); }
      setTurn((v) => v + 1); setMana(GAME_RULES.startingMana); setImpactPlayed(false); drawCards(1); setBusy(false);
    }, 700);
  };

  return <main className="dr-game">
    <header className="dr-top"><button className="dr-back" onClick={() => navigate('/')}>‹ <span>Menú</span></button><div><small>DUELO DE PRUEBA · TURNO {turn}</small><h1>Decreto Real</h1></div><button className="dr-iconbtn" onClick={() => setShowHelp(true)} aria-label="Reglas del prototipo">?</button></header>
    <section className="dr-rival"><div className="dr-avatar rival"><Portrait rival/></div><div className="dr-person"><strong>Virrey estratega</strong><button className="dr-difficulty" onClick={()=>setShowDifficulty(true)}>IA · {difficulty}　⌄</button><div className="dr-health"><span style={{ width: `${enemyHp * 5}%` }} /></div><b>♥ {enemyHp}<i>/20</i>　🛡 {enemyShield}</b></div><div className="dr-seals">IMPACTOS <strong>{enemySeals}/4</strong><div>{[0,1,2,3].map((i)=><span className={i<enemySeals?'filled':''} key={i}>✦</span>)}</div></div></section>
    <section className="dr-arena"><div className="dr-map">✥<small>CAMPO DE BATALLA</small></div>{lastPlay&&<div key={`${lastPlay.side}-${lastPlay.name}-${turn}`} className={`dr-played ${lastPlay.side}`}><span>{lastPlay.icon}</span><b>{lastPlay.name}</b><small>{lastPlay.side==='player'?'Tu jugada':'Jugada del rival'}</small></div>}<button className="dr-log" onClick={()=>setShowHistory(true)} aria-label="Ver historial de jugadas">✦　{message} <small>· Historial</small></button></section>
    <section className="dr-player"><div className="dr-avatar"><Portrait/></div><div className="dr-person"><strong>Tu monarca</strong><small>Investigador de Peruanistas</small><div className="dr-health"><span style={{ width: `${playerHp * 5}%` }} /></div><b>♥ {playerHp}<i>/20</i>　🛡 {shield}</b></div><div className="dr-mana"><strong>{mana}<small>/3</small></strong><span>Mando</span><small className="dr-streak">Racha {streak}/3</small></div></section>
    {gameOver ? <section className="dr-result"><small>FIN DEL DUELO</small><h2>{playerWon?'¡Victoria!':'Derrota'}</h2><p>{seals>=4?'Completaste los cuatro Impactos.':enemySeals>=4?'El Virrey completó los cuatro Impactos.':enemyHp<=0?'El rival se quedó sin vida.':playerHp<=0?'Tu monarca se quedó sin vida.':playerWon?'El reino recuerda tu decreto.':'El Virrey ha prevalecido esta vez.'}</p><div className="dr-result-stats"><div><b>{turn}</b><small>Turno</small></div><div><b>{playerHp}</b><small>Tu vida</small></div><div><b>{seals}/4</b><small>Impactos</small></div></div><button onClick={()=>window.location.reload()}>Jugar otra vez</button><button className="dr-result-menu" onClick={()=>navigate('/')}>Volver al menú</button></section> : <>
      <div className="dr-prompt">{chosen ? <><b>{chosen.name}</b> · {chosen.text}{chosen.cost>mana&&<span>Te faltan {chosen.cost-mana} de mando</span>}{chosen.effect.type==='impact'&&chosen.effect.rank!==seals+1&&<span>Primero debes sellar el Impacto {seals+1}</span>}{chosen.effect.type==='impact'&&impactPlayed&&<span>Ya jugaste un Impacto este turno</span>}<button onClick={()=>setSelected(null)}>Cancelar</button><button className="dr-confirm" disabled={chosen.cost>mana||(chosen.effect.type==='impact'&&(impactPlayed||chosen.effect.rank!==seals+1))} onClick={()=>play(chosen)}>Jugar carta</button></> : <>TU TURNO <b>· {mana} de mando</b><span>Selecciona una carta</span></>}</div>
      <section className="dr-hand">{hand.map((card)=>{const locked=card.cost>mana||(card.effect.type==='impact'&&(impactPlayed||card.effect.rank!==seals+1));return <button key={card.id} type="button" className={`dr-card ${card.kind} ${selected===card.id?'active':''} ${locked?'disabled':''}`} aria-disabled={locked} aria-pressed={selected===card.id} aria-label={`${card.name}, coste ${card.cost}. ${card.text}${card.cost>mana?` Te faltan ${card.cost-mana} de mando.`:''}${card.effect.type==='impact'&&card.effect.rank!==seals+1?` Impacto fuera de orden; debes jugar el ${seals+1}.`:''}${impactPlayed&&card.effect.type==='impact'?' Ya jugaste un Impacto este turno.':''}`} onClick={()=>{if(!busy&&!locked)setSelected(card.id)}}><span className="dr-cost">{card.cost}</span><small>{label[card.kind]}{impactRank(card)?` · ${impactRank(card)}/4`:''}</small><span className="dr-art"><CardArt kind={card.kind} rank={impactRank(card)}/></span><strong>{card.name}</strong><p>{card.text}</p>{card.cost>mana&&<span className="dr-lock">Falta mando</span>}{card.effect.type==='impact'&&(impactPlayed||card.effect.rank!==seals+1)&&<span className="dr-lock">Juega en orden</span>}</button>})}</section>
      <footer className="dr-actions"><button onClick={()=>setPileView('draw')}>▤ <span>Mazo {drawPile.length}</span></button><button className="dr-end" onClick={endTurn} disabled={busy}>TERMINAR TURNO　→</button><button onClick={()=>setShowPause(true)} disabled={busy} aria-label="Pausar partida">Ⅱ <span>Pausa</span></button></footer>
    </>}
    {showHelp && <div className="dr-overlay" role="presentation" onClick={()=>setShowHelp(false)}><section className="dr-help" role="dialog" aria-modal="true" aria-labelledby="dr-help-title" onClick={(event)=>event.stopPropagation()}><button className="dr-help-close" onClick={()=>setShowHelp(false)} aria-label="Cerrar ayuda">×</button><small>GUÍA RÁPIDA</small><h2 id="dr-help-title">Cómo se juega</h2><ol><li><b>Usa tu mando.</b> Cada turno tienes 3 puntos. El coste aparece en la esquina de cada carta.</li><li><b>Ataca o protégete.</b> El escudo absorbe el daño antes que la vida.</li><li><b>Prepara los Impactos.</b> Juega I, II, III y Final en orden. Solo uno por turno.</li><li><b>Busca una racha.</b> Tres cartas seguidas de Ataque añaden daño; tres de Defensa añaden escudo.</li><li><b>Gana el duelo.</b> Reduce la vida rival a cero o completa los cuatro Impactos.</li></ol><p>La mano admite hasta seis cartas. La IA también puede avanzar sus Impactos.</p><button className="dr-help-ok" onClick={()=>setShowHelp(false)}>Entendido</button></section></div>}
    {showDifficulty&&<div className="dr-overlay" role="presentation" onClick={()=>setShowDifficulty(false)}><section className="dr-help dr-difficulties" role="dialog" aria-modal="true" aria-labelledby="dr-difficulty-title" onClick={(event)=>event.stopPropagation()}><button className="dr-help-close" onClick={()=>setShowDifficulty(false)} aria-label="Cerrar dificultad">×</button><small>AJUSTA EL DESAFÍO</small><h2 id="dr-difficulty-title">Rival de IA</h2><p>La dificultad cambia la frecuencia con que ataca y prepara sus Impactos.</p>{(['Aprendiz','Estratega','Maestro'] as const).map((level)=><button key={level} className={`dr-level ${difficulty===level?'selected':''}`} onClick={()=>{setDifficulty(level);localStorage.setItem('decreto-difficulty',level);setShowDifficulty(false);setMessage(`Dificultad cambiada a ${level}.`)}}><b>{level}</b><small>{level==='Aprendiz'?'Da más oportunidades para aprender.':level==='Estratega'?'Combina ataque, defensa e Impactos.':'Presiona cuando detecta una posible victoria.'}</small></button>)}</section></div>}
    {showPause&&<div className="dr-overlay" role="presentation" onClick={()=>setShowPause(false)}><section className="dr-help dr-pause" role="dialog" aria-modal="true" aria-labelledby="dr-pause-title" onClick={(event)=>event.stopPropagation()}><small>PARTIDA EN CURSO</small><h2 id="dr-pause-title">Pausa</h2><p>Turno {turn} · {playerHp} de vida · {seals}/4 Impactos</p><button className="dr-help-ok" onClick={()=>setShowPause(false)}>Continuar partida</button><button className="dr-pause-menu" onClick={()=>navigate('/')}>Salir al menú</button></section></div>}
    {pileView&&<div className="dr-overlay" role="presentation" onClick={()=>setPileView(null)}><section className="dr-pile" role="dialog" aria-modal="true" aria-labelledby="dr-pile-title" onClick={(event)=>event.stopPropagation()}><button className="dr-help-close" onClick={()=>setPileView(null)} aria-label="Cerrar mazo">×</button><small>INFORMACIÓN DE PARTIDA</small><h2 id="dr-pile-title">Tus cartas</h2><div className="dr-pile-tabs"><button className={pileView==='draw'?'selected':''} onClick={()=>setPileView('draw')}>Mazo · {drawPile.length}</button><button className={pileView==='discard'?'selected':''} onClick={()=>setPileView('discard')}>Descarte · {discard.length}</button></div><div className="dr-pile-list">{(pileView==='draw'?drawPile:discard).length===0?<p className="dr-empty">{pileView==='draw'?'No quedan cartas por robar.':'Aún no has jugado cartas.'}</p>:(pileView==='draw'?drawPile:discard).map((card)=><div className={`dr-pile-row ${card.kind}`} key={card.id}><span>{card.icon}</span><div><b>{card.name}</b><small>{label[card.kind]}{impactRank(card)?` · Impacto ${impactRank(card)}/4`:''}</small></div><strong>{card.cost} ◈</strong></div>)}</div><button className="dr-help-ok" onClick={()=>setPileView(null)}>Volver a la partida</button></section></div>}
    {showHistory&&<div className="dr-overlay" role="presentation" onClick={()=>setShowHistory(false)}><section className="dr-pile" role="dialog" aria-modal="true" aria-labelledby="dr-history-title" onClick={(event)=>event.stopPropagation()}><button className="dr-help-close" onClick={()=>setShowHistory(false)} aria-label="Cerrar historial">×</button><small>CRÓNICA DEL DUELO</small><h2 id="dr-history-title">Últimas jugadas</h2><ol className="dr-history">{history.map((entry,index)=><li key={`${entry}-${index}`}>{entry}</li>)}</ol><button className="dr-help-ok" onClick={()=>setShowHistory(false)}>Volver a la partida</button></section></div>}

  </main>;
};

export default CombatPrototype;
