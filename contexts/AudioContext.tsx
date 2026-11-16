import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {NarrativeMusicDirector} from '../campaign/studio/musicDirector.ts';
import type {StudioNarrativeMusicMode} from '../campaign/studio/narrativeAudio.ts';
import { musicSceneUrl, type MusicSlot, type SoundType } from '../game/audioAssets.ts';
import { SoundEffectPool } from '../game/soundPool.ts';
import { menuMusicSource } from '../game/menuMusicPreload.ts';

// The selected scene always falls back to the currently published soundtrack.

interface AudioContextType {
    sfxEnabled: boolean;
    musicEnabled: boolean;
    toggleSfx: () => void;
    toggleMusic: () => void;
    /** Devuelve un control opcional para recortar efectos con duración editorial. */
    playSound: (type: SoundType) => void|(()=>void);
    /** Modifica solo la pista de fondo existente. El ajuste global siempre prevalece. */
    setNarrativeMusicMode: (mode: StudioNarrativeMusicMode) => void;
    /** Selecciona una pista local/publicada del editor, null restaura música base. */
    setNarrativeMusicTrack: (url: string | null) => void;
    /** Canciones por escena; no afecta a los efectos ni a la edición de narrativa. */
    setMusicScene: (scene: Exclude<MusicSlot,'DEFAULT'> | null) => void;
    /** True only when the browser blocks autoplay until the first gesture. */
    musicGestureRequired: boolean;
    unlockMusic: () => void;
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
    // A single lazy pool reuses small SFX players; it is not downloaded at mount.
    const soundPoolRef = useRef<SoundEffectPool|null>(null);

    useEffect(() => () => {
        soundPoolRef.current?.dispose();
        soundPoolRef.current = null;
    }, []);
    const [musicScene,setMusicScene]=useState<Exclude<MusicSlot,'DEFAULT'>|null>(() => {
        // After the splash the MENU theme was already downloaded. Select it on
        // the very first render to avoid briefly starting the default theme.
        const initialRoute=window.location.hash.slice(1).split('?')[0]||'/';
        return initialRoute==='/' ? 'MENU' : null;
    });
    const [musicGestureRequired,setMusicGestureRequired]=useState(false);
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
            onPlaybackPermissionChange:setMusicGestureRequired,
        });
        directorRef.current=director;
        return ()=>{
            director.dispose();
            if(directorRef.current===director)directorRef.current=null;
        };
    },[]);

    const soundtrackUrl = narrativeMusicTrack ?? (
        musicScene==='MENU' ? menuMusicSource() ?? musicSceneUrl('MENU',import.meta.env.BASE_URL)
            : musicSceneUrl(musicScene,import.meta.env.BASE_URL)
    );
    const unlockMusic=()=>{
        if(musicEnabled && soundtrackUrl)
            directorRef.current?.setSoundtrack(soundtrackUrl,true,narrativeMusicMode);
    };

    useEffect(()=>{
        if(!musicEnabled) setMusicGestureRequired(false);
    },[musicEnabled]);

    useEffect(()=>{
        if(soundtrackUrl)directorRef.current?.setSoundtrack(
            soundtrackUrl,musicEnabled,narrativeMusicMode);
        localStorage.setItem('decreto_music', JSON.stringify(musicEnabled));
    },[musicEnabled,narrativeMusicMode,soundtrackUrl]);

    // Always attempt playback on mount, including the opening loading screen.
    // If the browser blocked autoplay, the NEXT ordinary touch/key starts music
    // without requiring a dedicated "Activar música" button.
    useEffect(()=>{
        if (!musicEnabled || !musicGestureRequired) return;
        const unlock=()=>unlockMusic();
        document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
        document.addEventListener('keydown',unlock,true);
        return ()=>{
            document.removeEventListener('pointerdown',unlock,true);
            document.removeEventListener('keydown',unlock,true);
        };
    },[soundtrackUrl,musicEnabled,musicGestureRequired,narrativeMusicMode]);

    // Silence outstanding effects immediately when the SFX switch is disabled.
    useEffect(() => {
        if (!sfxEnabled) soundPoolRef.current?.stopAll();
        localStorage.setItem('decreto_sfx', JSON.stringify(sfxEnabled));
    }, [sfxEnabled]);

    const toggleSfx = () => setSfxEnabled((prev: boolean) => !prev);
    const toggleMusic = () => {
        // Resume synchronously from the click that enables music. Deferring
        // play() to React's effect alone can be blocked by mobile browsers.
        if (!musicEnabled && soundtrackUrl) {
            directorRef.current?.setSoundtrack(soundtrackUrl,true,narrativeMusicMode);
        }
        setMusicEnabled((prev: boolean) => !prev);
    };

    const playSound = (type: SoundType): void|(()=>void) => {
        if (!sfxEnabled) return;
        if (!soundPoolRef.current) {
            soundPoolRef.current = new SoundEffectPool(
                url => new Audio(url), import.meta.env.BASE_URL,
            );
        }
        return soundPoolRef.current.play(type);
    };

    return (
        <AudioContext.Provider value={{ sfxEnabled, musicEnabled, toggleSfx, toggleMusic, playSound, setNarrativeMusicMode, setNarrativeMusicTrack, setMusicScene, musicGestureRequired, unlockMusic }}>
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
