/**
 * Catálogo audiovisual de Decreto Real (G3).
 *
 * Las seis pistas aprobadas se activan solo después de verificar e importar
 * el ZIP original; antes se conserva el audio publicado sin peticiones 404.
 * La importación no cambia los efectos sonoros provisionales.
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

/**
 * Music delivery is gated until the signed G3 ZIP has passed GitHub Actions.
 * The importer changes ONLY this flag when all six MP3s are committed.
 * This prevents 404 requests while the binary upload is still pending.
 */
export const SUNO_G3_READY = false; // SUNO_G3_IMPORT_FLAG

const suno = (filename: string): string | null =>
  SUNO_G3_READY ? 'audio/suno-g3/' + filename : null;

/** Approved Suno music, published only after SHA-256 verification.
 * Existing SFX continue using their independent sound pool.
 */
export const MUSIC_ASSETS: Record<
  'DEFAULT' | 'MENU' | 'BATTLE' | 'DUEL_ENTRANCE' | 'CRITICAL' | 'VICTORY' | 'DEFEAT',
  AudioSlot
> = {
  DEFAULT: { file: suno('mus_menu_reinos_del_peru_v01.mp3'), fallback: 'https://assets.mixkit.co/music/80/80.mp3' },
  MENU: { file: suno('mus_menu_reinos_del_peru_v01.mp3'), fallback: null },
  BATTLE: { file: suno('mus_combate_ia_v01.mp3'), fallback: null },
  DUEL_ENTRANCE: { file: suno('mus_presentacion_duelo_v01.mp3'), fallback: null },
  CRITICAL: { file: suno('mus_combate_tension_critica_v01.mp3'), fallback: null },
  VICTORY: { file: suno('mus_victoria_v01.mp3'), fallback: null },
  DEFEAT: { file: suno('mus_derrota_v01.mp3'), fallback: null },
};

export type MusicSlot = keyof typeof MUSIC_ASSETS;
/** A scene without a published song falls back to the existing base track. */
export function musicSceneUrl(scene: Exclude<MusicSlot,'DEFAULT'> | null, baseUrl: string): string {
  return (scene ? musicAssetUrl(scene,baseUrl) : null)
    ?? musicAssetUrl('DEFAULT',baseUrl)
    ?? '';
}

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
