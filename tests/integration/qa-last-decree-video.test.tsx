import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { BattleSceneryLayer } from '../../screens/BattleSceneryLayer';
import { CardActivationBanner } from '../../screens/CardActivationBanner';
import { LastDecreeIndicator } from '../../screens/LastDecreeIndicator';
import type { CardData, CardType } from '../../types';

afterEach(cleanup);

test('duelo estándar: solo vídeo sin imagen clay, poster ni viñeta', () => {
  const { container } = render(<BattleSceneryLayer
    poster="/Decreto-Real/escenarios/plaza-arcilla-estandar.webp"
    video="/Decreto-Real/escenarios/partida-inicial-loop.mp4" />);
  expect(container.querySelector('[data-scenery-mode="video-only"]')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('.dr-royal-vignette')).toBeNull();
  const video = container.querySelector('video')!;
  expect(video).toBeTruthy();
  expect(video.getAttribute('poster')).toBeNull();
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
      expect(container.querySelector('.dr-cinematic-overlay')?.getAttribute('style')).toContain('--dr-cue-duration: 1000ms');
      expect(srcs).toContainEqual(expect.stringContaining(isPlayer ? 'banner-jugador-rojo.webm' : 'banner-rival-azul.webm'));
      if (clips[type]) expect(srcs).toContainEqual(expect.stringContaining(clips[type]!));
      unmount();
    }
  });
  test(`el último decreto ${names[type]} tiene insignia SVG para ambos participantes`, () => {
    const { container } = render(<>
      <LastDecreeIndicator type={type} side="player"/>
      <LastDecreeIndicator type={type} side="opponent"/>
    </>);
    const icons=container.querySelectorAll('.dr-last-decree-icon svg');
    expect(icons).toHaveLength(2);
    expect(container.querySelector('[aria-label="Último decreto del jugador: '+names[type]+'"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Último decreto del rival: '+names[type]+'"]')).toBeTruthy();
  });
}
