import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import BattleResultScreen from './BattleResultScreen';
import { formatBattleDuration } from '../game/battleStats';

/** Final libre: usa el fondo real de la partida y nunca muestra puntuaciones de ejemplo. */
const VictoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound, setMusicScene } = useAudio();
  const result = location.state as {
    outcome?: 'VICTORY' | 'DEFEAT';
    turnCount?: number;
    playerHP?: number;
    playerImpactLevel?: number;
    durationMs?: number;
    healthRecovered?: number;
    damageDealt?: number;
    impactsSummoned?: number;
  } | null;
  const won = result?.outcome !== 'DEFEAT';
  useEffect(() => {
    setMusicScene(won ? 'VICTORY' : 'DEFEAT');
    return () => setMusicScene(null);
  }, [won, setMusicScene]);

  useEffect(() => {
    playSound(won ? 'VICTORY' : 'DEFEAT');
  }, [won]);

  const count = (value: number | undefined): number | string =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : '—';

  return <BattleResultScreen
    won={won}
    stats={[
      { label: 'Turnos', value: count(result?.turnCount) },
      { label: 'Tiempo', value: formatBattleDuration(result?.durationMs) },
      { label: 'Vida recuperada', value: count(result?.healthRecovered) },
      { label: 'Daño realizado', value: count(result?.damageDealt) },
      { label: 'Impactos convocados', value: count(result?.impactsSummoned ?? result?.playerImpactLevel) },
      { label: 'Vida restante', value: count(result?.playerHP) },
    ]}
    actions={[
      { label: 'Jugar de nuevo', primary: true, onClick: () => { playSound('CLICK'); navigate('/game'); } },
      { label: 'Menú principal', onClick: () => { playSound('CLICK'); navigate('/'); } },
    ]}
  />;
};

export default VictoryScreen;
