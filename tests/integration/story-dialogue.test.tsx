import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StoryDialogue, { dialoguePages, nameplateFor } from '../../screens/StoryDialogue';

afterEach(cleanup);

test('long prose is paginated without losing or duplicating words',()=>{
  const words='Virreinato del Perú, siglo XVII. El Sello Real da autoridad a las órdenes de la Corona. Pero han aparecido decretos contradictorios: unos liberan a familias y otros ordenan encarcelarlas. Todos llevan el mismo sello. ¿Quién está cambiando las órdenes?';
  const pages=dialoguePages(words);
  expect(pages.length).toBeGreaterThan(1);
  expect(pages.join(' ').replace(/\s+/g,' ')).toBe(words);
  for(const page of pages)expect(page.length).toBeLessThanOrEqual(150);
});
test('nameplates reflect story roles rather than automatically assigning every guard blue',()=>{
  expect(nameplateFor('Xervias')).toBe('player');
  expect(nameplateFor('Zhinchi')).toBe('authority');
  expect(nameplateFor('Domingo Quispe')).toBe('neutral');
  expect(nameplateFor('Madre')).toBe('neutral');
  expect(nameplateFor('Crónica')).toBe('system');
});
test('dialogue advances within a long speech before changing story beat',()=>{
  const onAdvance=vi.fn();
  const text='Uno '.repeat(80).trim();
  render(<StoryDialogue beatKey="a" sceneTitle="Una orden inesperada" speaker="Madre" text={text}
    tone="character" progress="ESCENA 2/18" onAdvance={onAdvance}/>);
  expect(screen.getByRole('heading',{name:'Una orden inesperada'})).toBeTruthy();
  expect(screen.getByLabelText('Habla Madre')).toBeTruthy();
  const button=screen.getByRole('button',{name:'Continuar diálogo'});
  fireEvent.click(button);
  expect(onAdvance).not.toHaveBeenCalled();
  for(let i=1;i<dialoguePages(text).length-1;i++) fireEvent.click(screen.getByRole('button',{name:/Continuar/}));
  expect(onAdvance).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(onAdvance).toHaveBeenCalledOnce();
});
test('narrator and thoughts are semantically distinct without portraits in the dialog panel',()=>{
  const {rerender,container}=render(<StoryDialogue beatKey="n" sceneTitle="El misterio del Sello Real"
    speaker="Crónica" text="Un sello falso." tone="narrator" progress="ESCENA 1/18" onAdvance={()=>{}}/>);
  expect(container.querySelector('.dcop-dialog-narrator')).toBeTruthy();
  expect(container.querySelector('.dcop-dialog-box img')).toBeNull();
  rerender(<StoryDialogue beatKey="p" sceneTitle="El misterio continúa"
    speaker="Xervias" text="¿Quién estará detrás?" tone="thought" progress="ESCENA 18/18" onAdvance={()=>{}}/>);
  expect(container.querySelector('.dcop-dialog-thought')).toBeTruthy();
  expect(screen.getByText('Xervias · Pensamiento')).toBeTruthy();
});
