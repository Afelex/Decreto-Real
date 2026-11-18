import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailAccountGate, useOptionalDuelistAccount } from './EmailAccountGate';
import './multiplayer.css';

/** El acceso a cuentas no se presenta como listo antes de habilitar Firebase,
 * el servidor autenticado y su almacenamiento permanente. */
const EMAIL_ENABLED = import.meta.env.VITE_DR_EMAIL_ACCOUNTS === 'true';

function AccountOverview() {
  const navigate = useNavigate();
  const account = useOptionalDuelistAccount();
  const [error, setError] = React.useState('');
  return <main className="dr-pvp dr-pvp-home">
    <img className="dr-pvp-backdrop" src={import.meta.env.BASE_URL + 'portada/portada-poster.jpg'} alt=""/>
    <div className="dr-pvp-vignette" aria-hidden="true"/>
    <section className="dr-pvp-lobby" aria-label="Mi cuenta de duelista"
      style={{ margin:'auto', zIndex:1, maxWidth:440 }}>
      <h1>Mi cuenta</h1>
      <p style={{ overflowWrap:'anywhere' }}>Correo vinculado: <strong>{account?.email}</strong></p>
      <p>Tu cuenta identifica tus amistades, apodos y resultados del multijugador.</p>
      {error && <p className="dr-pvp-alert" role="alert">{error}</p>}
      <button type="button" className="dr-pvp-secondary" onClick={() => {
        if (!window.confirm('¿Deseas cerrar sesión? Tus datos permanecerán guardados.')) return;
        void account?.signOut().catch(() => setError('No se pudo cerrar sesión.'));
      }}>Cerrar sesión</button>
      <button type="button" className="dr-pvp-primary" onClick={() => navigate('/')}>
        Volver al menú principal
      </button>
    </section>
  </main>;
}

export default function AccountScreen() {
  const navigate = useNavigate();
  if (EMAIL_ENABLED) return <EmailAccountGate><AccountOverview/></EmailAccountGate>;
  return <main className="dr-pvp dr-pvp-home">
    <img className="dr-pvp-backdrop" src={import.meta.env.BASE_URL + 'portada/portada-poster.jpg'} alt=""/>
    <div className="dr-pvp-vignette" aria-hidden="true"/>
    <section className="dr-pvp-lobby" aria-label="Estado de cuenta" style={{ margin:'auto', zIndex:1, maxWidth:440 }}>
      <h1>Mi cuenta</h1>
      <p role="status">El acceso por correo está preparado, pero aún no está activado.</p>
      <p>Las partidas como invitado siguen disponibles. Tus datos actuales del perfil permanecen en este dispositivo.</p>
      <button type="button" className="dr-pvp-primary" onClick={() => navigate('/')}>
        Volver al menú principal
      </button>
    </section>
  </main>;
}
