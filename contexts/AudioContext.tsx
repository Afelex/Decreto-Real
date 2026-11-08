import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {NarrativeMusicDirector} from '../campaign/studio/musicDirector.ts';
import type {StudioNarrativeMusicMode} from '../campaign/studio/narrativeAudio.ts';

// --- SOUND ASSETS ---
const SOUNDS = {
    CLICK: 'https://assets.mixkit.co/active_storage/sfx/1109/1109-preview.mp3', // Click
    FLIP: 'https://assets.mixkit.co/active_storage/sfx/881/881-preview.mp3', // Quick Card Slide/Shuffle
    ATTACK: 'https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3', // Crisp Sword Slash
    DEFENSE: 'https://assets.mixkit.co/active_storage/sfx/878/878-preview.mp3', // Nature/Healing sound
    IMPACT: 'https://assets.mixkit.co/active_storage/sfx/880/880-preview.mp3', // Cinematic Deep Boom
    VICTORY: '', // Removed (Final Screen silenced)
    DEFEAT: '', // Removed (Final Screen silenced)
};

// War Drums Background Music
const BG_MUSIC_URL = 'https://assets.mixkit.co/music/80/80.mp3';

export type SoundType = keyof typeof SOUNDS;

interface AudioContextType {
    sfxEnabled: boolean;
    musicEnabled: boolean;
    toggleSfx: () => void;
    toggleMusic: () => void;
    playSound: (type: SoundType) => void;
    /** Modifica solo la pista de fondo existente. El ajuste global siempre prevalece. */
    setNarrativeMusicMode: (mode: StudioNarrativeMusicMode) => void;
    /** Selecciona una pista local/publicada del editor, null restaura música base. */
    setNarrativeMusicTrack: (url: string | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage or default to true
    const [sfxEnabled, setSfxEnabled] = useState(() => {
        const saved = localStorage.getItem('decreto_sfx');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [musicEnabled, setMusicEnabled] = useState(() => {
        const saved = localStorage.getItem('decreto_music');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const directorRef = useRef<NarrativeMusicDirector|null>(null);
    const [narrativeMusicMode,setNarrativeMusicMode]=useState<StudioNarrativeMusicMode>('normal');
    const [narrativeMusicTrack,setNarrativeMusicTrack]=useState<string|null>(null);

    // Un reproductor compartido conserva la pista durante todo el juego.
    // Dos canciones solo se solapan durante los 700 ms del fundido.
    useEffect(()=>{
        const director=new NarrativeMusicDirector({
            create:url=>new Audio(url),
            requestFrame:callback=>window.requestAnimationFrame(callback),
            cancelFrame:id=>window.cancelAnimationFrame(id),
            now:()=>performance.now(),
        });
        directorRef.current=director;
        return ()=>{
            director.dispose();
            if(directorRef.current===director)directorRef.current=null;
        };
    },[]);

    useEffect(()=>{
        directorRef.current?.setSoundtrack(
            narrativeMusicTrack??BG_MUSIC_URL,musicEnabled,narrativeMusicMode);
        localStorage.setItem('decreto_music', JSON.stringify(musicEnabled));
    },[musicEnabled,narrativeMusicMode,narrativeMusicTrack]);

    // Persistence for SFX
    useEffect(() => {
        localStorage.setItem('decreto_sfx', JSON.stringify(sfxEnabled));
    }, [sfxEnabled]);

    const toggleSfx = () => setSfxEnabled((prev: boolean) => !prev);
    const toggleMusic = () => setMusicEnabled((prev: boolean) => !prev);

    const playSound = (type: SoundType) => {
        if (!sfxEnabled) return;

        const url = SOUNDS[type];
        if (url) {
            const audio = new Audio(url);
            
            // Logic: Volume Control
            if (type === 'IMPACT') {
                audio.volume = 0.6; 
            } else {
                audio.volume = 0.4;
            }

            audio.play().catch(e => console.warn("Audio play blocked", e));
        }
    };

    return (
        <AudioContext.Provider value={{ sfxEnabled, musicEnabled, toggleSfx, toggleMusic, playSound, setNarrativeMusicMode, setNarrativeMusicTrack }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
/** Optional consumer for standalone story component previews and isolated tests. */
export const useOptionalAudio = () => useContext(AudioContext);
