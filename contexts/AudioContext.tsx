import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {NarrativeMusicDirector} from '../campaign/studio/musicDirector.ts';
import type {StudioNarrativeMusicMode} from '../campaign/studio/narrativeAudio.ts';
import { musicAssetUrl, type SoundType } from '../game/audioAssets.ts';
import { SoundEffectPool } from '../game/soundPool.ts';

// Keep the existing published music until Suno tracks are explicitly approved.
const BG_MUSIC_URL = musicAssetUrl('DEFAULT', import.meta.env.BASE_URL)!;

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

    // Silence outstanding effects immediately when the SFX switch is disabled.
    useEffect(() => {
        if (!sfxEnabled) soundPoolRef.current?.stopAll();
        localStorage.setItem('decreto_sfx', JSON.stringify(sfxEnabled));
    }, [sfxEnabled]);

    const toggleSfx = () => setSfxEnabled((prev: boolean) => !prev);
    const toggleMusic = () => setMusicEnabled((prev: boolean) => !prev);

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
