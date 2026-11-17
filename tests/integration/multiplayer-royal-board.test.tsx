import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MultiplayerBattleBoard } from '../../screens/MultiplayerBattleBoard';

vi.mock('../../contexts/AudioContext', () => ({
  useAudio: () => ({
    musicEnabled:true, sfxEnabled:true,
    toggleMusic:vi.fn(), toggleSfx:vi.fn(), playSound:vi.fn(),
  }),
}));
vi.mock('../../screens/BattleSceneryLayer', () => ({
  BattleSceneryLayer: () => <div data-testid="shared-scenery"/>,
}));
vi.mock('../../screens/ResultCinematicFX', () => ({
  ResultCinematicFX: () => <div data-testid="result-fx"/>,
}));
afterEach(() => cleanup());

const attack = { id:'p0-atk-0', type:'ATTACK' as const };
const defense = { id:'p0-def-0', type:'DEFENSE' as const };
const makeView = () => ({
  revision:1, status:'playing' as 'playing' | 'finished', isMyTurn:true, turnNumber:1,
  pendingCombo:null as 2 | 3 | null, winner:null as 'me' | 'opponent' | 'draw' | null,
  lastEvent:'Comienza el duelo.',
  me:{name:'Alfredo',hp:20,impact:0,connected:true,deckCount:24,hand:[attack,defense],impactThisTurn:false},
  opponent:{name:'Investigador B',hp:20,impact:0,connected:true,deckCount:24,handCount:3},
});
function mount(view = makeView()) {
  const onPlayCard=vi.fn(), onEndTurn=vi.fn(), onCombo=vi.fn();
  const onSurrender=vi.fn(), onNewGame=vi.fn(), onExit=vi.fn();
  render(<MultiplayerBattleBoard view={view} online activeTurn
    cinematicCue={null} onCueEnded={vi.fn()} stats={null}
    drawCues={[]} onDrawFinished={vi.fn()}
    onPlayCard={onPlayCard} onEndTurn={onEndTurn} onCombo={onCombo}
    onSurrender={onSurrender} onNewGame={onNewGame} onExit={onExit}/>);
  return {onPlayCard,onEndTurn,onCombo,onSurrender,onNewGame,onExit};
}
test('el tablero PvP reutiliza las dos fichas, losas, escenario y cartas IA', () => {
  const {onPlayCard,onEndTurn}=mount();
  expect(screen.getByTestId('shared-scenery')).toBeTruthy();
  expect(document.querySelectorAll('.dr-royal-character-frame')).toHaveLength(2);
  expect(document.querySelectorAll('.dr-royal-deck-back')).toHaveLength(2);
  expect(document.querySelectorAll('.dr-royal-rival-progress-slot')).toHaveLength(4);
  expect(document.querySelectorAll('.dr-royal-impact-slot')).toHaveLength(4);
  expect(document.querySelectorAll('.dr-royal-facedown')).toHaveLength(3);
  expect(document.querySelectorAll('.dr-royal-hand-card')).toHaveLength(2);
  expect(screen.getByLabelText('Terminar turno').getAttribute('data-art-version')).toBe('hud-g3');
  fireEvent.click(screen.getByLabelText('Seleccionar Decreto de Ataque'), {detail:0});
  fireEvent.click(screen.getByLabelText('Activar decreto seleccionado en el campo'));
  expect(onPlayCard).toHaveBeenCalledWith(attack);
  fireEvent.click(screen.getByLabelText('Terminar turno'));
  expect(onEndTurn).toHaveBeenCalledOnce();
});
test('combo confirmado abre el panel de IA y no altera acciones pendientes', () => {
  const view=makeView(); view.pendingCombo=3;
  const {onCombo,onPlayCard}=mount(view);
  expect(screen.getByText('Combo ×3')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Gracia Divina/i}));
  expect(onCombo).toHaveBeenCalledWith('HEAL');
  expect(onPlayCard).not.toHaveBeenCalled();
});
test('resultado PvP usa la misma pantalla de estadisticas de IA', () => {
  const view=makeView(); view.status='finished'; view.winner='me'; view.turnNumber=23;
  const {onNewGame}=mount(view);
  expect(screen.getByTestId('result-fx')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(document.querySelector('.dr-result-screen.is-victory')).toBeTruthy();
  const labels=Array.from(document.querySelectorAll('.dr-result-screen__stats dt')).map(n=>n.textContent);
  expect(labels).toEqual(['Turnos','Tiempo','Vida recuperada','Daño realizado','Impactos convocados']);
  fireEvent.click(screen.getByRole('button',{name:'Nueva partida'}));
  expect(onNewGame).toHaveBeenCalledOnce();
});