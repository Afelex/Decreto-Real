import React from 'react';
import type { StorySpeech } from '../campaign/combatDialogues.ts';
import './story-speech.css';

type Props = Readonly<{
  speech: StorySpeech;
  rivalName: string;
  playerPortrait: string;
  rivalPortrait: string;
  step: number;
  total: number;
  onContinue: () => void;
}>;

/** One speech bubble at a time, never scrolling the combat field. */
const StorySpeechPanel: React.FC<Props> = ({
  speech, rivalName, playerPortrait, rivalPortrait, step, total, onContinue,
}) => {
  const isSystem = speech.speaker === 'system';
  const player = speech.speaker === 'player';
  const name = isSystem ? 'CRÓNICA' : player ? 'Xervias' : rivalName;
  const portrait = player ? playerPortrait : rivalPortrait;

  return (
    <div className="dr-story-dialogue-layer" data-testid="story-combat-dialogue">
      <section role="dialog" aria-modal="true" aria-labelledby="dr-story-speaker"
        aria-describedby="dr-story-line" className={`dr-story-dialogue ${isSystem ? 'is-system' : player ? 'is-player' : 'is-rival'}`}>
        <div className="dr-story-dialogue__speaker">
          {!isSystem && <img src={portrait} alt="" draggable={false} />}
          <div>
            <small>{isSystem ? 'COMBATE · HISTORIA' : player ? 'PROTAGONISTA' : 'ADVERSARIO'}</small>
            <h2 id="dr-story-speaker">{name}</h2>
          </div>
        </div>
        <p id="dr-story-line">{speech.text}</p>
        <footer>
          <span aria-label={`Diálogo ${step} de ${total}`}>{step} / {total}</span>
          <button type="button" onClick={onContinue} autoFocus>
            {isSystem ? 'Continuar' : 'Siguiente'} <span aria-hidden="true">›</span>
          </button>
        </footer>
      </section>
    </div>
  );
};

export default StorySpeechPanel;
