import React from 'react';
import './royal-pause-menu.css';

type Confirmation = 'restart' | 'surrender' | null;

export type RoyalPauseMenuProps = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onSurrender?: () => void;
  onReturn?: () => void;
  onDevWin?: () => void;
};

/** Pausa del tablero clásico. Solo confirma acciones destructivas; no cambia el motor. */
export const RoyalPauseMenu: React.FC<RoyalPauseMenuProps> = ({
  musicEnabled, sfxEnabled, onToggleMusic, onToggleSfx, onClose,
  onRestart, onSurrender, onReturn, onDevWin,
}) => {
  const [confirmation, setConfirmation] = React.useState<Confirmation>(null);
  const modalRef = React.useRef<HTMLElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (confirmation) cancelRef.current?.focus();
    else closeRef.current?.focus();
  }, [confirmation]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmation) setConfirmation(null);
        else onClose();
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const buttons = Array.from(modalRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmation, onClose]);

  const confirmRestart = () => { if (onRestart) onRestart(); };
  const confirmSurrender = () => { if (onSurrender) onSurrender(); };
  const confirmationTitle = confirmation === 'restart' ? '¿Reiniciar partida?' : '¿Deseas rendirte?';
  const confirmationText = confirmation === 'restart'
    ? 'Perderás el progreso actual del duelo y comenzarás una partida nueva desde el sorteo.'
    : 'La batalla terminará y se contará como derrota.';

  return (
    <div className="dr-pause-backdrop" data-testid="royal-pause-menu">
      <section ref={modalRef}
        className={`dr-pause-panel${confirmation ? ' dr-pause-panel--confirm' : ''}`}
        role={confirmation ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="dr-pause-title"
        aria-describedby={confirmation ? 'dr-pause-confirm-description' : undefined}>
        <div className="dr-pause-panel__inner">
          <button ref={closeRef} type="button" className="dr-pause-close"
            onClick={onClose} aria-label="Cerrar menú de pausa">
            <span className="material-icons" aria-hidden="true">close</span>
          </button>

          <header className="dr-pause-header">
            <img src={`${import.meta.env.BASE_URL}moneda/sol.webp`}
              className="dr-pause-emblem" alt="" aria-hidden="true" draggable={false} />
            <span className="dr-pause-eyebrow">DECRETO REAL</span>
            <h2 id="dr-pause-title">{confirmation ? confirmationTitle : 'PAUSA'}</h2>
            <div className="dr-pause-divider" aria-hidden="true"><span>✦</span></div>
            {!confirmation && <p className="dr-pause-subtitle">Menú del duelo</p>}
          </header>

          {confirmation ? (
            <div className="dr-pause-confirm" data-confirmation={confirmation}>
              <p id="dr-pause-confirm-description">{confirmationText}</p>
              <div className="dr-pause-confirm__actions">
                <button ref={cancelRef} type="button"
                  className="dr-pause-action dr-pause-action--cancel"
                  onClick={() => setConfirmation(null)}>CANCELAR</button>
                <button type="button"
                  className={`dr-pause-action ${confirmation === 'restart' ? 'dr-pause-action--restart-confirm' : 'dr-pause-action--surrender-confirm'}`}
                  onClick={confirmation === 'restart' ? confirmRestart : confirmSurrender}>
                  {confirmation === 'restart' ? 'SÍ, REINICIAR' : 'SÍ, RENDIRME'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="dr-pause-settings" aria-label="Ajustes de sonido">
                <div className="dr-pause-setting">
                  <span className="dr-pause-setting__name">
                    <span className="material-icons" aria-hidden="true">music_note</span>Música
                  </span>
                  <button type="button" className="dr-pause-toggle" data-enabled={musicEnabled}
                    aria-label="Música" aria-pressed={musicEnabled}
                    onClick={onToggleMusic}>{musicEnabled ? 'ACTIVADO' : 'APAGADO'}</button>
                </div>
                <div className="dr-pause-setting">
                  <span className="dr-pause-setting__name">
                    <span className="material-icons" aria-hidden="true">volume_up</span>Efectos
                  </span>
                  <button type="button" className="dr-pause-toggle" data-enabled={sfxEnabled}
                    aria-label="Efectos" aria-pressed={sfxEnabled}
                    onClick={onToggleSfx}>{sfxEnabled ? 'ACTIVADO' : 'APAGADO'}</button>
                </div>
              </div>

              <nav className="dr-pause-actions" aria-label="Acciones de la partida">
                <button type="button" className="dr-pause-action dr-pause-action--continue"
                  onClick={onClose}>CONTINUAR BATALLA</button>
                {onRestart && <button type="button" className="dr-pause-action dr-pause-action--restart"
                  onClick={() => setConfirmation('restart')}>REINICIAR PARTIDA</button>}
                {onSurrender && <button type="button" className="dr-pause-action dr-pause-action--surrender"
                  onClick={() => setConfirmation('surrender')}>RENDIRSE</button>}
                {onReturn && <button type="button" className="dr-pause-action dr-pause-action--return"
                  onClick={onReturn}>VOLVER AL MENÚ PRINCIPAL</button>}
                {onDevWin && <button type="button" className="dr-pause-action dr-pause-action--dev"
                  data-testid="dev-auto-win" title="Control de desarrollo"
                  onClick={onDevWin}>⚙ VICTORIA AUTOMÁTICA · DEV</button>}
              </nav>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
