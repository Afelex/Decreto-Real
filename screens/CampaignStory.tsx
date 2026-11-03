import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import { generalForChapter, MAIN_CHARACTERS } from '../campaign/characters.ts';
import './campaign.css';
import './one-screen-ui.css';

/**
 * Pages instead of vertical scrolling. Longer lore is divided into digestible
 * chapters, with large touch controls that remain visible on short phones.
 */
const CampaignStory: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const headings = ['La Revolución Solar', 'Personajes', 'Ocho generales'];
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
        <div className="dc-full-art dc-full-art-intro" aria-hidden="true">✥ <span>162X</span></div>
        <span className="dc-scene-label">PERÚ VIRREINAL FICTICIO · AÑO 162X</span>
        <h2 id="dc-story-paged-title">El reino escucha dos verdades</h2>
        <p>Xervias sirve a la <strong>Orden de la Corona Solar</strong>. Tras su consagración, recibió un anillo que canaliza las cartas en un combate llamado Decreto Real.</p>
        <p>Dos órdenes con el mismo sello se contradicen: una libera familias y otra las arresta. Sigumán, excomandante, dirige la <strong>Revolución Solar</strong>; sus seguidores, los <strong>solarianos</strong>, difunden decretos falsos.</p>
        <blockquote className="dc-story-quote">Zhinchi: «Investiga antes de obedecer. ¿Quién alteró el sello?»</blockquote>
      </>}
      {page === 1 && <>
        <span className="dc-scene-label">PERSONAJES · ELENCO PRINCIPAL</span>
        <h2 id="dc-story-paged-title">Cuatro destinos, un mismo secreto</h2>
        <div className="dc-full-cast">
          <div><span>⚔</span><strong>Xervias</strong><small>{MAIN_CHARACTERS.hero.role}. Busca quién cambió las órdenes y protege a las familias.</small></div>
          <div><span>✦</span><strong>Zhinchi</strong><small>{MAIN_CHARACTERS.mentor.role}. Enseña a Xervias a pensar antes de obedecer, pero guarda un secreto.</small></div>
          <div><span>♜</span><strong>Vándalo Rojo</strong><small>{MAIN_CHARACTERS.outlaw.role}. Fue amigo de Xervias, pero ahora ayuda a Sigumán para conseguir poder.</small></div>
          <div><span>♛</span><strong>Sigumán</strong><small>{MAIN_CHARACTERS.antagonist.role}. Ordena falsificar decretos porque cree que solo él puede imponer la paz.</small></div>
        </div>
      </>}
      {page === 2 && <>
        <span className="dc-scene-label">OCHO REGIONES · OCHO GENERALES</span>
        <h2 id="dc-story-paged-title">Ocho generales, ocho decisiones</h2>
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
