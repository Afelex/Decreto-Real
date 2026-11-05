import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptionalAudio } from '../contexts/AudioContext';
import './campaign-opening.css';

/** Compact pause/settings control shared by narrative and guided combat. */
export default function CampaignPauseMenu() {
  const navigate=useNavigate();
  const audio=useOptionalAudio();
  const musicEnabled=audio?.musicEnabled??true;
  const sfxEnabled=audio?.sfxEnabled??true;
  const toggleMusic=()=>audio?.toggleMusic();
  const toggleSfx=()=>audio?.toggleSfx();
  const [open,setOpen]=React.useState(false);
  const [exitHelp,setExitHelp]=React.useState(false);
  React.useEffect(()=>{
    if (!open) return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[open]);
  return <div className="dcop-pause">
    <button type="button" className="dcop-burger" aria-label="Abrir menú de campaña"
      aria-expanded={open} onClick={()=>setOpen(!open)}>☰</button>
    {open && <div className="dcop-pause-backdrop" onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <section role="dialog" aria-modal="true" aria-label="Menú de campaña" className="dcop-pause-panel">
        <header><strong>DECRETO REAL</strong><button type="button" onClick={()=>setOpen(false)} aria-label="Cerrar menú">×</button></header>
        <h2>Historia en pausa</h2>
        <button type="button" onClick={toggleMusic}>♫ Música <span>{musicEnabled?'Activada':'Silenciada'}</span></button>
        <button type="button" onClick={toggleSfx}>♪ Efectos de sonido <span>{sfxEnabled?'Activados':'Silenciados'}</span></button>
        <button type="button" className="dcop-menu-primary" onClick={()=>setOpen(false)}>▶ Continuar historia</button>
        <button type="button" onClick={()=>navigate('/')}>⌂ Volver al menú principal</button>
        <button type="button" onClick={()=>setExitHelp(!exitHelp)}>⇥ Salir del juego</button>
        {exitHelp && <p role="status">En la versión web, cierra esta pestaña para salir del juego. Tu avance del prólogo queda guardado en este dispositivo.</p>}
      </section>
    </div>}
  </div>;
}
