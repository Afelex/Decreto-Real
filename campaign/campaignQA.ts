import { CAMPAIGN_MISSIONS, CAMPAIGN_STORAGE_KEY, type CampaignProgress } from './campaign.ts';
import { STORY_CHAPTERS, stagesForChapter } from './story.ts';

/** Tooling only: release builds can disable every QA entrypoint with VITE_ENABLE_CAMPAIGN_QA=false. */
const ACTIVE_KEY = 'decreto-real.qa.campania.activa.v1';
const CAMPAIGN_META_KEYS = [
  CAMPAIGN_STORAGE_KEY,
  'decreto-real.campania.introduccion.v1',
  'decreto-real.campania.prologo-cinematico.v1',
  'decreto-real.prologo.finalizado.v1',
  'decreto-real.campania.generales-presentados.v1',
  'decreto-real.campania.centro-revelado.v1',
  'decreto-real.campania.regiones-visitadas.v1',
  'decreto-real.campania.regiones-liberadas-presentadas.v1',
  'decreto-real.campania.mazo-mistico.v1',
] as const;

export type QaDestination = Readonly<{
  id: string;
  group: string;
  label: string;
  path: string;
  won: readonly string[];
}>;

const prologue = stagesForChapter('p').map(stage => stage.id);
const regionMissions = CAMPAIGN_MISSIONS.filter(mission => mission.chapterId !== 'p' && mission.chapterId !== 'f').map(mission => mission.id);
const finalMissions = stagesForChapter('f').map(stage => stage.id);
const after = (chapterId: string, count: number): string[] => {
  const earlier = stagesForChapter(chapterId).slice(0, count).map(stage => stage.id);
  if (chapterId === 'p') return earlier;
  if (chapterId === 'f') return [...prologue, ...regionMissions, ...earlier];
  return [...prologue, ...earlier];
};

const destinations: QaDestination[] = [
  { id: 'primer-ingreso', group: 'Inicio', label: 'Primera vez · Introducción', path: '/campania/inicio', won: [] },
  { id:'pergamino-real',group:'Prólogo cinematográfico',label:'Escena 2 · Pergamino y Sello Real',path:'/campania/prologo?escena=pergamino',won:[] },
  { id:'arresto-familia',group:'Prólogo cinematográfico',label:'Escena 3 · Arresto de la familia',path:'/campania/prologo?escena=arresto',won:[] },
  { id:'intervencion-xervias',group:'Prólogo cinematográfico',label:'Escena 4 · Intervención de Xervias',path:'/campania/prologo?escena=xervias',won:[] },
  { id:'revision-decreto',group:'Prólogo cinematográfico',label:'Escena 5 · Artículo VII y revisión',path:'/campania/prologo?escena=revision',won:[] },
  { id:'desafio-guardia',group:'Prólogo cinematográfico',label:'Escena 6 · Desafío y honor',path:'/campania/prologo?escena=desafio',won:[] },
  { id:'invocacion-anillo',group:'Prólogo cinematográfico',label:'Escena 7 · Anillo y Carta Dorada',path:'/campania/prologo?escena=anillo',won:[] },
  { id:'cara-a-cara',group:'Prólogo cinematográfico',label:'Transición VS · Xervias contra Domingo',path:'/campania/prologo?escena=versus',won:[] },
  { id:'tutorial-decreto',group:'Prólogo cinematográfico',label:'Escena 8 · Tutorial guiado / Duelo',path:'/campania/prologo?escena=duelo',won:[] },
  { id:'victoria-decreto',group:'Prólogo cinematográfico',label:'Desenlace · Guardia inconsciente',path:'/campania/prologo?escena=desenlace',won:[] },
  { id:'entrada-zhinchi',group:'Prólogo cinematográfico',label:'Escena 10 · Entrada del capitán Zhinchi',path:'/campania/prologo?escena=zhinchi',won:[] },
  { id:'verificar-cetro',group:'Prólogo cinematográfico',label:'Escena 11 · Cetro y sello falso',path:'/campania/prologo?escena=cetro',won:[] },
  { id:'resolver-arresto',group:'Prólogo cinematográfico',label:'Escena 12 · Resolución del caso',path:'/campania/prologo?escena=resolucion',won:[] },
  { id:'reflexion-final',group:'Prólogo cinematográfico',label:'Escena 13 · Reflexión de Xervias',path:'/campania/prologo?escena=reflexion',won:[] },
  { id:'fin-prologo',group:'Prólogo cinematográfico',label:'Escena 14 · Fin del Prólogo',path:'/campania/prologo?escena=fin',won:[] },
  { id: 'prologo-mapa', group: 'Prólogo', label: 'Mapa del prólogo', path: '/campania', won: [] },
];

for (const [index, stage] of stagesForChapter('p').entries()) {
  const won = after('p', index);
  destinations.push(
    { id: `mision-${stage.id}`, group: 'Prólogo', label: `M${stage.id} · ${stage.title}`, path: `/campania/mision/${stage.id}`, won },
    { id: `duelo-${stage.id}`, group: 'Prólogo', label: `Duelo M${stage.id}`, path: `/campania/mision/${stage.id}?qaEscena=combate`, won },
    { id: `dialogo-${stage.id}`, group: 'Prólogo', label: `Diálogo tras M${stage.id}`, path: `/campania/conversacion/${stage.id}`, won: after('p', index + 1) },
  );
}

destinations.push(
  { id: 'presentacion-generales', group: 'Mapa de generales', label: 'Xervias y Zhinchi presentan a los ocho generales', path: '/campania/generales?intro=1', won: prologue },
  { id: 'selector-generales', group: 'Mapa de generales', label: 'Selector de los ocho generales', path: '/campania/generales', won: prologue },
);

for (const chapter of STORY_CHAPTERS.filter(c => c.id !== 'p' && c.id !== 'f')) {
  const group = `Región ${chapter.id} · ${chapter.title}`;
  const stages = stagesForChapter(chapter.id);
  destinations.push(
    { id: `entrada-${chapter.id}`, group, label: 'Introducción a la región', path: `/campania/entrada/${chapter.id}`, won: [...prologue] },
    { id: `mapa-${chapter.id}`, group, label: 'Mapa · cuatro fases', path: `/campania/region/${chapter.id}`, won: [...prologue] },
  );
  stages.forEach((stage, index) => {
    const won = after(chapter.id, index);
    destinations.push(
      { id: `mision-${stage.id}`, group, label: `M${stage.id} · ${stage.title}`, path: `/campania/mision/${stage.id}`, won },
    );
    if (stage.kind === 'boss') destinations.push(
      { id: `jefe-${stage.id}`, group, label: `Presentación del jefe M${stage.id}`, path: `/campania/mision/${stage.id}?qaEscena=confrontacion`, won },
    );
    destinations.push(
      { id: `duelo-${stage.id}`, group, label: `Combate M${stage.id}`, path: `/campania/mision/${stage.id}?qaEscena=combate`, won },
      { id: `dialogo-${stage.id}`, group, label: `Diálogo tras M${stage.id}`, path: `/campania/conversacion/${stage.id}`, won: after(chapter.id, index + 1) },
    );
  });
  destinations.push({ id: `liberada-${chapter.id}`, group, label: 'Liberación de la región', path: `/campania/liberada/${chapter.id}`, won: after(chapter.id, 4) });
}

destinations.push(
  { id: 'revelacion-final', group: 'Final', label: 'Revelación del centro del mapa', path: '/campania/revelacion', won: after('f', 0) },
  { id: 'mapa-final', group: 'Final', label: 'Mapa de la Casa del Sello', path: '/campania/region/f', won: after('f', 0) },
);
for (const [index, stage] of stagesForChapter('f').entries()) {
  const won = after('f', index);
  destinations.push(
    { id: `mision-${stage.id}`, group: 'Final', label: `M${stage.id} · ${stage.title}`, path: `/campania/mision/${stage.id}`, won },
    { id: `duelo-${stage.id}`, group: 'Final', label: `Combate M${stage.id}${stage.id === '38' ? ' · Sigumán' : ''}`, path: `/campania/mision/${stage.id}?qaEscena=combate`, won },
    { id: `dialogo-${stage.id}`, group: 'Final', label: `Diálogo tras M${stage.id}`, path: `/campania/conversacion/${stage.id}`, won: after('f', index + 1) },
  );
}
destinations.push(
  { id: 'epilogo', group: 'Desenlace', label: 'Epílogo · primera página', path: '/campania/epilogo', won: after('f', finalMissions.length) },
  { id: 'epilogo-final', group: 'Desenlace', label: 'Epílogo · última página', path: '/campania/epilogo?qaPagina=4', won: after('f', finalMissions.length) },
  { id: 'creditos', group: 'Desenlace', label: 'Créditos', path: '/campania/creditos', won: after('f', finalMissions.length) },
  { id: 'baraja-desbloqueada', group: 'Desenlace', label: 'Editor de baraja desbloqueado', path: '/campania/baraja', won: after('f', 1) },
);

export const QA_CAMPAIGN_DESTINATIONS: readonly QaDestination[] = destinations;
export const QA_CAMPAIGN_GROUPS: readonly string[] = [...new Set(destinations.map(item => item.group))];

export function qaPreviewProgress(destination: QaDestination): CampaignProgress {
  const stars: Record<string, number> = {};
  const known = new Set(CAMPAIGN_MISSIONS.map(mission => mission.id));
  for (const id of destination.won) if (known.has(id)) stars[id] = 1;
  return { version: 1, stars };
}

export function isCampaignQaAvailable(): boolean {
  if (typeof window === 'undefined' || import.meta.env?.VITE_ENABLE_CAMPAIGN_QA === 'false') return false;
  return Boolean(import.meta.env?.DEV || new URLSearchParams(window.location.search).get('drDev') === '1');
}

export function isCampaignQaActive(): boolean {
  if (!isCampaignQaAvailable()) return false;
  try { return window.sessionStorage.getItem(ACTIVE_KEY) === '1'; }
  catch { return false; }
}

/** Isolates every campaign read/write: the real player's localStorage is untouched. */
export function getCampaignStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return isCampaignQaActive() ? window.sessionStorage : window.localStorage; }
  catch { return null; }
}

/** Every jump starts a coherent, disposable snapshot to bypass *only* test navigation locks. */
export function startCampaignQaAt(destination: QaDestination): boolean {
  if (!isCampaignQaAvailable() || !QA_CAMPAIGN_DESTINATIONS.some(item => item.id === destination.id)) return false;
  try {
    for (const key of CAMPAIGN_META_KEYS) window.sessionStorage.removeItem(key);
    window.sessionStorage.setItem(ACTIVE_KEY, '1');
    window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(qaPreviewProgress(destination)));
    if (destination.id !== 'primer-ingreso') window.sessionStorage.setItem('decreto-real.campania.introduccion.v1', '1');
    if (destination.id !== 'presentacion-generales') window.sessionStorage.setItem('decreto-real.campania.generales-presentados.v1', '1');
    if (destination.id !== 'revelacion-final') window.sessionStorage.setItem('decreto-real.campania.centro-revelado.v1', '1');
    return true;
  } catch { return false; }
}

export function stopCampaignQa(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of CAMPAIGN_META_KEYS) window.sessionStorage.removeItem(key);
    window.sessionStorage.removeItem(ACTIVE_KEY);
  } catch { /* Storage blocked; this never deletes the real save. */ }
}
