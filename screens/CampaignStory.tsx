import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import { generalForChapter, MAIN_CHARACTERS } from '../campaign/characters.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import './campaign.css';
import './one-screen-ui.css';

/**
 * Pages instead of vertical scrolling. Longer lore is divided into digestible
 * chapters, with large touch controls that remain visible on short phones.
 */
const STORY_TEXTS = [
  { id: 'p1', label: 'Párrafo 1', original: 'Año 16XX. Los Reinos del Perú. Las leyes mantienen el orden y los Sellos Reales guardan una energía mística que solo algunos pueden percibir. La **Orden de la Corona Solar** forma a sus portadores.' },
  { id: 'p2', label: 'Párrafo 2', original: 'Ahora circulan decretos contradictorios que parecen llevar sellos auténticos. Corren rumores de una **Revolución Solar** y de los **solarianos**, pero nadie sabe aún quién está alterando las órdenes.' },
  { id: 'cita', label: 'Cita', original: '«Si las órdenes se contradicen, ¿cuál de los sellos dice la verdad?»' },
] as const;
const STORY_TITLES = ['El reino escucha dos verdades', 'Cuatro destinos, un mismo secreto', 'Ocho generales, ocho decisiones'];

const CampaignStoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const headings = ['La Revolución Solar', 'Personajes', 'Ocho generales'];
  const sceneKey = 'cronica/pagina-' + (page + 1);
  const pageTitle = useStudioTitle(sceneKey, STORY_TITLES[page]);
  const art = useStudioBackground(sceneKey, '');
  return <main className="dc-page dc-full-page dc-story-page dc-prologue">
    <header className="dc-header">
      <button type="button" onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · CRÓNICA</small><h1>El Sello y la Revolución Solar</h1></div>
    </header>
    <nav className="dc-page-tabs" aria-label="Capítulos del prólogo">
      {headings.map((heading, index) => <button key={heading} type="button"
        aria-current={page === index ? 'page' : undefined}
        className={page === index ? 'active' : ''}
        onClick={() => setPage(index)}>{heading}</button>)}
    </nav>
    <article className="dc-full-scene" aria-labelledby="dc-story-paged-title">
      {page === 0 && <>
        <div className="dc-full-art dc-full-art-intro" aria-hidden="true"
          style={art ? { backgroundImage: 'url("' + art + '")', backgroundSize: 'cover' } : undefined}>✥ <span>162X</span></div>
        <span className="dc-scene-label">PERÚ VIRREINAL FICTICIO · AÑO 162X</span>
        {pageTitle !== null && <h2 id="dc-story-paged-title">{pageTitle}</h2>}
        <p><StudioText k={sceneKey + '-p1'} original={STORY_TEXTS[0].original}/></p>
        <p><StudioText k={sceneKey + '-p2'} original={STORY_TEXTS[1].original}/></p>
        <blockquote className="dc-story-quote"><StudioText k={sceneKey + '-cita'} original={STORY_TEXTS[2].original}/></blockquote>
      </>}
      {page === 1 && <>
        <span className="dc-scene-label">PERSONAJES · ELENCO PRINCIPAL</span>
        {pageTitle !== null && <h2 id="dc-story-paged-title">{pageTitle}</h2>}
        <div className="dc-full-cast">
          <div><span>⚔</span><strong>Xervias</strong><small>{MAIN_CHARACTERS.hero.role}. Busca quién cambió las órdenes y protege a las familias.</small></div>
          <div><span>✦</span><strong>Zhinchi</strong><small>{MAIN_CHARACTERS.mentor.role}. Enseña a Xervias a pensar antes de obedecer, pero guarda un secreto.</small></div>
          <div><span>♜</span><strong>Vándalo Rojo</strong><small>{MAIN_CHARACTERS.outlaw.role}. Fue amigo de Xervias, pero ahora ayuda a Sigumán para conseguir poder.</small></div>
          <div><span>♛</span><strong>Sigumán</strong><small>{MAIN_CHARACTERS.antagonist.role}. Ordena falsificar decretos porque cree que solo él puede imponer la paz.</small></div>
        </div>
      </>}
      {page === 2 && <>
        <span className="dc-scene-label">OCHO REGIONES · OCHO GENERALES</span>
        {pageTitle !== null && <h2 id="dc-story-paged-title">{pageTitle}</h2>}
        <div className="dc-general-list dc-full-generals">
          {STORY_CHAPTERS.filter(chapter => chapter.general).map(chapter =>
            <div key={chapter.id}><span className="dc-general-emblem" aria-hidden="true">✥</span><div><strong>{generalForChapter(chapter.id)?.name ?? chapter.general}</strong><small>{chapter.general} · {chapter.region}</small></div></div>)}
        </div>
      </>}
    </article>
    <footer className="dc-page-footer">
      <div className="dc-pagination" aria-label="Navegación entre páginas">
        <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Anterior</button>
        <span>Página {page + 1} de 3</span>
        <button type="button" disabled={page === 2} onClick={() => setPage(p => p + 1)}>Siguiente ›</button>
      </div>
      <button type="button" className="dc-primary" onClick={() => navigate('/campania')}>Ver mapa de campaña →</button>
    </footer>
    <StudioScreenLayers sceneKey={sceneKey}/>
    <StudioScreenPanel label={'Crónica · página ' + (page + 1)} sceneKey={sceneKey} originalTitle={STORY_TITLES[page]}
      texts={page === 0 ? STORY_TEXTS.map(t => ({ key: sceneKey + '-' + t.id, label: t.label, original: t.original })) : []}/>
  </main>;
};

/** Crónica con su capa de autoría de Decreto Real Studio (solo QA). */
const CampaignStory: React.FC = () => <StudioScreenProvider><CampaignStoryScreen/></StudioScreenProvider>;

export default CampaignStory;
