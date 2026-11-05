import { getCampaignStorage } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './campaign-intro.css';

export const CAMPAIGN_INTRO_KEY = 'decreto-real.campania.introduccion.v1';

/** The three-paragraph premise is displayed once; the player can replay it at /campania/inicio. */
const CampaignIntro: React.FC = () => {
  const navigate = useNavigate();
  const continueToPrologue = () => {
    try { getCampaignStorage()?.setItem(CAMPAIGN_INTRO_KEY, '1'); } catch { /* private browsing */ }
    navigate('/campania');
  };

  return <main className="dci-screen" aria-label="Introducción a la campaña">
    <div className="dci-stage">
      <div className="dci-landscape" role="img" aria-label="Fortaleza andina al amanecer">
        <img src="./portada/portada-poster.jpg" alt="" draggable={false} />
        <div className="dci-sky-shade" />
        <div className="dci-landscape-title">
          <small>DECRETO REAL · CAMPAÑA</small>
          <h1>El Sello y la Revolución Solar</h1>
        </div>
      </div>
      <article className="dci-story">
        <span className="dci-kicker">ANTES DE COMENZAR</span>
        <h2>El reino escucha dos verdades</h2>
        <p>En el Virreinato del Perú, durante un siglo XVII ficticio, el Sello Real da validez a las órdenes del reino. Pero han aparecido decretos contradictorios: unos liberan familias y otros las condenan usando exactamente el mismo sello.</p>
        <p>Xervias, joven guerrero de la Orden de la Corona Solar, debe descubrir quién está alterando las órdenes. Su mentor Zhinchi lo acompaña y le recuerda que obedecer no siempre significa hacer lo correcto.</p>
        <p>Tras los falsos decretos se esconde la Revolución Solar de Sigumán. Antes de enfrentar a sus ocho generales, Xervias deberá resolver dos misiones y seguir las primeras pistas de la conspiración.</p>
      </article>
      <footer className="dci-actions">
        <button type="button" className="dci-menu" onClick={() => navigate('/')}>⌂ Volver al Menú</button>
        <button type="button" className="dci-continue" onClick={continueToPrologue}>Continuar al prólogo ›</button>
      </footer>
    </div>
  </main>;
};

export default CampaignIntro;
