import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCampaignProgress } from '../campaign/campaign.ts';
import { campaignOverview } from '../campaign/progressView.ts';
import './main-menu-cinematic.css';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const journey = React.useMemo(() => {
    try { return campaignOverview(loadCampaignProgress(window.localStorage)); }
    catch { return campaignOverview(loadCampaignProgress(null)); }
  }, []);
  const nextMissionText = journey.completedCampaign
    ? 'Historia completada · ★ ' + journey.stars + '/' + journey.maximumStars
    : journey.completed === 0
      ? 'Inicia tu aventura'
      : 'Reto ' + Number(journey.nextMission!.id) + ' · ' + journey.nextMission!.title;

  return (
    <div className="dr-main-menu-screen dr-cinematic-screen">
      {/* La imagen queda debajo del vídeo como respaldo y para movimiento reducido. */}
      <img
        src="./portada/portada-poster.jpg"
        className="dr-cinematic-background dr-cinematic-poster"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <video
        className="dr-cinematic-background dr-cinematic-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="./portada/portada-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="./portada/portada-loop.mp4" type="video/mp4" />
      </video>
      <div className="dr-cinematic-shade" aria-hidden="true" />
      <main className="dr-cinematic-layout">
        <header className="dr-cinematic-brand">
          <h1 className="dr-cinematic-title">
            <img
              src="./portada/decreto-real-logo.png"
              className="dr-cinematic-logo"
              alt="Decreto Real"
              draggable={false}
            />
          </h1>
        </header>
        <nav className="dr-cinematic-actions" aria-label="Menú principal">
          <button
            type="button"
            className="dr-cinematic-button dr-cinematic-button-primary"
            onClick={() => navigate('/campania')}
          >
            <span className="dr-cinematic-button-icon" aria-hidden="true">⚔</span>
            <span className="dr-cinematic-primary-copy">
              <strong>CAMPAÑA</strong>
              <small title={nextMissionText}>{nextMissionText}</small>
            </span>
            <span className="dr-cinematic-chevron" aria-hidden="true">›</span>
            <span className="dr-menu-progress-track" aria-hidden="true">
              <span style={{ width: String(journey.percentage) + '%' }} />
            </span>
          </button>
          <div className="dr-cinematic-secondary">
            <button
              type="button"
              className="dr-cinematic-button dr-cinematic-button-secondary"
              onClick={() => navigate('/rules')}
            >
              <span aria-hidden="true">📖</span>
              <span>REGLAS</span>
            </button>
            <button
              type="button"
              className="dr-cinematic-button dr-cinematic-button-secondary"
              onClick={() => navigate('/options')}
            >
              <span aria-hidden="true">⚙</span>
              <span>OPCIONES</span>
            </button>
          </div>
          <button
            type="button"
            className="dr-cinematic-button dr-cinematic-button-classic"
            onClick={() => navigate('/game')}
          >
            <span aria-hidden="true">✦</span>
            <span>DUELO ORIGINAL CONTRA IA</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default MainMenu;
