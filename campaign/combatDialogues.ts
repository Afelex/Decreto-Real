/** Combate narrativo: escenas exclusivas de las 38 misiones de Historia.
 * Nunca modifica daño, mazos, IA o determinismo de las reglas.
 */
import { STORY_STAGES } from './story.ts';
import { enemyForMission } from './characters.ts';

export type StorySpeech = Readonly<{ speaker: 'opponent' | 'player' | 'system'; text: string }>;
export type CombatConversation = Readonly<{
  opponentName: string;
  intro: readonly StorySpeech[];
  midpoint: readonly StorySpeech[];
  critical: readonly StorySpeech[];
  victory: readonly StorySpeech[];
  isBoss: boolean;
}>;

type DialogueRow = readonly [first: string, reply: string, challenge: string, critical: string, midpoint: string, defeat: string, finalReply: string];
const script: Readonly<Record<string, DialogueRow>> = {
  "10": [
    "He enviado mensajeros a todos los pueblos. Mis jinetes son los más rápidos del reino.",
    "¿Sabes que están llevando decretos falsos? Algunas familias ya fueron castigadas por esas órdenes.",
    "Me ordenaron repartirlas sin demora. Si me detengo a investigar cada carta, perderé el control de los caminos.",
    "¡Todavía tengo una última carga! No dejaré que rompas mi red.",
    "Empiezo a entender que mis mensajes pudieron hacer daño. Pero he jurado obedecer a mis superiores.",
    "Me venciste. Llevé cientos de órdenes sin comprobar si eran verdaderas.",
    "Ser rápido no sirve si llevas una mentira. Usaré tus cartas para averiguar quién las pagó."
  ],
  "11": [
    "Voy a cerrar la mina. Los trabajadores están protestando y mis superiores dicen que son rebeldes.",
    "¿Por qué protestan? He hablado con ellos: trabajan demasiado y reciben menos dinero del que les prometieron.",
    "Es verdad que están mal pagados, pero nos ordenaron llamar rebelde a cualquiera que se queje.",
    "¡No puedes entrar! Si ven los libros, sabrán cuánto les debemos.",
    "",
    "",
    "Los mineros sí están sufriendo. Investigaré sus denuncias sin aceptar las órdenes falsas que hablan en su nombre."
  ],
  "12": [
    "Guardo los libros de salarios. Si los trabajadores los leen, descubrirán que les pagamos menos de lo debido.",
    "Entonces ¿por qué escondes esa información? Es su dinero y tienen derecho a reclamarlo.",
    "El dueño de la mina me ordenó cambiar las cuentas. Si lo denuncio, también perderé mi trabajo.",
    "¡No pueden salir esos libros! Todos sabrán lo que hice.",
    "Durante años obedecí al dueño. Pensé que así protegía mi puesto, pero hice daño a mucha gente.",
    "Ya no puedo esconder los salarios que cambié. Los mineros sabrán la verdad.",
    "Estas cuentas servirán para devolver lo que les quitaron. Nadie debería perder su trabajo por pedir un pago justo."
  ],
  "13": [
    "Hay pólvora bajo esta salida. Si intentan llevarse los documentos, cerraré el paso.",
    "¿Por qué arriesgas la vida de los mineros? Solo queremos sacarlos y guardar las pruebas.",
    "Me ordenaron impedir que los libros salgan de aquí. Si los encuentran, descubrirán quién robó la plata.",
    "¡No te acerques! Un error puede derrumbar la mina.",
    "",
    "",
    "Primero pondremos a salvo a los mineros. Después seguiremos la pista del dinero robado."
  ],
  "14": [
    "Soy el dueño de estas minas. Una parte de la plata sirve para pagar a los soldados de la Falsa Luz.",
    "¿Por qué financias a Sigumán? Tus trabajadores pasan hambre mientras tú pagas por una rebelión.",
    "Sigumán me prometió conservar mis tierras y mis minas. Si él manda, nadie revisará mis cuentas.",
    "¡Todavía tengo oro y hombres a mi servicio!",
    "Si el reino cambia de dueño, podría perder todo lo que tengo. Por eso necesito que Sigumán gane.",
    "Me venciste. Los libros mostrarán a quién pagué y cuánto me quedé.",
    "La plata es fruto del trabajo de los mineros. Recuperaremos lo que les debes y seguiremos los pagos."
  ],
  "15": [
    "Nos ordenaron disparar contra cualquiera que intente llegar al bastión.",
    "¿Incluso contra los vecinos? Hay familias que necesitan cruzar para escapar de los cañones.",
    "El general teme que entren espías. Por eso cerró todos los caminos, aunque la gente viva aquí.",
    "¡No avances! Todavía tenemos munición.",
    "",
    "",
    "Debemos abrir un paso seguro para los vecinos antes de atacar la fortaleza."
  ],
  "16": [
    "Estoy apuntando los cañones hacia los caminos. Nadie podrá acercarse a la fortaleza.",
    "¿Por qué apuntas donde pasan las familias? Estás impidiendo que salgan de la zona de combate.",
    "El general dice que cualquiera que escape puede ser un espía. Me ordenó cerrar todas las salidas.",
    "¡Todavía tengo pólvora! No pasarán.",
    "Mis cañones son precisos, pero por primera vez me pregunto a quién estoy disparando.",
    "Ya no puedo detenerte. Te dejaré los planos de la fortaleza.",
    "Con esos planos abriremos un camino seguro. Un cañón no debería decidir qué vidas importan."
  ],
  "17": [
    "Detrás de esta puerta hay testigos encerrados. Tengo órdenes de no soltarlos.",
    "¿Por qué están presos? Solo vieron quién llevó la pólvora a la fortaleza.",
    "Precisamente por eso. El general no quiere que cuenten lo que saben.",
    "¡No abriré la puerta! Me lo han prohibido.",
    "",
    "",
    "Los testigos quedan libres. Ahora podrán explicar quién envió las armas y los decretos."
  ],
  "18": [
    "He puesto cañones en toda la fortaleza. Nadie se atreverá a desafiarme mientras pueda disparar.",
    "¿Por qué amenazas a los pueblos? Dices que mantienes la paz, pero la gente vive con miedo.",
    "Porque cuando me temen, obedecen. Así evito que apoyen a los rebeldes de Sigumán o a sus enemigos.",
    "¡Mi fortaleza no caerá! Todavía puedo disparar.",
    "Creí que el miedo era la única forma de mantener el orden. Ahora mis propios soldados empiezan a dudar.",
    "Mis cañones se han callado. Ya no puedo impedir que los testigos hablen.",
    "Esos testimonios nos dirán quién cruzó la frontera. Gobernar con miedo nunca fue proteger al pueblo."
  ],
  "19": [
    "Vigilo este sendero. No sale en los mapas oficiales y no quiero que entren soldados de fuera.",
    "¿Por qué lo ocultas? Estamos siguiendo a mensajeros que llevan órdenes falsas a las aldeas.",
    "Porque otros soldados entraron antes y dañaron a nuestra gente. No sabemos si tú harás lo mismo.",
    "¡No daré el camino a un desconocido!",
    "",
    "",
    "Escucharé primero a las familias de la frontera. Ellas saben por dónde pasaron los mensajeros."
  ],
  "20": [
    "Conozco las rutas que tus mapas no pueden nombrar.",
    "No vengo a tomar tus rutas; quiero descubrir quién las usa.",
    "Mi familia depende de que nadie cruce.",
    "¡No arriesgaré la vida de los míos!",
    "No puedes comprender lo que estoy protegiendo.",
    "Tal vez pueda encontrar otro modo de cuidarlos.",
    "Un camino abierto vale más si nadie debe pagarlo con miedo."
  ],
  "21": [
    "Cada aldea escucha la proclamación que necesita.",
    "Eso no es informar: es dividir para gobernar.",
    "La verdad cambia según quien la cuente.",
    "¡No conseguirás detener todos los mensajes!",
    "",
    "",
    "Una misma firma une versiones que pretendían ser distintas."
  ],
  "22": [
    "Los soldados de la capital siempre traen promesas.",
    "He venido con pruebas, no con nuevas órdenes.",
    "Si te equivocas, mi gente pagará el precio.",
    "No subestimes lo que protege esta selva.",
    "Antes te derrotaría que entregar a mi pueblo.",
    "La tinta... coincide con los decretos que recibí.",
    "Nayisa, protege a tu pueblo. Yo llevaré la prueba fuera de aquí."
  ],
  "23": [
    "Una bandera debe gobernar esta plaza.",
    "Ningún color vale más que los vecinos que separaste.",
    "Entonces elige un bando y lucha.",
    "¡La plaza todavía me obedece!",
    "",
    "",
    "Que vuelva la palabra antes que las armas."
  ],
  "24": [
    "La Falsa Luz librará a todos de sus dudas.",
    "Quitarles el derecho a decidir no es liberarlos.",
    "La multitud cree en mí, no en tus preguntas.",
    "¡No perderé a mis seguidores!",
    "He sostenido esta ciudad con una promesa.",
    "Mis palabras ya no bastan...",
    "Una promesa no justifica engañar a quienes confían en ti."
  ],
  "25": [
    "Estos archivos están cerrados por orden superior.",
    "Solo quiero comparar las dos versiones del decreto.",
    "Una de ellas no existe oficialmente.",
    "¡Los libros no saldrán de aquí!",
    "",
    "",
    "Ningún archivo puede esconder para siempre su contradicción."
  ],
  "26": [
    "Sin mi estandarte, esta ciudad se romperá.",
    "La unidad no se construye negando lo que pasó.",
    "Si lo derribas, tú cargarás con sus consecuencias.",
    "¡Mis soldados no abandonarán la bandera!",
    "He consagrado mi vida a este símbolo.",
    "Quizás confundí defender la ciudad con defender mi estandarte.",
    "Que la ciudad permanezca unida por sus habitantes, Isabela."
  ],
  "27": [
    "Nadie puede pasar por la tormenta.",
    "No abandonaré a quienes llevan las pruebas.",
    "Entonces la montaña decidirá por ti.",
    "¡El desfiladero sigue cerrado!",
    "",
    "",
    "Cruzaremos juntos, o no cruzaremos."
  ],
  "28": [
    "Juramos guardar estas rutas hasta la muerte.",
    "Un juramento debe proteger a alguien, no condenarlo.",
    "No puedo decidirlo mientras empuñas una espada.",
    "¡Mi palabra no caerá contigo!",
    "He custodiado este paso durante años.",
    "Quizás abrí los ojos demasiado tarde.",
    "Aún puedes usar tu juramento para salvar a otros."
  ],
  "29": [
    "El Cóndor conoce cada paso que intentas tomar.",
    "Y yo conozco lo que ha costado llegar hasta aquí.",
    "Entonces todavía no conoces el miedo de la cumbre.",
    "¡El puente seguirá cerrado!",
    "",
    "",
    "La última respuesta nos espera al otro lado."
  ],
  "30": [
    "Hay promesas escritas con sangre de generaciones.",
    "Y también nombres borrados de los documentos que guardas.",
    "Lo que protejo es más antiguo que tu causa.",
    "¡Mis cumbres no serán tu victoria!",
    "Nadie rompe un juramento sin pagar un precio.",
    "Esta carta... fue escrita antes de que nos mintieran.",
    "Aukan, entrégala. Lo que pasó merece ser conocido."
  ],
  "31": [
    "Los heraldos no cuestionamos el juramento.",
    "Entonces no sabéis a quién estáis protegiendo.",
    "Protegemos la palabra de nuestros superiores.",
    "¡Mi palabra no será puesta en duda!",
    "",
    "",
    "Las promesas deben responder ante las personas."
  ],
  "32": [
    "Mi deber es guardar cada copia de estos documentos.",
    "Tu deber también es impedir que los falsifiquen.",
    "No soy quien debe decidir cuál es verdadera.",
    "¡No abrirás la cámara del juramento!",
    "He protegido esos papeles durante años.",
    "Guardarlos también me hizo cómplice de su silencio.",
    "Ahora puedes custodiar las pruebas sin ocultarlas."
  ],
  "33": [
    "Tras esa puerta duerme la versión oficial.",
    "Y también las palabras que borraron de ella.",
    "No harás que las lea frente a mis hombres.",
    "¡La cámara seguirá cerrada!",
    "",
    "",
    "Una orden no se vuelve justa por estar bajo llave."
  ],
  "34": [
    "Juramos guardar la paz, no discutir su origen.",
    "Pero alguien cambió las palabras de tu juramento.",
    "Si eso es cierto, toda mi vida fue una mentira.",
    "¡No permitiré que derribes mi palabra!",
    "¿Qué queda de un caballero sin su juramento?",
    "No defendí la paz... defendí un texto adulterado.",
    "Aún puedes cumplir tu promesa protegiendo la verdad, Gonzalo."
  ],
  "35": [
    "No inventé el sufrimiento del reino; solo escribí lo que deseaban oír.",
    "Usaste ese dolor para fabricar decretos que enfrentaron a inocentes.",
    "Las palabras siempre pertenecen al vencedor.",
    "¡Mis originales nunca verán la luz!",
    "Todo comenzó en mi mesa, pero no terminará aquí.",
    "La escritura me dio poder... y ahora me condena.",
    "Los testimonios quedarán junto a tus falsificaciones, Leocadio."
  ],
  "36": [
    "Fuimos compañeros. Tú obedecías; yo aprendí a ganar.",
    "Confundes ganar con tomar lo que no te pertenece.",
    "Todavía puedes seguirme, Xervias. Es nuestra última oportunidad.",
    "¡No me derrotarás con ideales!",
    "No necesito a Sigumán para vencerte.",
    "Caí... pero no me arrepiento de haber elegido el poder.",
    "No te dejaré decidir por los inocentes otra vez."
  ],
  "37": [
    "Sigumán no te entregará el rastro de Zhinchi.",
    "No abandonaré a mi maestro ni a las personas que protegió.",
    "Entonces tendrás que buscar entre los escombros.",
    "¡Todavía guardo la última entrada!",
    "",
    "",
    "Zhinchi, seguiré tu promesa aunque no pueda encontrarte hoy."
  ],
  "38": [
    "He traído orden a un reino dividido por su propia verdad.",
    "Convertiste injusticias reales en una mentira que sometió a todos.",
    "¿Y qué harás tú, Xervias? ¿Gobernar con dudas?",
    "¡Aún puedo sostener la Falsa Luz!",
    "Mira a tu alrededor. Incluso mis enemigos necesitan autoridad.",
    "Mi voluntad... no bastó para sostener este reino.",
    "No vengo a reemplazar tu voluntad por la mía. Vengo a devolverles su voz."
  ],
  "01": [
    "Voy a detener a estas familias. Tengo una orden que dice que son culpables.",
    "¿Por qué las detienes? Yo tengo otro decreto, con el mismo sello, que dice que deben quedar libres.",
    "No sé cuál es el verdadero. Mi capitán me ordenó arrestarlas. Si desobedezco, también me castigarán.",
    "¡Espera! Si pierdo, mi capitán dirá que traicioné al reino.",
    "",
    "",
    "No voy a castigar a estas familias por una orden que nadie puede explicar. Primero vamos a descubrir quién la cambió."
  ],
  "02": [
    "Llevo una carta urgente hacia el puerto. Me han prohibido enseñársela a nadie.",
    "¿Quién te dio esa orden? En el pueblo hay dos decretos opuestos. Necesito saber quién los envió.",
    "Me pagaron por entregar la carta sin hacer preguntas. No sé lo que dice y no puedo dejarte pasar.",
    "¡Espera! Si me quitas la carta, perderé mi trabajo.",
    "",
    "",
    "Esta carta tiene la marca del puerto del Callao. Allí buscaré a quien está enviando los decretos falsos."
  ],
  "03": [
    "Estamos descargando estas cajas. En los papeles dice que llevan comida para el interior.",
    "Entonces, ¿por qué hay pólvora dentro? Si estas armas llegan a los pueblos, puede empezar una guerra.",
    "Nos ordenaron declarar la pólvora como comida para que nadie revise el cargamento. Yo solo cumplo con mi turno.",
    "¡No puedes llevarte esos documentos! El Almirante los necesita.",
    "",
    "",
    "Ya sé que alguien esconde armas en los barcos. Ahora necesito descubrir quién dio la orden."
  ],
  "04": [
    "Soy el contramaestre. Controlo la entrada al arsenal y nadie pasa sin mi contraseña.",
    "¿Qué guardan ahí? He visto cajas de pólvora registradas como comida. Quiero revisar los libros del puerto.",
    "Guardamos las armas de la flota. Si dejas que otros vean esos libros, el Almirante perderá el control de los muelles.",
    "¡Todavía puedo avisar al Almirante y cerrar el puerto!",
    "Has llegado más lejos de lo que esperaba. Si caigo, perderé mi puesto y mis hombres quedarán sin mando.",
    "No puedo detenerte. La entrada al arsenal es tuya.",
    "Entraré por las pruebas. Si tus hombres dejan de luchar, nadie tendrá que salir herido."
  ],
  "05": [
    "Estos libros muestran a dónde fue enviada la pólvora. Mi orden es impedir que alguien los lea.",
    "¿Por qué quieren ocultarlos? Podrían decirnos quién está preparando una guerra sin que el pueblo lo sepa.",
    "Porque si la gente ve los nombres, se enfrentará a sus propios jefes. Por eso el Almirante cerró el archivo.",
    "¡No te llevarás los registros! Todavía puedo quemarlos.",
    "",
    "",
    "Los envíos pasan por las estaciones de mensajeros del reino. Seguiré esa ruta para encontrar al responsable."
  ],
  "06": [
    "He cerrado el Callao y retenido los barcos. Así impido que el caos llegue a la costa.",
    "¿Y las familias que necesitan esos barcos? Además, alguien ha escondido armas y falsificado órdenes en tu puerto.",
    "Lo sé, pero temo que una rebelión destruya la ciudad. Prefiero mandar con firmeza antes que perder el control.",
    "¡Aún tengo soldados y barcos! No abriré el puerto.",
    "Mis órdenes están causando daño, pero si retiro la guardia, ¿quién protegerá el Callao?",
    "He perdido el puerto. Tal vez mi miedo me hizo obedecer a los hombres equivocados.",
    "Proteger una ciudad también es dejar que se conozca la verdad. Abriremos el puerto y seguiremos la ruta de las cartas."
  ],
  "07": [
    "Debo entregar estos decretos hoy mismo. Los pueblos esperan órdenes de la capital.",
    "¿Sabes lo que dicen? Ya encontramos decretos falsos. Si entregas estos, podrían castigar a gente inocente.",
    "No los he leído. Solo me pagan por llevarlos rápido. Si no llego hoy, perderé mi puesto.",
    "¡No me quites las cartas! Debo cumplir con la entrega.",
    "",
    "",
    "Detuvimos estas órdenes antes de que llegaran a los pueblos. Ahora revisaremos quién las escribió."
  ],
  "08": [
    "Estoy cobrando dinero para dejar pasar las caravanas. Es mi nueva ley del camino.",
    "¿Por qué les cobras? Esa gente solo lleva alimentos y cartas. No debería pagar para viajar.",
    "Los soldados abandonaron esta ruta y nadie me paga por cuidarla. Así que decidí quedarme con lo que pasa.",
    "¡Mis hombres todavía controlan el camino!",
    "Si pierdo el paso, perderé todo el dinero que he reunido.",
    "Está bien, el camino queda abierto. Mis hombres se retirarán.",
    "No necesitas robar para vivir. Las caravanas podrán pasar y llevar las denuncias que alguien intenta detener."
  ],
  "09": [
    "Estos son los registros de la estación de mensajeros. No puedo mostrártelos.",
    "¿Por qué? Algunas cartas están fechadas antes de que ocurrieran los hechos que anuncian.",
    "Porque las órdenes llegaron preparadas desde la capital. Nos dijeron que las enviáramos en la fecha indicada.",
    "¡Ese libro no saldrá de aquí! Podría perder mi empleo.",
    "",
    "",
    "Alguien escribió las noticias antes de que ocurrieran. Esto demuestra que la rebelión se está organizando con mentiras."
  ]
};

const speech = (speaker: StorySpeech['speaker'], text: string): StorySpeech => ({ speaker, text });

export function combatConversationForMission(missionId: string): CombatConversation | undefined {
  const stage = STORY_STAGES.find(stage => stage.id === missionId);
  const lines = script[missionId];
  if (!stage || !lines) return undefined;
  const [first, reply, challenge, critical, midpoint, defeat, finalReply] = lines;
  const isBoss = stage.kind === 'subboss' || stage.kind === 'boss' || stage.kind === 'final';
  return {
    opponentName: enemyForMission(missionId)?.name ?? stage.opponent,
    isBoss,
    intro: [speech('opponent', first), speech('player', reply), speech('opponent', challenge), speech('system', 'Inicia el combate')],
    midpoint: isBoss ? [speech('opponent', midpoint)] : [],
    critical: [speech('opponent', critical)],
    victory: isBoss ? [speech('opponent', defeat), speech('player', finalReply)] : [speech('player', finalReply)],
  };
}
