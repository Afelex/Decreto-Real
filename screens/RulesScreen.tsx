import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CORNER_IMG, BACKGROUND_ORNAMENT } from '../constants';

const RulesScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_#000_100%)] min-h-screen w-full relative overflow-hidden flex flex-col items-center">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-texture opacity-30"></div>
            <div className="absolute top-0 left-0 w-32 h-32 opacity-50 pointer-events-none bg-no-repeat bg-contain transform rotate-180 mix-blend-overlay" style={{backgroundImage: `url('${BACKGROUND_ORNAMENT}')`}}></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-50 pointer-events-none bg-no-repeat bg-contain transform -scale-x-100 mix-blend-overlay" style={{backgroundImage: `url('${BACKGROUND_ORNAMENT}')`}}></div>

             {/* Corners */}
             <div className="absolute top-0 left-0 w-[80px] h-[80px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain transform scale-x-[-1]" src={CORNER_IMG}/>
            </div>
            <div className="absolute top-0 right-0 w-[80px] h-[80px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain" src={CORNER_IMG}/>
            </div>

            <main className="relative z-10 w-full max-w-2xl px-6 py-8 flex flex-col h-full">
                {/* Title */}
                <div className="text-center mb-8 relative">
                    <h1 className="font-decorative text-4xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C3] to-[#D4AF37] drop-shadow-md">
                        Reglas del Reino
                    </h1>
                    <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-gold-dark to-transparent mx-auto mt-2"></div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar ornate-border bg-[#0B0C10]/95 p-6 rounded-lg text-gold-light space-y-6 shadow-2xl mb-6">
                    
                    <section>
                        <h2 className="font-rpg text-xl text-primary border-b border-primary/30 pb-1 mb-2">Objetivo del Juego</h2>
                        <p className="font-body text-sm leading-relaxed text-gray-300">Gana la partida quien:</p>
                        <ul className="list-disc list-inside font-body text-sm text-gray-300 mt-1 ml-2 space-y-1">
                            <li>Juega el <span className="text-gold-main font-bold">Impacto Final</span>, o</li>
                            <li>Reduce los <span className="text-red-400 font-bold">HP</span> del rival a 0.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-rpg text-xl text-primary border-b border-primary/30 pb-1 mb-2">Inicio de la Partida</h2>
                        <ul className="list-disc list-inside font-body text-sm text-gray-300 space-y-1 ml-2">
                            <li>El jugador y la IA encarnan a un <span className="text-gold-main">Monarca</span>.</li>
                            <li>Cada jugador comienza con <span className="text-white font-bold">10 HP</span> y <span className="text-white font-bold">24 cartas</span> en su baraja.</li>
                            <li>Se lanza una moneda para decidir quién empieza.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-rpg text-xl text-primary border-b border-primary/30 pb-1 mb-2">Tipos de Cartas</h2>
                        
                        <div className="mb-4 pl-2 border-l-2 border-purple-900/50">
                            <h3 className="font-display text-purple-300 text-md font-bold">Impactos (4 cartas)</h3>
                            <p className="text-xs text-gray-400 italic mb-1">Impacto I, Impacto II, Impacto III, Impacto Final</p>
                            <ul className="list-disc list-inside font-body text-sm text-gray-300 space-y-1">
                                <li>Solo se puede jugar 1 Impacto por turno.</li>
                                <li>Deben jugarse en orden estricto.</li>
                                <li>Efecto: <span className="text-green-400 font-bold">+1 HP</span> y <span className="text-red-400 font-bold">-1 HP al rival</span>.</li>
                                <li>El primer jugador que juega el Impacto Final <span className="text-gold-main">gana la partida</span>.</li>
                            </ul>
                        </div>

                        <div className="mb-4 pl-2 border-l-2 border-red-900/50">
                            <h3 className="font-display text-red-400 text-md font-bold">Decretos de Ataque (10 cartas)</h3>
                            <p className="font-body text-sm text-gray-300">Al jugarse: El rival pierde <span className="text-red-500 font-bold">2 HP</span>.</p>
                        </div>

                        <div className="pl-2 border-l-2 border-green-900/50">
                            <h3 className="font-display text-green-400 text-md font-bold">Decretos de Defensa (10 cartas)</h3>
                            <p className="font-body text-sm text-gray-300">Al jugarse: Recuperas <span className="text-green-500 font-bold">1 HP</span>.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-rpg text-xl text-primary border-b border-primary/30 pb-1 mb-2">Turnos</h2>
                        <p className="font-body text-sm text-gray-300 mb-2">En tu turno puedes:</p>
                        <ul className="list-disc list-inside font-body text-sm text-gray-300 space-y-1 ml-2">
                            <li>Jugar cualquier cantidad de Decretos.</li>
                            <li>Jugar como máximo 1 Impacto.</li>
                            <li><span className="text-gray-400 italic">No hay interrupciones ni respuestas del rival durante tu turno.</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-rpg text-xl text-primary border-b border-primary/30 pb-1 mb-2">Reglas Clave</h2>
                        <div className="grid grid-cols-2 gap-2 text-center mt-3">
                            <div className="bg-white/5 p-2 rounded border border-white/10">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">Reacciones</span>
                                <span className="text-gold-light font-display">Ninguna</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded border border-white/10">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">Efectos</span>
                                <span className="text-gold-light font-display">Directos</span>
                            </div>
                        </div>
                        <p className="text-center font-display text-xs text-gray-400 mt-4 italic">"Las decisiones son simples y definitivas."</p>
                    </section>
                </div>

                <button 
                    onClick={() => navigate('/')}
                    className="self-center w-full max-w-xs py-3 rounded-md border-2 border-[#555] bg-gradient-to-b from-[#2a2a2a] to-[#151515] text-gray-300 font-display font-bold tracking-widest uppercase text-sm hover:border-primary/50 hover:text-white transition-colors active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                    <span className="material-icons text-sm">arrow_back</span>
                    Volver al Menú
                </button>
            </main>
        </div>
    );
};

export default RulesScreen;