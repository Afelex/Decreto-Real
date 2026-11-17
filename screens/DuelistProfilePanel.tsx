import React from 'react';
import {
  COSMETICS, DEFAULT_APPEARANCE, MAX_ALIASES, cleanName, isUnlocked,
  portraitUrl, unlockText, type CosmeticKind, type DuelistProfile,
} from '../game/duelistProfile';
import './duelist-profile.css';

const SECTIONS: { kind: CosmeticKind; title: string }[] = [
  { kind: 'portrait', title: 'Retrato' },
  { kind: 'entrance', title: 'Entrada al duelo' },
  { kind: 'back', title: 'Dorso de cartas' },
  { kind: 'nameFx', title: 'Efecto del nombre' },
];

export function DuelistProfilePanel({ profile, onChange, onClose, onSignOut, email, history = [] }: {
  profile: DuelistProfile; onChange: (updated: DuelistProfile) => void; onClose: () => void;
  onSignOut?: () => void; email?: string;
  history?: Array<{ id: string; date: string; result: string; opponentName: string; turns: number }>;
}) {
  const slot = profile.slots[profile.active];
  const [draftName, setDraftName] = React.useState(slot.name);
  const [message, setMessage] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const [category, setCategory] = React.useState<CosmeticKind>('portrait');
  React.useEffect(() => { setDraftName(slot.name); setMessage(''); }, [profile.active]);

  const saveName = () => {
    const name = cleanName(draftName);
    if (name.length < 2) { setMessage('El nombre debe tener entre 2 y 24 caracteres.'); return; }
    if (profile.slots.some((other, index) => index !== profile.active && other.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setMessage('Ya tienes ese nombre guardado.'); return;
    }
    onChange({ ...profile, slots: profile.slots.map((item, index) =>
      index === profile.active ? { ...item, name } : item) });
    setDraftName(name);
    setMessage('Nombre guardado.');
  };
  const chooseCosmetic = (kind: CosmeticKind, id: string) => {
    const cosmetic = COSMETICS[kind].find(item => item.id === id);
    if (!cosmetic || !isUnlocked(profile, cosmetic)) return;
    onChange({ ...profile, slots: profile.slots.map((item, index) => index === profile.active
      ? { ...item, appearance: { ...item.appearance, [kind]: id } } : item) });
    setMessage('Apariencia guardada.');
  };
  const addSlot = () => {
    if (profile.slots.length >= MAX_ALIASES) return;
    const next = profile.slots.length;
    onChange({ ...profile, active: next, slots: [...profile.slots,
      { name: '', appearance: { ...DEFAULT_APPEARANCE } }] });
  };

  return <section className="dr-duelist-panel" role="dialog" aria-modal="true" aria-label="Mi perfil de duelista">
    <header className="dr-duelist-panel-header">
      <div><small>DECRETO REAL</small><h2>Mi perfil de duelista</h2></div>
      <button type="button" onClick={onClose} aria-label="Cerrar perfil">✕</button>
    </header>
    <p className="dr-duelist-help">Guarda hasta cuatro nombres. Cada nombre conserva su retrato, entrada, dorso y efectos.</p>
    <div className="dr-duelist-aliases" role="group" aria-label="Nombres guardados">
      {profile.slots.map((item, index) => <button key={index} type="button"
        aria-pressed={profile.active === index}
        className={profile.active === index ? 'active' : ''}
        onClick={() => onChange({ ...profile, active: index })}>
        {item.name || 'Nuevo nombre'}
      </button>)}
      {profile.slots.length < MAX_ALIASES && <button type="button" className="dr-duelist-add"
        onClick={addSlot}>+ Añadir nombre</button>}
    </div>
    <form className="dr-duelist-name-edit" onSubmit={event => { event.preventDefault(); saveName(); }}>
      <label htmlFor="dr-duelist-nickname">Nombre seleccionado</label>
      <div><input id="dr-duelist-nickname" maxLength={24} value={draftName}
        onChange={event => { setDraftName(event.target.value); setMessage(''); }}
        placeholder="Tu apodo (2 a 24 caracteres)"/>
        <button type="submit">Guardar</button></div>
    </form>
    {message && <p role="status" className="dr-duelist-message">{message}</p>}
    <div className="dr-duelist-progress">
      <span>{profile.progress.matches} duelos</span><span>{profile.progress.wins} victorias</span>
      <span>{profile.progress.impacts} Impactos</span>
    </div>
    <div className="dr-duelist-tabs" role="group" aria-label="Categorías de personalización">
      {SECTIONS.map(({ kind, title }) => <button type="button" key={kind} className={category === kind ? 'active' : ''}
        aria-pressed={category === kind} onClick={() => setCategory(kind)}>{title}</button>)}
    </div>
    {SECTIONS.filter(({ kind }) => category === kind).map(({ kind, title }) => <section className="dr-duelist-section" key={kind}
      aria-label={title}>
      <h3>{title}</h3>
      <div className="dr-duelist-cosmetics">
        {COSMETICS[kind].map(item => {
          const unlocked = isUnlocked(profile, item);
          const selected = slot.appearance[kind] === item.id;
          return <button type="button" key={item.id} disabled={!unlocked}
            className={'dr-duelist-option' + (selected ? ' selected' : '')}
            aria-pressed={selected}
            title={unlocked ? item.title : 'Desbloquea con ' + unlockText(item)}
            onClick={() => chooseCosmetic(kind, item.id)}>
            {item.image
              ? <img src={import.meta.env.BASE_URL + item.image} alt="" draggable={false}/>
              : <span className={kind === 'back' ? 'dr-duelist-back back-' + item.id : 'dr-duelist-symbol'} aria-hidden="true">{item.symbol || '✦'}</span>}
            <strong>{item.title}</strong>
            {!unlocked && <small>🔒 {unlockText(item)}</small>}
            {unlocked && selected && <small>Equipado</small>}
          </button>;
        })}
      </div>
    </section>)}
    <button type="button" className="dr-duelist-preview-toggle" onClick={() => setPreview(current => !current)}>
      {preview ? 'Ocultar vista previa' : '▶ Vista previa de mi duelista'}
    </button>
    {preview && <div className={'dr-duelist-preview entrance-' + slot.appearance.entrance}>
      <div className="dr-duelist-preview-portrait"><img src={portraitUrl(slot.appearance.portrait)} alt="Retrato seleccionado"/></div>
      <div className={'dr-duelist-preview-name namefx-' + slot.appearance.nameFx}>{slot.name || 'TU NOMBRE'}</div>
      <span className="dr-duelist-preview-versus">VS</span>
      <div className={'dr-duelist-preview-card back-' + slot.appearance.back} aria-label="Dorso seleccionado">✥</div>
      <p>Vista previa visual · Sin alterar el combate</p>
    </div>}
    <p className="dr-duelist-help">{email
      ? 'Tus datos se vinculan a tu correo verificado. No se comparten con otros jugadores.'
      : 'Modo invitado: el perfil se guarda en este dispositivo. El acceso por correo se habilitará cuando termine su verificación.'}</p>
    {email && <p className="dr-duelist-help" style={{ overflowWrap: 'anywhere' }}>
      Cuenta: <strong>{email}</strong>
    </p>}
    {history.length > 0 && <section aria-label="Últimas partidas" className="dr-duelist-section">
      <h3>Últimas partidas</h3>
      <ul style={{ paddingInlineStart: '1.3rem', fontSize: '.9rem' }}>
        {history.slice(0, 10).map(item => <li key={item.id}>
          {item.result === 'victoria' ? 'Victoria' : item.result === 'derrota' ? 'Derrota' : 'Empate'}
          {' · '}{item.opponentName || 'Rival'}{' · '}{item.turns} turnos
        </li>)}
      </ul>
    </section>}
    <button type="button" className="dr-duelist-done" onClick={onClose}>Volver al multijugador</button>
    {onSignOut && <button type="button" className="dr-duelist-done" onClick={onSignOut}
      style={{ background: '#6c2027', marginTop: '.6rem' }}>Cerrar sesión</button>}
  </section>;
}
