import React from 'react';
import './multiplayer-records.css';

export type RecordsSummary = {
  type: 'records:summary';
  persistent: boolean;
  rankedEnabled: boolean;
  totals: { played: number; wins: number; losses: number; draws: number;
    streak: number; bestStreak: number; winRate: number };
  ranked: { rating: number; played: number; wins: number; losses: number;
    draws: number; position: number | null };
  history: Array<{ matchId: string; opponentId: string; opponent: string;
    outcome: 'win' | 'loss' | 'draw'; mode: 'casual' | 'ranked';
    turns: number; reason: string; at: number }>;
  rivals: Array<{ id: string; name: string; matches: number;
    wins: number; losses: number; draws: number; lastAt: number }>;
  leaderboard: Array<{ position: number; name: string; rating: number;
    played: number; wins: number; losses: number }>;
};

const resultLabels = { win: 'Victoria', loss: 'Derrota', draw: 'Empate' } as const;
const when = (time: number) => new Date(time).toLocaleDateString('es', {
  year: 'numeric', month: 'short', day: 'numeric',
});

export function MultiplayerRecordsPanel({ summary, onClose }: {
  summary: RecordsSummary | null; onClose: () => void;
}) {
  const [tab, setTab] = React.useState<'summary' | 'history' | 'rivals' | 'ranked'>('summary');
  const [filter, setFilter] = React.useState<'all' | 'casual' | 'ranked'>('all');
  const matches = (summary?.history || []).filter(item => filter === 'all' || item.mode === filter);
  return <div className="dr-records-overlay" role="dialog" aria-modal="true"
    aria-label="Historial y clasificación de duelos">
    <section className="dr-records-panel">
      <header className="dr-records-header">
        <div><small>DECRETO REAL · MULTIJUGADOR</small><h2>Crónicas del duelista</h2></div>
        <button type="button" onClick={onClose} aria-label="Cerrar crónicas">×</button>
      </header>
      <nav className="dr-records-tabs" aria-label="Estadísticas del multijugador">
        <button type="button" aria-pressed={tab === 'summary'} onClick={() => setTab('summary')}>Resumen</button>
        <button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')}>Historial</button>
        <button type="button" aria-pressed={tab === 'rivals'} onClick={() => setTab('rivals')}>Rivales</button>
        <button type="button" aria-pressed={tab === 'ranked'} onClick={() => setTab('ranked')}>Ranked</button>
      </nav>
      <div className="dr-records-body">
        {!summary ? <p className="dr-records-empty">Conecta con el servidor para consultar tus combates.</p> : <>
          {!summary.persistent && <p className="dr-records-note" role="status">
            Estadísticas de prueba: el servidor todavía no tiene un volumen de almacenamiento permanente.
            Podrían desaparecer si se reinicia. Los combates Ranked permanecen bloqueados.
          </p>}
          {tab === 'summary' && <>
            <div className="dr-records-stats">
              <div><strong>{summary.totals.played}</strong><span>Combates</span></div>
              <div><strong>{summary.totals.wins}</strong><span>Victorias</span></div>
              <div><strong>{summary.totals.losses}</strong><span>Derrotas</span></div>
              <div><strong>{summary.totals.draws}</strong><span>Empates</span></div>
              <div><strong>{summary.totals.winRate}%</strong><span>Victorias %</span></div>
              <div><strong>{summary.totals.streak}</strong><span>Racha actual</span></div>
              <div><strong>{summary.totals.bestStreak}</strong><span>Mejor racha</span></div>
              <div><strong>{summary.ranked.rating}</strong><span>Puntos Ranked</span></div>
            </div>
            <h3>Últimos encuentros</h3>
            {(summary.history.length ? summary.history.slice(0, 3) : []).map(item =>
              <article className="dr-records-match" key={item.matchId}>
                <span className={'dr-records-outcome ' + item.outcome}>{resultLabels[item.outcome]}</span>
                <div><strong>{item.opponent}</strong><small>{item.mode === 'ranked' ? 'Ranked' : 'Casual'} · {when(item.at)}</small></div>
                <small>{item.turns} turnos</small>
              </article>)}
            {!summary.history.length && <p className="dr-records-empty">Tu historia comenzará con el primer duelo finalizado.</p>}
          </>}
          {tab === 'history' && <>
            <div className="dr-records-filter" role="group" aria-label="Filtrar partidas">
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todos</button>
              <button type="button" aria-pressed={filter === 'casual'} onClick={() => setFilter('casual')}>Casuales</button>
              <button type="button" aria-pressed={filter === 'ranked'} onClick={() => setFilter('ranked')}>Ranked</button>
            </div>
            {matches.map(item => <article className="dr-records-match" key={item.matchId}>
              <span className={'dr-records-outcome ' + item.outcome}>{resultLabels[item.outcome]}</span>
              <div><strong>VS {item.opponent}</strong><small>{item.mode === 'ranked' ? 'Ranked' : 'Casual'} · {when(item.at)}</small></div>
              <small>{item.turns} turnos</small>
            </article>)}
            {!matches.length && <p className="dr-records-empty">No hay combates en esta categoría.</p>}
            <p className="dr-records-muted">Se muestran los últimos 100 combates.</p>
          </>}
          {tab === 'rivals' && <>
            <p className="dr-records-intro">Rivales más frecuentes, agrupados por perfil de duelista y no por apodo.</p>
            {summary.rivals.map((item, i) => <article className="dr-records-rival" key={item.id}>
              <span className="dr-records-rival-number">{i + 1}</span>
              <div><strong>{item.name}</strong><small>Último combate: {when(item.lastAt)}</small></div>
              <div className="dr-records-rival-count"><strong>{item.matches}</strong><small>duelos</small></div>
              <small className="dr-records-rival-wld">{item.wins} V · {item.losses} D · {item.draws} E</small>
            </article>)}
            {!summary.rivals.length && <p className="dr-records-empty">Aún no has combatido contra otros duelistas.</p>}
          </>}
          {tab === 'ranked' && <>
            <div className="dr-records-ranked-hero">
              <span>Mi clasificación</span>
              <strong>{summary.ranked.rating} <small>RP</small></strong>
              <p>{summary.ranked.position ? 'Posición #' + summary.ranked.position : 'Sin clasificación todavía'}</p>
              <small>{summary.ranked.played} combates · {summary.ranked.wins} victorias · {summary.ranked.losses} derrotas</small>
            </div>
            <p className="dr-records-intro">Puntuación inicial: 1000 RP. Cada combate Ranked modifica los puntos de ambos jugadores según sus puntuaciones; los duelos casuales no afectan el ranking.</p>
            <h3>Clasificación general</h3>
            {summary.leaderboard.map(item => <div className="dr-records-leader" key={item.position}>
              <b>#{item.position}</b><strong>{item.name}</strong><span>{item.rating} RP</span>
              <small>{item.wins} V / {item.losses} D</small>
            </div>)}
            {!summary.leaderboard.length && <p className="dr-records-empty">Todavía no hay duelistas clasificados.</p>}
          </>}
        </>}
      </div>
      <footer className="dr-records-footer">
        <button type="button" onClick={onClose}>Volver al multijugador</button>
      </footer>
    </section>
  </div>;
}
