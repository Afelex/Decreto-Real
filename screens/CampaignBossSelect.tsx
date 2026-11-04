import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { STORY_CHAPTERS } from '../campaign/story.ts';
import { GeneralPortrait } from './GeneralPortrait';
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

const storage = (): Storage | null => {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
};

const CampaignBossSelect: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [progress] = React.useState(() => loadCampaignProgress(storage()));
  const [intro, setIntro] = React.useState(search.get('intro') === '1');
  const [introIndex, setIntroIndex] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState('1');
  const selected = GENERALS.find(general => general.id === selectedId) ?? GENERALS[0];
  const missionsFor = (chapterId: string) => CAMPAIGN_MISSIONS.filter(mission => mission.chapterId === chapterId);
  const completionFor = (chapterId: string) => {
    const missions = missionsFor(chapterId);
    const completed = missions.filter(mission => bestStars(progress, mission.id) > 0).length;
    return { completed, percent: Math.round(completed / missions.length * 100) };
  };
  const startChapter = () => {
    const missions = missionsFor(selected.id);
    const next = missions.find(mission => bestStars(progress, mission.id) === 0 && isMissionUnlocked(progress, mission.id))
      ?? [...missions].reverse().find(mission => isMissionUnlocked(progress, mission.id));
    if (next) navigate('/campania/mision/' + next.id);
  };

  if (intro) {
    const general = GENERALS[introIndex];
    const chapter = STORY_CHAPTERS.find(item => item.id === general.id);
    return <main className="dbs-screen dbs-intro-screen" style={{ '--dbs-accent': chapter?.color ?? '#c9a85e' } as React.CSSProperties}>
      <header className="dbs-header">
        <button type="button" onClick={() => navigate('/campania')}>‹ Campaña</button>
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
        <button type="button" className="dbs-primary" onClick={() => introIndex < GENERALS.length - 1 ? setIntroIndex(index => index + 1) : setIntro(false)}>
          {introIndex < GENERALS.length - 1 ? 'Siguiente general ›' : 'Elegir capítulo ⚔'}
        </button>
      </footer>
    </main>;
  }

  return <main className="dbs-screen">
    <header className="dbs-header">
      <button type="button" onClick={() => navigate('/campania')}>‹ Campaña</button>
      <div><small>EL SELLO Y LA REVOLUCIÓN SOLAR</small><h1>Elige un capítulo</h1></div>
      <span>OCHO GENERALES</span>
    </header>
    <section className="dbs-gallery" aria-label="Capítulos de los ocho generales">
      {GENERALS.map(general => {
        const completion = completionFor(general.id);
        const active = selectedId === general.id;
        return <button type="button" key={general.id}
          className={'dbs-general' + (active ? ' selected' : '') + (completion.percent === 100 ? ' defeated' : '')}
          onClick={() => setSelectedId(general.id)} aria-pressed={active}
          aria-label={general.title + ', ' + completion.percent + '% derrotado'}>
          <span className="dbs-portrait"><GeneralPortrait chapterId={general.id} /></span>
          <span className="dbs-general-name">{general.name}</span>
          <span className="dbs-general-title">{general.title}</span>
          <span className="dbs-percent">{completion.percent}% derrotado</span>
        </button>;
      })}
    </section>
    <section className="dbs-details" aria-live="polite" aria-labelledby="dbs-detail-title">
      <div className="dbs-detail-copy">
        <small>{selected.domain}</small><h2 id="dbs-detail-title">{selected.card}</h2>
        <p>{selected.story}</p><strong>{selected.effect}</strong>
        <blockquote>«{selected.quote}»</blockquote>
      </div>
      <div className="dbs-detail-progress">
        <span>{completionFor(selected.id).completed}/4 fases superadas</span>
        <div role="progressbar" aria-label={'Progreso de ' + selected.title} aria-valuemin={0}
          aria-valuemax={100} aria-valuenow={completionFor(selected.id).percent}>
          <i style={{ width: completionFor(selected.id).percent + '%' }} />
        </div>
        <button type="button" className="dbs-primary" onClick={startChapter}>
          {completionFor(selected.id).percent === 100 ? 'Repetir escenario ⚔' : 'Jugar capítulo ⚔'}
        </button>
      </div>
    </section>
    <footer className="dbs-gallery-footer">
      <span>Gana una fase para avanzar un 25 %. Al completar las cuatro, el retrato quedará en gris.</span>
      <button type="button" onClick={() => { setIntroIndex(0); setIntro(true); }}>Volver a escuchar la presentación</button>
    </footer>
  </main>;
};

export default CampaignBossSelect;
