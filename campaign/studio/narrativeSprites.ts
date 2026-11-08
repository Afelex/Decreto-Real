/**
 * Biblioteca verificable de expresiones para el prólogo. Solo se registran
 * archivos versionados en /public: no se aceptan URLs arbitrarias de terceros.
 * Se comparte entre el editor y el combate narrativo publicado.
 */
import type {StudioNarrativeCard,StudioNarrativeTone} from './schema.ts';

export type NarrativeSprite={
  id:string;speaker:'Xervias'|'Domingo Quispe';
  label:string;path:string;
};
export const NARRATIVE_SPRITES:readonly NarrativeSprite[]=[
  {id:'xervias-tutorial',speaker:'Xervias',label:'Neutral · explicando',
    path:'campania/prologo/sprites/xervias_03_tutorial.webp'},
  {id:'xervias-objecion',speaker:'Xervias',label:'Decidido · objeción',
    path:'campania/prologo/sprites/xervias_01_objecion.webp'},
  {id:'xervias-invoca',speaker:'Xervias',label:'Invocación · acción',
    path:'campania/prologo/sprites/xervias_02_invoca.webp'},
  {id:'xervias-reflexion',speaker:'Xervias',label:'Reflexivo · sereno',
    path:'campania/prologo/sprites/xervias_04_reflexion.webp'},
  {id:'xervias-energia',speaker:'Xervias',label:'Energía del anillo',
    path:'campania/prologo-v3/sprites/xervias_05_anillo_energia.png'},
  {id:'domingo-neutro',speaker:'Domingo Quispe',label:'Neutral',
    path:'campania/prologo/sprites/domingo_01_neutro.webp'},
  {id:'domingo-arrogante',speaker:'Domingo Quispe',label:'Arrogante',
    path:'campania/prologo/sprites/domingo_02_arrogante.webp'},
  {id:'domingo-furioso',speaker:'Domingo Quispe',label:'Furioso',
    path:'campania/prologo/sprites/domingo_03_furioso.webp'},
  {id:'domingo-derrotado',speaker:'Domingo Quispe',label:'Derrotado · preocupado',
    path:'campania/prologo/sprites/domingo_04_derrotado.webp'},
  {id:'domingo-serio',speaker:'Domingo Quispe',label:'Serio',
    path:'campania/prologo-v2/sprites/domingo_01_serio.webp'},
  {id:'domingo-molesto',speaker:'Domingo Quispe',label:'Molesto',
    path:'campania/prologo-v2/sprites/domingo_02_molesto.webp'},
  {id:'domingo-burlon',speaker:'Domingo Quispe',label:'Burlón',
    path:'campania/prologo-v2/sprites/domingo_03_burlon.webp'},
  {id:'domingo-invocacion',speaker:'Domingo Quispe',label:'Invocación de combate',
    path:'campania/prologo-v3/sprites/domingo_08_invocacion_combate.png'},
] as const;

const byId=new Map(NARRATIVE_SPRITES.map(sprite=>[sprite.id,sprite]));
export const narrativeSpriteById=(id:string):NarrativeSprite|undefined=>byId.get(id);
export const isNarrativeSpriteId=(id:unknown):id is string=>
  typeof id==='string'&&byId.has(id);
export const narrativeSpriteOptions=(speaker:string):readonly NarrativeSprite[]=>
  NARRATIVE_SPRITES.filter(item=>item.speaker===speaker);

const AUTO:Readonly<Record<'Xervias'|'Domingo Quispe',Record<StudioNarrativeTone,string>>>={
  Xervias:{
    neutral:'xervias-tutorial',decidido:'xervias-objecion',
    preocupado:'xervias-reflexion',sorprendido:'xervias-invoca',
    enojado:'xervias-objecion',sereno:'xervias-reflexion',
  },
  'Domingo Quispe':{
    neutral:'domingo-neutro',decidido:'domingo-arrogante',
    preocupado:'domingo-derrotado',sorprendido:'domingo-burlon',
    enojado:'domingo-furioso',sereno:'domingo-serio',
  },
};

/** Una selección explícita incorrecta nunca muestra al personaje equivocado.
 * Sin selección, la emoción de la ficha dirige la expresión automáticamente. */
export function resolveNarrativeSprite(
  speaker:string,tone:StudioNarrativeTone='neutral',spriteId?:string,
):NarrativeSprite|undefined{
  if(speaker!=='Xervias'&&speaker!=='Domingo Quispe')return undefined;
  const chosen=spriteId?byId.get(spriteId):undefined;
  if(chosen&&chosen.speaker===speaker)return chosen;
  return byId.get(AUTO[speaker][tone]??AUTO[speaker].neutral);
}
export function resolveNarrativeCardSprite(
  card:StudioNarrativeCard|undefined,fallbackSpeaker:string,
):NarrativeSprite|undefined{
  return resolveNarrativeSprite(card?.speaker??fallbackSpeaker,card?.tone??'neutral',card?.spriteId);
}

/** Decisión narrativa de aparición: al hablar en una pausa se muestra el
 * personaje, durante una acción la imagen se oculta salvo decisión explícita.
 * Nunca cambia el guion, la baraja ni los tiempos del combate. */
export function narrativePortraitVisible(
  step:{speaker:string;action?:string},card?:StudioNarrativeCard,
):boolean {
  const speaker=card?.speaker??step.speaker;
  if(speaker!=='Xervias'&&speaker!=='Domingo Quispe')return false;
  if(card?.portraitMode==='hide')return false;
  if(card?.portraitMode==='show')return true;
  return !step.action;
}
