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
    "Mi caballería llega antes que cualquier duda.",
    "También llega antes que la verdad, y por eso daña inocentes.",
    "En la guerra solo importa quién llega primero.",
    "¡Una última carga acabará contigo!",
    "Dices que dudo porque aún no has visto mi fuerza.",
    "He corrido por todo el reino... sin saber para quién.",
    "Que desde hoy los caminos lleven testimonios, no amenazas."
  ],
  "11": [
    "No escuches a los mineros; solo quieren rebelarse.",
    "Sus heridas son verdaderas aunque alguien falsifique sus proclamas.",
    "No permitiré que abras la mina.",
    "¡Mis hombres aún obedecen!",
    "",
    "",
    "Ninguna mentira debe borrar un sufrimiento auténtico."
  ],
  "12": [
    "Los libros de trabajo no saldrán de mi oficina.",
    "Los hombres que trabajaron aquí tienen derecho a conocerlos.",
    "Si los lees, esta mina se volverá contra ti.",
    "No puedo perder esos registros.",
    "Los libros sostienen todo lo que he construido.",
    "Que nadie vea lo que hice firmar...",
    "Los registros hablarán por quienes obligaste a callar."
  ],
  "13": [
    "Una chispa bastará para enterrar las pruebas.",
    "Si enciendes la pólvora, también condenas a tus compañeros.",
    "Eso no te dará permiso para avanzar.",
    "¡No te acerques al depósito!",
    "",
    "",
    "Salvar vidas importa más que ganar una discusión."
  ],
  "14": [
    "Todo tiene un precio, hasta tus juramentos.",
    "No podrás comprar la justicia que negaste a los mineros.",
    "Entonces te enseñaré cuánto vale el poder.",
    "¡La plata aún me pertenece!",
    "Mis libros alimentan ejércitos enteros.",
    "Mis cuentas... serán mi condena.",
    "Que ese dinero regrese a quienes lo produjeron."
  ],
  "15": [
    "Nadie cruza el valle bajo el fuego de nuestros cañones.",
    "Hay aldeas detrás de tus blancos.",
    "Los daños de una guerra no son asunto de un explorador.",
    "¡El paso todavía está bajo nuestro fuego!",
    "",
    "",
    "Abriremos una ruta segura para los testigos."
  ],
  "16": [
    "Conozco la posición exacta de cada pieza.",
    "¿Y conoces a las personas que tienes al otro lado del cañón?",
    "Mi deber es apuntar. El tuyo, sobrevivir.",
    "¡Todavía me queda pólvora!",
    "Ni uno de mis disparos falla.",
    "Se ha hecho el silencio...",
    "Ahora también podrás escuchar a quienes atacabas."
  ],
  "17": [
    "Las puertas del bastión no se abrirán.",
    "Dentro hay personas que no forman parte de esta guerra.",
    "Tengo órdenes de mantenerlas encerradas.",
    "¡La última puerta resistirá!",
    "",
    "",
    "Que salgan los prisioneros antes de hablar de victoria."
  ],
  "18": [
    "El trueno de mis cañones es la voz del orden.",
    "Si solo puedes hacerte oír con miedo, has perdido tu autoridad.",
    "Mis murallas no oyen sermones.",
    "¡Mi fortaleza no se rendirá!",
    "Aún puedo convertir este campo en cenizas.",
    "Mis cañones callaron... y ahora oigo lo que oculté.",
    "Que el silencio permita declarar a quienes sobrevivieron."
  ],
  "19": [
    "Estos senderos no figuran en los mapas.",
    "Sus habitantes conocen cada curva mejor que tus oficiales.",
    "Entonces no los hallarás por tu cuenta.",
    "¡Nunca cruzarás nuestra frontera!",
    "",
    "",
    "Escuchar el territorio es el primer paso para comprenderlo."
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
    "¡Alto! El pregón ordena arrestar a todos los testigos.",
    "¿Y por qué el otro decreto, con el mismo sello, pide liberarlos?",
    "Las preguntas no cambian mis órdenes.",
    "No entregaré mi puesto por un muchacho.",
    "",
    "",
    "Hoy no ha vencido un sello: han hablado los testigos."
  ],
  "02": [
    "Tengo una orden urgente. Nadie puede leerla.",
    "Una orden que oculta su origen no merece obediencia ciega.",
    "Si quieres conocerla, tendrás que detenerme.",
    "No... ¡No permitiré que abras ese sobre!",
    "",
    "",
    "Ya sé hacia dónde conduce el rastro del sello."
  ],
  "03": [
    "Estas cajas contienen provisiones para el interior.",
    "La pólvora no alimenta a ningún pueblo.",
    "No tienes autoridad para inspeccionar la carga.",
    "El puerto no caerá en tus manos.",
    "",
    "",
    "Los libros del muelle dirán para quién eran esas armas."
  ],
  "04": [
    "Sin mi contraseña nadie pisa el arsenal.",
    "La contraseña no vale más que quienes sufrirán con esas armas.",
    "Entonces vuelve por donde viniste.",
    "¡Aún puedo avisar al Almirante!",
    "Pensé que eras solo un mensajero con espada.",
    "Mi puesto... mis hombres... todo se pierde.",
    "Tu derrota abre el arsenal, pero no me alegra tu miedo."
  ],
  "05": [
    "Los registros son propiedad del Almirante.",
    "Las pruebas de una mentira pertenecen a quienes la padecen.",
    "No tocarás un solo libro.",
    "¡Atrás! ¡Los sellos no deben salir de aquí!",
    "",
    "",
    "Estos manifiestos revelan otra ruta de la conspiración."
  ],
  "06": [
    "En mi puerto, la obediencia mantiene la paz.",
    "Una paz fundada en decretos falsos no es paz.",
    "Entonces demuéstrame que tu verdad puede proteger el Callao.",
    "Aún controlo las naves. No cederé.",
    "No fue la fuerza lo que me trajo hasta aquí.",
    "He perdido mi flota... quizás también la causa que juré servir.",
    "Que el puerto vuelva a abrirse. La verdad debe poder viajar."
  ],
  "07": [
    "Este convoy no puede detenerse por tus sospechas.",
    "Si lleva órdenes falsas, cada legua causará más daño.",
    "No conozco otra ley que llegar a tiempo.",
    "¡No dejaré que interceptes los decretos!",
    "",
    "",
    "Ahora las aldeas podrán escuchar una versión distinta."
  ],
  "08": [
    "Los caminos son míos. Todo viajero paga.",
    "Has convertido el miedo de la gente en tu recompensa.",
    "Y tú has venido a perder tu última moneda.",
    "¡Mis hombres no te dejarán pasar!",
    "He sobrevivido a guardias peores que tú.",
    "El camino... ya no me pertenece.",
    "Ni a ti ni a mí: debe volver a ser de todos."
  ],
  "09": [
    "Estas postas obedecen a un mando legítimo.",
    "Tus registros anuncian sucesos que aún no han ocurrido.",
    "Porque las órdenes no esperan a los indecisos.",
    "¡Ese libro no saldrá de aquí!",
    "",
    "",
    "Las fechas revelan cómo organizaron las mentiras."
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
