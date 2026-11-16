import { soundAssetUrl, type SoundType } from './audioAssets.ts';

/** Minimal media interface enables deterministic tests without Audio/WebAudio. */
export type SoundVoice = {
  paused: boolean;
  ended: boolean;
  currentTime: number;
  volume: number;
  preload: string;
  play: () => Promise<unknown> | void;
  pause: () => void;
};
type Slot = { audio: SoundVoice; serial: number };
export type CreateSound = (url: string) => SoundVoice;

/**
 * Reuse at most two media elements per effect (instead of new Audio on every
 * card/click). Create nothing until the player actually requests that sound.
 * If both voices are busy, drop a redundant sound rather than cut off another.
 * No preloading or network activity occurs in the constructor.
 */
export class SoundEffectPool {
  private readonly voices = new Map<SoundType, Slot[]>();
  private readonly maxPerSound: number;

  constructor(
    private readonly create: CreateSound,
    private readonly baseUrl: string,
    maxPerSound = 2,
  ) {
    this.maxPerSound = Math.max(1, Math.floor(maxPerSound));
  }

  play(type: SoundType): (() => void) | undefined {
    const url = soundAssetUrl(type, this.baseUrl);
    if (!url) return;
    let slots = this.voices.get(type);
    if (!slots) {
      slots = [];
      this.voices.set(type, slots);
    }
    let slot = slots.find(entry => entry.audio.paused || entry.audio.ended);
    if (!slot && slots.length < this.maxPerSound) {
      const audio = this.create(url);
      audio.preload = 'auto'; // only after an explicit user/game cue
      slot = { audio, serial: 0 };
      slots.push(slot);
    }
    if (!slot) return;

    const { audio } = slot;
    const serial = ++slot.serial;
    try { audio.currentTime = 0; } catch { /* may be seeking */ }
    audio.volume = type === 'IMPACT' ? 0.6 : 0.4;
    try {
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        void result.catch(() => { /* autoplay rejected: never block a turn */ });
      }
    } catch { /* unsupported audio devices never interrupt combat */ }

    return () => {
      // Stopping an older cue cannot cut off a later reuse of the same voice.
      if (slot!.serial !== serial) return;
      try { audio.pause(); audio.currentTime = 0; } catch { /* media closed */ }
    };
  }

  stopAll(): void {
    for (const slots of this.voices.values()) {
      for (const slot of slots) {
        ++slot.serial;
        try { slot.audio.pause(); slot.audio.currentTime = 0; } catch { /* media closed */ }
      }
    }
  }

  dispose(): void {
    this.stopAll();
    this.voices.clear();
  }
}
