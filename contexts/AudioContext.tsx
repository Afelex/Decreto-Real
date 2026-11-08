import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

    const musicRef = useRef<HTMLAudioElement | null>(null);
    const [narrativeMusicMode,setNarrativeMusicMode]=useState<StudioNarrativeMusicMode>('normal');
    const [narrativeMusicTrack,setNarrativeMusicTrack]=useState<string|null>(null);

    // Initialize Music Object
    useEffect(() => {
        const audio = new Audio(narrativeMusicTrack??BG_MUSIC_URL);
        audio.loop = true;
        audio.volume = 0.3; // Low volume for background ambience
        musicRef.current = audio;

        // Attempt to play immediately if enabled, though browsers may block autoplay until interaction
        // La selección de la pista nunca ignora el silencio elegido por el
        // jugador; los navegadores pueden exigir un gesto antes de reproducir.
        if (musicEnabled&&narrativeMusicMode!=='silent') {
            audio.play().catch(e => console.warn("Music autoplay blocked (waiting for interaction):", e));
        }

        return () => {
            audio.pause();
            musicRef.current = null;
        };
    }, [narrativeMusicTrack]);

    // Handle Music Toggle Changes
    useEffect(() => {
        const audio = musicRef.current;
        if (!audio) return;

        // La narración solo atenúa o pausa la pista existente; nunca fuerza
        // reproducción cuando el jugador ha desactivado la música.
        audio.volume=narrativeMusicMode==='soft'?0.12:0.3;
        if (musicEnabled && narrativeMusicMode!=='silent') {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.warn("Music play blocked:", e));
            }
        } else {
            audio.pause();
        }
        
        localStorage.setItem('decreto_music', JSON.stringify(musicEnabled));
    }, [musicEnabled,narrativeMusicMode]);

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
