import React from 'react';
import { useNavigate } from 'react-router-dom';
import './one-screen-ui.css';

const RULE_PAGES = [
  { name: 'Inicio', icon: '♛', title: 'La partida original',
    lines: ['Ambos jugadores empiezan con 10 puntos de vida y un mazo propio de 24 cartas.', 'Lanza la moneda del ritual para decidir quién juega primero.', 'Gana al reducir la vida rival a cero o al completar cuatro Impactos.'] },
  { name: 'Cartas', icon: '◈', title: '10 ataques, 10 defensas y 4 Impactos',
    lines: ['Cada mazo contiene 10 Decretos de Ataque, 10 Decretos de Defensa y los cuatro Impactos.', 'Comienzas con tres cartas en la mano y robas una al iniciar cada turno propio.', 'Toca una carta para seleccionarla; arrástrala al centro para activarla. Sin Mando.'] },
  { name: 'Ataque', icon: '⚔', title: 'Actúa sin esperar',
    lines: ['Cada Decreto de Ataque quita 2 puntos de vida al rival.', 'Cada Decreto de Defensa recupera 1 punto de vida, sin superar los 10 iniciales.', 'Para Ataque o Defensa, suéltala en el campo central. También puedes seleccionar y tocar la zona.'] },
  { name: 'Impactos', icon: '✦', title: 'Los cuatro sellos',
    lines: ['Coloca Impacto I, II, III y Final en las cuatro casillas, de izquierda a derecha.', 'Solo puedes jugar un Impacto por turno.', 'Los primeros Impactos dañan al rival y recuperan vida. El cuarto termina el combate.'] },
  { name: 'Combos', icon: '♜', title: 'Habilidades especiales',
    lines: ['Encadena cartas del mismo tipo: COMBO ×2 anuncia progreso y ×3 activa la habilidad.', 'Cuando se active, escoge entre infligir daño adicional o recuperar vida.', 'Tu rival también tiene mazo, mano, combinaciones y efectos.'] },
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
      <button type="button" className="dr-guide-cta" onClick={() => navigate('/game')}>Jugar el original ⚔</button>
    </footer>
  </main>;
};
export default RulesScreen;
