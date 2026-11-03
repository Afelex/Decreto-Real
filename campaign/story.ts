/** DR-C02 · Lore and 38 missions of Decreto Real I: El Sello y la Falsa Luz.
 * Xervias, Zhinchi, Vándalo Rojo and Sigumán are the definitive protagonists and antagonists. The 38 encounters form a continuous narrative: manipulated decrees, real grievances,
 * eight moral conflicts and a final confrontation. Narration is concise for one-screen mobile layouts.
 * The eight general names, regions, special cards, canonical subbosses, original 2+32+4 layout and overarching conclusion
 * preserve the agreed narrative. No combat cards or abilities are added here.
 */
export type StoryChapter = {
  id: string; title: string; region: string; subtitle: string; summary: string;
  color: string; general?: string; specialCard?: string;
};
export type StoryStage = {
  id: string; chapterId: string; title: string; description: string;
  kind: 'skirmish' | 'subboss' | 'boss' | 'final'; opponent: string;
  openingLine: string; victoryLine: string; defeatLine: string;
};

export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    "id": "p",
    "title": "El llamado del Sello",
    "region": "Los primeros caminos",
    "subtitle": "Prólogo · El rumor de la Falsa Luz",
    "summary": "Dos decretos con el mismo sello ordenan cosas opuestas. Xervias debe elegir entre obedecer sin preguntar o escuchar a quienes serán castigados por una mentira. Zhinchi le confía una investigación, no una cacería.",
    "color": "#caa873"
  },
  {
    "id": "1",
    "title": "El puerto de hierro",
    "region": "Puerto del Callao",
    "subtitle": "General I · Almirante de Hierro",
    "summary": "La pólvora llega al Callao bajo el nombre de «provisiones de paz». El Almirante de Hierro cierra el puerto para impedir que los manifiestos lleguen a manos del pueblo.",
    "general": "Almirante de Hierro",
    "specialCard": "Bombardeo naval",
    "color": "#6b99ac"
  },
  {
    "id": "2",
    "title": "Los caminos escarlata",
    "region": "Caminos del Reino",
    "subtitle": "General II · Jinete Escarlata",
    "summary": "Los mensajes de la rebelión cruzan el reino antes que sus testigos. El Jinete Escarlata ha convertido las postas en una maquinaria de obediencia; entre las cartas aparece una misma firma oculta.",
    "general": "Jinete Escarlata",
    "specialCard": "Carga de caballería",
    "color": "#c47562"
  },
  {
    "id": "3",
    "title": "La plata enterrada",
    "region": "Minas de la Sierra",
    "subtitle": "General III · Señor de la Plata",
    "summary": "En las minas hay injusticias verdaderas que nadie quiso escuchar. El Señor de la Plata aprovecha esos agravios para enriquecerse y convertir el dolor de los trabajadores en propaganda.",
    "general": "Señor de la Plata",
    "specialCard": "Pólvora enterrada",
    "color": "#a3a0af"
  },
  {
    "id": "4",
    "title": "El trueno del bastión",
    "region": "Fortaleza de Artillería",
    "subtitle": "General IV · Artillero del Trueno",
    "summary": "El Artillero del Trueno usa el miedo como argumento. Para atravesar su fortaleza, Xervias deberá salvar pruebas y testigos antes de silenciar los cañones.",
    "general": "Artillero del Trueno",
    "specialCard": "Fuego concentrado",
    "color": "#cba36b"
  },
  {
    "id": "5",
    "title": "Sombras de la frontera",
    "region": "Frontera Oriental",
    "subtitle": "General V · Fantasma de la Selva",
    "summary": "La frontera guarda rutas invisibles y voces que nunca llegaron a la capital. Nayisa, el Fantasma de la Selva, protege a su gente con órdenes que quizá no son lo que parecen.",
    "general": "Fantasma de la Selva",
    "specialCard": "Sendero secreto",
    "color": "#779e7b"
  },
  {
    "id": "6",
    "title": "La ciudad de los estandartes",
    "region": "Ciudad de los Estandartes",
    "subtitle": "General VI · Dama del Estandarte",
    "summary": "Una ciudad exhibe dos estandartes y una sola herida. La Dama del Estandarte cree que los símbolos sostienen la paz; Xervias debe demostrar que ninguna bandera vale más que sus habitantes.",
    "general": "Dama del Estandarte",
    "specialCard": "Estandarte de resistencia",
    "color": "#b8848c"
  },
  {
    "id": "7",
    "title": "El cóndor y las cumbres",
    "region": "Fortaleza de las Cumbres",
    "subtitle": "General VII · Cóndor de los Andes",
    "summary": "En las cumbres, el aislamiento ha hecho ley de la sospecha. Aukan del Cóndor custodia el paso y una carta antigua que vincula el juramento de los generales con Zhinchi.",
    "general": "Cóndor de los Andes",
    "specialCard": "Ataque de las cumbres",
    "color": "#8aadd0"
  },
  {
    "id": "8",
    "title": "La casa del juramento",
    "region": "Casa del Juramento",
    "subtitle": "General VIII · Caballero del Juramento",
    "summary": "Las promesas que sostuvieron al ejército se revelan torcidas. Gonzalo de Montes, el Caballero del Juramento, debe decidir si fue fiel a su palabra o a la mentira de Sigumán.",
    "general": "Caballero del Juramento",
    "specialCard": "Último juramento",
    "color": "#c8af7d"
  },
  {
    "id": "f",
    "title": "La Falsa Luz",
    "region": "Casa del Sello",
    "subtitle": "Final · Vándalo Rojo, el Escribano y Sigumán",
    "summary": "Las cuentas, los sellos y los testimonios conducen a la Casa del Sello. Leocadio del Alba, Vándalo Rojo y Sigumán aguardan al final; la verdad costará a Xervias más que una victoria.",
    "color": "#ba8394"
  }
];

export const STORY_STAGES: readonly StoryStage[] = [
  {
    "id": "01",
    "chapterId": "p",
    "title": "El pregón alterado",
    "description": "Dos decretos idénticos condenan y absuelven a los mismos vecinos del puesto de guardia.",
    "kind": "skirmish",
    "opponent": "Guardia del pregón",
    "openingLine": "Zhinchi: «Si ambos llevan el sello, ¿a cuál obedecerías? Protege a la gente primero».",
    "victoryLine": "Xervias rescata a los testigos: el sello es auténtico, pero alguien ha cambiado sus palabras.",
    "defeatLine": "Los vecinos quedan expuestos al castigo y el pregón falso sigue circulando."
  },
  {
    "id": "02",
    "chapterId": "p",
    "title": "La orden sin sello",
    "description": "Un mensajero encapuchado transporta la copia de una orden que nadie reconoce.",
    "kind": "skirmish",
    "opponent": "Mensajero encapuchado",
    "openingLine": "Xervias: «Si la orden es falsa, su recorrido nos llevará hasta quien la escribió».",
    "victoryLine": "En la cera del sobre aparece una marca de embarque. El rastro conduce al Callao.",
    "defeatLine": "El mensajero desaparece con la única copia que podía delatar su ruta."
  },
  {
    "id": "03",
    "chapterId": "1",
    "title": "Niebla sobre el Callao",
    "description": "Un barco descarga pólvora registrada como alimento para las poblaciones del interior.",
    "kind": "skirmish",
    "opponent": "Guardia del muelle",
    "openingLine": "Zhinchi: «Quien esconde armas bajo el nombre del pan teme que conozcamos su propósito».",
    "victoryLine": "El manifiesto revela una ruta clandestina entre la costa y las postas del reino.",
    "defeatLine": "El cargamento parte y las pruebas del engaño se hunden entre la niebla."
  },
  {
    "id": "04",
    "chapterId": "1",
    "title": "El contramaestre rebelde",
    "description": "El contramaestre vigila el muelle y conoce la contraseña de los navíos rebeldes.",
    "kind": "subboss",
    "opponent": "Contramaestre rebelde",
    "openingLine": "Bartolomé de Avilés: «Aquí nadie pregunta por el cargamento. Solo obedece».",
    "victoryLine": "Su contraseña permite acceder al arsenal sin alertar todavía al Almirante.",
    "defeatLine": "El contramaestre alerta a la flota y se cierran los accesos al puerto."
  },
  {
    "id": "05",
    "chapterId": "1",
    "title": "El arsenal del puerto",
    "description": "En el arsenal, las armas comparten depósito con libros de embarque alterados.",
    "kind": "skirmish",
    "opponent": "Custodio del arsenal",
    "openingLine": "Xervias: «No hemos venido a quemar el arsenal. Hemos venido a leer sus registros».",
    "victoryLine": "Un manifiesto vincula la pólvora con órdenes enviadas a las postas del interior.",
    "defeatLine": "Los custodios sellan el archivo y el Almirante conserva sus pruebas."
  },
  {
    "id": "06",
    "chapterId": "1",
    "title": "El Almirante de Hierro",
    "description": "Baltasar de Fierro bloquea el Callao porque cree que solo el miedo puede preservar el orden.",
    "kind": "boss",
    "opponent": "Almirante de Hierro",
    "openingLine": "Baltasar de Fierro: «He visto ciudades caer por dudar. No permitiré que el Callao sea otra».",
    "victoryLine": "El puerto queda libre. Los manifiestos apuntan al Jinete Escarlata y su red de correos.",
    "defeatLine": "La flota sostiene el bloqueo; la costa permanece bajo las órdenes de Sigumán."
  },
  {
    "id": "07",
    "chapterId": "2",
    "title": "Polvo en el camino",
    "description": "Un convoy lleva decretos urgentes hacia poblaciones que todavía ignoran la falsificación.",
    "kind": "skirmish",
    "opponent": "Escolta del camino",
    "openingLine": "Zhinchi: «Una mentira que viaja más rápido que la verdad se convierte en ley».",
    "victoryLine": "Xervias intercepta las órdenes antes de que otras aldeas las reciban.",
    "defeatLine": "El convoy se adelanta y la confusión llega primero a los caminos."
  },
  {
    "id": "08",
    "chapterId": "2",
    "title": "El capitán de salteadores",
    "description": "Gaspar Montoro cobra peaje a los viajeros y roba cartas destinadas a denunciar abusos.",
    "kind": "subboss",
    "opponent": "Capitán de salteadores",
    "openingLine": "Gaspar Montoro: «La guerra de los poderosos siempre deja algo para los que sabemos tomarlo».",
    "victoryLine": "Liberas a los viajeros y recuperas un itinerario de las postas intervenidas.",
    "defeatLine": "Las caravanas quedan aisladas y los denunciantes pierden su ruta."
  },
  {
    "id": "09",
    "chapterId": "2",
    "title": "La posta intervenida",
    "description": "Los libros de una posta registran mensajes fechados antes de que ocurrieran los hechos.",
    "kind": "skirmish",
    "opponent": "Custodio de la posta",
    "openingLine": "Xervias: «Alguien preparó las respuestas antes de que existieran las preguntas».",
    "victoryLine": "Las fechas y las marcas de lacre identifican una red coordinada desde el interior.",
    "defeatLine": "Los custodios destruyen el libro de salidas y borran la pista principal."
  },
  {
    "id": "10",
    "chapterId": "2",
    "title": "El Jinete Escarlata",
    "description": "Leandro Valcázar, el Jinete Escarlata, convierte la velocidad en obediencia ciega.",
    "kind": "boss",
    "opponent": "Jinete Escarlata",
    "openingLine": "Leandro Valcázar: «Mientras tú dudas, yo ya he decidido el destino de una ciudad».",
    "victoryLine": "Su correspondencia revela pagos del Señor de la Plata por difundir proclamas falsas.",
    "defeatLine": "El Jinete mantiene su dominio sobre los caminos y el reino escucha su versión."
  },
  {
    "id": "11",
    "chapterId": "3",
    "title": "El precio de la plata",
    "description": "En la mina, los reclamos de los trabajadores son reales, aunque los decretos que circulan son falsos.",
    "kind": "skirmish",
    "opponent": "Guardia de la mina",
    "openingLine": "Zhinchi: «No desacredites su sufrimiento solo porque alguien aprendió a explotarlo».",
    "victoryLine": "Xervias escucha a los mineros y separa sus denuncias de las órdenes falsificadas.",
    "defeatLine": "El miedo silencia a los trabajadores y crece el resentimiento."
  },
  {
    "id": "12",
    "chapterId": "3",
    "title": "El capataz de la mina",
    "description": "Esteban Salvatierra oculta los registros de jornadas y salarios bajo amenaza de derrumbe.",
    "kind": "subboss",
    "opponent": "Capataz",
    "openingLine": "Esteban Salvatierra: «Si abrimos esos libros, caerán más hombres que piedras».",
    "victoryLine": "Los libros prueban abusos auténticos y un desvío de plata hacia los emisarios del Alba.",
    "defeatLine": "El capataz conserva los archivos y los mineros continúan sin respuestas."
  },
  {
    "id": "13",
    "chapterId": "3",
    "title": "La pólvora escondida",
    "description": "Un depósito de pólvora amenaza con sepultar a quienes intenten sacar las pruebas.",
    "kind": "skirmish",
    "opponent": "Custodio de pólvora",
    "openingLine": "Xervias: «Si salvamos los documentos pero perdemos a los mineros, no habremos ganado nada».",
    "victoryLine": "La salida queda a salvo y una orden de pago apunta al despacho del Señor de la Plata.",
    "defeatLine": "La pólvora mantiene la mina bajo amenaza y la evacuación fracasa."
  },
  {
    "id": "14",
    "chapterId": "3",
    "title": "El Señor de la Plata",
    "description": "Octavio Argento ha hecho de los agravios una moneda para financiar la Falsa Luz.",
    "kind": "boss",
    "opponent": "Señor de la Plata",
    "openingLine": "Octavio Argento: «La plata no pregunta si una causa es justa. Solo reconoce al vencedor».",
    "victoryLine": "Sus cuentas revelan pagos a Leocadio del Alba y a la fortaleza de los cañones.",
    "defeatLine": "El Señor de la Plata conserva sus libros y compra el silencio de sus testigos."
  },
  {
    "id": "15",
    "chapterId": "4",
    "title": "Camino de los cañones",
    "description": "El paso hacia la fortaleza está marcado por disparos y aldeas que temen otro bombardeo.",
    "kind": "skirmish",
    "opponent": "Explorador artillero",
    "openingLine": "Zhinchi: «Un disparo obliga a bajar la cabeza; una prueba obliga a levantarla».",
    "victoryLine": "La avanzada alcanza las defensas sin abandonar a los habitantes del camino.",
    "defeatLine": "Los cañones obligan a retirarse y la ruta de los testigos se interrumpe."
  },
  {
    "id": "16",
    "chapterId": "4",
    "title": "El maestro bombardero",
    "description": "Mauro de la Peña ha calibrado los cañones para cerrar todas las rutas de evacuación.",
    "kind": "subboss",
    "opponent": "Maestro bombardero",
    "openingLine": "Mauro de la Peña: «La precisión de una pieza nunca duda de quien le da la orden».",
    "victoryLine": "Sus planos revelan el punto débil del bastión y permiten abrir una ruta segura.",
    "defeatLine": "El fuego de artillería conserva el control de los accesos."
  },
  {
    "id": "17",
    "chapterId": "4",
    "title": "La puerta del bastión",
    "description": "Los guardias del bastión protegen una puerta tras la que permanecen prisioneros varios testigos.",
    "kind": "skirmish",
    "opponent": "Guardia del bastión",
    "openingLine": "Xervias: «Abrid esa puerta. No quiero otra victoria que deje inocentes encerrados».",
    "victoryLine": "Los testigos salen con vida y el Artillero queda sin su última defensa.",
    "defeatLine": "La puerta permanece cerrada y los prisioneros siguen a merced del general."
  },
  {
    "id": "18",
    "chapterId": "4",
    "title": "El Artillero del Trueno",
    "description": "Jerónimo Arrellano gobierna con el estruendo de los cañones y la obediencia del miedo.",
    "kind": "boss",
    "opponent": "Artillero del Trueno",
    "openingLine": "Jerónimo Arrellano: «La paz comienza cuando nadie se atreve a llevarme la contraria».",
    "victoryLine": "El bastión calla. Un testigo señala a los emisarios que cruzaron la frontera oriental.",
    "defeatLine": "La fortaleza mantiene sus cañones y el testimonio sigue censurado."
  },
  {
    "id": "19",
    "chapterId": "5",
    "title": "Sendero sin nombre",
    "description": "En la frontera oriental los mapas oficiales callan rutas que la población conoce desde siempre.",
    "kind": "skirmish",
    "opponent": "Guardián del sendero",
    "openingLine": "Zhinchi: «No confundas un territorio sin mapa con un territorio sin memoria».",
    "victoryLine": "Una familia muestra a Xervias el sendero que usaron los mensajeros de la Falsa Luz.",
    "defeatLine": "Los custodios vuelven a cerrar el acceso a los testigos de la frontera."
  },
  {
    "id": "20",
    "chapterId": "5",
    "title": "El explorador renegado",
    "description": "Amaru Llaguno guía a los emisarios por pasos ocultos mientras teme por los suyos.",
    "kind": "subboss",
    "opponent": "Explorador renegado",
    "openingLine": "Amaru Llaguno: «Si rechazo sus órdenes, mi familia pagará el precio».",
    "victoryLine": "El guía se aparta de la red clandestina y revela un puente oculto.",
    "defeatLine": "Amaru mantiene los senderos cerrados para proteger a su familia."
  },
  {
    "id": "21",
    "chapterId": "5",
    "title": "Voces entre las hojas",
    "description": "Distintas aldeas recibieron proclamas con palabras diferentes y una misma tinta.",
    "kind": "skirmish",
    "opponent": "Emisario del Alba",
    "openingLine": "Xervias: «No escribieron para decir la verdad; escribieron lo que cada pueblo quería oír».",
    "victoryLine": "Una marca en el papel identifica el taller de Leocadio del Alba.",
    "defeatLine": "La red de mensajeros alcanza otra aldea antes de que puedas advertirla."
  },
  {
    "id": "22",
    "chapterId": "5",
    "title": "El Fantasma de la Selva",
    "description": "Nayisa, guardiana de la selva, desconfía de quien llega con emblemas de la capital.",
    "kind": "boss",
    "opponent": "Fantasma de la Selva",
    "openingLine": "Nayisa: «He defendido a mi gente de quienes siempre prometen protección. ¿Por qué creerte?».",
    "victoryLine": "Nayisa ve la prueba de la falsificación y permite llevar los testimonios fuera de la selva.",
    "defeatLine": "La red de Nayisa conserva los pasos cerrados y la verdad no puede salir."
  },
  {
    "id": "23",
    "chapterId": "6",
    "title": "La plaza dividida",
    "description": "Dos banderas dividen una ciudad donde vecinos y familias dejan de hablarse.",
    "kind": "skirmish",
    "opponent": "Guardia de la plaza",
    "openingLine": "Zhinchi: «Elige primero a quién proteger. Los colores pueden esperar».",
    "victoryLine": "Xervias consigue una tregua y los vecinos vuelven a declarar sin miedo.",
    "defeatLine": "Las facciones ocupan la plaza y la ciudad pierde su última tregua."
  },
  {
    "id": "24",
    "chapterId": "6",
    "title": "El predicador impostor",
    "description": "Pedro Elari predica una paz sin preguntas mientras altera los juramentos públicos.",
    "kind": "subboss",
    "opponent": "Predicador impostor",
    "openingLine": "Pedro Elari: «La Falsa Luz os quitará el peso de decidir».",
    "victoryLine": "Los habitantes escuchan los testimonios y dejan de obedecer al falso predicador.",
    "defeatLine": "El predicador conserva la plaza y la población desconfía de sus propios vecinos."
  },
  {
    "id": "25",
    "chapterId": "6",
    "title": "Los libros del cabildo",
    "description": "Los archivos del cabildo guardan dos copias incompatibles del mismo decreto.",
    "kind": "skirmish",
    "opponent": "Escribano de guardia",
    "openingLine": "Xervias: «Si destruyen una copia, la otra parecerá la única verdad».",
    "victoryLine": "Ambos documentos prueban la manipulación y revelan una ruta hacia las cumbres.",
    "defeatLine": "Los libros son sellados y solo los pregones oficiales alcanzan la plaza."
  },
  {
    "id": "26",
    "chapterId": "6",
    "title": "La Dama del Estandarte",
    "description": "Isabela Valdierra ha unido a sus soldados bajo un estandarte que ya no puede justificar.",
    "kind": "boss",
    "opponent": "Dama del Estandarte",
    "openingLine": "Isabela Valdierra: «Sin un símbolo común, esta ciudad volverá a despedazarse».",
    "victoryLine": "La Dama deja el estandarte. La ciudad conserva su unidad sin negar los testimonios.",
    "defeatLine": "La Dama mantiene la guarnición y la ciudad sigue dividida bajo una sola bandera."
  },
  {
    "id": "27",
    "chapterId": "7",
    "title": "El paso de las nubes",
    "description": "La nieve amenaza a quienes intentan llevar las pruebas por un paso de altura.",
    "kind": "skirmish",
    "opponent": "Guardián de altura",
    "openingLine": "Zhinchi: «Ninguna verdad merece que abandonemos a los rezagados».",
    "victoryLine": "La caravana cruza unida y conserva los documentos del cabildo.",
    "defeatLine": "El frío y los centinelas dispersan a quienes acompañan a Xervias."
  },
  {
    "id": "28",
    "chapterId": "7",
    "title": "El guardián de los pasos",
    "description": "Martín Ancajima conoce los pasos que llevan a la fortaleza, pero juró cerrarlos.",
    "kind": "subboss",
    "opponent": "Guardián de los pasos",
    "openingLine": "Martín Ancajima: «He guardado este camino toda mi vida. No sé hacer otra cosa».",
    "victoryLine": "El guardián permite el paso y cuenta que el Cóndor custodia una carta antigua.",
    "defeatLine": "Martín mantiene la ruta bloqueada por lealtad a su juramento."
  },
  {
    "id": "29",
    "chapterId": "7",
    "title": "El filo de la cordillera",
    "description": "En la cumbre, una última patrulla vigila el puente hacia la cámara del general.",
    "kind": "skirmish",
    "opponent": "Defensor de la cumbre",
    "openingLine": "Xervias: «No llegamos hasta aquí para entregar a otros el peso de nuestra decisión».",
    "victoryLine": "El puente queda abierto y Xervias alcanza el refugio del Cóndor.",
    "defeatLine": "La patrulla sostiene el desfiladero y obliga a la caravana a retroceder."
  },
  {
    "id": "30",
    "chapterId": "7",
    "title": "El Cóndor de los Andes",
    "description": "Aukan del Cóndor guarda una carta que vincula los ocho juramentos con un nombre borrado.",
    "kind": "boss",
    "opponent": "Cóndor de los Andes",
    "openingLine": "Aukan del Cóndor: «Si rompo mi palabra, ¿qué me queda después de tantos inviernos?».",
    "victoryLine": "Aukan entrega la carta: una mención a San Jerónimo lleva hasta la Casa del Juramento.",
    "defeatLine": "El Cóndor conserva la carta y el paso a los últimos secretos permanece cerrado."
  },
  {
    "id": "31",
    "chapterId": "8",
    "title": "Los heraldos del juramento",
    "description": "Los heraldos repiten una promesa antigua sin recordar a quién protegía realmente.",
    "kind": "skirmish",
    "opponent": "Heraldo del juramento",
    "openingLine": "Zhinchi: «Una promesa que exige callar ante el daño ha perdido su sentido».",
    "victoryLine": "Los heraldos reconocen que el juramento fue alterado después de ser pronunciado.",
    "defeatLine": "La guardia sigue confundiendo lealtad con silencio."
  },
  {
    "id": "32",
    "chapterId": "8",
    "title": "El teniente de la Guardia",
    "description": "Lucas de Orduña conserva testimonios contradictorios sobre el origen de los juramentos.",
    "kind": "subboss",
    "opponent": "Teniente de la Guardia",
    "openingLine": "Lucas de Orduña: «No soy juez de los documentos. Soy su guardián».",
    "victoryLine": "Una copia original contradice las órdenes distribuidas por Leocadio del Alba.",
    "defeatLine": "El teniente conserva las copias y niega el acceso a los testigos."
  },
  {
    "id": "33",
    "chapterId": "8",
    "title": "La última guardia",
    "description": "La última guardia protege la cámara donde se escribió la versión oficial del juramento.",
    "kind": "skirmish",
    "opponent": "Capitán del juramento",
    "openingLine": "Xervias: «Lo que hay detrás de esa puerta no pertenece solo a quienes mandan».",
    "victoryLine": "La cámara queda abierta. Una nota sugiere que Sigumán sabía del fraude desde el inicio.",
    "defeatLine": "El capitán mantiene la cámara cerrada y el origen de las órdenes sigue oculto."
  },
  {
    "id": "34",
    "chapterId": "8",
    "title": "El Caballero del Juramento",
    "description": "Gonzalo de Montes enfrenta la prueba de que el juramento que defendía fue adulterado.",
    "kind": "boss",
    "opponent": "Caballero del Juramento",
    "openingLine": "Gonzalo de Montes: «Prometí guardar la paz. Nadie me advirtió que me pedirían mentir».",
    "victoryLine": "El Caballero se retira. La puerta de la Casa del Sello se abre y apunta hacia Sigumán.",
    "defeatLine": "Gonzalo conserva el acceso, incapaz todavía de distinguir deber y obediencia."
  },
  {
    "id": "35",
    "chapterId": "f",
    "title": "El Escribano del Alba",
    "description": "Leocadio del Alba convirtió dolores verdaderos en órdenes falsas escritas para dividir al reino.",
    "kind": "subboss",
    "opponent": "Escribano del Alba",
    "openingLine": "Leocadio del Alba: «Nunca inventé el sufrimiento. Solo le di las palabras que necesitaba».",
    "victoryLine": "Los originales prueban la falsificación y que Sigumán decidió continuar aun sabiéndolo.",
    "defeatLine": "Leocadio esconde sus matrices y la Falsa Luz conserva su coartada."
  },
  {
    "id": "36",
    "chapterId": "f",
    "title": "La emboscada de Vándalo Rojo",
    "description": "Vándalo Rojo, antiguo compañero de Xervias, busca el poder que antes fingía despreciar.",
    "kind": "subboss",
    "opponent": "Vándalo Rojo",
    "openingLine": "Vándalo Rojo: «Tú sigues buscando lo justo. Yo aprendí a quedarme con lo que vence».",
    "victoryLine": "Vándalo es capturado. Zhinchi salva a Xervias, queda gravemente herido y desaparece.",
    "defeatLine": "Vándalo escapa y Zhinchi queda expuesto a su emboscada."
  },
  {
    "chapterId": "f",
    "title": "La última promesa de Zhinchi",
    "description": "La última guardia impide seguir la pista de Zhinchi hacia la Casa del Sello.",
    "kind": "skirmish",
    "opponent": "Guardia de Sigumán",
    "openingLine": "Zhinchi (recuerdo): «No me sigas por lealtad, Xervias. Sigue lo que sabes que es justo».",
    "victoryLine": "Xervias recupera el último testimonio de Zhinchi y llega ante Sigumán. Su mentor sigue desaparecido.",
    "defeatLine": "Bruno Serrat cierra el acceso y se pierde el rastro de Zhinchi.",
    "id": "37"
  },
  {
    "id": "38",
    "chapterId": "f",
    "title": "La Casa del Sello",
    "description": "Sigumán reclama la paz para justificar una autoridad edificada sobre documentos falsos.",
    "kind": "final",
    "opponent": "Sigumán",
    "openingLine": "Sigumán: «La verdad dividió al reino. Mi voluntad habría podido salvarlo».",
    "victoryLine": "Sigumán muere al derrumbarse la Casa del Sello. La Falsa Luz cae; San Jerónimo y Zhinchi siguen siendo un misterio.",
    "defeatLine": "Sigumán conserva la Casa del Sello y el reino continúa sometido a su mentira."
  }
];

export function chapterForStage(id: string): StoryChapter | undefined {
  const stage = STORY_STAGES.find(stage => stage.id === id);
  return STORY_CHAPTERS.find(chapter => chapter.id === stage?.chapterId);
}
export function stagesForChapter(id: string): readonly StoryStage[] {
  return STORY_STAGES.filter(stage => stage.chapterId === id);
}
