import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CORNER_IMG, SOVEREIGN_IMG } from '../constants';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_#000_100%)] text-gold-main font-rpg w-full relative flex flex-col items-center min-h-[100dvh] overflow-x-hidden"
      // Nota: no usamos overflow-hidden ni h-screen para no recortar en pantallas bajas.
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-texture" />

      {/* Corners */}
      <div className="absolute top-0 left-0 w-[120px] h-[120px] pointer-events-none z-20">
        <img
          alt="Corner Decoration"
          className="w-full h-full object-contain transform scale-x-[-1]"
          src={CORNER_IMG}
        />
      </div>
      <div className="absolute top-0 right-0 w-[120px] h-[120px] pointer-events-none z-20">
        <img alt="Corner Decoration" className="w-full h-full object-contain" src={CORNER_IMG} />
      </div>
      <div className="absolute bottom-0 left-0 w-[120px] h-[120px] pointer-events-none z-20">
        <img
          alt="Corner Decoration"
          className="w-full h-full object-contain transform rotate-180"
          src={CORNER_IMG}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-[120px] h-[120px] pointer-events-none z-20">
        <img
          alt="Corner Decoration"
          className="w-full h-full object-contain transform scale-y-[-1]"
          src={CORNER_IMG}
        />
      </div>

     <main className="relative z-30 w-full min-h-[100dvh] max-w-md mx-auto flex flex-col items-center px-4 py-2 sm:py-3">
        {/* Header */}
        <header className="flex flex-col items-center w-full text-center gap-1">
          <div className="flex items-center space-x-2 opacity-90">
            <span className="h-[1px] w-8 bg-gold-dark" />
            <h2 className="text-[clamp(7px,1.3vw,9px)] tracking-[0.2em] font-bold text-gold-dark uppercase">
              Juego de Cartas Táctico RPG
            </h2>
            <span className="h-[1px] w-8 bg-gold-dark" />
          </div>

          <h1
            className="font-decorative leading-none text-transparent bg-clip-text drop-shadow-[0_5px_5px_rgba(0,0,0,1)]"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, #fff 0%, #ffd700 50%, #b8860b 100%)',
              fontSize: 'clamp(2.0rem, 5.2vw, 3.1rem)',
            }}
          >
            DECRETO
            <br />
            REAL
          </h1>

         </header>

        {/* Hero Card */}
        <section className="flex-1 flex items-center justify-center relative w-full py-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold-dark/20 rounded-full blur-3xl animate-pulse" />

          {/* Card Container */}
          <div
           className="relative z-10 animate-float-delayed group perspective-1000"
           style={{ height: 'clamp(260px, 44dvh, 460px)' }}   // 👈 clave
          >
          <div className="h-full aspect-[2/3] relative transform transition-transform duration-500 group-hover:scale-[1.03] group-hover:rotate-y-12">

              {/* Glowing Border */}
              <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-tr from-gold-dark via-[#ffd700] to-gold-dark opacity-80 blur-sm group-hover:opacity-100 transition-opacity" />

              {/* Main Image Frame */}
              <div className="absolute inset-0 rounded-xl overflow-hidden bg-black border-2 border-[#b8860b]">
                <img
                  alt="El Monarca"
                  className="w-full h-full object-cover"
                  src={SOVEREIGN_IMG}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                {/* Card Text Content */}
                <div className="absolute bottom-5 left-4 right-4 flex flex-col items-start">
                  <h3 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gold-main font-serif text-[clamp(20px,3vw,30px)] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-tight">
                    El Monarca
                  </h3>
                  <div className="h-0.5 w-12 bg-gold-dark mt-2" />
                </div>
              </div>

              {/* Decorative Corner Elements (CSS) */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#ffd700]/50 rounded-tl-sm" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#ffd700]/50 rounded-tr-sm" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#ffd700]/50 rounded-bl-sm" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#ffd700]/50 rounded-br-sm" />
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <footer className="w-full flex flex-col items-center gap-3 pt-2 pb-3">
          <button
            onClick={() => navigate('/game')}
            aria-label="Empezar Juego"
            className="group w-full max-w-[90%] h-[52px] relative transition-all active:scale-95 bg-gradient-to-r from-[#8f1f1f] via-[#d93838] to-[#8f1f1f] bg-[length:200%_100%] hover:bg-[100%_0] flex items-center justify-center space-x-3 hover:shadow-[0_0_20px_rgba(217,56,56,0.4)]"
            style={{
              border: '2px solid #d4af37',
              borderRadius: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
            }}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30" />
            <span className="text-2xl drop-shadow-md relative z-10">⚔️</span>
            <span
              className="text-white font-bold font-rpg text-xl tracking-[0.15em] relative z-10"
              style={{ textShadow: '0 2px 4px black' }}
            >
              EMPEZAR
            </span>
          </button>

          <div className="flex items-center justify-center gap-4 w-full max-w-[90%]">
            <button
              onClick={() => navigate('/rules')}
              aria-label="Cómo Jugar"
              className="flex-1 h-[44px] relative group transition-transform active:scale-95 bg-gradient-to-b from-[#4a4a4a] to-[#2b2b2b] flex items-center justify-center gap-2 hover:border-[#e5cfa5]"
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
              className="flex-1 h-[44px] relative group transition-transform active:scale-95 bg-gradient-to-b from-[#4a4a4a] to-[#2b2b2b] flex items-center justify-center gap-2 hover:border-[#e5cfa5]"
              style={{ border: '1px solid #777', borderRadius: '4px' }}
            >
              <span className="opacity-80 group-hover:opacity-100">⚙️</span>
              <span className="text-gray-300 group-hover:text-white font-bold text-xs tracking-wider uppercase transition-colors">
                Opciones
              </span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MainMenu;
