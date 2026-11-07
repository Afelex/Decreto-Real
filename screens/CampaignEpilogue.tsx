import { getCampaignStorage, isCampaignQaActive } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import './campaign.css';
import './one-screen-ui.css';

const EPILOGUE_TITLES = ['El Sello permanece', 'Una promesa inconclusa'];
const EPILOGUE_TEXTS: readonly (readonly { id: string; label: string; original: string }[])[] = [
  [
    { id: 'p1', label: 'Párrafo 1', original: 'Vándalo Rojo ha sido derrotado y capturado. Los documentos originales muestran cómo el Escribano cambió las órdenes. Ahora los afectados pueden contar lo que pasó.' },
    { id: 'p2', label: 'Párrafo 2', original: 'Sigumán, que conocía parte del engaño y aun así lo sostuvo, muere cuando se derrumba la Casa del Sello. La rebelión acaba, pero las familias todavía necesitan recuperar lo perdido.' },
  ],
  [
    { id: 'p1', label: 'Párrafo 1', original: 'Zhinchi desapareció gravemente herido después de salvar a Xervias. Nadie sabe dónde está. Xervias está a salvo, pero no piensa abandonar a su maestro.' },
    { id: 'p2', label: 'Párrafo 2', original: 'En una carta aparece el nombre de San Jerónimo. Zhinchi conocía ese secreto, pero nunca explicó qué significaba. Xervias guarda la carta sin olvidarlo, mientras ayuda al reino a reconstruirse.' },
    { id: 'cita', label: 'Cita', original: '«Ganar un combate no arregla todo. Todavía queda gente a la que debemos ayudar».' },
  ],
];

const CampaignEpilogueScreen: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [page, setPage] = React.useState(() => isCampaignQaActive() && search.get('qaPagina') === '2' ? 1 : 0);
  const finished = React.useMemo(() => {
    try {
      const progress = loadCampaignProgress(getCampaignStorage());
      return CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0);
    } catch { return false; }
  }, []);

  const sceneKey = 'epilogo/pagina-' + (page + 1);
  const pageTitle = useStudioTitle(sceneKey, EPILOGUE_TITLES[page]);
  const art = useStudioBackground(sceneKey, '');
  const texts = EPILOGUE_TEXTS[page].map(t => ({ key: sceneKey + '-' + t.id, label: t.label, original: t.original }));
  if (!finished) return <main className="dc-page dc-center dc-full-page">
    <div className="dc-locked-ending"><span aria-hidden="true">🔒</span><h1>El epílogo sigue sellado</h1>
      <p>Supera las 38 misiones para conocer el desenlace de la historia.</p>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Regresar al mapa</button>
    </div>
  </main>;

  return <main className="dc-page dc-full-page dc-story-page">
    <header className="dc-header">
      <button onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · EPÍLOGO</small><h1>Después de la Revolución Solar</h1></div>
    </header>
    <article className="dc-full-scene dc-ending-scene" aria-labelledby="dc-epilogue-title">
      <div className="dc-full-art dc-full-art-ending" aria-hidden="true"
        style={art ? { backgroundImage: 'url("' + art + '")', backgroundSize: 'cover' } : undefined}>✥</div>
      <span className="dc-scene-label">{page === 0 ? 'LA REVOLUCIÓN SOLAR HA CAÍDO' : 'EL SECRETO PERMANECE'}</span>
      {pageTitle !== null && <h2 id="dc-epilogue-title">{pageTitle}</h2>}
      <p><StudioText k={texts[0].key} original={texts[0].original}/></p>
      <p><StudioText k={texts[1].key} original={texts[1].original}/></p>
      {page === 1 && <>
        <blockquote className="dc-story-quote"><StudioText k={texts[2].key} original={texts[2].original}/></blockquote>
        <strong className="dc-ending-next">FIN</strong>
      </>}
    </article>
    <footer className="dc-page-footer">
      <div className="dc-pagination">
        <button disabled={page === 0} onClick={() => setPage(0)}>‹ Anterior</button>
        <span>Página {page + 1} de 2</span>
        <button disabled={page === 1} onClick={() => setPage(1)}>Siguiente ›</button>
      </div>
      {page === 1 ? <button className="dc-primary" onClick={() => navigate('/campania/creditos')}>Ver créditos ›</button>
        : <button className="dc-primary" onClick={() => navigate('/campania')}>Volver a mi recorrido</button>}
    </footer>
    <StudioScreenLayers sceneKey={sceneKey}/>
    <StudioScreenPanel label={'Epílogo · página ' + (page + 1)} sceneKey={sceneKey} originalTitle={EPILOGUE_TITLES[page]} texts={texts}/>
  </main>;
};

/** Epílogo con su capa de autoría de Decreto Real Studio (solo QA). */
const CampaignEpilogue: React.FC = () => <StudioScreenProvider><CampaignEpilogueScreen/></StudioScreenProvider>;

export default CampaignEpilogue;
