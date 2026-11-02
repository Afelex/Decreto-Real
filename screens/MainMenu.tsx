import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCampaignProgress } from '../campaign/campaign.ts';
import { campaignOverview } from '../campaign/progressView.ts';
import './main-menu-cinematic.css';

/**
 * Recursos para sustituir los botones por PNG transparentes.
 * Copia el PNG a public/portada/ y coloca su URL relativa aquí, por ejemplo:
 *   src: './portada/boton-campania.png'
 *
 * Si el PNG ya incluye el icono y el texto, cambia includesText a true para
 * evitar duplicarlos. Sin archivo se mantiene la versión CSS funcional.
 *
 * Resoluciones de diseño (2x):
 *   Campaña: 1440 x 260 px (720 x 130 en la referencia).
 *   Duelo / Reglas / Opciones: 1360 x 180 px (680 x 90 en referencia).
 */
type MenuArtKey = 'campaign' | 'duel' | 'rules' | 'options';
type MenuArt = { src: string | null; includesText: boolean };
const BUTTON_PNG: Record<MenuArtKey, MenuArt> = {
  campaign: { src: null, includesText: false },
  duel: { src: null, includesText: false },
  rules: { src: null, includesText: false },
  options: { src: null, includesText: false },
};

type MenuButtonProps = {
  artKey: MenuArtKey;
  className?: string;
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
};

const MenuButton: React.FC<MenuButtonProps> = ({
  artKey, className = '', ariaLabel, onClick, children,
}) => {
  const art = BUTTON_PNG[artKey];
  const fullArt = Boolean(art.src && art.includesText);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`dr-cinematic-button ${className} ${art.src ? 'dr-cinematic-button-has-png' : ''}`}
    >
      {art.src && (
        <img
          className="dr-cinematic-button-png"
          src={art.src}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
      {!fullArt && <span className="dr-cinematic-button-copy">{children}</span>}
    </button>
  );
};

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const journey = React.useMemo(() => {
    try { return campaignOverview(loadCampaignProgress(window.localStorage)); }
    catch { return campaignOverview(loadCampaignProgress(null)); }
  }, []);
  const nextMissionText = journey.completedCampaign
    ? 'Historia completada · ★ ' + journey.stars + '/' + journey.maximumStars
    : journey.completed === 0
      ? 'Inicia el recorrido'
      : 'Reto ' + Number(journey.nextMission!.id) + ' · ' + journey.nextMission!.title;

  return (
    <div className="dr-main-menu-screen dr-cinematic-screen">
      <img
        src="./portada/portada-poster.jpg"
        className="dr-cinematic-background dr-cinematic-poster"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <video
        className="dr-cinematic-background dr-cinematic-video"
        autoPlay muted loop playsInline
        preload="metadata"
        poster="./portada/portada-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="./portada/portada-loop.mp4" type="video/mp4" />
      </video>
      <div className="dr-cinematic-shade" aria-hidden="true" />

      {/* El centro del logo coincide exactamente con el 50 % del viewport. */}
      <header className="dr-cinematic-brand">
        <h1 className="dr-cinematic-title">
          <img
            src="./portada/decreto-real-logo.png"
            className="dr-cinematic-logo"
            alt="Decreto Real"
            draggable={false}
          />
        </h1>
        <p className="dr-cinematic-tagline">Juego de Cartas</p>
      </header>

      {/* Cuatro botones verticales como en la referencia, sin panel común. */}
      <nav className="dr-cinematic-actions" aria-label="Menú principal">
        <MenuButton
          artKey="campaign"
          className="dr-cinematic-button-primary"
          ariaLabel="Empezar campaña"
          onClick={() => navigate('/campania')}
        >
          <span className="dr-cinematic-button-icon" aria-hidden="true">⚔️</span>
          <span className="dr-cinematic-primary-copy">
            <strong>CAMPAÑA</strong>
            <small title={nextMissionText}>{nextMissionText}</small>
          </span>
          <span className="dr-menu-progress-track" aria-hidden="true">
            <span style={{ width: String(journey.percentage) + '%' }} />
          </span>
        </MenuButton>

        <MenuButton
          artKey="duel"
          className="dr-cinematic-button-secondary"
          ariaLabel="Duelo contra IA"
          onClick={() => navigate('/game')}
        >
          <span className="dr-cinematic-button-icon" aria-hidden="true">⚔️</span>
          <strong>DUELO CONTRA IA</strong>
        </MenuButton>

        <MenuButton
          artKey="rules"
          className="dr-cinematic-button-secondary"
          ariaLabel="Reglas"
          onClick={() => navigate('/rules')}
        >
          <span className="dr-cinematic-button-icon" aria-hidden="true">📖</span>
          <strong>REGLAS</strong>
        </MenuButton>

        <MenuButton
          artKey="options"
          className="dr-cinematic-button-secondary"
          ariaLabel="Opciones"
          onClick={() => navigate('/options')}
        >
          <span className="dr-cinematic-button-icon" aria-hidden="true">⚙️</span>
          <strong>OPCIONES</strong>
        </MenuButton>
      </nav>
    </div>
  );
};

export default MainMenu;
