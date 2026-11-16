import React from 'react';
import { useLocation } from 'react-router-dom';
import { preloadMainMenu, type MenuStartupProgress } from '../game/mainMenuStartup';

/** This overlay is deliberately limited to the first visit to the HOME route.
 * Direct /game, /campania and /studio links keep their existing lazy routing.
 * Returning to the menu never forces a second startup download. */
export function InitialLoadingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = React.useState(() => location.pathname !== '/');
  const [attempt, setAttempt] = React.useState(0);
  const [progress, setProgress] = React.useState<MenuStartupProgress>({
    completed: 0, total: 1, label: 'Preparando Decreto Real',
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (ready || location.pathname !== '/') return;
    const controller = new AbortController();
    setError(null);
    void preloadMainMenu({
      signal: controller.signal,
      onProgress: next => {
        if (!controller.signal.aborted) setProgress(next);
      },
    }).then(async () => {
      if (controller.signal.aborted) return;
      // Briefly paint the verified 100% before revealing the full-screen menu.
      await new Promise<void>(resolve => window.setTimeout(resolve, 80));
      if (!controller.signal.aborted) setReady(true);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los recursos');
      }
    });
    return () => controller.abort();
  }, [ready, attempt, location.pathname]);

  if (ready || location.pathname !== '/') return <>{children}</>;
  const percent = Math.floor(100 * progress.completed / Math.max(1, progress.total));

  return <main className="dr-initial-boot" data-testid="initial-loading-screen"
    aria-label="Cargando Decreto Real">
    <div className="dr-initial-boot__content">
      <img className="dr-initial-boot__logo"
        src={`${import.meta.env.BASE_URL}portada/decreto-real-logo.png`}
        alt="Decreto Real" draggable={false} />
      <div className="dr-initial-boot__progress" role="progressbar"
        aria-label="Preparación del menú principal"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span className="dr-initial-boot__fill" style={{ width: percent + '%' }} />
        <strong className="dr-initial-boot__percent">{percent}%</strong>
      </div>
      <span className="dr-initial-boot__sr-only" role="status" aria-live="polite">
        {error ?? (percent === 100 ? 'Menú preparado' : progress.label)}
      </span>
      {error && <div className="dr-initial-boot__failure" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => {
          setProgress({ completed: 0, total: 1, label: 'Reintentando' });
          setAttempt(previous => previous + 1);
        }}>Reintentar</button>
      </div>}
    </div>
  </main>;
}
