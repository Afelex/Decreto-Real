import React from 'react';
import './battle-result.css';

export type BattleResultStat = Readonly<{ label: string; value: string | number }>;
export type BattleResultAction = Readonly<{ label: string; onClick: () => void; primary?: boolean }>;

type Props = {
  won: boolean;
  heading?: string;
  stats: readonly BattleResultStat[];
  actions: readonly BattleResultAction[];
  warning?: string;
  /** Solo campaña: consecuencia narrativa breve; el duelo libre permanece sin texto extra. */
  narrative?: string;
};

/**
 * Final de partida: exclusivamente el escenario real de victoria/derrota,
 * las estadísticas verificables y los botones para continuar.
 * Compartido por el duelo libre y las misiones de campaña.
 */
const BattleResultScreen: React.FC<Props> = ({ won, heading, stats, actions, warning, narrative }) => (
  <main className={`dr-result-screen ${won ? 'is-victory' : 'is-defeat'}`}
    aria-label={won ? 'Resultado de la partida: victoria' : 'Resultado de la partida: derrota'}>
    <img className="dr-result-screen__scene"
      src={`${import.meta.env.BASE_URL}final/${won ? 'victoria' : 'derrota'}.webp`}
      alt="" aria-hidden="true" draggable={false}/>
    <div className="dr-result-screen__controls">
      <h1 className="dr-result-screen__sr-only">{heading ?? (won ? 'Victoria' : 'Derrota')}</h1>
      <section className="dr-result-screen__stats" aria-label="Estadísticas de la partida">
        <h2>Resultados</h2>
        <dl>
          {stats.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {narrative && <p className="dr-result-screen__narrative" aria-label="Consecuencia narrativa">{narrative}</p>}
      {warning && <p className="dr-result-screen__warning" role="alert">{warning}</p>}
      <nav className={`dr-result-screen__actions ${actions.length > 2 ? 'has-extra-action' : ''}`}
        aria-label="Acciones después de la partida">
        {actions.map(({ label, onClick, primary }) => (
          <button key={label} type="button"
            className={`dr-result-screen__action ${primary ? 'is-primary' : 'is-secondary'}`}
            onClick={onClick}>{label}</button>
        ))}
      </nav>
    </div>
  </main>
);

export default BattleResultScreen;
