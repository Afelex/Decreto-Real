import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { BattleSceneryLayer } from '../../screens/BattleSceneryLayer';
import { CardActivationBanner } from '../../screens/CardActivationBanner';
import { ComboEffectOverlay } from '../../screens/ComboEffectOverlay';
import { LastDecreeIndicator } from '../../screens/LastDecreeIndicator';
import type { CardData, CardType } from '../../types';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('duelo estándar: muestra fotograma del MISMO vídeo sin imagen clay ni viñeta', () => {
  const { container } = render(<BattleSceneryLayer
    poster="/Decreto-Real/escenarios/plaza-arcilla-estandar.webp"
    video="/Decreto-Real/escenarios/partida-inicial-loop.mp4" />);
  expect(container.querySelector('[data-scenery-mode="video-only"]')).toBeTruthy();
  const preview = container.querySelector('img.dr-battle-video-poster')!;
  expect(preview).toBeTruthy();
  expect(preview.getAttribute('src')).toContain('partida-inicial-poster.jpg');
  expect(container.querySelector('img[src*="plaza-arcilla"]')).toBeNull();
  expect(container.querySelector('.dr-royal-vignette')).toBeNull();
  const video = container.querySelector('video')!;
  expect(video).toBeTruthy();
  expect(video.getAttribute('poster')).toContain('partida-inicial-poster.jpg');
  expect(container.querySelector('[data-video-ready="false"]')).toBeTruthy();
  expect(video.querySelector('source')?.getAttribute('src')).toContain('partida-inicial-loop.mp4');
});

test('escenas sin vídeo conservan su imagen de campaña', () => {
  const { container } = render(<BattleSceneryLayer poster="/Decreto-Real/escenarios/mision-2.webp" />);
  expect(container.querySelector('[data-scenery-mode="still"] img')?.getAttribute('src')).toContain('mision-2.webp');
  expect(container.querySelector('video')).toBeNull();
});

const names: Record<CardType, string> = {
  ATTACK: 'Ataque', DEFENSE: 'Defensa', ORDER: 'Orden',
  IMPACT: 'Impacto', MYSTIC: 'Místico',
};
const clips: Record<CardType, string | null> = {
  ATTACK: 'efectos/ataque.webm',
  DEFENSE: 'efectos/defensa.webm',
  ORDER: 'efectos/orden.webm',
  IMPACT: null, MYSTIC: null,
};

for (const type of Object.keys(names) as CardType[]) {
  test(`activar ${names[type]} muestra banner WebM de jugador y rival`, () => {
    const card: CardData = { id:'demo',type,name:'Decreto '+names[type],
      description:'Efecto +1',cost:0,img:'',...(type === 'IMPACT' ? { rank:1 } : {}) };
    for (const isPlayer of [true,false]) {
      const { container, unmount } = render(
        <CardActivationBanner card={card} isPlayer={isPlayer} paused={false} />
      );
      const srcs = Array.from(container.querySelectorAll('video source')).map(source=>source.getAttribute('src')||'');
      expect(container.querySelector('.dr-decree-banner__copy')).toBeTruthy();
       expect(container.querySelectorAll('.dr-decree-banner')).toHaveLength(1);
       expect(container.querySelector('.dr-cinematic-fallback')).toBeNull();
       expect(container.querySelector('.dr-cinematic-media')).toBeNull();
      expect(container.querySelector('.dr-cinematic-overlay')?.getAttribute('style')).toContain('--dr-cue-duration: 1500ms');
      expect(srcs).toContainEqual(expect.stringContaining(isPlayer ? 'banner-jugador-rojo.webm' : 'banner-rival-azul.webm'));
      // The banner and energy clips must never occupy the same frame.
      expect(srcs).not.toContainEqual(expect.stringContaining('efectos/'));
      unmount();
      const { container: energy, unmount: stop } = render(
        <CardActivationBanner card={card} isPlayer={isPlayer} paused={false} stage="effect" />
      );
      const fx = energy.querySelector('.dr-fx-g3-host');
      expect(fx).toBeTruthy();
      expect(fx?.getAttribute('data-fx-id')).toBe(
        type === 'ATTACK' ? (isPlayer ? 'A01' : 'A02') :
        type === 'DEFENSE' ? 'A03' : type === 'ORDER' ? 'A09' :
        type === 'IMPACT' ? 'A05' : 'D07'
      );
      expect(energy.querySelector('video source[src*="animaciones/banner-"]')).toBeNull();
      expect(energy.querySelector('.dr-cinematic-copy')).toBeNull();
      // Mientras carga el motor, el clip previo se conserva como respaldo.
      if (clips[type]) expect(energy.querySelector('video[src*="' + clips[type] + '"]')).toBeTruthy();
      else expect(energy.querySelector('.dr-cinematic-effect-fallback')).toBeTruthy();
      stop();
    }
  });
  test(`el último decreto ${names[type]} tiene insignia SVG para ambos participantes`, () => {
    const { container } = render(<>
      <LastDecreeIndicator type={type} side="player"/>
      <LastDecreeIndicator type={type} side="opponent"/>
    </>);
    const icons=container.querySelectorAll('.dr-last-decree-icon img.dr-g3-decree-visual');
    expect(Array.from(icons).every(icon => icon.getAttribute('src')?.includes('interfaz/hud-g3/'))).toBe(true);
    expect(icons).toHaveLength(2);
    expect(container.querySelector('[aria-label="Último decreto del jugador: '+names[type]+'"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Último decreto del rival: '+names[type]+'"]')).toBeTruthy();
  });
}

test('indicador ×2/×3 comunica la racha real en ambos lados con su icono', () => {
  const { container }=render(<>
    <LastDecreeIndicator type="ATTACK" comboLevel={2} side="player"/>
    <LastDecreeIndicator type="DEFENSE" comboLevel={3} side="opponent"/>
  </>);
  expect(container.querySelector('[aria-label="Último decreto del jugador: Ataque ×2"]')).toBeTruthy();
  expect(container.querySelector('[aria-label="Último decreto del rival: Defensa ×3"]')).toBeTruthy();
  expect(Array.from(container.querySelectorAll('.dr-last-decree-combo')).map(x=>x.textContent)).toEqual(['×2','×3']);
  expect(container.querySelectorAll('.dr-g3-decree-visual')).toHaveLength(2);
});


test('decreto: una sola cinta WebM sin franja CSS; texto sincronizado con el video', () => {
  const card: CardData = { id:'attack', type:'ATTACK', name:'Decreto de Ataque',
    description:'Inflige 2 daño', cost:0, img:'' };
  const { container }=render(<CardActivationBanner card={card} isPlayer paused={false} />);
  const stage=container.querySelector('.dr-decree-banner')!;
  const video=stage.querySelector('video')!;
  expect(video).toBeTruthy();
  expect(video.hasAttribute('loop')).toBe(false);
  expect(stage.getAttribute('data-decree-video')).toBe('loading');
  expect(stage.classList.contains('is-playing')).toBe(false);
  expect(stage.querySelectorAll('.dr-decree-banner__copy')).toHaveLength(1);
  expect(stage.querySelectorAll('.dr-decree-banner__video')).toHaveLength(1);
  expect(container.querySelector('.dr-cinematic-fallback')).toBeNull();
  expect(container.querySelector('.dr-cinematic-media')).toBeNull();
  fireEvent.playing(video);
  expect(stage.getAttribute('data-decree-video')).toBe('playing');
  expect(stage.classList.contains('is-playing')).toBe(true);
  // Once the first frame was shown, intermittent VP9 buffering must not
  // flash the whole banner and its text off/on (observed on real Android).
  fireEvent.waiting(video);
  fireEvent.waiting(video);
  expect(stage.getAttribute('data-decree-video')).toBe('playing');
  expect(stage.classList.contains('is-playing')).toBe(true);
  expect(stage.querySelector('video')).toBe(video);
  expect(stage.querySelector('.dr-decree-banner__copy')).toBeTruthy();
  fireEvent.playing(video);
  expect(stage.classList.contains('is-playing')).toBe(true);
  fireEvent.error(video);
  expect(stage.querySelector('video')).toBeNull();
  expect(stage.getAttribute('data-decree-video')).toBe('failed');
  expect(stage.classList.contains('is-playing')).toBe(false);
  expect(container.querySelector('.dr-cinematic-fallback')).toBeNull();
});

for (const isPlayer of [true, false]) {
  test(`decreto ${isPlayer ? 'rojo' : 'azul'} permanece estable durante waiting y pausa`, () => {
    const card: CardData = { id:'order', type:'ORDER', name:'Decreto de Orden',
      description:'Roba 1 carta', cost:0, img:'' };
    const { container, rerender } = render(
      <CardActivationBanner card={card} isPlayer={isPlayer} paused={false}/>,
    );
    const stage=container.querySelector('.dr-decree-banner')!;
    const video=stage.querySelector('video')!;
    fireEvent.playing(video);
    expect(stage.classList.contains('is-playing')).toBe(true);
    fireEvent.waiting(video);
    rerender(<CardActivationBanner card={card} isPlayer={isPlayer} paused={true}/>);
    expect(stage.classList.contains('is-playing')).toBe(true);
    expect(stage.querySelector('video')).toBe(video);
    rerender(<CardActivationBanner card={card} isPlayer={isPlayer} paused={false}/>);
    fireEvent.waiting(video);
    expect(stage.classList.contains('is-playing')).toBe(true);
    expect(stage.querySelector('source')?.getAttribute('src')).toContain(
      isPlayer ? 'banner-jugador-rojo.webm' : 'banner-rival-azul.webm',
    );
    expect(container.querySelector('.dr-cinematic-fallback')).toBeNull();
  });
}

test('decreto: effect phase has a fallback and never shows the banner simultaneously', () => {
  const card: CardData = { id:'defense', type:'DEFENSE', name:'Decreto de Defensa',
    description:'Cura 1', cost:0, img:'' };
  const { container }=render(<CardActivationBanner card={card} isPlayer={false} paused={false} stage="effect"/>);
  const video=container.querySelector('video')!;
  expect(video.getAttribute('src')).toContain('efectos/defensa.webm');
  expect(video.hasAttribute('loop')).toBe(false);
  expect(container.querySelector('.dr-fx-g3-host')?.getAttribute('data-fx-id')).toBe('A03');
  expect(container.querySelector('.dr-cinematic-copy')).toBeNull();
  expect(container.querySelectorAll('video')).toHaveLength(1);
  // El clip es el respaldo hasta que el motor local se cargue, no otro efecto simultáneo.
  fireEvent.playing(video);
  expect(container.querySelectorAll('video')).toHaveLength(1);
});

test('combos ×2/×3 usan los efectos Canvas de Claude en las cuatro combinaciones', () => {
  for (const level of [2, 3] as const) {
    for (const ability of ['DAMAGE', 'HEAL'] as const) {
      const { container, unmount } = render(
        <ComboEffectOverlay level={level} ability={ability} isPlayer={false} paused={false} />
      );
      const overlay = container.querySelector('[data-fx-engine="canvas-g3"]');
      expect(overlay?.getAttribute('data-fx-id')).toBe(level === 2 ? 'B05' : 'B06');
      expect(container.querySelector('video')).toBeNull();
      // Durante la carga o un fallo de red la partida conserva su respaldo CSS.
      expect(container.querySelector('.dr-energy-overlay__fallback')).toBeTruthy();
      expect(overlay?.getAttribute('aria-label')).toContain(ability === 'HEAL' ? 'Curación' : 'Ataque');
      unmount();
    }
  }
});

test('pausar un WebM durante su arranque no lo marca como roto', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    () => Promise.reject({name:'AbortError'}),
  );
  const card: CardData = {id:'attack',type:'ATTACK',name:'Decreto de Ataque',
    description:'Daño',cost:0,img:''};
  const {container,rerender}=render(
    <CardActivationBanner card={card} isPlayer={true} paused={false}/>,
  );
  const first=container.querySelector('video');
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(container.querySelector('video')).toBe(first);
  rerender(<CardActivationBanner card={card} isPlayer={true} paused={true}/>);
  expect(container.querySelector('video')).toBeTruthy();
  rerender(<CardActivationBanner card={card} isPlayer={true} paused={false}/>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('video')).toBeTruthy();
  // A pause does not delete the original asset; an actual decoder error does.
  fireEvent.error(container.querySelector('video')!);
  expect(container.querySelector('video')).toBeNull();
});

test('pausar un combo G3 conserva el respaldo CSS y no reactiva vídeos anteriores', async () => {
  const {container,rerender}=render(
    <ComboEffectOverlay level={2} ability="HEAL" isPlayer={true} paused={false}/>,
  );
  await act(async () => { await Promise.resolve(); });
  rerender(<ComboEffectOverlay level={2} ability="HEAL" isPlayer={true} paused={true}/>);
  expect(container.querySelector('.dr-energy-overlay__fallback')).toBeTruthy();
  rerender(<ComboEffectOverlay level={2} ability="HEAL" isPlayer={true} paused={false}/>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('[data-fx-id="B05"]')).toBeTruthy();
  expect(container.querySelector('video')).toBeNull();
});

test('video ambiental del duelo se pausa y reanuda sin cambiar su póster', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('matchMedia', () => ({
    matches:false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const scenery = { poster:'/Decreto-Real/escenarios/plaza-arcilla-estandar.webp',
    video:'/Decreto-Real/escenarios/partida-inicial-loop.mp4' };
  const { container, rerender }=render(<BattleSceneryLayer {...scenery} paused={false}/>);
  expect(play).toHaveBeenCalled();
  const source=container.querySelector('video source')?.getAttribute('src');
  const poster=container.querySelector('img.dr-battle-video-poster')?.getAttribute('src');
  const played=play.mock.calls.length;
  rerender(<BattleSceneryLayer {...scenery} paused/>);
  expect(pause).toHaveBeenCalled();
  expect(play.mock.calls.length).toBe(played);
  rerender(<BattleSceneryLayer {...scenery} paused={false}/>);
  expect(play.mock.calls.length).toBeGreaterThan(played);
  expect(container.querySelector('video source')?.getAttribute('src')).toEqual(source);
  expect(container.querySelector('img.dr-battle-video-poster')?.getAttribute('src')).toEqual(poster);
});

test('pestaña oculta y reducir movimiento suspenden el vídeo sin desmontarlo', () => {
  let hidden=false;
  let reduced=true;
  const mediaChange: Array<() => void>=[];
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.stubGlobal('matchMedia', () => ({
    get matches(){ return reduced; },
    addEventListener: (_event: string, callback: () => void) => mediaChange.push(callback),
    removeEventListener: vi.fn(),
  }));
  const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
  const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
  const {container}=render(<BattleSceneryLayer poster="scene.webp" video="scene.mp4" />);
  expect(pause).toHaveBeenCalled();
  expect(play).not.toHaveBeenCalled();
  reduced=false;
  act(()=>mediaChange.forEach(callback=>callback()));
  expect(play).toHaveBeenCalled();
  hidden=true;
  const stopCount=pause.mock.calls.length;
  act(()=>document.dispatchEvent(new Event('visibilitychange')));
  expect(pause.mock.calls.length).toBeGreaterThan(stopCount);
  expect(container.querySelector('video source')?.getAttribute('src')).toBe('scene.mp4');
});
