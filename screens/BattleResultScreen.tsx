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
  reward?: string;
  /** Recompensa visual exclusiva de las victorias contra los ocho generales. */
  rewardShowcase?: Readonly<{ cardName: string; effect: string; locked: boolean }>;
  /** Solo campaña: consecuencia narrativa breve; el duelo libre permanece sin texto extra. */
  narrative?: string;
};

/**
 * Final de partida: exclusivamente el escenario real de victoria/derrota,
 * las estadísticas verificables y los botones para continuar.
 * Compartido por el duelo libre y las misiones de campaña.
 */
const BattleResultScreen: React.FC<Props> = ({ won, heading, stats, actions, warning, narrative, reward, rewardShowcase }) => (
  <main className={`dr-result-screen ${won ? 'is-victory' : 'is-defeat'}`}
    aria-label={won ? 'Resultado de la partida: victoria' : 'Resultado de la partida: derrota'}>
    <img className="dr-result-screen__scene"
      src={`${import.meta.env.BASE_URL}final/${won ? 'victoria' : 'derrota'}.webp`}
      alt="" aria-hidden="true" draggable={false}/>
    {won && rewardShowcase && <section className="dr-result-screen__showcase" aria-label="Carta mística obtenida">
      <img className="dr-result-screen__hero" src={`${import.meta.env.BASE_URL}retratos/jugador.webp`} alt="Xervias"/>
      <div className="dr-result-screen__obtained">
        <small>¡HAS OBTENIDO!</small>
        <strong>{rewardShowcase.cardName}</strong>
        <div className="dr-result-screen__showcase-card">
          <img src={`${import.meta.env.BASE_URL}cartas/decreto-orden.webp`} alt="Carta mística obtenida"/>
          <p>{rewardShowcase.effect}</p>
        </div>
        <em>{rewardShowcase.locked ? 'Carta sellada · disponible tras recibir el Sello de Mando' : 'Carta disponible para tu baraja mística'}</em>
      </div>
    </section>}
    <div className={`dr-result-screen__controls${won && rewardShowcase ? ' has-reward-showcase' : ''}`}>
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
      {reward && <p className="dr-result-screen__reward" role="status">✦ {reward}</p>}
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
