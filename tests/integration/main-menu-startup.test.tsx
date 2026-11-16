import { describe, it, expect, vi } from 'vitest';
import { preloadMainMenu } from '../../game/mainMenuStartup';

const images = [
  { label: 'Logotipo', url: '/logo.png' },
  { label: 'Póster', url: '/poster.jpg' },
] as const;

describe('carga inicial de Decreto Real', () => {
  it('100% solo al terminar menú, imágenes, música y vídeo de portada', async () => {
    const signal = new AbortController().signal;
    const progress: Array<{ completed:number; total:number; label:string }> = [];
    let releaseVideo!: () => void;
    const video = new Promise<void>(resolve => { releaseVideo = resolve; });
    const task = preloadMainMenu({
      signal,
      onProgress: p => progress.push(p),
      loadMenu: () => Promise.resolve(),
      loadImage: () => Promise.resolve(),
      loadVideo: () => video,
      loadMusic: () => Promise.resolve(),
      images,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(progress[0]).toMatchObject({ completed:0, total:5 });
    expect(progress.at(-1)?.completed).toBe(4);
    releaseVideo();
    await task;
    expect(progress.at(-1)).toMatchObject({ completed:5, total:5 });
    expect(progress.map(p => p.completed)).toEqual([0,1,2,3,4,5]);
  });

  it('no anuncia 100% ni abre el menú cuando falla un recurso esencial', async () => {
    const progress: number[] = [];
    await expect(preloadMainMenu({
      signal: new AbortController().signal,
      onProgress: p => progress.push(p.completed),
      loadMenu: () => Promise.resolve(),
      loadImage: url => url.includes('logo') ? Promise.reject(new Error('404')) : Promise.resolve(),
      loadVideo: () => Promise.resolve(),
      loadMusic: () => Promise.resolve(),
      images,
    })).rejects.toThrow('No se pudo cargar: Logotipo');
    expect(progress).not.toContain(5);
  });

  it('si el MP4 opcional falla, el póster preparado permite mostrar el menú', async () => {
    const progress: number[] = [];
    await preloadMainMenu({
      signal: new AbortController().signal,
      onProgress: p => progress.push(p.completed),
      loadMenu: () => Promise.resolve(),
      loadImage: () => Promise.resolve(),
      loadVideo: () => Promise.reject(new Error('No se puede reproducir video')),
      loadMusic: () => Promise.resolve(),
      images,
    });
    expect(progress.at(-1)).toBe(5);
  });

  it('cancela la preparación si la pantalla se desmonta', async () => {
    const controller = new AbortController();
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const progress: number[] = [];
    const task = preloadMainMenu({
      signal: controller.signal,
      onProgress: p => progress.push(p.completed),
      loadMenu: () => pending,
      loadImage: () => pending,
      loadVideo: () => pending,
      loadMusic: () => pending,
      images,
    });
    controller.abort();
    release();
    await expect(task).rejects.toThrow();
    expect(progress).not.toContain(5);
  });

  it('no abre el menú si la pista original habilitada no se descargó', async () => {
    const percentages: number[] = [];
    await expect(preloadMainMenu({
      signal: new AbortController().signal,
      onProgress: p => percentages.push(p.completed),
      loadMenu: () => Promise.resolve(),
      loadImage: () => Promise.resolve(),
      loadVideo: () => Promise.resolve(),
      loadMusic: () => Promise.reject(new Error('audio desconectado')),
      images,
    })).rejects.toThrow('No se pudo cargar: Música del menú preparada');
    expect(percentages).not.toContain(5);
  });

  it('no inventa el porcentaje cuando el paquete llega vacío', async () => {
    const onProgress = vi.fn();
    await preloadMainMenu({
      signal: new AbortController().signal, onProgress,
      loadMenu: () => Promise.resolve(), images: [], loadVideo: () => Promise.resolve(), loadMusic: () => Promise.resolve(),
    });
    expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({completed:3,total:3}));
  });
});
