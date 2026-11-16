import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { BattleSceneryLayer } from '../../screens/BattleSceneryLayer';
import { CardActivationBanner } from '../../screens/CardActivationBanner';
import { ComboEffectOverlay } from '../../screens/ComboEffectOverlay';
import { LastDecreeIndicator } from '../../screens/LastDecreeIndicator';
import type { CardData, CardType } from '../../types';

afterEach(cleanup);

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
      expect(container.querySelector('.dr-cinematic-copy')).toBeTruthy();
      expect(container.querySelector('.dr-cinematic-overlay')?.getAttribute('style')).toContain('--dr-cue-duration: 1500ms');
      expect(srcs).toContainEqual(expect.stringContaining(isPlayer ? 'banner-jugador-rojo.webm' : 'banner-rival-azul.webm'));
      // The banner and energy clips must never occupy the same frame.
      expect(srcs).not.toContainEqual(expect.stringContaining('efectos/'));
      unmount();
      if (clips[type]) {
        const { container: energy, unmount: stop } = render(
          <CardActivationBanner card={card} isPlayer={isPlayer} paused={false} stage="effect" />
        );
        const effectSources = Array.from(energy.querySelectorAll('video source')).map(source => source.getAttribute('src') || '');
        expect(effectSources).toContainEqual(expect.stringContaining(clips[type]!));
        expect(effectSources).not.toContainEqual(expect.stringContaining('animaciones/banner-'));
        expect(energy.querySelector('.dr-cinematic-copy')).toBeNull();
        stop();
      }
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


test('decreto: fallback until video plays, restores fallback on buffering or failure', () => {
  const card: CardData = { id:'attack', type:'ATTACK', name:'Decreto de Ataque',
    description:'Inflige 2 daño', cost:0, img:'' };
  const { container }=render(<CardActivationBanner card={card} isPlayer paused={false} />);
  const video=container.querySelector('video')!;
  expect(video).toBeTruthy();
  expect(video.hasAttribute('loop')).toBe(false);
  expect(container.querySelector('.dr-cinematic-fallback')).toBeTruthy();
  expect(video.classList.contains('is-playing')).toBe(false);
  fireEvent.playing(video);
  expect(container.querySelector('.dr-cinematic-fallback')).toBeNull();
  expect(video.classList.contains('is-playing')).toBe(true);
  fireEvent.waiting(video);
  expect(container.querySelector('.dr-cinematic-fallback')).toBeTruthy();
  fireEvent.error(video);
  expect(container.querySelector('video')).toBeNull();
  expect(container.querySelector('.dr-cinematic-fallback')).toBeTruthy();
});

test('decreto: effect phase has a fallback and never shows the banner simultaneously', () => {
  const card: CardData = { id:'defense', type:'DEFENSE', name:'Decreto de Defensa',
    description:'Cura 1', cost:0, img:'' };
  const { container }=render(<CardActivationBanner card={card} isPlayer={false} paused={false} stage="effect"/>);
  const video=container.querySelector('video')!;
  expect(video.querySelector('source')?.getAttribute('src')).toContain('efectos/defensa.webm');
  expect(video.hasAttribute('loop')).toBe(false);
  expect(container.querySelector('.dr-cinematic-effect-fallback')).toBeTruthy();
  expect(container.querySelector('.dr-cinematic-copy')).toBeNull();
  expect(container.querySelectorAll('video')).toHaveLength(1);
  fireEvent.playing(video);
  expect(container.querySelector('.dr-cinematic-effect-fallback')).toBeNull();
});

test('combo: mantiene una sola reproducción y recurso visible si WebM no está listo', () => {
  const { container }=render(<ComboEffectOverlay level={3} ability="DAMAGE" paused={false}/>);
  const video=container.querySelector('video')!;
  expect(video).toBeTruthy();
  expect(video.hasAttribute('loop')).toBe(false);
  expect(container.querySelector('.dr-energy-overlay__fallback')).toBeTruthy();
  fireEvent.playing(video);
  expect(container.querySelector('.dr-energy-overlay__fallback')).toBeNull();
  fireEvent.error(video);
  expect(container.querySelector('video')).toBeNull();
  expect(container.querySelector('.dr-energy-overlay__fallback')).toBeTruthy();
});
