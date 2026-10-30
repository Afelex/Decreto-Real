import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import './campaign.css';
import './one-screen-ui.css';

/**
 * Pages instead of vertical scrolling. Longer lore is divided into digestible
 * chapters, with large touch controls that remain visible on short phones.
 */
const CampaignStory: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const headings = ['La Falsa Luz', 'Protagonistas', 'Ocho generales'];
  return <main className="dc-page dc-full-page dc-story-page dc-prologue">
    <header className="dc-header">
      <button type="button" onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · CRÓNICA</small><h1>El Sello y la Falsa Luz</h1></div>
    </header>
    <nav className="dc-page-tabs" aria-label="Capítulos del prólogo">
      {headings.map((heading, index) => <button key={heading} type="button"
        aria-current={page === index ? 'page' : undefined}
        className={page === index ? 'active' : ''}
        onClick={() => setPage(index)}>{heading}</button>)}
    </nav>
    <article className="dc-full-scene" aria-labelledby="dc-story-paged-title">
      {page === 0 && <>
        <div className="dc-full-art dc-full-art-intro" aria-hidden="true">✥ <span>162X</span></div>
        <span className="dc-scene-label">PERÚ VIRREINAL FICTICIO · AÑO 162X</span>
        <h2 id="dc-story-paged-title">El reino escucha dos verdades</h2>
        <p>Un joven soldado recibe una misión de Zero: investigar decretos contradictorios y una rebelión alimentada por agravios reales y documentos falsos.</p>
        <p>Detrás de las proclamas aparece <strong>la Falsa Luz</strong>. Sigma promete redención, pero pretende imponer su voluntad. Zero sigue el rastro de la verdad.</p>
        <blockquote className="dc-story-quote">Zero: «Defiende a los inocentes. No confundas un juramento con la verdad».</blockquote>
      </>}
      {page === 1 && <>
        <span className="dc-scene-label">PERSONAJES · NOMBRES PROVISIONALES</span>
        <h2 id="dc-story-paged-title">Los cuatro protagonistas</h2>
        <div className="dc-full-cast">
          <div><span>⚔</span><strong>Tu personaje (X)</strong><small>Joven soldado que busca la verdad y protege a los inocentes.</small></div>
          <div><span>✦</span><strong>Zero</strong><small>Capitán y mentor; conoce el secreto de San Jerónimo.</small></div>
          <div><span>♜</span><strong>Vile</strong><small>Excompañero brutal, aliado de Sigma por ambición.</small></div>
          <div><span>♛</span><strong>Sigma</strong><small>Antiguo comandante, falso redentor de la Falsa Luz.</small></div>
        </div>
      </>}
      {page === 2 && <>
        <span className="dc-scene-label">OCHO REGIONES · OCHO GENERALES</span>
        <h2 id="dc-story-paged-title">Guardianes del camino</h2>
        <div className="dc-general-list dc-full-generals">
          {STORY_CHAPTERS.filter(chapter => chapter.general).map(chapter =>
            <div key={chapter.id}><span className="dc-general-emblem" aria-hidden="true">✥</span><div><strong>{chapter.general}</strong><small>{chapter.region}</small></div></div>)}
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
  </main>;
};

export default CampaignStory;
