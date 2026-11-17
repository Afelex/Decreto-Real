import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useOptionalAudio } from '../../contexts/AudioContext';
import MainMenu from '../../screens/MainMenu';

vi.mock('../../contexts/AudioContext', () => ({
  useOptionalAudio: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openMenu(overrides: { musicEnabled?: boolean; musicGestureRequired?: boolean } = {}) {
  const audio = {
    musicEnabled: true,
    musicGestureRequired: false,
    toggleMusic: vi.fn(),
    unlockMusic: vi.fn(),
    setMusicScene: vi.fn(),
    ...overrides,
  };
  vi.mocked(useOptionalAudio).mockReturnValue(
    audio as unknown as NonNullable<ReturnType<typeof useOptionalAudio>>
  );
  render(<MemoryRouter><MainMenu /></MemoryRouter>);
  return audio;
}

test('music is on by default and the menu uses the existing G3 speaker image', () => {
  const audio = openMenu();
  expect(screen.queryByText('Activar música')).toBeNull();
  const toggle = screen.getByRole('button', { name: 'Silenciar música' });
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(toggle.querySelector('img')?.getAttribute('src')).toContain('sonido_activado.webp');
  fireEvent.click(toggle);
  expect(audio.toggleMusic).toHaveBeenCalledTimes(1);
  expect(audio.unlockMusic).not.toHaveBeenCalled();
});

test('blocked autoplay offers a small muted icon and unlocks on its click', () => {
  const audio = openMenu({ musicGestureRequired: true });
  expect(screen.queryByText('Activar música')).toBeNull();
  const toggle = screen.getByRole('button', { name: 'Reproducir música' });
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(toggle.querySelector('img')?.getAttribute('src')).toContain('sonido_silenciado.webp');
  fireEvent.click(toggle);
  expect(audio.unlockMusic).toHaveBeenCalledTimes(1);
  expect(audio.toggleMusic).not.toHaveBeenCalled();
});

test('the player can unmute without a large activation prompt', () => {
  const audio = openMenu({ musicEnabled: false });
  const toggle = screen.getByRole('button', { name: 'Encender música' });
  expect(toggle.querySelector('img')?.getAttribute('src')).toContain('sonido_silenciado.webp');
  fireEvent.click(toggle);
  expect(audio.toggleMusic).toHaveBeenCalledTimes(1);
});
