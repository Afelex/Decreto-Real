/** Combate narrativo: escenas exclusivas de las 38 misiones de Historia.
 * Nunca modifica daño, mazos, IA o determinismo de las reglas.
 */
import { STORY_STAGES } from './story.ts';
import { enemyForMission } from './characters.ts';

export type StorySpeech = Readonly<{ speaker: 'opponent' | 'player' | 'system'; text: string }>;
export type CombatConversation = Readonly<{
  opponentName: string;
  opponentRole: string;
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
    "Soy el dueño de estas minas. Una parte de la plata sirve para pagar a los soldados de la Revolución Solar.",
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
    "Conozco el puente escondido. Estoy guiando por él a los mensajeros de la Revolución Solar.",
    "¿Por qué los ayudas? Están llevando órdenes falsas a las aldeas de la selva.",
    "Porque me amenazaron. Si dejo de guiarlos, harán daño a mi familia. No sé cómo salir de esto.",
    "¡No puedo perder! Mi familia sigue en peligro.",
    "Mi familia me necesita. Pero cada mensaje que llevo puede poner en riesgo a otra familia.",
    "Ya no puedo seguir ocultando el puente. Te diré dónde está.",
    "Buscaremos cómo proteger a tu familia. No tienes que seguir ayudando a quienes te amenazan."
  ],
  "21": [
    "Estoy entregando una orden distinta en cada aldea. Así cada pueblo escucha lo que quiere oír.",
    "¿Por qué cambias el texto? Si todos reciben órdenes diferentes, acabarán peleando entre ellos.",
    "Es lo que me pidió el Escribano del Alba. Me dijo que así lograríamos que todos siguieran a Sigumán.",
    "¡Si me detienes, el Escribano sabrá que he fallado!",
    "",
    "",
    "Todos estos papeles tienen una misma marca. Ahora sabemos dónde buscar al hombre que escribe las mentiras."
  ],
  "22": [
    "Voy a cerrar los senderos de la selva. No permitiré que entren soldados que puedan hacer daño a mi gente.",
    "¿Por qué nos atacas, Nayisa? Traigo pruebas de que los mensajes que llegan a tus aldeas son falsos.",
    "Antes también prometieron ayudarnos y terminaron robándonos. Si dejo pasar a cualquiera, mi pueblo pagará el precio.",
    "¡No permitiré que pongan en peligro a mi gente!",
    "Quiero defender mi hogar, pero si esos mensajes son falsos, quizá estoy protegiendo a quienes nos engañan.",
    "Veo que tienes razón: esta carta fue cambiada. He cerrado la selva por miedo a que nos lastimen otra vez.",
    "No has dejado de proteger a tu pueblo, Nayisa. Ahora puedes ayudarme a llevar la verdad a las otras aldeas."
  ],
  "23": [
    "Voy a sacar de la plaza a quienes llevan la bandera contraria. Son enemigos de nuestra ciudad.",
    "¿Por qué? Son tus vecinos. Tener otra bandera no significa que quieran hacer daño.",
    "Mi capitana dice que, si permitimos dos banderas, la ciudad volverá a enfrentarse. Por eso debo expulsarlos.",
    "¡No puedo dejar que vuelvan a entrar a la plaza!",
    "",
    "",
    "Esta plaza es de todos sus vecinos. Hablarán entre ellos antes de que alguien vuelva a obligarlos a elegir bando."
  ],
  "24": [
    "Estoy reuniendo a la gente para prometerle paz. Les digo que los solarianos acabarán con todos sus problemas.",
    "¿Por qué les prometes eso si sabes que hay órdenes falsas? La gente confía en tus palabras.",
    "Porque, si tienen miedo, me escuchan. Sigumán me ofreció poder si consigo que sigan sus órdenes.",
    "¡No me quites a mis seguidores! Sin ellos no soy nadie.",
    "Pensé que podía guiar a toda la ciudad. Ahora muchos empiezan a hacerse preguntas.",
    "Ya nadie cree mis promesas. No puedo seguir ocultando las órdenes falsas.",
    "Puedes hablar con la gente, pero no decidir por ella. Una promesa solo vale si dices la verdad."
  ],
  "25": [
    "Voy a cerrar el archivo del cabildo, donde se guardan las decisiones de la ciudad.",
    "¿Por qué no puedo leerlas? Aquí hay dos copias del mismo decreto y dicen cosas diferentes.",
    "Me ordenaron esconder una de ellas. Si el pueblo descubre que cambió el texto, dejará de confiar en sus jefes.",
    "¡No dejaré que compares esas copias!",
    "",
    "",
    "Las dos copias prueban que alguien cambió el decreto. Debemos llevar esa prueba a la siguiente región."
  ],
  "26": [
    "Voy a quitar la bandera de quienes se oponen a mí. Solo mi estandarte podrá verse en esta ciudad.",
    "¿Por qué obligas a todos a seguirte? Hay familias enfrentadas porque no les permites hablar de lo que ocurrió.",
    "Creo que, si todos siguen un mismo símbolo, dejarán de pelear. Tengo miedo de que la ciudad se rompa otra vez.",
    "¡No dejaré que destruyan mi estandarte!",
    "He protegido esta bandera durante años. Pero veo que mis soldados empiezan a pelear también por ella.",
    "Me has vencido. Tal vez obligar a todos a seguir un color solo hizo crecer el problema.",
    "Isabela, no hace falta que todos piensen igual para vivir juntos. Lo importante es escuchar a la ciudad."
  ],
  "27": [
    "Vigilo el paso de montaña. No dejaré cruzar a nadie mientras dure la tormenta.",
    "Tenemos que llevar estas pruebas a la fortaleza. Además, hay personas detrás de nosotros que necesitan refugio.",
    "El camino es peligroso y mis superiores lo han cerrado. Si alguien cae, dirán que fue culpa mía.",
    "¡Regresa! No permitiré que arriesgues a nadie en este paso.",
    "",
    "",
    "Primero ayudaremos a cruzar a todos. Las pruebas no sirven de nada si abandonamos a quienes las llevaron."
  ],
  "28": [
    "Soy el guardián de este puente. Juré impedir el paso a quienes no tengan permiso del Cóndor.",
    "¿Por qué mantienes cerrado el camino? Llevamos documentos que podrían demostrar quién ha falsificado las órdenes.",
    "Porque prometí obedecer al Cóndor. Si rompo mi palabra, mis propios compañeros dejarán de confiar en mí.",
    "¡Aún puedo defender el puente!",
    "Llevo toda la vida cuidando este paso. Si me equivoco ahora, ¿para qué sirvió tanto esfuerzo?",
    "Me venciste. Tal vez debí escuchar lo que traías antes de atacarte.",
    "Cumplir una promesa también exige saber a quién protege. Ahora deja que llevemos las pruebas."
  ],
  "29": [
    "Estoy vigilando el último puente hacia la fortaleza del Cóndor. Nadie debe llegar hasta su cámara.",
    "¿Qué guarda allí? Sabemos que tiene una carta antigua que puede revelar quién cambió los juramentos.",
    "Es cierto. El general teme que esa carta haga que sus soldados duden de todas las órdenes que recibieron.",
    "¡No llegarás a la cámara del Cóndor!",
    "",
    "",
    "Ya podemos llegar hasta el general. Le preguntaré directamente por qué ha escondido la carta."
  ],
  "30": [
    "Guardo una carta antigua que explica por qué los ocho generales juraron servir a Sigumán.",
    "¿Por qué la escondes, Aukan? Si esa carta fue cambiada, tus soldados merecen saberlo.",
    "Porque he servido a ese juramento durante años. Si está basado en una mentira, tendré que aceptar que me equivoqué.",
    "¡No permitiré que me arrebates la carta!",
    "Empiezo a pensar que he defendido una promesa sin comprobar qué decía en realidad.",
    "Ya lo veo. Esta carta menciona a San Jerónimo y es anterior a las órdenes que recibimos.",
    "Gracias por entregarla, Aukan. Seguiremos ese nombre hasta encontrar al verdadero autor de las órdenes."
  ],
  "31": [
    "Voy a detenerte. Los heraldos tenemos órdenes de proteger la Casa del Juramento.",
    "¿Qué protegen exactamente? Tenemos pruebas de que alguien cambió las palabras de sus promesas.",
    "Nos enseñaron a obedecerlas desde jóvenes. Si las cuestionamos, todo lo que defendimos podría perder sentido.",
    "¡No puedes decir que nuestro juramento es falso!",
    "",
    "",
    "No tienes que dejar de ser leal. Solo debes saber si tu promesa está ayudando a la gente o dañándola."
  ],
  "32": [
    "Estoy guardando las copias antiguas de los juramentos. Nadie puede revisarlas.",
    "¿Por qué las ocultas? Necesitamos compararlas con los decretos que Leocadio entregó a los generales.",
    "Porque si son diferentes, se demostrará que muchos soldados fueron engañados. Me ordenaron evitar ese escándalo.",
    "¡No te llevarás las copias originales!",
    "Llevo años cuidando estos documentos. Quizá los protegí tanto que terminé escondiendo la verdad.",
    "Las copias son distintas. Ya no puedo decir que todos recibieron el mismo juramento.",
    "Gracias por abrir el archivo. Mostrar las dos versiones es la única manera de que todos entiendan qué pasó."
  ],
  "33": [
    "Estoy cerrando la sala donde se escribió el juramento que todavía obedecen los soldados.",
    "¿Por qué impides el paso? Allí podríamos encontrar el documento que prueba que Sigumán sabía del engaño.",
    "Mi capitán me ordenó protegerlo. Si Sigumán conocía la mentira, nadie volverá a confiar en nuestro ejército.",
    "¡No puedes entrar! Si encuentran las órdenes de Sigumán, mis superiores me culparán por dejarlas salir.",
    "",
    "",
    "Aquí está la prueba: Sigumán sabía que algunas órdenes eran falsas y decidió usarlas de todos modos."
  ],
  "34": [
    "Soy el Caballero del Juramento. Prometí proteger al reino y por eso sigo defendiendo a Sigumán.",
    "¿Y si alguien cambió tu promesa? Tenemos el documento original: no dice que debas obedecer una mentira.",
    "Si es verdad, he luchado contra personas inocentes creyendo que estaba protegiendo la paz. No quiero aceptarlo.",
    "¡No puedo perder! Mi palabra es lo único que me queda.",
    "Me aferro al juramento porque toda mi vida ha girado a su alrededor. Pero ya no sé qué versión es la verdadera.",
    "Me venciste. Ahora veo que defendí las órdenes de Sigumán, no la promesa de proteger al pueblo.",
    "Gonzalo, todavía puedes cumplir tu promesa. Empieza ayudando a quienes sufrieron por esas órdenes."
  ],
  "35": [
    "Yo escribí las nuevas órdenes. Cambié partes de los decretos para que cada pueblo apoyara a Sigumán.",
    "¿Por qué lo hiciste? Aprovechaste problemas reales, como el hambre y los abusos, para enfrentar a la gente.",
    "Porque Sigumán me pagó y prometió darme poder. Era más fácil manipular su enojo que resolver sus problemas.",
    "¡No permitiré que encuentres mis documentos originales!",
    "Todo lo que Sigumán construyó depende de mis textos. Si caigo, se sabrá cómo engañamos al reino.",
    "Me has vencido. Los originales están ahí: demuestran que Sigumán sabía que las órdenes eran falsas.",
    "Leocadio, usaste el dolor de la gente para ganar poder. Guardaremos las pruebas para que nadie repita esa mentira."
  ],
  "36": [
    "Voy a entregarte a Sigumán. Él me dará poder sobre los soldados que antes luchaban a nuestro lado.",
    "¿Por qué haces esto, Vándalo? Fuimos compañeros. ¿Cuándo empezaste a tratar a las personas como una recompensa?",
    "Cuando vi que obedecer no me daba nada. Sigumán me ofreció un ejército y decidí tomarlo. Tú también podrías unirte.",
    "¡No perderé contra ti! Sigumán me prometió el mando.",
    "Éramos iguales, Xervias. La diferencia es que yo aprendí a conseguir lo que quiero sin pedir permiso.",
    "Me venciste, pero sigo creyendo que el poder vale más que tus promesas.",
    "Zhinchi me salvó y me entregó su bastón. Con él podré despertar las cartas místicas de los generales. ¿Dónde estás, maestro?"
  ],
  "37": [
    "Sigumán me ordenó cerrar esta entrada. Aquí llegaron las últimas noticias sobre Zhinchi.",
    "¿Dónde está mi maestro? Se quedó atrás para protegerme y ahora está gravemente herido. Necesito encontrarlo.",
    "No lo sé. Solo me pidieron ocultar los mensajes. Si entras, llegarás hasta la sala donde espera Sigumán.",
    "¡No pasarás! Me ordenaron destruir esos mensajes.",
    "",
    "",
    "Encontré una última pista de Zhinchi, pero todavía no sé dónde está. Seguiré adelante y después volveré a buscarlo."
  ],
  "38": [
    "He usado decretos falsos para conseguir que los generales me obedezcan. Así quería unir un reino que estaba dividido.",
    "¿Por qué mentiste, Sigumán? La gente tenía problemas reales, pero tú los usaste para conseguir poder.",
    "Porque pensé que solo una autoridad fuerte podía imponer la paz. Si decía toda la verdad, muchos no me seguirían.",
    "¡No dejaré que destruyas la Revolución Solar! Sin mí, el reino volverá al caos.",
    "Veo que estás cerca de vencerme. Pero sigo creyendo que la gente necesita a alguien que decida por ella.",
    "He perdido. Obligarlos a obedecer no resolvió sus problemas... y ahora todo lo que construí se derrumba.",
    "Tu error fue creer que la paz se consigue obligando a todos a callar. La gente necesita justicia y poder decidir."
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
  const opponent = enemyForMission(missionId);
  if (!stage || !lines || !opponent) return undefined;
  const [first, reply, challenge, critical, midpoint, defeat, finalReply] = lines;
  const isBoss = stage.kind === 'subboss' || stage.kind === 'boss' || stage.kind === 'final';
  return {
    opponentName: opponent.name,
    opponentRole: opponent.role,
    isBoss,
    intro: [speech('opponent', first), speech('player', reply), speech('opponent', challenge), speech('system', 'Inicia el combate')],
    midpoint: isBoss ? [speech('opponent', midpoint)] : [],
    critical: [speech('opponent', critical)],
    victory: isBoss ? [speech('opponent', defeat), speech('player', finalReply)] : [speech('player', finalReply)],
  };
}
