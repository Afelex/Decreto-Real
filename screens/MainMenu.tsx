import { getCampaignStorage } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { CAMPAIGN_INTRO_KEY } from '../campaign/campaignKeys';
import { PROLOGUE_COMPLETE_KEY } from '../campaign/prologueArt';
import { isCampaignQaActive } from '../campaign/campaignQA';
import { campaignOverview } from '../campaign/progressView.ts';
import { useAmbientVideo } from './useAmbientVideo';
import { G3_UI_ASSETS } from '../game/g3UiAssets';
import { menuLoopSource } from '../game/mainMenuStartup';
import { useOptionalAudio } from '../contexts/AudioContext';
import { preloadVersusIa, type DuelLoadProgress } from '../game/versusIaPreload';
import { VERSUS_IA_DIFFICULTIES, type VersusIaDifficulty } from '../game/versusIaDifficulty';
import './main-menu-cinematic.css';
import './versus-ia-loading.css';

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
type MenuArt = { src: string | null; pressedSrc?: string | null; includesText: boolean };
const BUTTON_PNG: Record<MenuArtKey, MenuArt> = {
  campaign: { src: G3_UI_ASSETS.menuButton, pressedSrc: G3_UI_ASSETS.menuButtonPressed, includesText: false },
  duel: { src: G3_UI_ASSETS.menuButton, pressedSrc: G3_UI_ASSETS.menuButtonPressed, includesText: false },
  rules: { src: G3_UI_ASSETS.smallButton, includesText: false },
  options: { src: G3_UI_ASSETS.smallButton, includesText: false },
};

/** La prueba de calidad publica solo las dos modalidades de duelo.
 * Para restaurar el menú completo, compilar con VITE_DR_FULL_MAIN_MENU=true.
 * Las demás pantallas y datos se conservan.
 */
const SHOW_FULL_MENU = import.meta.env.VITE_DR_FULL_MAIN_MENU === 'true';

type MenuButtonProps = {
  artKey: MenuArtKey;
  className?: string;
  ariaLabel: string;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onTouchStart?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

const MenuButton: React.FC<MenuButtonProps> = ({
  artKey, className = '', ariaLabel, onClick, onPointerEnter, onTouchStart, onFocus,
  disabled = false, children,
}) => {
  const art = BUTTON_PNG[artKey];
  const [artLoaded, setArtLoaded] = React.useState(false);
  const [pressedLoaded, setPressedLoaded] = React.useState(false);
  const fullArt = Boolean(artLoaded && art.includesText);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onTouchStart={onTouchStart}
      onFocus={onFocus}
      disabled={disabled}
      className={`dr-cinematic-button ${className} ${artLoaded ? 'dr-cinematic-button-has-png' : ''} ${pressedLoaded ? 'dr-cinematic-button-has-pressed' : ''}`}
    >
      {art.src && (
        <img
          className="dr-cinematic-button-png dr-cinematic-button-png--base"
          src={art.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ visibility: artLoaded ? 'visible' : 'hidden' }}
          onLoad={() => setArtLoaded(true)}
          onError={() => setArtLoaded(false)}
        />
      )}
      {art.pressedSrc && (
        <img
          className="dr-cinematic-button-png dr-cinematic-button-png--pressed"
          src={art.pressedSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ visibility: pressedLoaded ? 'visible' : 'hidden' }}
          onLoad={() => setPressedLoaded(true)}
          onError={() => setPressedLoaded(false)}
        />
      )}
      {!fullArt && <span className="dr-cinematic-button-copy">{children}</span>}
    </button>
  );
};

type LoadingView = DuelLoadProgress & {
  phase: 'loading' | 'ready' | 'error';
  error?: string;
};

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const audio = useOptionalAudio();
  const setMusicScene = audio?.setMusicScene;
  React.useEffect(() => {
    setMusicScene?.('MENU');
    return () => setMusicScene?.(null);
  }, [setMusicScene]);
  const [loading, setLoading] = React.useState<LoadingView | null>(null);
  const [difficultyOpen, setDifficultyOpen] = React.useState(false);
  const [difficulty, setDifficulty] = React.useState<VersusIaDifficulty>('normal');
  const preloadController = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => preloadController.current?.abort(), []);
  const cancelVsIa = React.useCallback(() => {
    preloadController.current?.abort();
    preloadController.current = null;
    setLoading(null);
  }, []);
  const openVsIa = React.useCallback(() => {
    if (preloadController.current) return;
    const controller = new AbortController();
    preloadController.current = controller;
    setLoading({ phase: 'loading', completed: 0, total: 1, label: 'Iniciando descarga…' });
    void preloadVersusIa({
      signal: controller.signal,
      onProgress: progress => {
        if (!controller.signal.aborted) setLoading({ ...progress, phase: 'loading' });
      },
    }).then(async () => {
      if (controller.signal.aborted) return;
      setLoading(current => current ? { ...current, phase: 'ready', label: 'Duelo preparado' } : null);
      // Let 100% paint before the navigation unloads the progress dialog.
      await new Promise<void>(resolve => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
        else setTimeout(resolve, 0);
      });
      if (!controller.signal.aborted) navigate('/game', { state: { duelEntrance: true, difficulty } });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoading(current => ({
        phase: 'error',
        completed: current?.completed ?? 0,
        total: current?.total ?? 1,
        label: current?.label ?? 'Carga interrumpida',
        error: error instanceof Error ? error.message : 'No se pudieron cargar los recursos',
      }));
    }).finally(() => {
      if (preloadController.current === controller) preloadController.current = null;
    });
  }, [navigate, difficulty]);
  // Warm the IA code only after explicit interest. The background MP4 of the
  // battle should NEVER compete with the menu's visible cinematic resources.
  const warmDuel = React.useCallback(() => {
    void import('./GameBoard').catch(() => { /* normal navigation can retry */ });
  }, []);
  const coverVideoRef = React.useRef<HTMLVideoElement>(null);
  useAmbientVideo(coverVideoRef, loading?.phase === 'loading' || loading?.phase === 'ready');
  const progress = React.useMemo(() => {
    try { return loadCampaignProgress(getCampaignStorage()); }
    catch { return loadCampaignProgress(null); }
  }, []);
  const journey = React.useMemo(() => campaignOverview(progress), [progress]);
  const prologueComplete = bestStars(progress, '01') > 0 && bestStars(progress, '02') > 0;
  const openCampaign = () => {
    // Public first release ends after the visual-novel prologue. QA/dev retains the complete unpublished campaign.
    if (import.meta.env.PROD && !isCampaignQaActive()) {
      const store=getCampaignStorage();
      let alreadyFinished=false;
      let introSeen=false;
      try {
        alreadyFinished=store?.getItem(PROLOGUE_COMPLETE_KEY)==='1';
        introSeen=store?.getItem(CAMPAIGN_INTRO_KEY)==='1';
      } catch { /* private mode */ }
      navigate(alreadyFinished?'/campania/prologo?escena=fin':introSeen?'/campania/prologo':'/campania/inicio');
      return;
    }
    if (!prologueComplete) {
      let introSeen = false;
      try { introSeen = getCampaignStorage()?.getItem(CAMPAIGN_INTRO_KEY) === '1'; } catch { /* private mode */ }
      navigate(journey.completed > 0 ? '/campania' : introSeen ? '/campania/prologo' : '/campania/inicio');
      return;
    }
    navigate('/campania/generales');
  };
  const nextMissionText = journey.completedCampaign
    ? 'Historia completada · ★ ' + journey.stars + '/' + journey.maximumStars
    : prologueComplete
      ? 'Elige una de las ocho regiones · ★ ' + journey.stars + '/' + journey.maximumStars
      : journey.completed === 0
        ? 'Inicia el recorrido'
        : 'Reto ' + Number(journey.nextMission!.id) + '/38 · ' + journey.nextMission!.title;

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
        ref={coverVideoRef}
        className="dr-cinematic-background dr-cinematic-video"
        autoPlay muted loop playsInline
        preload="metadata"
        poster="./portada/portada-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src={menuLoopSource()} type="video/mp4" />
      </video>
      <img
        className="dr-cinematic-side-logo dr-cinematic-side-logo--left"
        src={`${import.meta.env.BASE_URL}portada/decreto-real-logo.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="dr-cinematic-side-logo dr-cinematic-side-logo--right"
        src={`${import.meta.env.BASE_URL}portada/decreto-real-logo.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="dr-cinematic-shade" aria-hidden="true" />
      {audio && (
        <button className="dr-cinematic-music-toggle" type="button"
          aria-label={audio.musicGestureRequired && audio.musicEnabled ? 'Reproducir música'
            : audio.musicEnabled ? 'Silenciar música' : 'Encender música'}
          title={audio.musicGestureRequired && audio.musicEnabled ? 'Reproducir música'
            : audio.musicEnabled ? 'Silenciar música' : 'Encender música'}
          aria-pressed={audio.musicEnabled && !audio.musicGestureRequired}
          onClick={() => {
            if (audio.musicEnabled && audio.musicGestureRequired) audio.unlockMusic();
            else audio.toggleMusic();
          }}>
          <img className="dr-cinematic-music-toggle__icon"
            src={`${import.meta.env.BASE_URL}interfaz/hud-g3/${audio.musicEnabled && !audio.musicGestureRequired
              ? 'sonido_activado.webp' : 'sonido_silenciado.webp'}`}
            alt="" aria-hidden="true" draggable={false}/>
        </button>
      )}

      <button className="dr-cinematic-account-toggle" type="button"
        aria-label="Mi cuenta de duelista" title="Mi cuenta"
        onClick={() => navigate('/cuenta')}>
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c0-4.2 3.1-6.5 7.5-6.5s7.5 2.3 7.5 6.5" />
        </svg>
      </button>

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

      {/* Campaña, duelo y baraja en columna; reglas y opciones en una sola fila. */}
      <nav className="dr-cinematic-actions" aria-label="Menú principal" data-menu-mode={SHOW_FULL_MENU ? "completo" : "qa-duelos"}>
        {SHOW_FULL_MENU && (
        <MenuButton
          artKey="campaign"
          className="dr-cinematic-button-primary"
          ariaLabel="Empezar campaña"
          onClick={openCampaign}
        >
          
          <span className="dr-cinematic-primary-copy">
            <strong>CAMPAÑA</strong>
            <small title={nextMissionText}>{nextMissionText}</small>
          </span>
          <span className="dr-menu-progress-track" aria-hidden="true">
            <span style={{ width: String(journey.percentage) + '%' }} />
          </span>
        </MenuButton>
        )}

        <MenuButton
          artKey="duel"
          className="dr-cinematic-button-secondary"
          ariaLabel="Versus IA"
          onPointerEnter={warmDuel}
          onTouchStart={warmDuel}
          onFocus={warmDuel}
          onClick={() => { setDifficulty('normal'); setDifficultyOpen(true); }}
          disabled={Boolean(loading)}
        >
          
          <strong>VERSUS IA</strong>
        </MenuButton>

        <MenuButton
          artKey="duel"
          className="dr-cinematic-button-secondary"
          ariaLabel="Multijugador"
          onClick={() => navigate('/multijugador')}
        >
          
          <strong>MULTIJUGADOR</strong>
        </MenuButton>

        {SHOW_FULL_MENU && (
          <>
        <MenuButton
          artKey="duel"
          className="dr-cinematic-button-secondary dr-cinematic-button-disabled dr-cinematic-button-deck"
          ariaLabel="Creación de baraja - No disponible"
          disabled
        >
          
          <span className="dr-cinematic-deck-copy">
            <strong>CREACIÓN DE BARAJA</strong>
            <small>No disponible</small>
          </span>
        </MenuButton>

        <div className="dr-cinematic-actions-duo" role="group" aria-label="Información y configuración">
          <MenuButton
            artKey="rules"
            className="dr-cinematic-button-secondary dr-cinematic-button-half"
            ariaLabel="Reglas"
            onClick={() => navigate('/rules')}
          >
            
            <strong>REGLAS</strong>
          </MenuButton>

          <MenuButton
            artKey="options"
            className="dr-cinematic-button-secondary dr-cinematic-button-half"
            ariaLabel="Opciones"
            onClick={() => navigate('/options')}
          >
            
            <strong>OPCIONES</strong>
          </MenuButton>
        </div>
          </>
        )}
      </nav>

      {difficultyOpen && !loading && (
        <section className="dr-vsia-loading dr-vsia-difficulty" role="dialog" aria-modal="true"
          aria-labelledby="dr-vsia-difficulty-title" data-testid="vs-ia-difficulty">
          <div className="dr-vsia-loading__panel">
            <small>DECRETO REAL</small>
            <h2 id="dr-vsia-difficulty-title">Elige tu dificultad</h2>
            <p className="dr-vsia-loading__subtitle">La IA tiene 20 PV. Tu vida inicial depende de la dificultad y puedes curarte hasta 20 PV.</p>
            <div className="dr-vsia-difficulty__choices" role="radiogroup" aria-label="Nivel de dificultad">
              {VERSUS_IA_DIFFICULTIES.map(option => (
                <label key={option.id} className={'dr-vsia-difficulty__option' + (difficulty === option.id ? ' is-selected' : '')}>
                  <input type="radio" name="vsia-difficulty" value={option.id}
                    checked={difficulty === option.id}
                    onChange={() => setDifficulty(option.id)}/>
                  <span className="dr-vsia-difficulty__copy">
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                  <b>{option.hp} / 20 PV</b>
                </label>
              ))}
            </div>
            <div className="dr-vsia-loading__actions">
              <button type="button" className="dr-vsia-difficulty__start"
                onClick={() => { setDifficultyOpen(false); openVsIa(); }}>Comenzar duelo</button>
              <button type="button" onClick={() => setDifficultyOpen(false)}>Cancelar</button>
            </div>
          </div>
        </section>
      )}
      {loading && (
        <section className="dr-vsia-loading" role="dialog" aria-modal="true"
          aria-labelledby="dr-vsia-loading-title" data-testid="vs-ia-loading">
          <div className="dr-vsia-loading__panel">
            <small>DECRETO REAL</small>
            <h2 id="dr-vsia-loading-title">
              {loading.phase === 'error' ? 'No se completó la carga' :
                loading.phase === 'ready' ? '¡Todo listo!' : 'Preparando el duelo'}
            </h2>
            <p className="dr-vsia-loading__subtitle">Comprobando el motor, las cartas, los retratos y el escenario.</p>
            <div className="dr-vsia-loading__progress" role="progressbar"
              aria-label="Carga de recursos de Versus IA"
              aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={Math.floor(100 * loading.completed / loading.total)}>
              <span style={{ width: `${Math.floor(100 * loading.completed / loading.total)}%` }} />
            </div>
            <strong className="dr-vsia-loading__percentage">
              {Math.floor(100 * loading.completed / loading.total)}%
            </strong>
            <p className="dr-vsia-loading__status" role="status" aria-live="polite">
              {loading.phase === 'error' ? 'Comprueba tu conexión y vuelve a intentarlo.' :
                loading.phase === 'ready' ? 'Comenzando la presentación…' :
                  `Recurso verificado: ${loading.label}`}
            </p>
            {loading.phase === 'error' && <p className="dr-vsia-loading__error" role="alert">{loading.error}</p>}
            <div className="dr-vsia-loading__actions">
              {loading.phase === 'error' && <button type="button" onClick={() => { setLoading(null); openVsIa(); }}>
                Reintentar
              </button>}
              <button type="button" onClick={cancelVsIa} autoFocus>
                Volver al menú
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MainMenu;
