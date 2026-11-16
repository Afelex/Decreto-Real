import { G3_UI_ASSETS } from './g3UiAssets';
import { loadDecodedImage } from './versusIaPreload';

/** Only the resources necessary to *display the first menu* are blocking.
 * Combat art/music and campaign videos remain lazy on their own routes. */
const root = import.meta.env.BASE_URL;
export const MENU_STARTUP_IMAGES = [
  { label: 'Logotipo', url: root + 'portada/decreto-real-logo.png' },
  { label: 'Fondo de portada', url: root + 'portada/portada-poster.jpg' },
  { label: 'Botón del menú', url: G3_UI_ASSETS.menuButton },
  { label: 'Botón pulsado', url: G3_UI_ASSETS.menuButtonPressed },
] as const;

export type MenuStartupProgress = Readonly<{
  completed: number;
  total: number;
  label: string;
}>;

const MENU_LOOP_PATH = root + 'portada/portada-loop.mp4';
let bufferedMenuVideo: string | null = null;

/** Reuse the verified MP4 Blob after loading instead of requesting it twice
 * when the cinematic menu mounts; one original video under 1 MB in memory. */
export const menuLoopSource = () => bufferedMenuVideo ?? MENU_LOOP_PATH;

export async function loadMenuLoop(signal: AbortSignal): Promise<void> {
  if (bufferedMenuVideo) return;
  const response = await fetch(MENU_LOOP_PATH, { signal, cache: 'force-cache' });
  if (!response.ok) throw new Error('No se pudo descargar el fondo animado');
  const video = await response.blob();
  if (signal.aborted) throw new DOMException('Carga cancelada', 'AbortError');
  if (typeof URL.createObjectURL !== 'function') return;
  const objectUrl = URL.createObjectURL(video);
  if (bufferedMenuVideo) URL.revokeObjectURL(objectUrl);
  else bufferedMenuVideo = objectUrl;
}

type StartupOptions = {
  signal: AbortSignal;
  onProgress: (progress: MenuStartupProgress) => void;
  loadMenu?: () => Promise<unknown>;
  loadImage?: (url: string, signal: AbortSignal) => Promise<void>;
  loadVideo?: (signal: AbortSignal) => Promise<void>;
  images?: readonly { label: string; url: string }[];
};

/** Percentage represents *completed* work, never elapsed time or simulated bytes.
 * On a failed required resource it stops short of 100% and enables Retry.
 * MP4 is an optional enhancement; the already-decoded poster is the fallback.
 */
export async function preloadMainMenu({
  signal,
  onProgress,
  loadMenu = () => import('../screens/MainMenu'),
  loadImage = loadDecodedImage,
  loadVideo = loadMenuLoop,
  images = MENU_STARTUP_IMAGES,
}: StartupOptions): Promise<void> {
  const tasks = [
    { label: 'Interfaz preparada', run: async () => { await loadMenu(); } },
    ...images.map(asset => ({
      label: asset.label,
      run: () => loadImage(asset.url, signal),
    })),
    { label: 'Vídeo de portada preparado', run: async () => {
      try { await loadVideo(signal); }
      catch (error) {
        if (signal.aborted) throw error;
        // Video is optional: poster already decoded before declaring 100%.
        // Keep the original MP4 URL as a fallback for compatible browsers.
      }
    } },
  ];
  const total = tasks.length;
  let completed = 0;
  let cursor = 0;
  let failed = false;
  const assertActive = () => {
    if (signal.aborted) throw new DOMException('Carga cancelada', 'AbortError');
  };

  assertActive();
  onProgress({ completed, total, label: 'Preparando Decreto Real' });
  const workers = Array.from({ length: Math.min(3, total) }, async () => {
    while (!failed) {
      assertActive();
      const task = tasks[cursor++];
      if (!task) return;
      try {
        await task.run();
        assertActive();
        if (failed) return;
        completed++;
        onProgress({ completed, total, label: task.label });
      } catch (error) {
        failed = true;
        if (signal.aborted) throw error;
        throw new Error('No se pudo cargar: ' + task.label, { cause: error });
      }
    }
  });
  await Promise.all(workers);
  assertActive();
  if (completed !== total) throw new Error('La preparación del menú está incompleta');
}
