import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CORNER_IMG } from '../constants';
import { useAudio } from '../contexts/AudioContext';

const OptionsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { sfxEnabled, musicEnabled, toggleSfx, toggleMusic, playSound } = useAudio();

    const handleSave = () => {
        playSound('CLICK');
        navigate('/');
    };

    const Toggle = ({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: () => void, icon: string }) => (
        <div className="flex items-center justify-between w-full bg-black/40 border border-gold-dark/30 p-4 rounded-lg hover:border-gold-main/50 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${checked ? 'bg-primary/20 border-primary text-primary' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                    <span className="material-icons">{icon}</span>
                </div>
                <span className={`font-display tracking-widest text-sm uppercase ${checked ? 'text-gold-light' : 'text-gray-500'}`}>{label}</span>
            </div>
            
            <button 
                onClick={() => { onChange(); if(!checked) playSound('CLICK'); }}
                className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none shadow-inner ${checked ? 'bg-gradient-to-r from-green-900 to-green-700' : 'bg-gray-800'}`}
            >
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center
                    ${checked ? 'translate-x-8 bg-primary border-white' : 'translate-x-1 bg-gray-500 border-gray-400'} border`}
                >
                </div>
            </button>
        </div>
    );

    return (
        <div className="bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000_100%)] min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center">
             {/* Corners */}
             <div className="absolute top-0 left-0 w-[100px] h-[100px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain transform scale-x-[-1]" src={CORNER_IMG}/>
            </div>
            <div className="absolute top-0 right-0 w-[100px] h-[100px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain" src={CORNER_IMG}/>
            </div>
            <div className="absolute bottom-0 left-0 w-[100px] h-[100px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain transform rotate-180" src={CORNER_IMG}/>
            </div>
            <div className="absolute bottom-0 right-0 w-[100px] h-[100px] pointer-events-none z-20">
                <img alt="Corner" className="w-full h-full object-contain transform scale-y-[-1]" src={CORNER_IMG}/>
            </div>

            <main className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
                <div className="w-full ornate-border bg-[#0B0C10]/95 p-8 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                    <div className="text-center mb-10">
                        <h1 className="font-decorative text-3xl text-primary drop-shadow-md">
                            Opciones
                        </h1>
                        <div className="h-[1px] w-16 bg-gold-dark mx-auto mt-2 opacity-50"></div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <Toggle 
                            label="Música" 
                            icon="music_note" 
                            checked={musicEnabled} 
                            onChange={toggleMusic} 
                        />
                        <Toggle 
                            label="Efectos de Sonido" 
                            icon="volume_up" 
                            checked={sfxEnabled} 
                            onChange={toggleSfx} 
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button 
                            onClick={handleSave}
                            className="w-full btn-ornate py-3 rounded relative overflow-hidden group active:scale-95 transition-transform"
                        >
                            <span className="relative z-10 text-white font-display font-bold tracking-[0.2em] uppercase text-sm">Guardar y Volver</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OptionsScreen;