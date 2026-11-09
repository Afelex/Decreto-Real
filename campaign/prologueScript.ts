/**
 * Guion del prólogo cinematográfico (antes y después del duelo guiado).
 * Cada intervención tiene un `id` ESTABLE: Decreto Real Studio v3 guarda las
 * composiciones por id, de modo que insertar o reordenar diálogos no desplaza
 * las ediciones a otra intervención. No cambiar un id existente; para un
 * diálogo nuevo, crear un id nuevo.
 */
export type PrologueSceneId = 'pergamino' | 'arresto' | 'xervias' | 'revision' | 'desafio' | 'anillo' | 'versus';
export type AfterDuelPhase = 'desenlace' | 'zhinchi' | 'cetro' | 'resolucion' | 'reflexion';
export type OpeningBeat = {id: string; scene: PrologueSceneId; speaker: string; text: string; title: string};
export type AfterDuelBeat = {id: string; phase: AfterDuelPhase; speaker: string; text: string};

export const OPENING_BEATS: readonly OpeningBeat[] = [
  {id:'pergamino-01',scene:'pergamino',title:'Los Reinos del Perú',speaker:'Crónica',text:'Año 16XX. Los Reinos del Perú. En estas tierras, la paz y el orden se mantienen gracias a las leyes del reino.'},
  {id:'pergamino-02',scene:'pergamino',title:'Los Sellos Reales',speaker:'Crónica',text:'Las órdenes más importantes llevan un Sello Real. Pero esos sellos no son simples marcas: en su interior guardan un misterioso poder místico.'},
  {id:'pergamino-03',scene:'pergamino',title:'Un poder especial',speaker:'Crónica',text:'Todos pueden ver los sellos, pero solo algunas personas son capaces de percibir su energía y comprobar su autenticidad.'},
  {id:'pergamino-04',scene:'pergamino',title:'El misterio del Sello Real',speaker:'Crónica',text:'Sin embargo, algo extraño está ocurriendo. Han comenzado a aparecer decretos contradictorios: sus sellos parecen verdaderos, pero su energía no corresponde con las órdenes.'},
  {id:'pergamino-05',scene:'pergamino',title:'El misterio del Sello Real',speaker:'Crónica',text:'Alguien está alterando los sellos del reino. Si nadie puede confiar en las leyes, la paz de los Reinos del Perú estará en peligro.'},
  {id:'arresto-01',scene:'arresto',title:'Una orden inesperada',speaker:'Madre',text:'¡Por favor! ¡No hemos hecho nada! ¡Mis hijos no han cometido ningún crimen!'},
  {id:'arresto-02',scene:'arresto',title:'Una orden inesperada',speaker:'Domingo Quispe',text:'Lo siento, señora. Tenemos órdenes de llevarlos bajo custodia. El documento tiene el Sello Real.'},
  {id:'arresto-03',scene:'arresto',title:'Una orden inesperada',speaker:'Madre',text:'¡Pero ayer nos dijeron que éramos libres! ¿Por qué ahora quieren encarcelarnos?'},
  {id:'xervias-01',scene:'xervias',title:'Un joven soldado interviene',speaker:'Xervias',text:'¡Un momento! ¿Qué está sucediendo aquí?'},
  {id:'xervias-02',scene:'xervias',title:'Un joven soldado interviene',speaker:'Domingo Quispe',text:'No te metas. Estamos cumpliendo una orden de la Corona.'},
  {id:'xervias-03',scene:'xervias',title:'Un joven soldado interviene',speaker:'Madre',text:'¡Joven soldado, ayúdenos! ¡Le suplico que escuche nuestra historia!'},
  {id:'revision-01',scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Permíteme revisar ese decreto. Si es legítimo, debe poder comprobarse.'},
  {id:'revision-02',scene:'revision',title:'Un decreto bajo sospecha',speaker:'Domingo Quispe',text:'¡No puedes cuestionar el Sello Real! ¡Una orden es una orden!'},
  {id:'revision-03',scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Artículo VII de la Orden: cuando exista duda razonable sobre un decreto, un soldado puede solicitar su verificación antes de ejecutarlo.'},
  {id:'revision-04',scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Mi anillo percibe la energía del sello, pero no la reconoce en el texto. Algo no concuerda. Necesitamos investigar.'},
  {id:'desafio-01',scene:'desafio',title:'El honor de la Corona',speaker:'Domingo Quispe',text:'¡Silencio! Acabas de graduarte de la academia. ¡No eres nadie para cuestionarme!'},
  {id:'desafio-02',scene:'desafio',title:'El honor de la Corona',speaker:'Xervias',text:'¿Nadie? Soy soldado de este reino. He jurado proteger a quienes no pueden defenderse.'},
  {id:'desafio-03',scene:'desafio',title:'El honor de la Corona',speaker:'Xervias',text:'En nombre de la justicia y del honor de la Corona, exijo que suspendas este arresto hasta aclarar la verdad.'},
  {id:'desafio-04',scene:'desafio',title:'El honor de la Corona',speaker:'Domingo Quispe',text:'¡No pienso obedecerte! ¡Soy Domingo Quispe, guardia del pregón, y tengo autoridad para detenerlos!'},
  {id:'anillo-01',scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'Este anillo representa mi fidelidad al reino... y mi deber de proteger a los inocentes.'},
  {id:'anillo-02',scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'¡Activo el DECRETO REAL!'},
  {id:'anillo-03',scene:'anillo',title:'El juramento de Xervias',speaker:'Domingo Quispe',text:'¿Qué estás haciendo? ¡¿Te atreves a declararme un duelo?!'},
  {id:'anillo-04',scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'He declarado Decreto Real porque tu orden es dudosa y pretendes lastimar a una familia. Defendamos nuestras razones en el duelo.'},
  {id:'anillo-05',scene:'anillo',title:'El juramento de Xervias',speaker:'Domingo Quispe',text:'¡Muy bien! Invocaré mi propio Decreto Real. ¡Ahora estás en problemas!'},
  {id:'versus-01',scene:'versus',title:'El duelo comienza',speaker:'Crónica',text:'Las dos Cartas Doradas de Invocación Real responden a la energía de sus portadores. El desafío ha sido aceptado. ¡Comienza el Decreto Real!'},
];

export const AFTER_DUEL_BEATS: readonly AfterDuelBeat[] = [
  {id:'desenlace-01',phase:'desenlace',speaker:'Domingo Quispe',text:'¡¿Qué?! ¡Mi anillo...! ¡No puedo mantener el vínculo!'},
  {id:'desenlace-02',phase:'desenlace',speaker:'Crónica',text:'Las cartas desaparecen. Domingo cae de rodillas y pierde el conocimiento tras la descarga mística.'},
  {id:'desenlace-03',phase:'desenlace',speaker:'Madre',text:'¡Dios mío! ¿Qué le ocurrió? ¿Está muerto?'},
  {id:'desenlace-04',phase:'desenlace',speaker:'Xervias',text:'No. Está vivo. Al perder un Decreto Real, el vínculo místico con el anillo se rompe por unos instantes.'},
  {id:'desenlace-05',phase:'desenlace',speaker:'Xervias',text:'Esa descarga puede dejar al vencido inconsciente. Pronto despertará.'},
  {id:'desenlace-06',phase:'desenlace',speaker:'Domingo Quispe',text:'¿Qué... qué pasó? ¿Por qué no siento la energía de mi anillo?'},
  {id:'desenlace-07',phase:'desenlace',speaker:'Xervias',text:'Has perdido. Mi Decreto Final rompió tu vínculo místico. Este arresto queda suspendido hasta verificar la orden.'},
  {id:'desenlace-08',phase:'desenlace',speaker:'Domingo Quispe',text:'Pero... el documento tenía el sello de la Corona...'},
  {id:'desenlace-09',phase:'desenlace',speaker:'Madre',text:'Gracias, joven soldado. No sabemos qué habría sido de nosotros.'},
  {id:'zhinchi-01',phase:'zhinchi',speaker:'Zhinchi',text:'¡Alto! ¿Qué sucede aquí?'},
  {id:'zhinchi-02',phase:'zhinchi',speaker:'Xervias',text:'¡Capitán Zhinchi!'},
  {id:'zhinchi-03',phase:'zhinchi',speaker:'Zhinchi',text:'Xervias, explícame esta situación. ¿Por qué hay un soldado derrotado y una familia bajo amenaza?'},
  {id:'zhinchi-04',phase:'zhinchi',speaker:'Xervias',text:'Este guardia quiso detenerlos con un decreto sospechoso. Le pedí verificarlo, se negó y tuve que invocar el Decreto Real.'},
  {id:'cetro-01',phase:'cetro',speaker:'Zhinchi',text:'Déjame examinar esa orden.'},
  {id:'cetro-02',phase:'cetro',speaker:'Crónica',text:'Zhinchi toma el documento y acerca al sello su pequeño cetro de mando, que lleva sujeto al cinturón.'},
  {id:'cetro-03',phase:'cetro',speaker:'Zhinchi',text:'La marca parece auténtica... pero mi cetro no percibe ninguna resonancia mística.'},
  {id:'cetro-04',phase:'cetro',speaker:'Xervias',text:'¡Mi anillo detectó lo mismo, capitán!'},
  {id:'cetro-05',phase:'cetro',speaker:'Zhinchi',text:'Entonces tenías razón. El sello no es legítimo. Alguien está falsificando las órdenes de la Corona.'},
  {id:'resolucion-01',phase:'resolucion',speaker:'Madre',text:'¿Entonces podemos irnos?'},
  {id:'resolucion-02',phase:'resolucion',speaker:'Zhinchi',text:'Sí. Este arresto queda suspendido. Pueden retirarse en paz.'},
  {id:'resolucion-03',phase:'resolucion',speaker:'Zhinchi',text:'Domingo Quispe, vendrás conmigo. Tendrás que explicar quién te entregó este documento.'},
  {id:'resolucion-04',phase:'resolucion',speaker:'Domingo Quispe',text:'Capitán... yo solo cumplía órdenes.'},
  {id:'resolucion-05',phase:'resolucion',speaker:'Zhinchi',text:'Entonces podrás demostrarlo en tu declaración. No volverás a detener a nadie por esta orden.'},
  {id:'resolucion-06',phase:'resolucion',speaker:'Zhinchi',text:'Xervias, me ocuparé del detenido y del papeleo. Espérame cuando termine. Quiero que me acompañes.'},
  {id:'resolucion-07',phase:'resolucion',speaker:'Xervias',text:'¡Sí, capitán!'},
  {id:'reflexion-01',phase:'reflexion',speaker:'Crónica',text:'La familia se aleja a salvo. El capitán se marcha con el guardia. Xervias queda solo frente a la plaza.'},
  {id:'reflexion-02',phase:'reflexion',speaker:'Xervias',text:'Un sello falso... y, sin embargo, parecía auténtico a simple vista.'},
  {id:'reflexion-03',phase:'reflexion',speaker:'Xervias',text:'¿Quién podría hacer algo así? ¿Y cuántas órdenes más habrán sido alteradas?'},
];

export const PROLOGUE_PHASE_TITLES: Readonly<Record<AfterDuelPhase,string>> = {
  desenlace:'El precio de la victoria',
  zhinchi:'La llegada del capitán',
  cetro:'El sello bajo sospecha',
  resolucion:'Una decisión justa',
  reflexion:'El misterio continúa',
};

/** Prefijo de pantalla para las claves de escena de Studio v3. */
export const PROLOGUE_STUDIO_SCREEN = 'prologo';
/** Todas las intervenciones editables, en orden de reproducción. */
export const PROLOGUE_BEAT_IDS: readonly string[] = [
  ...OPENING_BEATS.map(beat=>beat.id),
  ...AFTER_DUEL_BEATS.map(beat=>beat.id),
];
/** Clave estable de Studio v3 para una intervención del prólogo. */
export function prologueSceneKey(beatId: string): string {
  if (!PROLOGUE_BEAT_IDS.includes(beatId)) throw new Error('Intervención del prólogo desconocida: ' + beatId);
  return PROLOGUE_STUDIO_SCREEN + '/' + beatId;
}

/** Intervenciones de la misma escena o fase que `beatId` (en orden), para «aplicar a toda la escena». */
export function prologueBeatGroup(beatId:string):string[] {
  const opening=OPENING_BEATS.find(beat=>beat.id===beatId);
  if(opening)return OPENING_BEATS.filter(beat=>beat.scene===opening.scene).map(beat=>beat.id);
  const after=AFTER_DUEL_BEATS.find(beat=>beat.id===beatId);
  if(after)return AFTER_DUEL_BEATS.filter(beat=>beat.phase===after.phase).map(beat=>beat.id);
  return [];
}
