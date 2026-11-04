import React from 'react';
import type { CampaignMission } from '../campaign/campaign.ts';
import { chapterForStage } from '../campaign/story.ts';
import { regionVisual } from '../campaign/regionVisuals.ts';
import {
  GENERAL_MYSTICS, SIGUMAN_MYSTICS, mysticDisplayName, mysticPower,
  mysticPowerText,
} from '../game/mysticCards.ts';
import { GeneralPortrait } from './GeneralPortrait';
import { campaignLandscape } from '../campaign/regionAssets.ts';
import './boss-confrontation.css';

type Props = Readonly<{
  mission: CampaignMission;
  alreadyDefeated: boolean;
  legacyAwakened: boolean;
  onBeginBattle: () => void;
  onBack: () => void;
}>;

type BossLine = Readonly<{ enemy: string; xervias: string }>;

/** Short cinematic lines distinct from the full pre-coin-toss dialogue. */
const BOSS_LINES: Readonly<Record<string, BossLine>> = {
  '06': {
    enemy: 'El puerto permanecerá cerrado. Mi flota no obedecerá a un joven soldado.',
    xervias: 'Tu deber era proteger a la gente, Baltasar. Tengo pruebas de que las órdenes fueron alteradas.',
  },
  '10': {
    enemy: 'Mis jinetes han llevado cada orden hasta el último pueblo. Nadie podrá detenerlos.',
    xervias: 'Tus mensajeros difundieron mentiras, Leandro. Hoy responderás por ellas.',
  },
  '14': {
    enemy: 'Con mi plata puedo comprar el silencio de cualquiera. No tienes poder aquí.',
    xervias: 'No todo se compra, Octavio. Tus cuentas demuestran que financiaste las órdenes falsas.',
  },
  '18': {
    enemy: 'Nadie desafía los cañones de mi bastión. Un solo disparo puede decidirlo todo.',
    xervias: 'Tus armas no tienen derecho a callar a las familias. Detendré tus cañones, Jerónimo.',
  },
  '22': {
    enemy: 'Esta selva es mi hogar. No dejaré entrar a quienes antes dañaron a mi gente.',
    xervias: 'Entiendo tu desconfianza, Nayisa. Pero hay pruebas de que Sigumán también te engañó.',
  },
  '26': {
    enemy: 'Solo un estandarte puede evitar otra guerra. No permitiré que destruyas nuestra unidad.',
    xervias: 'La paz no exige silenciar a los vecinos, Isabela. Sus voces también deben ser escuchadas.',
  },
  '30': {
    enemy: 'Juramos proteger esta carta. Ningún extraño puede llevársela.',
    xervias: 'Aukan, esa carta explica por qué tantos juramentos fueron cambiados. Merecemos conocer la verdad.',
  },
  '34': {
    enemy: 'Mi palabra es mi vida. Aunque el reino cambie, jamás abandonaré mi juramento.',
    xervias: 'Gonzalo, alguien cambió las palabras que juraste. Cumplir una mentira no es honrar tu promesa.',
  },
  '38': {
    enemy: 'Yo decidí qué verdad necesitaba este reino. El Sello seguirá obedeciéndome.',
    xervias: 'Sigumán, los decretos falsos han dividido a nuestras familias. Hoy termina tu engaño.',
  },
};

export const CONFRONTATION_MISSIONS = Object.freeze(Object.keys(BOSS_LINES));

/** Presentation only: the original game still handles every duel, mystic effect and victory. */
const BossConfrontation: React.FC<Props> = ({ mission, alreadyDefeated, legacyAwakened, onBeginBattle, onBack }) => {
  const [lineIndex, setLineIndex] = React.useState(0);
  const chapter = chapterForStage(mission.id);
  const region = regionVisual(mission.chapterId);
  const isFinal = mission.kind === 'final';
  const script = BOSS_LINES[mission.id];
  const mystic = GENERAL_MYSTICS.find(card => card.missionId === mission.id);
  const mysticName = mystic ? mysticDisplayName(mystic.id) : null;
  const effect = mystic ? mysticPowerText(mysticPower(mystic.id, 1)) : null;
  const lines = script
    ? [ { name: mission.kind === 'final' ? 'Sigumán' : mission.title, text: script.enemy },
        { name: 'Xervias', text: script.xervias } ] : [];
  const current = lines[lineIndex];
  const last = lineIndex === lines.length - 1;
  const advance = () => last ? onBeginBattle() : setLineIndex(index => index + 1);

  if (!script || !current || !chapter) return null;

  return <main className={`dcb-screen ${isFinal ? 'dcb-final' : ''}`}
    aria-label={isFinal ? 'Encuentro final con Sigumán' : `Encuentro con ${mission.title}`}
    style={{ '--dcb-accent': chapter.color, '--dcb-horizon': region.horizon } as React.CSSProperties}>
    <div className="dcb-shell">
      <header className="dcb-head">
        <small>{isFinal ? 'DESENLACE · SIGUMÁN' : `CAPÍTULO ${mission.chapterId} · CUARTA MISIÓN`}</small>
        <h1>{isFinal ? 'El Señor de la Falsa Luz' : 'Enfrentamiento con el general'}</h1>
      </header>

      <section className="dcb-hero" aria-label={mission.title}>
        <img src={campaignLandscape(mission.chapterId)}
          alt={`Escenario de ${chapter.region}`} draggable={false} className="dcb-scenery" />
        <div className="dcb-atmosphere" aria-hidden="true" />
        <div className="dcb-portrait">
          {isFinal ? <span aria-hidden="true" className="dcb-final-emblem">✥</span> :
            <GeneralPortrait chapterId={mission.chapterId} />}
        </div>
        <div className="dcb-hero-caption">
          <small>{isFinal ? 'JEFE FINAL' : 'GENERAL · RETO DECISIVO'}</small>
          <h2>{isFinal ? 'Sigumán' : mission.title}</h2>
          <p>{mission.description}</p>
        </div>
      </section>

      <section className="dcb-power" aria-label="Poder místico del enemigo">
        <div className="dcb-power-icon" aria-hidden="true">✦</div>
        {isFinal
          ? <div className="dcb-power-copy">
              <small>TRES CARTAS MÍSTICAS DEL ENEMIGO</small>
              <strong>El poder de la Falsa Luz</strong>
              <p>{SIGUMAN_MYSTICS.map(card => mysticDisplayName(card.id)).join(' · ')}</p>
              <em>Será tu enfrentamiento más difícil.</em>
            </div>
          : <div className="dcb-power-copy">
              <small>CARTA MÍSTICA DEL GENERAL</small>
              <strong>{mysticName}</strong>
              <p>{effect}</p>
              <em>{alreadyDefeated ? 'Carta conseguida en una victoria anterior.'
                : legacyAwakened ? 'Obtendrás esta carta si lo derrotas.'
                  : 'Al vencer, obtendrás esta carta sellada. Zhinchi aún no sabe cómo despertarla.'}</em>
            </div>}
      </section>

      <section className="dcb-dialogue" aria-live="polite" aria-atomic="true">
        <div className="dcb-speaker">
          <strong>{current.name}</strong>
          <span>{lineIndex + 1} / {lines.length}</span>
        </div>
        <p>{current.text}</p>
      </section>

      <footer className="dcb-actions">
        <button type="button" className="dcb-back" onClick={onBack}>‹ Volver a misión</button>
        <button type="button" className="dcb-next" onClick={advance}>
          {last ? '¡Comenzar duelo! ⚔' : 'Responder ›'}
        </button>
        {!last && <button type="button" className="dcb-skip" onClick={onBeginBattle}>
          Omitir presentación
        </button>}
      </footer>
    </div>
  </main>;
};

export default BossConfrontation;
