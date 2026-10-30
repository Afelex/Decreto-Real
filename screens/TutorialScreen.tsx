import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './combat-prototype.css';
import type { CombatState } from '../game/combatEngine';
import { browserStorage, writePreference } from '../game/combatSave';
import { cardLookup, describeEntry } from '../game/combatText';
import { createTutorialCombat, TUTORIAL_STEPS, tutorialAllows, tutorialCards, tutorialStep, tutorialTarget, type TutorialStepId } from '../game/tutorial';
import { DuelBoard } from './DuelBoard';
import { TUTORIAL_KEY } from './CombatPrototype';

const TOTAL = TUTORIAL_STEPS.length - 1;

/** In-memory tutorial: it never writes the duel save, so leaving it keeps no advantage. */
const TutorialRun: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
  const navigate = useNavigate();
  const initial = useMemo(createTutorialCombat, []);
  const cards = useMemo(() => tutorialCards(initial), [initial]);
  const [state, setState] = useState<CombatState>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<ReadonlySet<TutorialStepId>>(new Set());
  const step = tutorialStep({ state, selected, acknowledged }, cards);
  const ack = (id: TutorialStepId) => setAcknowledged(previous => new Set([...previous, id]));
  const leave = (mark: 'visto' | 'omitido') => { writePreference(browserStorage(), TUTORIAL_KEY, mark); navigate('/duelo-v1'); };
  const name = (id: string) => initial.hand.find(card => card.id === id)!.name;
  const rivalLine = () => {
    const entry = [...state.journal].reverse().find(item => item.action.type === 'resolve_rival');
    return entry ? describeEntry(entry, cardLookup(state)).join(' ') : '';
  };

  const content: Record<TutorialStepId, { title: string; text: React.ReactNode; action?: React.ReactNode }> = {
    intro: { title: 'Bienvenida al duelo', text: 'Vas a jugar dos turnos de práctica contra el Virrey con las reglas normales. Gana quien deje al rival sin vida o selle cuatro Impactos.', action: <button className="dr-coach-next" onClick={() => ack('intro')}>Empezar</button> },
    select: { title: 'Elige una carta', text: <>Toca <b>{name(cards.attack)}</b>. El número de la esquina es su coste: tienes <b>{state.mana} de mando</b> por turno.</> },
    confirm: { title: 'Confirma la jugada', text: <>Pulsa <b>Jugar carta</b>. Si te equivocas, <b>Cancelar</b> la deja en tu mano.</> },
    defend: { title: 'Ataca y defiéndete', text: <>¡{20 - state.enemyHp} de daño al rival! Ahora protégete: elige <b>{name(cards.defense)}</b> y pulsa Jugar carta. El escudo absorbe el daño antes que la vida.</> },
    end_turn: { title: 'Mando e Impactos', text: <>Te queda <b>{state.mana} de mando</b>: por eso Impacto I (coste 2) aparece bloqueado. Los Impactos se sellan en orden, uno por turno, y quien selle cuatro gana. Pulsa <b>Terminar turno</b>.</> },
    rival: state.phase === 'rival'
      ? { title: 'Turno del rival', text: 'El Virrey prepara su respuesta. Mientras tanto no puedes jugar cartas.' }
      : { title: 'Respuesta del rival', text: <>{rivalLine()} Al empezar tu turno recuperas 3 de mando y robas una carta.</>, action: <button className="dr-coach-next" onClick={() => ack('rival')}>Continuar</button> },
    impact: { title: 'Sella un Impacto', text: <>Ya tienes mando de nuevo. Elige <b>{name(cards.impact)}</b> y pulsa Jugar carta.</> },
    done: { title: 'Tutorial completado', text: `Impacto ${state.seals}/4 sellado: el rival pierde 1 de vida y tú recuperas 1. Ya conoces lo esencial; la ayuda (?) resume las reglas.`, action: <><button className="dr-coach-next" onClick={() => leave('visto')}>Jugar un duelo</button><button onClick={onRestart}>Repetir tutorial</button></> },
  };
  const current = content[step];
  const index = TUTORIAL_STEPS.indexOf(step);
  const panel = <section className="dr-coach" aria-labelledby="dr-coach-title" aria-live="polite">
    <small>PASO {Math.min(index + 1, TOTAL)} DE {TOTAL}{step === 'done' ? ' · COMPLETADO' : ''}</small>
    <h2 id="dr-coach-title">{current.title}</h2>
    <p>{current.text}</p>
    {current.action && <div className="dr-coach-actions">{current.action}</div>}
  </section>;

  return <DuelBoard initial={initial} onStateChange={setState} onSelect={setSelected} onExit={() => leave('omitido')}
    headerAction={step === 'done' ? <span/> : <button className="dr-skip" onClick={() => leave('omitido')}>Omitir</button>}
    guide={{ panel, target: tutorialTarget(step, cards, selected), allows: move => tutorialAllows(step, cards, move), refusal: 'Sigue el paso indicado en la guía.' }}/>;
};

const TutorialScreen: React.FC = () => {
  const [run, setRun] = useState(0);
  return <TutorialRun key={run} onRestart={() => setRun(value => value + 1)}/>;
};

export default TutorialScreen;
