import { getCampaignStorage, isCampaignQaActive } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import './campaign.css';
import './one-screen-ui.css';

/**
 * Desenlace cerrado, inspirado en la sensación contemplativa de una aventura
 * terminada: Xervias camina SOLO. La muerte de Zhinchi nunca se confirma y
 * NO hay escena posterior de reencuentro ni anuncio de otra entrega.
 * Cada página y cada párrafo tienen claves estables editables desde DRStudio.
 */
export const EPILOGUE_TITLES = [
  'La verdad recuperada',
  'Un camino en silencio',
  'Lo que aprendí',
  'Seguiré adelante',
] as const;

export const EPILOGUE_TEXTS: readonly (readonly { id: string; label: string; original: string }[])[] = [
  [
    { id: 'p1', label: 'Narración · la conspiración', original: 'Las pruebas reunidas en las ocho regiones demostraron cómo Leocadio manipuló los sellos místicos por orden de Sigumán. El comandante fue derrotado y quedó bajo custodia.' },
    { id: 'p2', label: 'Narración · reconstrucción', original: 'Los decretos falsificados fueron retirados. Los habitantes de Los Reinos del Perú comenzaron a reconstruir sus hogares y a recuperar su confianza. La paz necesitaría tiempo y esfuerzo.' },
  ],
  [
    { id: 'p1', label: 'Narración · camino', original: 'Días después, Xervias camina solo por un sendero, lejos de la ciudad. A lo lejos se escucha el viento entre las montañas.' },
    { id: 'p2', label: 'Narración · ausencia', original: 'Nadie ha podido confirmar qué ocurrió con Zhinchi tras el derrumbe. Xervias recuerda el instante en que su capitán lo salvó y se quedó atrás.' },
  ],
  [
    { id: 'p1', label: 'Pensamiento · primera decisión', original: 'Todo comenzó con una orden que no parecía correcta. Solo quería ayudar a aquella familia. Nunca imaginé todo lo que descubriría.' },
    { id: 'p2', label: 'Pensamiento · generales', original: 'Algunos luchaban por ambición, otros por miedo. Muchos creían estar haciendo lo correcto. Aprendí que ser fuerte también significa escuchar y comprender.' },
    { id: 'cita', label: 'Recuerdo · Zhinchi', original: 'Capitán Zhinchi... No sé qué fue de usted. Pero nunca olvidaré lo que me enseñó.' },
  ],
  [
    { id: 'p1', label: 'Narración · horizonte', original: 'Xervias se detiene, observa su anillo y vuelve a caminar. La cámara se aleja mientras el sol ilumina los caminos de los Reinos del Perú.' },
    { id: 'p2', label: 'Pensamiento · decisión', original: 'Sigumán ha sido derrotado, pero todavía habrá personas que necesiten ayuda. No puedo resolver todos los problemas de este mundo...' },
    { id: 'cita', label: 'Últimas palabras · Xervias', original: 'Pero mientras tenga fuerzas para hacerlo... seguiré adelante.' },
  ],
];

const CampaignEpilogueScreen: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [page, setPage] = React.useState(() => {
    const requested = Number(search.get('qaPagina'));
    return isCampaignQaActive() && Number.isInteger(requested) && requested >= 1
      ? Math.min(requested - 1, EPILOGUE_TITLES.length - 1) : 0;
  });
  const finished = React.useMemo(() => {
    try {
      const progress = loadCampaignProgress(getCampaignStorage());
      return CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0);
    } catch { return false; }
  }, []);
  const sceneKey = 'epilogo/pagina-' + (page + 1);
  const pageTitle = useStudioTitle(sceneKey, EPILOGUE_TITLES[page]);
  const art = useStudioBackground(sceneKey,
    page === 0 ? './portada/portada-poster.jpg' : './campania/epilogo-camino.svg');
  const texts = EPILOGUE_TEXTS[page].map(t => ({ key: sceneKey + '-' + t.id, label: t.label, original: t.original }));
  const isLast = page === EPILOGUE_TITLES.length - 1;
  if (!finished) return <main className="dc-page dc-center dc-full-page">
    <div className="dc-locked-ending"><span aria-hidden="true">🔒</span><h1>El epílogo sigue sellado</h1>
      <p>Supera las 38 misiones para conocer el desenlace de la historia.</p>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Regresar al mapa</button>
    </div>
  </main>;

  return <main className="dc-page dc-full-page dc-story-page" aria-label="Epílogo de Decreto Real">
    <header className="dc-header">
      <button onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL · EPÍLOGO</small><h1>Después de la Revolución Solar</h1></div>
    </header>
    <article className="dc-full-scene dc-ending-scene" aria-labelledby="dc-epilogue-title">
      <div className="dc-full-art dc-full-art-ending" aria-hidden="true"
        style={art ? { backgroundImage: 'url("' + art + '")', backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}/>
      <span className="dc-scene-label">{page === 0 ? 'LOS REINOS DEL PERÚ · AÑO 16XX' : 'EL CAMINO DE XERVIAS'}</span>
      {pageTitle !== null && <h2 id="dc-epilogue-title">{pageTitle}</h2>}
      {texts.map(text => text.id === sceneKey + '-cita'
        ? <blockquote key={text.key} className="dc-story-quote"><StudioText k={text.key} original={text.original}/></blockquote>
        : <p key={text.key}><StudioText k={text.key} original={text.original}/></p>)}
      {isLast && <strong className="dc-ending-next">FIN</strong>}
    </article>
    <footer className="dc-page-footer">
      <div className="dc-pagination">
        <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>‹ Anterior</button>
        <span>Página {page + 1} de {EPILOGUE_TITLES.length}</span>
        <button disabled={isLast} onClick={() => setPage(p => Math.min(EPILOGUE_TITLES.length - 1, p + 1))}>Siguiente ›</button>
      </div>
      <button className="dc-primary" onClick={() => isLast
        ? navigate('/campania/creditos') : setPage(p => p + 1)}>
        {isLast ? 'Ver créditos ›' : 'Continuar historia ›'}
      </button>
    </footer>
    <StudioScreenLayers sceneKey={sceneKey}/>
    <StudioScreenPanel label={'Epílogo · página ' + (page + 1)} sceneKey={sceneKey} originalTitle={EPILOGUE_TITLES[page]} texts={texts}/>
  </main>;
};

const CampaignEpilogue: React.FC = () => <StudioScreenProvider><CampaignEpilogueScreen/></StudioScreenProvider>;
export default CampaignEpilogue;
