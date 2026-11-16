import { OPPONENT_IMG, PLAYER_IMG } from '../constants';
import { STANDARD_BATTLE_POSTER, STANDARD_BATTLE_VIDEO_POSTER } from './battleScenery';
import { G3_UI_ASSETS } from './g3UiAssets';

/**
 * Assets that must be decoded before entering the free IA duel.
 * Only the opening gameplay set is blocking: battle video streams as usual,
 * and optional/network-hosted music & effects never hold the player hostage.
 */
const base = import.meta.env.BASE_URL;
const hud = base + 'interfaz/hud-g3/';

export type DuelLoadProgress = Readonly<{
  completed: number;
  total: number;
  label: string;
}>;

type StartupImage = Readonly<{ label: string; url: string; fallbackUrl?: string }>;

export const VS_IA_STARTUP_IMAGES: readonly StartupImage[] = [
  { label: 'Escenario del combate', url: import.meta.env.DEV ? STANDARD_BATTLE_POSTER : STANDARD_BATTLE_VIDEO_POSTER,
    fallbackUrl: STANDARD_BATTLE_POSTER },
  { label: 'Retrato de Xervias', url: PLAYER_IMG },
  { label: 'Retrato del rival', url: OPPONENT_IMG },
  { label: 'Puerta izquierda', url: G3_UI_ASSETS.gateLeft },
  { label: 'Puerta derecha', url: G3_UI_ASSETS.gateRight },
  { label: 'Marco rojo de presentación', url: G3_UI_ASSETS.playerFrame },
  { label: 'Marco azul de presentación', url: G3_UI_ASSETS.rivalFrame },
  { label: 'Decreto de ataque', url: base + 'cartas/decreto-ataque.webp' },
  { label: 'Decreto de defensa', url: base + 'cartas/decreto-defensa.webp' },
  { label: 'Decreto de orden', url: base + 'cartas/decreto-orden.webp?v=20261103' },
  { label: 'Decreto de impacto', url: base + 'cartas/decreto-impacto.webp?v=20261103' },
  { label: 'Moneda del sol', url: base + 'moneda/sol.webp' },
  { label: 'Moneda del sello', url: base + 'moneda/cruz.webp' },
  { label: 'Marco del tablero', url: hud + 'retrato_marco.webp' },
  { label: 'Mazo de cartas', url: hud + 'mazo.webp' },
  { label: 'Menú de pausa', url: hud + 'menu.webp' },
  { label: 'Fin de turno', url: hud + 'fin_turno.webp' },
  { label: 'Control de sonido', url: hud + 'sonido_activado.webp' },
  { label: 'Sonido silenciado', url: hud + 'sonido_silenciado.webp' },
  { label: 'Panel de combo', url: hud + 'combo_panel.webp' },
  { label: 'Cinta de turno de Xervias', url: base + 'interfaz/banner-tu-turno.webp' },
  { label: 'Cinta de turno del rival', url: base + 'interfaz/banner-turno-rival.webp' },
];

/** Image.decode ensures the entire image is available and decoded, not only the first response byte. */
export function loadDecodedImage(url: string, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Carga cancelada', 'AbortError'));
      return;
    }
    const img = new Image();
    let finished = false;
    const timer = window.setTimeout(() => fail(new Error('Tiempo agotado para el recurso')), 20000);
    const cleanup = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      img.onload = null;
      img.onerror = null;
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };
    const fail = (reason: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      img.src = '';
      reject(reason);
    };
    const abort = () => fail(new DOMException('Carga cancelada', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    img.onload = () => {
      if (typeof img.decode === 'function') {
        void img.decode().then(finish, () => fail(new Error('No fue posible decodificar la imagen')));
      } else finish();
    };
    img.onerror = () => fail(new Error('No fue posible descargar la imagen'));
    img.src = url;
  });
}

type PreloadOptions = {
  signal: AbortSignal;
  onProgress: (progress: DuelLoadProgress) => void;
  /** Injected in tests; real play uses the same chunk as React.lazy /game. */
  loadBoard?: () => Promise<unknown>;
  loadImage?: (url: string, signal: AbortSignal) => Promise<void>;
  images?: readonly StartupImage[];
};

/**
 * 100% is reached ONLY when the IA board module and every startup image have
 * actually resolved. Capped concurrency reduces memory and network spikes.
 */
export async function preloadVersusIa({
  signal,
  onProgress,
  loadBoard = () => import('../screens/GameBoard'),
  loadImage = loadDecodedImage,
  images = VS_IA_STARTUP_IMAGES,
}: PreloadOptions): Promise<void> {
  const total = images.length + 1;
  let completed = 0;
  let index = 0;
  let failed = false;

  const assertActive = () => {
    if (signal.aborted) throw new DOMException('Carga cancelada', 'AbortError');
  };
  const tick = (label: string) => {
    assertActive();
    if (failed) return;
    completed += 1;
    onProgress({ completed, total, label });
  };

  assertActive();
  onProgress({ completed: 0, total, label: 'Preparando los recursos del duelo…' });
  const boardTask = loadBoard()
    .then(() => tick('Motor del duelo listo'))
    .catch(error => {
      failed = true;
      throw new Error('No se pudo cargar el motor del duelo', { cause: error });
    });
  const workers = Array.from({ length: Math.min(4, images.length) }, async () => {
    while (!failed) {
      assertActive();
      const current = index++;
      if (current >= images.length) break;
      const asset = images[current];
      try {
        try {
          await loadImage(asset.url, signal);
        } catch (error) {
          if (!asset.fallbackUrl || signal.aborted) throw error;
          // The optimized JPG is generated by the Pages deployment workflow.
          // Built previews do not have it; the checked-in still is the safe fallback.
          await loadImage(asset.fallbackUrl, signal);
        }
        tick(asset.label);
      } catch (error) {
        failed = true;
        if (signal.aborted) throw error;
        throw new Error('No se pudo preparar: ' + asset.label, { cause: error });
      }
    }
  });
  await Promise.all([boardTask, ...workers]);
  assertActive();
  if (completed !== total) throw new Error('La carga de recursos está incompleta');
}
