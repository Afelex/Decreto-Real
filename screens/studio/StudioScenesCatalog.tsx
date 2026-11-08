import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  QA_CAMPAIGN_DESTINATIONS, isCampaignQaAvailable, startCampaignQaAt, type QaDestination,
} from '../../campaign/campaignQA';
import '../decreto-real-studio.css';

const EDITABLE=/^\/campania\/(conversacion|entrada|liberada|epilogo|creditos)/;
/** Abre una pantalla en Studio, con la partida temporal de QA que la desbloquea. */
export function studioPathFor(path:string):string {
  const [base,query='']=path.split('?');
  const q=new URLSearchParams(query);
  q.set('studio','1');
  if(/^\/campania\/(entrada|liberada)\//.test(base))q.set('repetir','1');
  return base+'?'+q.toString();
}

/**
 * Catálogo de escenas editables con Decreto Real Studio (solo QA): prólogo,
 * conversaciones tras victoria, regiones, crónica, epílogo y créditos. Cada
 * entrada prepara una partida temporal de QA, sin tocar la partida real.
 */
export default function StudioScenesCatalog(){
  const navigate=useNavigate();
  if(!isCampaignQaAvailable())return <Navigate to="/" replace/>;
  const open=(destination:QaDestination,path=destination.path)=>{
    if(!startCampaignQaAt(destination))return;
    navigate(studioPathFor(path));
  };
  const groups=new Map<string,QaDestination[]>();
  for(const item of QA_CAMPAIGN_DESTINATIONS.filter(d=>EDITABLE.test(d.path))){
    const list=groups.get(item.group)??[];list.push(item);groups.set(item.group,list);
  }
  const mapDestination=QA_CAMPAIGN_DESTINATIONS.find(d=>d.id==='prologo-mapa');
  return <main className="dr-studio-catalog" data-testid="studio-scenes-catalog-page" aria-label="Escenas de Decreto Real Studio">
    <h1>Decreto Real Studio · Escenas</h1>
    <p>Elige una pantalla para editar sus textos, rótulo, fondo y capas. Se abre con una partida de prueba; tu partida real no cambia.</p>
    <section>
      <h2>Prólogo cinematográfico</h2>
      <ul>
        <li><button type="button" data-testid="studio-catalog-prologo" onClick={()=>navigate('/studio')}>✦ Prólogo · 49 intervenciones</button></li>
        <li><button type="button" data-testid="studio-catalog-tablero" onClick={()=>navigate('/game?studio=1')}>♜ Tablero de juego · retratos, mazos y botones</button></li>
        {mapDestination&&<li><button type="button" data-testid="studio-catalog-cronica"
          onClick={()=>open(mapDestination,'/campania/historia')}>Crónica · El Sello y la Revolución Solar</button></li>}
      </ul>
    </section>
    {[...groups.entries()].map(([group,items])=><section key={group}>
      <h2>{group}</h2>
      <ul>{items.map(item=><li key={item.id}>
        <button type="button" data-testid="studio-catalog-item" data-path={item.path} onClick={()=>open(item)}>{item.label}</button>
      </li>)}</ul>
    </section>)}
    <button type="button" onClick={()=>navigate('/')}>‹ Volver al menú</button>
  </main>;
}
