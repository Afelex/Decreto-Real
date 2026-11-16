import { musicAssetUrl } from './audioAssets';

/**
 * The menu theme is downloaded during the initial splash, not after it.
 * Keep one object URL for the session so the audio player does not need to
 * request the same ~3.7 MB again after the loading bar reaches 100%.
 */
let preparedMenuAudio: string | null = null;
export const menuMusicSource = (): string | null => preparedMenuAudio;

export async function preloadMenuMusic(signal: AbortSignal): Promise<void> {
  if (preparedMenuAudio || signal.aborted) {
    if (signal.aborted) throw new DOMException('Carga cancelada', 'AbortError');
    return;
  }
  // Do not download music when the player has explicitly disabled it.
  try {
    if (window.localStorage.getItem('decreto_music') === 'false') return;
  } catch { /* unavailable storage; use the default enabled state */ }
  const url = musicAssetUrl('MENU', import.meta.env.BASE_URL);
  if (!url) return; // The published audio catalog may be gated in QA.
  const response = await fetch(url, { signal, cache: 'force-cache' });
  if (!response.ok) throw new Error('No se pudo descargar la música del menú');
  const bytes = await response.blob();
  if (signal.aborted) throw new DOMException('Carga cancelada', 'AbortError');
  if (!bytes.size || !bytes.type.startsWith('audio/')) {
    // GitHub Pages may serve MP3 as application/octet-stream; trust only real
    // MPEG sync/ID3 headers when the MIME type is not audio/*.
    const header = new Uint8Array(await bytes.slice(0, 3).arrayBuffer());
    const isId3 = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33;
    const isMpeg = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
    if (!bytes.size || (!isId3 && !isMpeg)) throw new Error('Música del menú inválida');
  }
  if (typeof URL.createObjectURL !== 'function') return;
  const objectUrl = URL.createObjectURL(bytes);
  if (preparedMenuAudio) URL.revokeObjectURL(objectUrl);
  else preparedMenuAudio = objectUrl;
}
