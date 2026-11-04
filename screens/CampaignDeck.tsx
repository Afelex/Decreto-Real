import React from 'react';
import { useNavigate } from 'react-router-dom';
import { bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { collectedMystics, hasZhinchiLegacy, loadMysticSlots, saveMysticSlots } from '../campaign/mysticDeck.ts';
import {
  GENERAL_MYSTICS, ZHINCHI_MYSTIC, mysticDisplayName,
  type MysticSlot, type MysticId, type ReplaceableKind,
} from '../game/mysticCards.ts';
import './mystic-deck.css';

const storage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

type SlotDraft = MysticSlot | null;
const EMPTY_SLOTS: readonly SlotDraft[] = [null, null, null];
const REPLACE_OPTIONS: ReadonlyArray<{ value: ReplaceableKind; name: string }> = [
  { value: 'ATTACK', name: 'Ataque' }, { value: 'DEFENSE', name: 'Defensa' }, { value: 'ORDER', name: 'Orden' },
];

const CampaignDeck: React.FC = () => {
  const navigate = useNavigate();
  const [savedProgress] = React.useState(() => loadCampaignProgress(storage()));
  const [store] = React.useState(storage);
  const awakened = hasZhinchiLegacy(savedProgress);
  const owned = collectedMystics(savedProgress);
  const [page, setPage] = React.useState<'collection' | 'editor'>('collection');
  const [draft, setDraft] = React.useState<SlotDraft[]>(() => {
    const loaded = loadMysticSlots(storage(), savedProgress);
    return EMPTY_SLOTS.map((_, index) => loaded[index] ?? null);
  });
  const [notice, setNotice] = React.useState('');
  const [dirty, setDirty] = React.useState(false);

  const choose = (index: number, mysticId: string) => {
    setDraft(prev => prev.map((slot, i) => i === index
      ? mysticId ? { mysticId: mysticId as MysticId, replace: slot?.replace ?? 'ATTACK' } : null
      : slot));
    setDirty(true);
    setNotice('');
  };
  const replace = (index: number, kind: ReplaceableKind) => {
    setDraft(prev => prev.map((slot, i) => i === index && slot ? { ...slot, replace: kind } : slot));
    setDirty(true);
    setNotice('');
  };
  const save = () => {
    const slots = draft.filter((slot): slot is MysticSlot => slot !== null);
    const success = saveMysticSlots(store, slots, savedProgress);
    setNotice(success ? 'Baraja guardada: 28 cartas, máximo 3 místicas.' : 'No se pudo guardar. Revisa la selección.');
    if (success) setDirty(false);
  };

  return <main className="mdc-screen" aria-label="Colección de cartas místicas">
    <div className="mdc-shell">
      <header className="mdc-header">
        <button type="button" onClick={() => navigate('/campania')} aria-label="Volver al mapa">‹</button>
        <div><small>ORDEN DE LA CORONA SOLAR</small><h1>Cartas místicas</h1></div>
      </header>

      <div className="mdc-status">
        <span>✦ {owned.length} cartas obtenidas</span>
        <span>{awakened ? 'Bastón de Zhinchi · activo' : 'Místicas selladas'}</span>
      </div>

      <nav className="mdc-tabs" aria-label="Secciones de cartas místicas">
        <button type="button" aria-current={page === 'collection' ? 'page' : undefined}
          onClick={() => setPage('collection')}>Colección</button>
        <button type="button" aria-current={page === 'editor' ? 'page' : undefined}
          onClick={() => setPage('editor')} disabled={!awakened}>
          {awakened ? 'Editar baraja' : '🔒 Editar baraja'}
        </button>
      </nav>

      {page === 'collection' && <section className="mdc-main" aria-label="Cartas de los generales">
        <h2>{awakened ? 'El legado ha despertado' : 'Poderes que aún no puedes usar'}</h2>
        <p className="mdc-intro">{awakened
          ? 'Puedes equipar hasta tres cartas obtenidas. Sus nombres y efectos específicos se definirán más adelante.'
          : 'Al derrotar a un general recibes una de sus cartas místicas. Permanecen selladas hasta el legado de Zhinchi en la misión 36.'}</p>
        <div className="mdc-collection">
          {GENERAL_MYSTICS.map(card => {
            const acquired = bestStars(savedProgress, card.missionId) > 0;
            return <div key={card.id} className={acquired ? 'mdc-collectible owned' : 'mdc-collectible'}>
              <strong>{acquired ? '✦' : '🔒'} {card.owner}</strong>
              <small>{acquired ? awakened ? 'Disponible para equipar' : 'Obtenida · Sellada' : `Recompensa del jefe · Reto ${Number(card.missionId)}`}</small>
            </div>;
          })}
        </div>
        <div className="mdc-legacy">
          <strong>{awakened ? '✦' : '🔒'} Legado de Zhinchi</strong>
          <small>{awakened ? mysticDisplayName(ZHINCHI_MYSTIC.id) + ' obtenida' : 'Se despierta tras superar la misión 36'}</small>
        </div>
      </section>}

      {page === 'editor' && awakened && <section className="mdc-main" aria-label="Editor de baraja mística">
        <h2>Editar baraja · {draft.filter(Boolean).length}/3 místicas</h2>
        <p className="mdc-intro">Cada mística sustituye una carta de Ataque, Defensa u Orden. Los cuatro Impactos permanecen. Total: 28 cartas.</p>
        <div className="mdc-slots">
          {draft.map((slot, index) => {
            const used = new Set(draft.filter((other, i): other is MysticSlot => i !== index && !!other).map(other => other.mysticId));
            return <div className="mdc-slot" key={index}>
              <label htmlFor={`mystic-card-${index}`}>Espacio {index + 1}</label>
              <select id={`mystic-card-${index}`} value={slot?.mysticId ?? ''}
                onChange={event => choose(index, event.target.value)}>
                <option value="">Sin carta mística</option>
                {owned.filter(id => !used.has(id)).map(id =>
                  <option value={id} key={id}>{mysticDisplayName(id)}</option>)}
              </select>
              <label htmlFor={`mystic-replace-${index}`}>Sustituye</label>
              <select id={`mystic-replace-${index}`} value={slot?.replace ?? 'ATTACK'} disabled={!slot}
                onChange={event => replace(index, event.target.value as ReplaceableKind)}>
                {REPLACE_OPTIONS.map(item => <option value={item.value} key={item.value}>{item.name}</option>)}
              </select>
            </div>;
          })}
        </div>
        <p className="mdc-preview">
          Ataque: {10 - draft.filter(slot => slot?.replace === 'ATTACK').length} ·
          Defensa: {10 - draft.filter(slot => slot?.replace === 'DEFENSE').length} ·
          Orden: {4 - draft.filter(slot => slot?.replace === 'ORDER').length} ·
          Impacto: 4 · Mística: {draft.filter(Boolean).length}
        </p>
        <p className="mdc-provisional">Efectos místicos de prueba: 2 de daño y combos ×2/×3. Se reemplazarán tras definir las habilidades de cada general y Sigumán.</p>
        <button type="button" className="mdc-save" disabled={!dirty} onClick={save}>Guardar baraja</button>
        <p className="mdc-notice" role="status">{notice || 'La configuración se aplicará en las próximas batallas de la campaña.'}</p>
      </section>}

      <footer className="mdc-footer">
        <button type="button" onClick={() => navigate('/campania')}>Volver al mapa</button>
        {awakened && page === 'collection' && <button type="button" onClick={() => setPage('editor')}>Editar baraja ›</button>}
      </footer>
    </div>
  </main>;
};

export default CampaignDeck;
