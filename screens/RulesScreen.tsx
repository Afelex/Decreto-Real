import React from 'react';
import { useNavigate } from 'react-router-dom';
import './one-screen-ui.css';

const RULE_PAGES = [
  { name: 'Objetivo', icon: '♛', title: 'Cómo ganar',
    lines: ['Comienza con 20 puntos de vida. Tu rival también tiene 20.', 'Gana reduciendo la vida rival a cero o completando los cuatro Impactos.', 'Cada decisión cuenta. No necesitas dados para resolver los ataques.'] },
  { name: 'Turnos', icon: '◈', title: 'Tres puntos de mando',
    lines: ['Al comienzo de cada turno dispones de 3 puntos de mando.', 'Cada carta tiene un coste indicado en su esquina.', 'Puedes jugar varias cartas legales y después pulsar «Terminar turno».'] },
  { name: 'Cartas', icon: '⚔', title: 'Tu mano',
    lines: ['Empiezas con 4 cartas de un mazo de 24; tu mano admite un máximo de 6.', 'Ataques dañan al rival. Defensas aumentan tu escudo. Apoyos aportan otros efectos.', 'Toca una carta para leerla; en campaña puedes arrastrarla hasta la mesa.'] },
  { name: 'Impactos', icon: '✦', title: 'Los cuatro sellos',
    lines: ['Debes jugar Impacto I, II, III y Final, en ese orden.', 'Solo puedes completar un Impacto por turno.', 'Al conseguir el cuarto Impacto ganas de inmediato. La IA puede ganar de la misma manera.'] },
  { name: 'Estrategia', icon: '♜', title: 'Defiende el reino',
    lines: ['El escudo absorbe el daño antes que la vida.', 'Tres ataques o tres defensas en una misma racha pueden generar un combo.', 'Si una carta aparece bloqueada, revisa el mando disponible y el orden de los Impactos.'] },
] as const;

/** Short readable pages rather than a tall scrollable manual. */
const RulesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const current = RULE_PAGES[page];
  return <main className="dr-guide-screen" aria-label="Reglas del Reino">
    <header className="dr-guide-header">
      <button type="button" onClick={() => navigate('/')} aria-label="Volver al menú">‹ Volver</button>
      <div><small>DECRETO REAL · APRENDE</small><h1>Reglas del Reino</h1></div>
    </header>
    <nav className="dr-guide-tabs" aria-label="Temas de reglas">
      {RULE_PAGES.map((rule, i) => <button type="button" key={rule.name} onClick={() => setPage(i)}
        aria-current={page === i ? 'page' : undefined} className={page === i ? 'active' : ''}>{rule.name}</button>)}
    </nav>
    <section className="dr-guide-card" aria-labelledby="dr-rule-heading">
      <div className="dr-guide-emblem" aria-hidden="true">{current.icon}</div>
      <small>LECCIÓN {page + 1} DE {RULE_PAGES.length}</small>
      <h2 id="dr-rule-heading">{current.title}</h2>
      <div className="dr-guide-points">
        {current.lines.map((line, i) => <p key={line}><span aria-hidden="true">{i + 1}</span>{line}</p>)}
      </div>
    </section>
    <footer className="dr-guide-footer">
      <div className="dr-guide-pagination">
        <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Anterior</button>
        <span>{page + 1} de {RULE_PAGES.length}</span>
        <button type="button" disabled={page === RULE_PAGES.length - 1} onClick={() => setPage(p => p + 1)}>Siguiente ›</button>
      </div>
      <button type="button" className="dr-guide-cta" onClick={() => navigate('/duelo-v1/tutorial')}>Aprender jugando ⚔</button>
    </footer>
  </main>;
};
export default RulesScreen;
