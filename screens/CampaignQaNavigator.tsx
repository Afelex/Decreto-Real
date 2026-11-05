import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  QA_CAMPAIGN_DESTINATIONS, QA_CAMPAIGN_GROUPS,
  isCampaignQaActive, isCampaignQaAvailable,
  startCampaignQaAt, stopCampaignQa, type QaDestination,
} from '../campaign/campaignQA.ts';
import './campaign-qa.css';

const CampaignQaNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const activeRoute = location.pathname + location.search;
  const activeIndex = QA_CAMPAIGN_DESTINATIONS.findIndex(item => item.path === activeRoute);
  const [group, setGroup] = React.useState(() => QA_CAMPAIGN_DESTINATIONS[activeIndex]?.group ?? QA_CAMPAIGN_GROUPS[0]);
  const available = isCampaignQaAvailable();
  const previewActive = isCampaignQaActive();

  React.useEffect(() => {
    if (activeIndex >= 0) setGroup(QA_CAMPAIGN_DESTINATIONS[activeIndex].group);
  }, [activeIndex]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!available) return null;
  const launch = (destination: QaDestination) => {
    if (!startCampaignQaAt(destination)) return;
    setOpen(false);
    navigate(destination.path);
  };
  const step = (delta: number) => {
    const current = activeIndex < 0 ? 0 : activeIndex;
    const next = Math.max(0, Math.min(QA_CAMPAIGN_DESTINATIONS.length - 1, current + delta));
    launch(QA_CAMPAIGN_DESTINATIONS[next]);
  };
  const stop = () => {
    stopCampaignQa();
    setOpen(false);
    navigate('/');
  };

  return <aside className="dr-qa" data-testid="campaign-qa" aria-label="Herramientas de desarrollo de campaña">
    <button type="button" className="dr-qa-trigger" onClick={() => setOpen(value => !value)}
      aria-expanded={open} aria-controls="dr-qa-panel" data-testid="campaign-qa-toggle">
      <span aria-hidden="true">⚙</span> QA · Historia {previewActive ? '●' : ''}
    </button>
    {open && <div className="dr-qa-panel" id="dr-qa-panel" role="dialog" aria-label="Navegador de campaña de pruebas">
      <header className="dr-qa-header">
        <div><small>SOLO DESARROLLO</small><strong>Inspección de pantallas</strong></div>
        <button type="button" className="dr-qa-close" aria-label="Cerrar panel" onClick={() => setOpen(false)}>×</button>
      </header>
      <p className="dr-qa-help">Puedes saltar a escenas, capítulos, jefes y créditos sin completar las misiones. El progreso de prueba es temporal y no cambia tu partida guardada.</p>
      <div className="dr-qa-steps" role="group" aria-label="Avanzar entre pantallas">
        <button type="button" onClick={() => launch(QA_CAMPAIGN_DESTINATIONS[0])}>⟲ Desde el inicio</button>
        <button type="button" onClick={() => step(-1)} disabled={activeIndex === 0}>‹ Anterior</button>
        <button type="button" onClick={() => step(1)} disabled={activeIndex === QA_CAMPAIGN_DESTINATIONS.length - 1}>Siguiente ›</button>
      </div>
      <label className="dr-qa-label" htmlFor="dr-qa-chapter">Capítulo o sección</label>
      <select id="dr-qa-chapter" value={group} onChange={e => setGroup(e.target.value)}>
        {QA_CAMPAIGN_GROUPS.map(name => <option value={name} key={name}>{name}</option>)}
      </select>
      <div className="dr-qa-targets" role="group" aria-label="Pantallas disponibles">
        {QA_CAMPAIGN_DESTINATIONS.filter(item => item.group === group).map(item =>
          <button type="button" key={item.id} onClick={() => launch(item)}
            aria-current={item.path === activeRoute ? 'page' : undefined}
            className={item.path === activeRoute ? 'dr-qa-current' : ''}>{item.label}</button>)}
      </div>
      <footer className="dr-qa-footer">
        <span>Escenas disponibles: {QA_CAMPAIGN_DESTINATIONS.length}</span>
        <button type="button" onClick={stop}>Salir de prueba · Partida real</button>
      </footer>
    </div>}
  </aside>;
};
export default CampaignQaNavigator;
