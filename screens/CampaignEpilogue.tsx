import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import './campaign.css';
import './one-screen-ui.css';

const CampaignEpilogue: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const finished = React.useMemo(() => {
    try {
      const progress = loadCampaignProgress(window.localStorage);
      return CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0);
    } catch { return false; }
  }, []);

  if (!finished) return <main className="dc-page dc-center dc-full-page">
    <div className="dc-locked-ending"><span aria-hidden="true">🔒</span><h1>El epílogo sigue sellado</h1>
      <p>Supera las 38 misiones para conocer el desenlace de la historia.</p>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Regresar al mapa</button>
    </div>
  </main>;

  return <main className="dc-page dc-full-page dc-story-page">
    <header className="dc-header">
      <button onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · EPÍLOGO</small><h1>Después de la Falsa Luz</h1></div>
    </header>
    <article className="dc-full-scene dc-ending-scene" aria-labelledby="dc-epilogue-title">
      <div className="dc-full-art dc-full-art-ending" aria-hidden="true">✥</div>
      <span className="dc-scene-label">{page === 0 ? 'FIN DE LA PRIMERA CAMPAÑA' : 'EL SECRETO PERMANECE'}</span>
      <h2 id="dc-epilogue-title">{page === 0 ? 'El Sello permanece' : 'Una promesa inconclusa'}</h2>
      {page === 0 ? <>
        <p>Vándalo Rojo ha sido derrotado y capturado. Los decretos originales y los falsificados vuelven a verse juntos; quienes fueron silenciados pueden al fin declarar.</p>
        <p>Sigumán, que conocía parte del engaño y aun así lo sostuvo, muere durante el derrumbe de la Casa del Sello. Su promesa de paz dejó demasiadas heridas por reparar.</p>
      </> : <>
        <p>La rebelión termina, pero Zhinchi desapareció gravemente herido tras salvar a Xervias. Nadie conoce su destino, y la victoria tiene el peso de una despedida inconclusa.</p>
        <p>Entre los papeles recuperados permanece un nombre: San Jerónimo. Xervias guarda la última promesa de su mentor; todavía hay una verdad que encontrar.</p>
        <blockquote className="dc-story-quote">«No basta derribar una mentira. Hay que reparar el daño que dejó y buscar a quienes faltan».</blockquote>
        <strong className="dc-ending-next">CONTINUARÁ EN DECRETO REAL II</strong>
      </>}
    </article>
    <footer className="dc-page-footer">
      <div className="dc-pagination">
        <button disabled={page === 0} onClick={() => setPage(0)}>‹ Anterior</button>
        <span>Página {page + 1} de 2</span>
        <button disabled={page === 1} onClick={() => setPage(1)}>Siguiente ›</button>
      </div>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Volver a mi recorrido</button>
    </footer>
  </main>;
};

export default CampaignEpilogue;
