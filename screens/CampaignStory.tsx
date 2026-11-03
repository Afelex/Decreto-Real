import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import { generalForChapter } from '../campaign/characters.ts';
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
        <p>Al amanecer, dos decretos con el mismo sello llegan a un puesto de guardia: uno ordena liberar a los detenidos; el otro, castigarlos. Xervias presencia cómo una firma puede decidir una vida.</p>
        <p>Zhinchi le encomienda investigar, no perseguir culpables a ciegas. Sigumán dirige <strong>la Falsa Luz</strong>, una rebelión que transforma agravios verdaderos en decretos falsos y hace de la obediencia su arma.</p>
        <blockquote className="dc-story-quote">Zhinchi: «Un sello puede ordenar. No puede decidir por tu conciencia. Protege a quienes no tienen voz».</blockquote>
      </>}
      {page === 1 && <>
        <span className="dc-scene-label">PERSONAJES · ELENCO PRINCIPAL</span>
        <h2 id="dc-story-paged-title">Los cuatro protagonistas</h2>
        <div className="dc-full-cast">
          <div><span>⚔</span><strong>Xervias</strong><small>Soldado que deberá elegir entre la obediencia y la justicia.</small></div>
          <div><span>✦</span><strong>Zhinchi</strong><small>El Prototipo Cero; mentor que oculta una promesa ligada a San Jerónimo.</small></div>
          <div><span>♜</span><strong>Vándalo Rojo</strong><small>Antiguo compañero de Xervias; prefirió el poder a sus juramentos.</small></div>
          <div><span>♛</span><strong>Sigumán</strong><small>Antiguo comandante convencido de imponer la paz aunque deba mentir.</small></div>
        </div>
      </>}
      {page === 2 && <>
        <span className="dc-scene-label">OCHO REGIONES · OCHO GENERALES</span>
        <h2 id="dc-story-paged-title">Guardianes del camino</h2>
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
  </main>;
};

export default CampaignStory;
