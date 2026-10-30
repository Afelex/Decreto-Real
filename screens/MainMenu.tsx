import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CORNER_IMG, SOVEREIGN_IMG } from '../constants';
import { loadCampaignProgress } from '../campaign/campaign.ts';
import { campaignOverview } from '../campaign/progressView.ts';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  // The menu is remounted when returning from a duel; reread the latest
  // locally saved mission result without writing any new data.
  const journey = React.useMemo(() => {
    try { return campaignOverview(loadCampaignProgress(window.localStorage)); }
    catch { return campaignOverview(loadCampaignProgress(null)); }
  }, []);
  const nextMissionText = journey.completedCampaign
    ? `Historia completada · ★ ${journey.stars}/${journey.maximumStars}`
    : journey.completed === 0
      ? `Inicia el recorrido · ${journey.total} retos`
      : `Reto ${Number(journey.nextMission!.id)}/${journey.total} · ${journey.nextMission!.title}`;

  return (
    <div className="dr-main-menu-screen relative w-full min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_#000_100%)] text-gold-main font-rpg">
      {/* Background texture (no bloquea clicks) */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-texture" />

      {/* Corners (más pequeños en móvil) */}
      <div className="absolute top-0 left-0 w-[86px] h-[86px] sm:w-[120px] sm:h-[120px] pointer-events-none z-10">
        <img
          src={CORNER_IMG}
          alt="Corner Decoration"
          className="w-full h-full object-contain scale-x-[-1]"
          draggable={false}
        />
      </div>

      <div className="absolute top-0 right-0 w-[86px] h-[86px] sm:w-[120px] sm:h-[120px] pointer-events-none z-10">
        <img
          src={CORNER_IMG}
          alt="Corner Decoration"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      <div className="absolute bottom-0 left-0 w-[86px] h-[86px] sm:w-[120px] sm:h-[120px] pointer-events-none z-10">
        <img
          src={CORNER_IMG}
          alt="Corner Decoration"
          className="w-full h-full object-contain rotate-180"
          draggable={false}
        />
      </div>

      <div className="absolute bottom-0 right-0 w-[86px] h-[86px] sm:w-[120px] sm:h-[120px] pointer-events-none z-10">
        <img
          src={CORNER_IMG}
          alt="Corner Decoration"
          className="w-full h-full object-contain scale-y-[-1]"
          draggable={false}
        />
      </div>

      {/* Main layout */}
      <main
        className="dr-main-menu-content relative z-20 mx-auto w-full max-w-md flex min-h-[100dvh] flex-col items-center px-4"
        // ✅ “safe areas” para móviles (evita choque con bordes / barra inferior)
        style={{
          paddingTop: 'max(18px, env(safe-area-inset-top))',
          paddingBottom: 'max(22px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Header: baja un poco y reduce tamaño en móvil */}
        <header className="dr-main-menu-header w-full text-center mt-8 sm:mt-10">
          <div className="flex items-center justify-center gap-2 opacity-90">
            <span className="h-[1px] w-6 sm:w-8 bg-gold-dark" />
            <h2 className="text-[9px] sm:text-[10px] tracking-[0.18em] font-bold text-gold-dark uppercase">
              Juego de Cartas Táctico RPG
            </h2>
            <span className="h-[1px] w-6 sm:w-8 bg-gold-dark" />
          </div>

          <h1
            className="font-decorative leading-none text-transparent bg-clip-text drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mt-2"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, #fff 0%, #ffd700 50%, #b8860b 100%)',
              fontSize: 'clamp(2.0rem, 7.0vw, 3.2rem)', // ✅ más pequeño en móvil
              lineHeight: 0.95,
            }}
          >
            DECRETO
            <br />
            REAL
          </h1>
        </header>

        {/* Hero Card: altura controlada por viewport para que TODO quepa */}
        <section className="dr-main-menu-hero relative w-full flex-1 flex items-center justify-center">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72 bg-gold-dark/20 rounded-full blur-3xl animate-pulse" />

          <div
            className="relative z-10 group perspective-1000"
            // ✅ clave: limita el tamaño de la carta según pantalla
            style={{ height: 'min(37dvh, 350px)' }}
          >
            <div className="h-full aspect-[2/3] relative transform transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-y-12">
              <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-tr from-gold-dark via-[#ffd700] to-gold-dark opacity-80 blur-sm group-hover:opacity-100 transition-opacity" />

              <div className="absolute inset-0 rounded-xl overflow-hidden bg-black border-2 border-[#b8860b]">
                <img
                  alt="El Monarca"
                  src={SOVEREIGN_IMG}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                <div className="absolute bottom-4 left-4 right-4 flex flex-col items-start">
                  <h3 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gold-main font-serif text-[clamp(18px,3.2vw,30px)] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-tight">
                    El Monarca
                  </h3>
                  <div className="h-0.5 w-10 bg-gold-dark mt-2" />
                </div>
              </div>

              {/* Mini corners inside card */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#ffd700]/50 rounded-tl-sm" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#ffd700]/50 rounded-tr-sm" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#ffd700]/50 rounded-bl-sm" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#ffd700]/50 rounded-br-sm" />
            </div>
          </div>
        </section>

        {/* Footer: SUBE los botones para que no choquen con adornos */}
        <footer className="dr-main-menu-footer w-full flex flex-col items-center gap-2 pb-12 sm:pb-8">
          <button
            onClick={() => navigate('/campania')}
            aria-label="Empezar campaña"
            className="group w-full max-w-[92%] h-[52px] sm:h-[56px] relative transition-all active:scale-95 bg-gradient-to-r from-[#8f1f1f] via-[#d93838] to-[#8f1f1f] bg-[length:200%_100%] hover:bg-[100%_0] flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(217,56,56,0.4)]"
            style={{
              border: '2px solid #d4af37',
              borderRadius: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
            }}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30" />
            <span className="text-xl sm:text-2xl drop-shadow-md relative z-10">⚔️</span>
            <span className="dr-menu-campaign-label text-white relative z-10" style={{ textShadow: '0 2px 4px black' }}>
              <strong>CAMPAÑA</strong>
              <small title={nextMissionText}>{nextMissionText}</small>
            </span>
            <span className="dr-menu-progress-track" aria-hidden="true"><span style={{ width: `${journey.percentage}%` }}/></span>
          </button>

          <div className="flex items-center justify-center gap-3 w-full max-w-[92%]">
            <button
              onClick={() => navigate('/rules')}
              aria-label="Cómo Jugar"
              className="flex-1 h-[42px] sm:h-[44px] relative group transition-transform active:scale-95 bg-gradient-to-b from-[#4a4a4a] to-[#2b2b2b] flex items-center justify-center gap-2 hover:border-[#e5cfa5]"
              style={{ border: '1px solid #777', borderRadius: '4px' }}
            >
              <span className="opacity-80 group-hover:opacity-100">📖</span>
              <span className="text-gray-300 group-hover:text-white font-bold text-xs tracking-wider uppercase transition-colors">
                Reglas
              </span>
            </button>

            <button
              onClick={() => navigate('/options')}
              aria-label="Ajustes"
              className="flex-1 h-[42px] sm:h-[44px] relative group transition-transform active:scale-95 bg-gradient-to-b from-[#4a4a4a] to-[#2b2b2b] flex items-center justify-center gap-2 hover:border-[#e5cfa5]"
              style={{ border: '1px solid #777', borderRadius: '4px' }}
            >
              <span className="opacity-80 group-hover:opacity-100">⚙️</span>
              <span className="text-gray-300 group-hover:text-white font-bold text-xs tracking-wider uppercase transition-colors">
                Opciones
              </span>
            </button>
          </div>

          <button
            onClick={() => navigate('/duelo-v1')}
            className="w-full max-w-[92%] h-[42px] border border-[#cda952] rounded bg-gradient-to-r from-[#263d52] to-[#152638] text-[#f1d891] font-bold text-xs tracking-[0.12em] uppercase active:scale-95 transition-transform"
          >
            ✦ Duelo libre contra IA
          </button>

          <button
            onClick={() => navigate('/game')}
            className="w-full max-w-[92%] min-h-[44px] border border-[#66594a] rounded bg-[#2c2b30] text-[#d7c6a1] font-semibold text-xs tracking-[0.08em] uppercase active:scale-95 transition-transform"
          >
            Juego original
          </button>
        </footer>
      </main>
    </div>
  );
};

export default MainMenu;
