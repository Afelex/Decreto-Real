import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaignStorage } from '../campaign/campaignQA';
import { PROLOGUE_CHECKPOINT_KEY } from './CampaignOpening';
import CampaignPauseMenu from './CampaignPauseMenu';
import './campaign-intro.css';

export const CAMPAIGN_INTRO_KEY = 'decreto-real.campania.introduccion.v1';

/** Campaign poster: one invitation, not a wall of exposition. */
const CampaignIntro:React.FC=()=>{
  const navigate=useNavigate();
  const begin=()=>{
    try{
      const storage=getCampaignStorage();
      storage?.setItem(CAMPAIGN_INTRO_KEY,'1');
      storage?.removeItem(PROLOGUE_CHECKPOINT_KEY);
    }catch{/* storage optional */}
    navigate('/campania/prologo');
  };
  return <main className="dci-screen" aria-label="Introducción a la campaña">
    <div className="dci-stage dci-stage-cinematic">
      <img src="./portada/portada-poster.jpg" className="dci-cover-art" alt="Fortaleza andina al amanecer" draggable={false}/>
      <div className="dci-cover-shade"/>
      <CampaignPauseMenu/>
      <div className="dci-cinematic-title">
        <small>DECRETO REAL · CAMPAÑA</small>
        <h1>El Sello y la Revolución Solar</h1>
        <p>Dos decretos. Un mismo sello.<br/>Alguien está engañando al reino.</p>
      </div>
      <button type="button" className="dci-cinematic-start" onClick={begin}>Comenzar historia ›</button>
    </div>
  </main>;
};
export default CampaignIntro;
