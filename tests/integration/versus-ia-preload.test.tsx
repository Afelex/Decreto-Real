import { describe, expect, it, vi } from 'vitest';
import { preloadVersusIa } from '../../game/versusIaPreload';

const images = [
  { label: 'Retrato', url: '/retrato.webp' },
  { label: 'Moneda', url: '/moneda.webp' },
] as const;

describe('precarga Versus IA', () => {
  it('llega al 100% solamente después de cargar el motor y todas las imágenes', async () => {
    const controller = new AbortController();
    const reports: Array<{ completed: number; total: number }> = [];
    let releaseSecond!: () => void;
    const second = new Promise<void>(resolve => { releaseSecond = resolve; });
    const loadImage = vi.fn((src: string) => src.includes('moneda') ? second : Promise.resolve());
    const task = preloadVersusIa({
      signal: controller.signal,
      onProgress: report => reports.push(report),
      loadBoard: () => Promise.resolve(),
      loadImage,
      images,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(reports[0]).toMatchObject({ completed: 0, total: 3 });
    expect(reports.at(-1)?.completed).toBe(2);
    releaseSecond();
    await task;
    expect(reports.at(-1)).toMatchObject({ completed: 3, total: 3 });
    expect(reports.map(item => item.completed)).toEqual([0, 1, 2, 3]);
    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  it('no anuncia 100% cuando falta un recurso y ofrece causa específica', async () => {
    const controller = new AbortController();
    const counts: number[] = [];
    await expect(preloadVersusIa({
      signal: controller.signal,
      onProgress: report => counts.push(report.completed),
      loadBoard: () => Promise.resolve(),
      loadImage: (src: string) => src.includes('moneda') ?
        Promise.reject(new Error('404')) : Promise.resolve(),
      images,
    })).rejects.toThrow('No se pudo preparar: Moneda');
    expect(counts).not.toContain(3);
  });

  it('respeta cancelación y no deja completar la carga después de abandonar', async () => {
    const controller = new AbortController();
    const counts: number[] = [];
    let rejectImage!: (error: Error) => void;
    const pending = new Promise<void>((_resolve, reject) => { rejectImage = reject; });
    const task = preloadVersusIa({
      signal: controller.signal,
      onProgress: report => counts.push(report.completed),
      loadBoard: () => Promise.resolve(),
      loadImage: () => pending,
      images: [{ label: 'Puerta', url: '/puerta.webp' }],
    });
    controller.abort();
    rejectImage(new DOMException('Carga cancelada', 'AbortError'));
    await expect(task).rejects.toThrow();
    expect(counts).not.toContain(2);
  });

  it('incluye una tarea para el módulo del duelo aunque no haya imágenes', async () => {
    const counts: number[] = [];
    await preloadVersusIa({
      signal: new AbortController().signal,
      onProgress: report => counts.push(report.completed),
      loadBoard: () => Promise.resolve(),
      images: [],
    });
    expect(counts).toEqual([0, 1]);
  });
});
