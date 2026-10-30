import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VICTORY_IMG } from '../constants';
import { useAudio } from '../contexts/AudioContext';

const VictoryScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { playSound } = useAudio();
    
    // Determine outcome from state (defaults to Victory for preview purposes)
    const outcome = location.state?.outcome || 'VICTORY'; 
    const isVictory = outcome === 'VICTORY';
    const turnCount = location.state?.turnCount || '-';

    useEffect(() => {
        if (isVictory) {
            playSound('VICTORY');
        } else {
            playSound('DEFEAT');
        }
    }, [isVictory]);

    const handleRestart = () => {
        playSound('CLICK');
        navigate('/game');
    };

    const handleMenu = () => {
        playSound('CLICK');
        navigate('/');
    };

    // Theme configuration based on outcome
    const theme = {
        title: isVictory ? 'VICTORIA' : 'DERROTA',
        subtitle: isVictory ? 'Reino Asegurado' : 'Reino Caído',
        colorClass: isVictory ? 'from-[#FFF5C3] to-[#D4AF37]' : 'from-[#ffc3c3] to-[#d43737]',
        textClass: isVictory ? 'text-primary' : 'text-red-500',
        borderClass: isVictory ? 'border-primary' : 'border-red-900',
        bgGlow: isVictory ? 'bg-primary' : 'bg-red-700',
        mvpText: isVictory ? 'MVP' : 'CAÍDO',
        score: isVictory ? '2,450' : '500',
    };

    return (
        <div className="dr-victory-screen bg-background-light dark:bg-background-dark font-body min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-ornate-pattern opacity-10 dark:opacity-40 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-0 pointer-events-none"></div>
            
            {/* SVG Decorations (Color logic applied) */}
            <div className={`fixed top-0 left-0 w-32 h-32 pointer-events-none z-10 opacity-80 ${isVictory ? 'fill-primary' : 'fill-red-900'}`}>
                <svg className="w-full h-full fill-current" viewBox="0 0 100 100">
                    <path d="M0,0 L40,0 C20,0 10,10 5,20 L5,50 C5,20 0,10 0,0 Z M0,0 L0,40 C0,20 10,10 20,5 L50,5 C20,5 10,0 0,0 Z"></path>
                    <path d="M10,10 L30,10 C20,10 15,15 12,20 L12,40 C12,20 10,15 10,10 Z" fill={isVictory ? "#9E2A2B" : "#330000"}></path>
                </svg>
            </div>
            <div className={`fixed top-0 right-0 w-32 h-32 pointer-events-none z-10 opacity-80 transform scale-x-[-1] ${isVictory ? 'fill-primary' : 'fill-red-900'}`}>
                <svg className="w-full h-full fill-current" viewBox="0 0 100 100">
                    <path d="M0,0 L40,0 C20,0 10,10 5,20 L5,50 C5,20 0,10 0,0 Z M0,0 L0,40 C0,20 10,10 20,5 L50,5 C20,5 10,0 0,0 Z"></path>
                    <path d="M10,10 L30,10 C20,10 15,15 12,20 L12,40 C12,20 10,15 10,10 Z" fill={isVictory ? "#9E2A2B" : "#330000"}></path>
                </svg>
            </div>

            <main className="dr-victory-content relative z-20 w-full max-w-md px-4 py-8 flex flex-col items-center gap-6 h-full justify-center">
                <div className="text-center relative mb-4">
                    <div className={`absolute inset-0 ${theme.bgGlow} blur-3xl opacity-20 rounded-full`}></div>
                    <h1 className={`font-display text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b ${theme.colorClass} drop-shadow-lg tracking-widest uppercase relative z-10 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}>
                        {theme.title}
                    </h1>
                    <div className={`h-1 w-32 bg-gradient-to-r from-transparent via-${isVictory ? 'primary' : 'red-800'} to-transparent mx-auto mt-2`}></div>
                    <p className={`${theme.textClass}/80 font-display text-sm mt-1 tracking-[0.2em] uppercase`}>{theme.subtitle}</p>
                </div>

                <div className="dr-victory-portrait relative w-48 h-64 md:w-56 md:h-72 group">
                    <div className={`absolute inset-0 ${theme.bgGlow} blur-xl opacity-40 animate-pulse rounded-xl`}></div>
                    <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 ${theme.borderClass} shadow-2xl bg-gray-900 transform transition-transform duration-500 hover:scale-105 ${!isVictory ? 'grayscale' : ''}`}>
                        <img alt="Victorious anime warrior" className="w-full h-full object-cover opacity-90" src={VICTORY_IMG}/>
                        <div className="absolute inset-0 border-4 border-black/30 rounded-xl pointer-events-none"></div>
                        <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-black via-gray-900 to-black text-white px-4 py-1 rounded-sm border ${theme.borderClass} shadow-lg flex items-center gap-1 z-10`}>
                            <span className={`${isVictory ? 'text-yellow-400' : 'text-gray-500'} material-icons text-sm`}>star</span>
                            <span className="font-display font-bold text-xs tracking-wider">{theme.mvpText}</span>
                            <span className={`${isVictory ? 'text-yellow-400' : 'text-gray-500'} material-icons text-sm`}>star</span>
                        </div>
                    </div>
                </div>

                <div className="dr-victory-stats w-full ornate-border rounded-lg p-6 mt-4 relative bg-[#121212]/90 backdrop-blur-sm">
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-4 ${theme.textClass} font-display text-sm tracking-widest border ${theme.borderClass}/30`}>
                        Resultados
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center mt-2">
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 text-xs uppercase tracking-wider font-display mb-1">Puntuación</span>
                            <span className="text-3xl font-display font-bold text-white drop-shadow-md">{theme.score}</span>
                        </div>
                        <div className={`flex flex-col items-center border-l ${isVictory ? 'border-primary/20' : 'border-red-900/30'}`}>
                            <span className="text-gray-400 text-xs uppercase tracking-wider font-display mb-1">Turnos</span>
                            <span className="text-3xl font-display font-bold text-white drop-shadow-md">{turnCount}</span>
                        </div>
                        {isVictory && (
                            <div className="flex flex-col items-center col-span-2 mt-2 pt-4 border-t border-primary/20">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-display mb-2">Recompensas</span>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-400 flex items-center justify-center mb-1 shadow-lg">
                                            <span className="material-icons text-white text-lg">monetization_on</span>
                                        </div>
                                        <span className="text-primary font-bold text-sm">+500</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400 flex items-center justify-center mb-1 shadow-lg">
                                            <span className="material-icons text-white text-lg">auto_awesome</span>
                                        </div>
                                        <span className="text-purple-300 font-bold text-sm">EXP</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dr-victory-actions w-full flex flex-col gap-3 mt-4">
                    <button 
                        onClick={handleRestart}
                        className="w-full btn-ornate py-4 rounded-md relative overflow-hidden group transition-all hover:brightness-110 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-white font-display font-bold text-lg tracking-widest uppercase text-shadow-gold">Jugar de Nuevo</span>
                            <span className="material-icons text-primary">replay</span>
                        </div>
                    </button>
                    <button 
                        onClick={handleMenu}
                        className="w-full py-3 rounded-md border-2 border-[#555] bg-gradient-to-b from-[#2a2a2a] to-[#151515] text-gray-300 font-display font-bold tracking-widest uppercase text-sm hover:border-primary/50 hover:text-white transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-sm text-gray-400">home</span>
                        Menú Principal
                    </button>
                </div>
            </main>

            <div className="absolute bottom-4 w-full flex justify-center opacity-50 z-10">
                <div className="flex items-center gap-2">
                    <div className={`h-px w-16 bg-gradient-to-r from-transparent ${isVictory ? 'to-primary' : 'to-red-900'}`}></div>
                    <div className={`w-2 h-2 rotate-45 border ${isVictory ? 'border-primary' : 'border-red-900'}`}></div>
                    <div className={`h-px w-16 bg-gradient-to-l from-transparent ${isVictory ? 'to-primary' : 'to-red-900'}`}></div>
                </div>
            </div>
        </div>
    );
};

export default VictoryScreen;