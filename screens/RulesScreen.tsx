import React from 'react';
import { useNavigate } from 'react-router-dom';
import './one-screen-ui.css';

const RULE_PAGES = [
  { name: 'Inicio', icon: '♛', title: 'El duelo de decretos',
    lines: ['Ambos jugadores comienzan con 20 puntos de vida y un mazo propio de 28 cartas.', 'Lanza la moneda para decidir quién empieza. Recibes tres cartas y robas una al iniciar cada turno.', 'Vences si la vida rival llega a 0 o si completas tus cuatro Impactos. Rendirse cuenta como derrota.'] },
  { name: 'Cartas', icon: '◈', title: '28 cartas, cinco clases',
    lines: ['Baraja estándar: 10 Ataques, 10 Defensas, 4 Impactos y 4 Órdenes. En campaña puedes reemplazar hasta tres por Místicas.', 'Selecciona una carta y arrástrala al centro del campo para activarla; también puedes tocar la zona de destino.', 'Las cartas de Impacto se colocan en las cuatro casillas de progreso, en secuencia.'] },
  { name: 'Acciones', icon: '⚔', title: 'Ataque, defensa y orden',
    lines: ['Ataque: resta 2 puntos de vida al oponente.', 'Defensa: recupera 1 punto de vida propio, sin superar el máximo de 20.', 'Orden: roba una carta adicional de tu mazo. Tu rival puede usar las mismas cartas.'] },
  { name: 'Impactos', icon: '✦', title: 'El Decreto Final',
    lines: ['Juega Impacto I, II, III y Final en ese orden. Solo puedes activar un Impacto por turno.', 'Cada Impacto quita 1 punto de vida al rival y recupera 1 de tu vida, hasta el máximo.', 'Al colocar Impacto Final (cuarto sello) ganas inmediatamente, aunque el rival aún conserve vida.'] },
  { name: 'Combos', icon: '♜', title: 'Combos ×2 y ×3',
    lines: ['Activa dos cartas seguidas del mismo tipo para COMBO ×2: elige entre quitar 1 de vida o curarte 1.', 'Tres cartas seguidas del mismo tipo activan COMBO ×3: elige entre quitar 3 de vida o curarte 3.', 'Valen Ataque, Defensa, Impacto, Orden y Mística. La racha continúa entre turnos, incluso entre dos Impactos consecutivos.'] },

  { name: 'Místicas', icon: '✦', title: 'El legado de Zhinchi',
    lines: ['Cada general tiene tres cartas místicas en su baraja. Al derrotarlo, Xervias conserva una copia sellada.', 'Al superar la misión 36, el bastón de Zhinchi permite activar Editar baraja.', 'Equipa máximo tres místicas, reemplazando Ataque, Defensa u Orden; no puedes retirar Impactos. Los efectos propios aún están en diseño.'] },
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
