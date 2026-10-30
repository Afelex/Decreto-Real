import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import './campaign.css';

/** Narrative prologue only. No battle rules or cards are altered. */
const CampaignStory: React.FC = () => {
  const navigate = useNavigate();
  return <main className="dc-page dc-story-page">
    <header className="dc-header">
      <button onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · CRÓNICA</small><h1>El Sello y la Falsa Luz</h1></div>
    </header>
    <article className="dc-story-scene" aria-labelledby="dc-intro-title">
      <div className="dc-story-art dc-intro-art" aria-hidden="true"><div className="dc-story-sun">✥</div><span>♛</span></div>
      <span className="dc-scene-label">PERÚ VIRREINAL FICTICIO · AÑO 162X</span>
      <h2 id="dc-intro-title">El reino escucha dos verdades</h2>
      <p className="dc-scene-narration">Un soldado joven, a las órdenes de su capitán Zero, descubre decretos incompatibles y rumores que se propagan por el reino. Las injusticias son reales; las proclamas que prometen resolverlas, no siempre.</p>
      <p className="dc-scene-narration">Detrás de la rebelión crece una fuerza llamada <b>la Falsa Luz</b>. Sigma, antiguo comandante de honor, se presenta como redentor. Su antiguo compañero Zero busca la verdad. Vile, un guerrero brutal, ha elegido el poder por encima de la causa.</p>
      <blockquote className="dc-story-quote">Zero: «Defiende a los inocentes. No confundas un juramento con la verdad».</blockquote>
      <div className="dc-story-cast" aria-label="Personajes principales">
        <div><span aria-hidden="true">⚔</span><strong>Tu personaje (X)</strong><small>Soldado joven y compasivo; el nombre X es provisional</small></div>
        <div><span aria-hidden="true">✦</span><strong>Zero</strong><small>Capitán y mentor, guardián de un secreto de San Jerónimo</small></div>
        <div><span aria-hidden="true">♜</span><strong>Vile</strong><small>Antiguo camarada, armado y despiadado; persigue el poder</small></div>
        <div><span aria-hidden="true">♛</span><strong>Sigma</strong><small>Excomandante que utilizará la Falsa Luz para imponer su voluntad</small></div>
      </div>
      <h3>Ocho generales vigilan el camino</h3>
      <div className="dc-general-list">
        {STORY_CHAPTERS.filter(chapter => chapter.general).map(chapter =>
          <div key={chapter.id}><span className="dc-general-emblem">✥</span><div><strong>{chapter.general}</strong><small>{chapter.region}</small></div></div>,
        )}
      </div>
      <p className="dc-note">La campaña consta de 38 desafíos. Las ocho cartas especiales de generales figuran en la crónica, pero todavía no están disponibles como efectos jugables. Los nombres X, Zero, Vile y Sigma son provisionales.</p>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Ver el mapa de campaña →</button>
    </article>
  </main>;
};

export default CampaignStory;
