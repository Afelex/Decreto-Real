import React from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import { GeneralPortrait } from './GeneralPortrait';
import { CENTER_REVEAL_KEY } from './CampaignAfterVictory';
import { campaignLandscape } from '../campaign/regionAssets.ts';
import { hasSeenRegionMoment, REGION_ENTRANCES_KEY } from '../campaign/regionJourney.ts';
import './campaign-boss-select.css';

type GeneralEntry = {
  id: string; name: string; title: string; domain: string; story: string;
  card: string; effect: string; quote: string; xervias: string; zhinchi: string;
};

const GENERALS: readonly GeneralEntry[] = [
  { id:'1', name:'Baltasar de Fierro', title:'El Almirante de Hierro', domain:'Mar, resistencia y disciplina militar',
    story:'Antiguo comandante naval, protegía las rutas y a sus hombres. Sigumán torció su disciplina hasta volverla obediencia ciega.',
    card:'Marea de Hierro', effect:'Recupera 2 puntos de vida.', quote:'El hierro resiste donde la carne sucumbe.',
    xervias:'¿Por qué cerró el puerto si antes protegía a los viajeros?',
    zhinchi:'Baltasar cree que cualquier sacrificio garantiza la victoria. Su disciplina se convirtió en obediencia ciega.' },
  { id:'2', name:'Leandro Valcázar', title:'El Jinete Escarlata', domain:'Caballería, velocidad y agresividad',
    story:'Capitán famoso por sus cargas devastadoras. Sigumán aprovechó su valentía y su deseo de gloria.',
    card:'Carga Sangrante', effect:'Inflige 3 de daño al rival; su portador pierde 1 punto de vida.', quote:'La gloria exige sangre, incluso la propia.',
    xervias:'¿Qué lo lleva a arriesgar hasta su propia vida?',
    zhinchi:'Leandro persigue la gloria con ataques veloces. Ya no mide el precio que paga por vencer.' },
  { id:'3', name:'Octavio Argento', title:'El Señor de la Plata', domain:'Riqueza, negociación y manipulación',
    story:'Noble vinculado a las minas. Cree que todo tiene un precio y usa su fortuna para comprar voluntades.',
    card:'Pacto de Azogue', effect:'Recupera 4 puntos de vida propios y 1 punto de vida del rival.', quote:'Todo beneficio exige un precio.',
    xervias:'¿Por qué financia a Sigumán?',
    zhinchi:'Octavio cree que la lealtad y la justicia se pueden comprar. Su riqueza le permite controlar ejércitos.' },
  { id:'4', name:'Jerónimo Arrellano', title:'El Artillero del Trueno', domain:'Artillería, pólvora y destrucción',
    story:'Estratega de cañones que quería defender ciudades. Sigumán alimentó su obsesión por el poder destructivo.',
    card:'Descarga del Trueno', effect:'Inflige 3 puntos de daño al rival.', quote:'Que el trueno dicte la sentencia.',
    xervias:'¿Por qué amenaza a los pueblos que debía defender?',
    zhinchi:'Jerónimo llegó a creer que solo la superioridad militar puede imponer la paz.' },
  { id:'5', name:'Nayisa de Sombras', title:'La Fantasma de la Selva', domain:'Sigilo, engaño y secretos',
    story:'Guerrera que protegía comunidades en la selva. Ahora trabaja como espía de Sigumán.',
    card:'Velo de la Selva', effect:'Inflige 1 punto de daño al rival y permite robar 1 carta.', quote:'Aquello que no ves también puede destruirte.',
    xervias:'¿Por qué oculta la verdad a quienes protegía?',
    zhinchi:'Nayisa cree que mentir es necesario para sobrevivir. Conoce secretos peligrosos para ambos bandos.' },
  { id:'6', name:'Isabela Valdierra', title:'La Dama del Estandarte', domain:'Liderazgo, protección y sacrificio',
    story:'Comandante que inspiraba esperanza. Sigumán la convenció de que la libertad debía sacrificarse por la paz.',
    card:'Estandarte Sagrado', effect:'Recupera 3 puntos de vida propios y 1 punto de vida del rival.', quote:'Hasta en la guerra, la misericordia conserva su lugar.',
    xervias:'¿Por qué sus soldados aún la llaman heroína?',
    zhinchi:'Isabela quería proteger a los inocentes. Ahora cree que el orden exige obedecer por miedo.' },
  { id:'7', name:'Aukan del Cóndor', title:'El Cóndor de los Andes', domain:'Alturas, libertad y ataques devastadores',
    story:'Guerrero de las montañas que defendía la independencia de su pueblo. Sigumán convirtió su orgullo en ansias de superioridad.',
    card:'Picado Celestial', effect:'Inflige 4 de daño al rival; su portador pierde 1 punto de vida.', quote:'Desde las alturas, ningún enemigo escapa.',
    xervias:'¿Qué pasó con su lucha por la libertad?',
    zhinchi:'Aukan ahora ve a sus enemigos como presas. Su orgullo fue usado para cambiar el sentido de su causa.' },
  { id:'8', name:'Gonzalo de Montes', title:'El Caballero del Juramento', domain:'Honor, justicia y resistencia',
    story:'Caballero que juró defender a los débiles. Sigumán lo convenció de que romper su palabra sería peor que permitir una injusticia.',
    card:'Juramento Eterno', effect:'Inflige 2 de daño al rival y recupera 2 puntos de vida propios.', quote:'Mi palabra sobrevivirá incluso a mi muerte.',
    xervias:'¿Seguirá obedeciendo cuando vea el daño que causa?',
    zhinchi:'Gonzalo empieza a descubrir las consecuencias de su lealtad a un señor corrupto.' },
];

const completionForChapter = (progress: ReturnType<typeof loadCampaignProgress>, chapterId: string): number => {
  const missions = CAMPAIGN_MISSIONS.filter(mission => mission.chapterId === chapterId);
  return Math.round(missions.filter(mission => bestStars(progress, mission.id) > 0).length / missions.length * 100);
};

const GENERAL_INTRO_KEY = 'decreto-real.campania.generales-presentados.v1';

const storage = (): Storage | null => {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
};

const CampaignBossSelect: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [progress] = React.useState(() => loadCampaignProgress(storage()));
  const prologueComplete = bestStars(progress, '01') > 0 && bestStars(progress, '02') > 0;
  const centerUnlocked = isMissionUnlocked(progress, '35');
  const liberated = Array.from({ length: 8 }, (_, index) => completionForChapter(progress, String(index + 1))).filter(value => value === 100).length;
  const [intro, setIntro] = React.useState(() => {
    if (search.get('intro') === '1') return true;
    if (!prologueComplete || liberated > 0) return false;
    try { return storage()?.getItem(GENERAL_INTRO_KEY) !== '1'; }
    catch { return true; }
  });
  const [introIndex, setIntroIndex] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState('1');
  const selected = GENERALS.find(general => general.id === selectedId) ?? GENERALS[0];
  const missionsFor = (chapterId: string) => CAMPAIGN_MISSIONS.filter(mission => mission.chapterId === chapterId);
  const completionFor = (chapterId: string) => {
    const missions = missionsFor(chapterId);
    const completed = missions.filter(mission => bestStars(progress, mission.id) > 0).length;
    return { completed, percent: Math.round(completed / missions.length * 100) };
  };
  const finishIntroduction = () => {
    try { storage()?.setItem(GENERAL_INTRO_KEY, '1'); } catch { /* storage unavailable */ }
    setIntro(false);
  };
  const startChapter = () => {
    const missions = missionsFor(selected.id);
    const next = missions.find(mission => bestStars(progress, mission.id) === 0 && isMissionUnlocked(progress, mission.id))
      ?? [...missions].reverse().find(mission => isMissionUnlocked(progress, mission.id));
    if (next) {
      const alreadyStarted = missions.some(mission => bestStars(progress, mission.id) > 0);
      const introductionSeen = hasSeenRegionMoment(storage(), REGION_ENTRANCES_KEY, selected.id);
      navigate((alreadyStarted || introductionSeen ? '/campania/region/' : '/campania/entrada/') + selected.id);
    }
  };

  let centerRevealed = false;
  try { centerRevealed = storage()?.getItem(CENTER_REVEAL_KEY) === '1'; } catch { /* no storage */ }
  if (!prologueComplete) return <Navigate to="/campania" replace />;
  if (centerUnlocked && !centerRevealed) return <Navigate to="/campania/revelacion" replace />;

  if (intro) {
    const general = GENERALS[introIndex];
    const chapter = STORY_CHAPTERS.find(item => item.id === general.id);
    return <main className="dbs-screen dbs-intro-screen" style={{ '--dbs-accent': chapter?.color ?? '#c9a85e' } as React.CSSProperties}>
      <header className="dbs-header">
        <button type="button" onClick={() => navigate('/')}>⌂ Volver al Menú</button>
        <span>CONVERSACIÓN · GENERAL {introIndex + 1} DE 8</span>
      </header>
      <section className="dbs-dialogue" aria-live="polite">
        <div className="dbs-intro-portrait"><GeneralPortrait chapterId={general.id} /></div>
        <div className="dbs-dialogue-label">XERVIAS PREGUNTA</div>
        <p className="dbs-dialogue-line">{general.xervias}</p>
        <div className="dbs-dialogue-label zhinchi">ZHINCHI EXPLICA</div>
        <p className="dbs-dialogue-line">{general.zhinchi}</p>
        <h1>{general.name}</h1><h2>{general.title}</h2>
        <p className="dbs-intro-domain">{general.domain}</p>
      </section>
      <footer className="dbs-footer">
        <button type="button" className="dbs-primary" onClick={() => introIndex < GENERALS.length - 1 ? setIntroIndex(index => index + 1) : finishIntroduction()}>
          {introIndex < GENERALS.length - 1 ? 'Siguiente general ›' : 'Elegir capítulo ⚔'}
        </button>
      </footer>
    </main>;
  }

  const zones = [
    { left: 0, top: 28.2, width: 31.8, height: 14 },
    { left: 25, top: 28.2, width: 27.5, height: 14 },
    { left: 47, top: 28.2, width: 30, height: 14 },
    { left: 69, top: 28.2, width: 31, height: 14 },
    { left: 0, top: 60, width: 29.5, height: 16 },
    { left: 22, top: 60, width: 30, height: 16 },
    { left: 48, top: 60, width: 31, height: 16 },
    { left: 72, top: 60, width: 28, height: 16 },
  ];

  return <main className="dbs-art-screen" aria-label="Selección de generales">
    <div className="dbs-art-stage">
      <img className="dbs-art-base" src="/Decreto-Real/campania/salon-generales.webp"
        alt="Salón de mando andino con ocho retratos de generales alrededor del mapa" draggable={false} />
      {GENERALS.map((general, index) => completionFor(general.id).percent === 100 &&
        <span key={general.id} className={'dbs-art-gray dbs-art-gray-' + (index + 1)} aria-hidden="true" />)}
      <img className="dbs-art-selection" src={'/Decreto-Real/campania/seleccion-' + selectedId + '.webp'}
        alt="" aria-hidden="true" draggable={false} />
      <div className="dbs-art-heading">
        <button type="button" onClick={() => navigate('/')}>⌂ Volver al Menú</button>
        <h1>Elige un capítulo</h1>
      </div>
      {GENERALS.map((general, index) => {
        const zone = zones[index];
        const completion = completionFor(general.id);
        return <button type="button" key={general.id} className="dbs-art-hit"
          style={{ left: zone.left + '%', top: zone.top + '%', width: zone.width + '%', height: zone.height + '%' }}
          aria-label={general.name + ', ' + general.title + ', ' + completion.percent + '% derrotado'}
          aria-pressed={selectedId === general.id}
          onMouseEnter={() => setSelectedId(general.id)}
          onFocus={() => setSelectedId(general.id)}
          onClick={() => setSelectedId(general.id)} />;
      })}
      <button type="button" className={`dbs-art-center ${centerUnlocked ? 'open' : 'locked'}`}
         disabled={!centerUnlocked}
         aria-label={centerUnlocked ? 'Entrar al escenario central desbloqueado' : 'Escenario central bloqueado, derrota a los ocho generales'}
         onClick={() => navigate('/campania/region/f')}>
         <span aria-hidden="true">{centerUnlocked ? '✦' : '♜'}</span>
         <small>{centerUnlocked ? 'Entrar al centro' : 'Centro sellado'}</small>
       </button>
       <section className="dbs-art-details" aria-live="polite" aria-labelledby="dbs-detail-title">
        <img className="dbs-art-region-preview"
          src={campaignLandscape(selected.id)}
          alt="" aria-hidden="true" draggable={false} />
        <div className="dbs-art-meta"><strong>{selected.name}</strong><span>{selected.title} · {completionFor(selected.id).percent}% derrotado</span></div>
        <p>{selected.story}</p>
        <p><strong>{selected.card}:</strong> {selected.effect}</p>
        <div className="dbs-art-actions">
          <span>{completionFor(selected.id).completed}/4 fases</span>
          <button type="button" onClick={startChapter}>
            {completionFor(selected.id).percent === 100 ? 'Revisar región ⚔' : 'Explorar región ⚔'}
          </button>
        </div>
      </section>
      <span className="dbs-art-freed" aria-label={`${liberated} de 8 generales derrotados`}>{liberated}/8 generales</span>
       <button className="dbs-art-replay" type="button" onClick={() => { setIntroIndex(0); setIntro(true); }}
        aria-label="Volver a escuchar la presentación de los generales">↺</button>
    </div>
  </main>;
};

export default CampaignBossSelect;
