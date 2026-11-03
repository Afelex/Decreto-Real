import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import BattleResultScreen from './BattleResultScreen';

/** Final libre: usa el fondo real de la partida y nunca muestra puntuaciones de ejemplo. */
const VictoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useAudio();
  const result = location.state as {
    outcome?: 'VICTORY' | 'DEFEAT';
    turnCount?: number;
    playerHP?: number;
    playerImpactLevel?: number;
  } | null;
  const won = result?.outcome !== 'DEFEAT';

  useEffect(() => {
    playSound(won ? 'VICTORY' : 'DEFEAT');
  }, [won]);

  const count = (value: number | undefined): number | string =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : '—';

  return <BattleResultScreen
    won={won}
    stats={[
      { label: 'Turnos', value: count(result?.turnCount) },
      { label: 'Vida restante', value: count(result?.playerHP) },
      { label: 'Impactos', value: count(result?.playerImpactLevel) },
    ]}
    actions={[
      { label: 'Jugar de nuevo', primary: true, onClick: () => { playSound('CLICK'); navigate('/game'); } },
      { label: 'Menú principal', onClick: () => { playSound('CLICK'); navigate('/'); } },
    ]}
  />;
};

export default VictoryScreen;
