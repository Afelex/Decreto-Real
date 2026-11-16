/**
 * Catálogo audiovisual de Decreto Real (G3).
 *
 * Los recursos definitivos de Suno todavía no existen en el repositorio:
 * mantener file: null evita solicitar 404 y conserva los sonidos provisionales.
 *
 * Cuando estén aprobados, colocar los archivos en public/audio/... y editar
 * exclusivamente el campo "file". Las claves, controles y reglas no cambian.
 * Las rutas locales son relativas a import.meta.env.BASE_URL (GitHub Pages).
 */
type AudioSlot = { readonly file: string | null; readonly fallback: string | null };

export const SOUND_ASSETS: Record<
  'CLICK' | 'FLIP' | 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'VICTORY' | 'DEFEAT',
  AudioSlot
> = {
  CLICK: { file: null, fallback: 'https://assets.mixkit.co/active_storage/sfx/1109/1109-preview.mp3' },
  FLIP: { file: null, fallback: 'https://assets.mixkit.co/active_storage/sfx/881/881-preview.mp3' },
  ATTACK: { file: null, fallback: 'https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3' },
  DEFENSE: { file: null, fallback: 'https://assets.mixkit.co/active_storage/sfx/878/878-preview.mp3' },
  IMPACT: { file: null, fallback: 'https://assets.mixkit.co/active_storage/sfx/880/880-preview.mp3' },
  // El resultado permanece en silencio hasta recibir música aprobada.
  VICTORY: { file: null, fallback: null },
  DEFEAT: { file: null, fallback: null },
};

export type SoundType = keyof typeof SOUND_ASSETS;

/** Ranuras preparadas para composiciones Suno, sin archivos ficticios. */
export const MUSIC_ASSETS: Record<
  'DEFAULT' | 'MENU' | 'BATTLE' | 'DUEL_ENTRANCE' | 'VICTORY' | 'DEFEAT',
  AudioSlot
> = {
  DEFAULT: { file: null, fallback: 'https://assets.mixkit.co/music/80/80.mp3' },
  MENU: { file: null, fallback: null },
  BATTLE: { file: null, fallback: null },
  DUEL_ENTRANCE: { file: null, fallback: null },
  VICTORY: { file: null, fallback: null },
  DEFEAT: { file: null, fallback: null },
};

export type MusicSlot = keyof typeof MUSIC_ASSETS;

/** External fallback URLs are unchanged. Local assets respect /Decreto-Real/. */
export function resolveAudioSlot(slot: AudioSlot, baseUrl: string): string | null {
  if (!slot.file) return slot.fallback;
  const relative = slot.file.replace(/^\/+/, '');
  return baseUrl.replace(/\/?$/, '/') + relative;
}
export const soundAssetUrl = (type: SoundType, baseUrl: string): string | null =>
  resolveAudioSlot(SOUND_ASSETS[type], baseUrl);
export const musicAssetUrl = (type: MusicSlot, baseUrl: string): string | null =>
  resolveAudioSlot(MUSIC_ASSETS[type], baseUrl);
