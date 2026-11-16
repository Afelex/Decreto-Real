import React from 'react';

/**
 * Stops decoding ambient loops whenever they cannot be seen (background tab,
 * game pause, or reduced-motion preference). Never tears down the video
 * element: the approved matching poster and current decoded frame stay intact.
 *
 * Does not change any turn/animation clock or the card videos.
 */
export function useAmbientVideo(
  ref: React.RefObject<HTMLVideoElement | null>,
  paused = false,
  source?: string,
): void {
  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let active = true;

    const sync = () => {
      if (!active) return;
      if (paused || document.hidden || motion?.matches) {
        video.pause();
        return;
      }
      try {
        const result = video.play();
        if (result && typeof result.catch === 'function') {
          void result.catch(() => { /* Browsers may block autonomous playback. */ });
        }
      } catch { /* Decorative media must never crash the duel. */ }
    };

    document.addEventListener('visibilitychange', sync);
    motion?.addEventListener?.('change', sync);
    sync();

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', sync);
      motion?.removeEventListener?.('change', sync);
      video.pause();
    };
  }, [ref, paused, source]);
}
