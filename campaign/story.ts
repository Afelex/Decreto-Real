/** DR-C02 · Lore and 38 missions of Decreto Real I: El Sello y la Revolución Solar.
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
    "subtitle": "Prólogo · El rumor de la Revolución Solar",
    "summary": "Dos órdenes con el mismo sello dicen cosas opuestas. Xervias debe proteger a las familias afectadas y descubrir quién está cambiando los decretos.",
    "color": "#caa873"
  },
  {
    "id": "1",
    "title": "El puerto de hierro",
    "region": "Puerto del Callao",
    "subtitle": "General I · Almirante de Hierro",
    "summary": "En el Callao alguien esconde armas en barcos y falsifica sus documentos. Xervias busca los registros que revelan a dónde llevan esas armas.",
    "general": "Almirante de Hierro",
    "specialCard": "Marea de Hierro",
    "color": "#6b99ac"
  },
  {
    "id": "2",
    "title": "Los caminos escarlata",
    "region": "Caminos del Reino",
    "subtitle": "General II · Jinete Escarlata",
    "summary": "Los solarianos reparten decretos falsos por los caminos. Xervias sigue sus cartas para descubrir quién financia la Revolución Solar.",
    "general": "Jinete Escarlata",
    "specialCard": "Carga Sangrante",
    "color": "#c47562"
  },
  {
    "id": "3",
    "title": "La plata enterrada",
    "region": "Minas de la Sierra",
    "subtitle": "General III · Señor de la Plata",
    "summary": "Los mineros tienen problemas reales, pero sus jefes utilizan ese sufrimiento para ganar dinero y apoyar a Sigumán. Xervias busca las cuentas.",
    "general": "Señor de la Plata",
    "specialCard": "Pacto de Azogue",
    "color": "#a3a0af"
  },
  {
    "id": "4",
    "title": "El trueno del bastión",
    "region": "Fortaleza de Artillería",
    "subtitle": "General IV · Artillero del Trueno",
    "summary": "Un general amenaza a los pueblos con cañones para mantenerlos callados. Xervias debe liberar a los testigos y encontrar a los mensajeros.",
    "general": "Artillero del Trueno",
    "specialCard": "Descarga del Trueno",
    "color": "#cba36b"
  },
  {
    "id": "5",
    "title": "Sombras de la frontera",
    "region": "Frontera Oriental",
    "subtitle": "General V · Fantasma de la Selva",
    "summary": "Nayisa protege una región que antes sufrió abusos de los soldados. Xervias necesita su confianza para sacar las pruebas de la selva.",
    "general": "Fantasma de la Selva",
    "specialCard": "Velo de la Selva",
    "color": "#779e7b"
  },
  {
    "id": "6",
    "title": "La ciudad de los estandartes",
    "region": "Ciudad de los Estandartes",
    "subtitle": "General VI · Dama del Estandarte",
    "summary": "Una ciudad está dividida por banderas y promesas falsas. Xervias quiere demostrar que sus habitantes pueden vivir juntos sin obedecer por miedo.",
    "general": "Dama del Estandarte",
    "specialCard": "Estandarte Sagrado",
    "color": "#b8848c"
  },
  {
    "id": "7",
    "title": "El cóndor y las cumbres",
    "region": "Fortaleza de las Cumbres",
    "subtitle": "General VII · Cóndor de los Andes",
    "summary": "El Cóndor esconde una carta antigua porque teme descubrir que su juramento fue cambiado. Xervias busca la verdad detrás de esa promesa.",
    "general": "Cóndor de los Andes",
    "specialCard": "Picado Celestial",
    "color": "#8aadd0"
  },
  {
    "id": "8",
    "title": "La casa del juramento",
    "region": "Casa del Juramento",
    "subtitle": "General VIII · Caballero del Juramento",
    "summary": "Los juramentos de los soldados fueron alterados. El último general debe decidir si sigue obedeciendo a Sigumán o protege a la gente.",
    "general": "Caballero del Juramento",
    "specialCard": "Juramento Eterno",
    "color": "#c8af7d"
  },
  {
    "id": "f",
    "title": "La Revolución Solar",
    "region": "Casa del Sello",
    "subtitle": "Final · Vándalo Rojo, el Escribano y Sigumán",
    "summary": "Xervias descubre cómo los solarianos manipularon órdenes. Enfrenta al Escribano, a Vándalo Rojo y finalmente a Sigumán.",
    "color": "#ba8394"
  }
];

export const STORY_STAGES: readonly StoryStage[] = [
  {
    "id": "01",
    "chapterId": "p",
    "title": "El pregón alterado",
    "description": "Dos decretos idénticos condenan y absuelven a las mismas familias. Xervias debe impedir que se castigue a personas sin saber cuál orden es verdadera.",
    "kind": "skirmish",
    "opponent": "Guardia del pregón",
    "openingLine": "OBJETIVO: Protege a las familias y averigua por qué existen dos órdenes opuestas.",
    "victoryLine": "Xervias rescata a los testigos: el sello es auténtico, pero alguien ha cambiado sus palabras. ¿Quién pudo hacerlo sin romper el sello?",
    "defeatLine": "Los vecinos quedan expuestos al castigo y el pregón falso sigue circulando."
  },
  {
    "id": "02",
    "chapterId": "p",
    "title": "La orden sin sello",
    "description": "Un mensajero consagrado para tareas civiles lleva una carta secreta al Callao. Xervias cree que revelará quién falsificó los decretos.",
    "kind": "skirmish",
    "opponent": "Mensajero encapuchado",
    "openingLine": "OBJETIVO: Detén al mensajero y descubre de dónde viene la orden falsa.",
    "victoryLine": "En la cera del sobre aparece una marca de embarque. El rastro conduce al Callao. ¿Qué ocultan los barcos del Callao?",
    "defeatLine": "El mensajero desaparece con la única copia que podía delatar su ruta."
  },
  {
    "id": "03",
    "chapterId": "1",
    "title": "Niebla sobre el Callao",
    "description": "En el puerto del Callao, unas cajas marcadas como alimentos esconden pólvora. Alguien quiere enviar armas sin que nadie lo descubra.",
    "kind": "skirmish",
    "opponent": "Guardia del muelle",
    "openingLine": "OBJETIVO: Revisa la carga y encuentra los documentos del envío.",
    "victoryLine": "El manifiesto revela una ruta clandestina entre la costa y las postas del reino. ¿A quién iban destinadas esas armas?",
    "defeatLine": "El cargamento parte y las pruebas del engaño se hunden entre la niebla."
  },
  {
    "id": "04",
    "chapterId": "1",
    "title": "El contramaestre rebelde",
    "description": "El contramaestre, antiguo miembro de la Orden, controla el arsenal del puerto y sus registros. No permite entrar a Xervias.",
    "kind": "subboss",
    "opponent": "Contramaestre rebelde",
    "openingLine": "OBJETIVO: Consigue la contraseña del arsenal para investigar las armas.",
    "victoryLine": "Su contraseña permite acceder al arsenal sin alertar todavía al Almirante. ¿Qué nombres aparecen en los libros del arsenal?",
    "defeatLine": "El contramaestre alerta a la flota y se cierran los accesos al puerto."
  },
  {
    "id": "05",
    "chapterId": "1",
    "title": "El arsenal del puerto",
    "description": "Los libros del arsenal muestran a dónde fueron enviadas las armas. Los guardias quieren ocultarlos para proteger al Almirante.",
    "kind": "skirmish",
    "opponent": "Custodio del arsenal",
    "openingLine": "OBJETIVO: Recupera los libros y descubre adónde viajaron las armas.",
    "victoryLine": "Un manifiesto vincula la pólvora con órdenes enviadas a las postas del interior. ¿Por qué las armas siguen la ruta de los decretos?",
    "defeatLine": "Los custodios sellan el archivo y el Almirante conserva sus pruebas."
  },
  {
    "id": "06",
    "chapterId": "1",
    "title": "El Almirante de Hierro",
    "description": "El Almirante ha cerrado el puerto porque teme perder el control. Xervias debe mostrarle que ese bloqueo también protege a los falsificadores.",
    "kind": "boss",
    "opponent": "Almirante de Hierro",
    "openingLine": "OBJETIVO: Abre el puerto y recupera las cartas que llevan al siguiente general.",
    "victoryLine": "El puerto queda libre. Los manifiestos apuntan al Jinete Escarlata y su red de correos. ¿Qué esconde el Jinete en sus correos?",
    "defeatLine": "La flota sostiene el bloqueo; la costa permanece bajo las órdenes de Sigumán."
  },
  {
    "id": "07",
    "chapterId": "2",
    "title": "Polvo en el camino",
    "description": "Un grupo de mensajeros lleva decretos hacia los pueblos. Si son falsos, podrían provocar arrestos de personas inocentes.",
    "kind": "skirmish",
    "opponent": "Escolta del camino",
    "openingLine": "OBJETIVO: Intercepta las cartas antes de que lleguen a los pueblos.",
    "victoryLine": "Xervias intercepta las órdenes antes de que otras aldeas las reciban. ¿Quién quiere detener a tantas familias?",
    "defeatLine": "El convoy se adelanta y la confusión llega primero a los caminos."
  },
  {
    "id": "08",
    "chapterId": "2",
    "title": "El capitán de salteadores",
    "description": "Un capitán cobra a las caravanas para dejarlas pasar y roba cartas que denuncian abusos. Por eso las quejas nunca llegan a destino.",
    "kind": "subboss",
    "opponent": "Capitán de salteadores",
    "openingLine": "OBJETIVO: Libera el camino y recupera las cartas robadas.",
    "victoryLine": "Liberas a los viajeros y recuperas un itinerario de las postas intervenidas. ¿Por qué alguien robaba precisamente las denuncias?",
    "defeatLine": "Las caravanas quedan aisladas y los denunciantes pierden su ruta."
  },
  {
    "id": "09",
    "chapterId": "2",
    "title": "La posta intervenida",
    "description": "Los registros de una estación de mensajeros describen hechos que aún no habían ocurrido. Alguien preparó esas noticias antes de tiempo.",
    "kind": "skirmish",
    "opponent": "Custodio de la posta",
    "openingLine": "OBJETIVO: Revisa las fechas y descubre quién organizó los mensajes.",
    "victoryLine": "Las fechas y las marcas de lacre identifican una red coordinada desde el interior. ¿Quién escribió noticias antes de que ocurrieran?",
    "defeatLine": "Los custodios destruyen el libro de salidas y borran la pista principal."
  },
  {
    "id": "10",
    "chapterId": "2",
    "title": "El Jinete Escarlata",
    "description": "El Jinete Escarlata ha repartido decretos falsos por todo el reino sin comprobarlos. Alguien le pagó para hacerlo.",
    "kind": "boss",
    "opponent": "Jinete Escarlata",
    "openingLine": "OBJETIVO: Detén al Jinete y averigua quién financió los envíos.",
    "victoryLine": "Su correspondencia revela pagos del Señor de la Plata por difundir proclamas falsas. ¿Quién paga tantas mentiras con la plata de las minas?",
    "defeatLine": "El Jinete mantiene su dominio sobre los caminos y el reino escucha su versión."
  },
  {
    "id": "11",
    "chapterId": "3",
    "title": "El precio de la plata",
    "description": "Los mineros trabajan demasiado y cobran menos de lo prometido. Sus quejas son reales, aunque alguien las utiliza para difundir órdenes falsas.",
    "kind": "skirmish",
    "opponent": "Guardia de la mina",
    "openingLine": "OBJETIVO: Escucha a los mineros y consigue sus denuncias.",
    "victoryLine": "Xervias escucha a los mineros y separa sus denuncias de las órdenes falsificadas. ¿Quién está usando el dolor de los mineros?",
    "defeatLine": "El miedo silencia a los trabajadores y crece el resentimiento."
  },
  {
    "id": "12",
    "chapterId": "3",
    "title": "El capataz de la mina",
    "description": "Un antiguo consagrado, ahora capataz, oculta los libros de salarios. Los trabajadores podrían descubrir cuánto dinero les deben.",
    "kind": "subboss",
    "opponent": "Capataz",
    "openingLine": "OBJETIVO: Recupera los libros de pagos y demuestra el abuso.",
    "victoryLine": "Los libros prueban abusos auténticos y un desvío de plata hacia los emisarios del Alba. ¿Adónde fue a parar la plata que falta?",
    "defeatLine": "El capataz conserva los archivos y los mineros continúan sin respuestas."
  },
  {
    "id": "13",
    "chapterId": "3",
    "title": "La pólvora escondida",
    "description": "Hay pólvora junto a la salida de la mina. Un derrumbe podría encerrar a los trabajadores y destruir las pruebas.",
    "kind": "skirmish",
    "opponent": "Custodio de pólvora",
    "openingLine": "OBJETIVO: Ayuda a evacuar la mina y salva los documentos.",
    "victoryLine": "La salida queda a salvo y una orden de pago apunta al despacho del Señor de la Plata. ¿Qué más intenta esconder el Señor de la Plata?",
    "defeatLine": "La pólvora mantiene la mina bajo amenaza y la evacuación fracasa."
  },
  {
    "id": "14",
    "chapterId": "3",
    "title": "El Señor de la Plata",
    "description": "El Señor de la Plata se enriquece con las minas y utiliza parte del dinero para apoyar a Sigumán y conservar sus privilegios.",
    "kind": "boss",
    "opponent": "Señor de la Plata",
    "openingLine": "OBJETIVO: Recupera las cuentas para demostrar quién pagó a la Revolución Solar.",
    "victoryLine": "Sus cuentas revelan pagos a Leocadio del Alba y a la fortaleza de los cañones. ¿Por qué la Revolución Solar necesita tantos cañones?",
    "defeatLine": "El Señor de la Plata conserva sus libros y compra el silencio de sus testigos."
  },
  {
    "id": "15",
    "chapterId": "4",
    "title": "Camino de los cañones",
    "description": "Los soldados de una fortaleza disparan a los caminos para impedir que la gente entre o salga. Hay familias atrapadas.",
    "kind": "skirmish",
    "opponent": "Explorador artillero",
    "openingLine": "OBJETIVO: Encuentra un camino seguro para las familias.",
    "victoryLine": "La avanzada alcanza las defensas sin abandonar a los habitantes del camino. ¿Quién dio la orden de disparar contra los caminos?",
    "defeatLine": "Los cañones obligan a retirarse y la ruta de los testigos se interrumpe."
  },
  {
    "id": "16",
    "chapterId": "4",
    "title": "El maestro bombardero",
    "description": "El maestro bombardero conoce la posición de los cañones que bloquean las salidas. Sus planos podrían ayudar a los vecinos.",
    "kind": "subboss",
    "opponent": "Maestro bombardero",
    "openingLine": "OBJETIVO: Consigue los planos para evitar los cañones.",
    "victoryLine": "Sus planos revelan el punto débil del bastión y permiten abrir una ruta segura. ¿Qué esconden detrás de la puerta del bastión?",
    "defeatLine": "El fuego de artillería conserva el control de los accesos."
  },
  {
    "id": "17",
    "chapterId": "4",
    "title": "La puerta del bastión",
    "description": "El general mantiene encerrados a testigos que vieron llegar las armas. Teme que revelen quién las envió.",
    "kind": "skirmish",
    "opponent": "Guardia del bastión",
    "openingLine": "OBJETIVO: Abre la puerta y libera a los testigos.",
    "victoryLine": "Los testigos salen con vida y el Artillero queda sin su última defensa. ¿Por qué el Artillero teme tanto a esos testigos?",
    "defeatLine": "La puerta permanece cerrada y los prisioneros siguen a merced del general."
  },
  {
    "id": "18",
    "chapterId": "4",
    "title": "El Artillero del Trueno",
    "description": "El Artillero del Trueno amenaza a los pueblos con cañones para obligarlos a obedecer. Los testigos no se atreven a hablar.",
    "kind": "boss",
    "opponent": "Artillero del Trueno",
    "openingLine": "OBJETIVO: Detén los cañones para que los testigos puedan declarar.",
    "victoryLine": "El bastión calla. Un testigo señala a los emisarios que cruzaron la frontera oriental. ¿Qué llevaban los emisarios hacia la selva?",
    "defeatLine": "La fortaleza mantiene sus cañones y el testimonio sigue censurado."
  },
  {
    "id": "19",
    "chapterId": "5",
    "title": "Sendero sin nombre",
    "description": "La gente de la frontera esconde sus caminos porque antes fue atacada por soldados. Xervias necesita saber por dónde pasan los mensajes falsos.",
    "kind": "skirmish",
    "opponent": "Guardián del sendero",
    "openingLine": "OBJETIVO: Gana la confianza de las familias y encuentra el sendero.",
    "victoryLine": "Una familia muestra a Xervias el sendero que usaron los mensajeros de la Revolución Solar. ¿Quién más conoce ese sendero escondido?",
    "defeatLine": "Los custodios vuelven a cerrar el acceso a los testigos de la frontera."
  },
  {
    "id": "20",
    "chapterId": "5",
    "title": "El explorador renegado",
    "description": "Un explorador guía a los mensajeros de la Revolución Solar por caminos escondidos. Lo hace porque amenazaron a su familia.",
    "kind": "subboss",
    "opponent": "Explorador renegado",
    "openingLine": "OBJETIVO: Descubre el puente secreto y ayuda a liberar al explorador de las amenazas.",
    "victoryLine": "El guía se aparta de la red clandestina y revela un puente oculto. ¿Qué aguarda al otro lado del puente?",
    "defeatLine": "Amaru mantiene los senderos cerrados para proteger a su familia."
  },
  {
    "id": "21",
    "chapterId": "5",
    "title": "Voces entre las hojas",
    "description": "Cada aldea recibe una versión diferente del mismo decreto. Eso hace que los pueblos desconfíen unos de otros.",
    "kind": "skirmish",
    "opponent": "Emisario del Alba",
    "openingLine": "OBJETIVO: Recupera las cartas y busca quién las está escribiendo.",
    "victoryLine": "Una marca en el papel identifica el taller de Leocadio del Alba. ¿Por qué enviaron una versión distinta a cada aldea?",
    "defeatLine": "La red de mensajeros alcanza otra aldea antes de que puedas advertirla."
  },
  {
    "id": "22",
    "chapterId": "5",
    "title": "El Fantasma de la Selva",
    "description": "Nayisa protege los caminos de la selva porque desconfía de los soldados de la capital. Xervias trae pruebas de que también la han engañado.",
    "kind": "boss",
    "opponent": "Fantasma de la Selva",
    "openingLine": "OBJETIVO: Muestra a Nayisa las órdenes falsas y consigue que los testigos puedan salir.",
    "victoryLine": "Nayisa ve la prueba de la falsificación y permite llevar los testimonios fuera de la selva. ¿Quién está enfrentando a los vecinos de la ciudad?",
    "defeatLine": "La red de Nayisa conserva los pasos cerrados y la verdad no puede salir."
  },
  {
    "id": "23",
    "chapterId": "6",
    "title": "La plaza dividida",
    "description": "Un guardia consagrado custodia a las autoridades civiles. Dos banderas dividen la plaza y unos vecinos quieren expulsar a otros.",
    "kind": "skirmish",
    "opponent": "Guardia de la plaza",
    "openingLine": "OBJETIVO: Evita la expulsión y ayuda a que los vecinos vuelvan a hablar.",
    "victoryLine": "Xervias consigue una tregua y los vecinos vuelven a declarar sin miedo. ¿Quién ordenó levantar dos banderas enemigas?",
    "defeatLine": "Las facciones ocupan la plaza y la ciudad pierde su última tregua."
  },
  {
    "id": "24",
    "chapterId": "6",
    "title": "El predicador impostor",
    "description": "Un antiguo consagrado, ahora falso predicador, recluta solarianos prometiendo paz si obedecen a Sigumán.",
    "kind": "subboss",
    "opponent": "Predicador impostor",
    "openingLine": "OBJETIVO: Muestra las órdenes falsas y libera a la gente de sus amenazas.",
    "victoryLine": "Los habitantes escuchan los testimonios y dejan de obedecer al falso predicador. ¿Quién escribió las falsas promesas del predicador?",
    "defeatLine": "El predicador conserva la plaza y la población desconfía de sus propios vecinos."
  },
  {
    "id": "25",
    "chapterId": "6",
    "title": "Los libros del cabildo",
    "description": "Un escribano consagrado en función civil custodia dos versiones del mismo decreto. Una fue escondida por orden de sus jefes.",
    "kind": "skirmish",
    "opponent": "Escribano de guardia",
    "openingLine": "OBJETIVO: Recupera las dos copias para demostrar que el decreto fue cambiado.",
    "victoryLine": "Ambos documentos prueban la manipulación y revelan una ruta hacia las cumbres. ¿Por qué los documentos señalan las cumbres?",
    "defeatLine": "Los libros son sellados y solo los pregones oficiales alcanzan la plaza."
  },
  {
    "id": "26",
    "chapterId": "6",
    "title": "La Dama del Estandarte",
    "description": "La Dama del Estandarte cree que una sola bandera mantendrá unida a la ciudad. Pero obliga a callar a quienes piensan distinto.",
    "kind": "boss",
    "opponent": "Dama del Estandarte",
    "openingLine": "OBJETIVO: Demuestra que la ciudad puede unirse sin obligar a todos a obedecer.",
    "victoryLine": "La Dama deja el estandarte. La ciudad conserva su unidad sin negar los testimonios. ¿Qué secreto espera entre las montañas?",
    "defeatLine": "La Dama mantiene la guarnición y la ciudad sigue dividida bajo una sola bandera."
  },
  {
    "id": "27",
    "chapterId": "7",
    "title": "El paso de las nubes",
    "description": "Una tormenta dificulta el paso por la montaña. Xervias y los testigos necesitan cruzar sin dejar a nadie atrás.",
    "kind": "skirmish",
    "opponent": "Guardián de altura",
    "openingLine": "OBJETIVO: Abre un paso seguro y protege a quienes llevan las pruebas.",
    "victoryLine": "La caravana cruza unida y conserva los documentos del cabildo. ¿Por qué custodian tanto un puente de montaña?",
    "defeatLine": "El frío y los centinelas dispersan a quienes acompañan a Xervias."
  },
  {
    "id": "28",
    "chapterId": "7",
    "title": "El guardián de los pasos",
    "description": "Un guardián cerró el puente porque juró obedecer al Cóndor. Cree que abrirlo sería traicionar toda su vida.",
    "kind": "subboss",
    "opponent": "Guardián de los pasos",
    "openingLine": "OBJETIVO: Cruza el puente y demuestra que las pruebas merecen ser escuchadas.",
    "victoryLine": "El guardián permite el paso y cuenta que el Cóndor custodia una carta antigua. ¿Qué dice la carta que nadie puede leer?",
    "defeatLine": "Martín mantiene la ruta bloqueada por lealtad a su juramento."
  },
  {
    "id": "29",
    "chapterId": "7",
    "title": "El filo de la cordillera",
    "description": "Una patrulla protege la cámara del Cóndor, donde se guarda una carta antigua sobre el juramento de los generales.",
    "kind": "skirmish",
    "opponent": "Defensor de la cumbre",
    "openingLine": "OBJETIVO: Llega hasta el Cóndor y recupera la carta.",
    "victoryLine": "El puente queda abierto y Xervias alcanza el refugio del Cóndor. ¿Se atreverá el Cóndor a revisar su juramento?",
    "defeatLine": "La patrulla sostiene el desfiladero y obliga a la caravana a retroceder."
  },
  {
    "id": "30",
    "chapterId": "7",
    "title": "El Cóndor de los Andes",
    "description": "El Cóndor protege una carta que puede demostrar que las promesas de los generales fueron cambiadas. Teme haber obedecido una mentira.",
    "kind": "boss",
    "opponent": "Cóndor de los Andes",
    "openingLine": "OBJETIVO: Consigue la carta y descubre qué relación tiene con San Jerónimo.",
    "victoryLine": "Aukan entrega la carta: una mención a San Jerónimo lleva hasta la Casa del Juramento. ¿Qué ocurrió realmente en San Jerónimo?",
    "defeatLine": "El Cóndor conserva la carta y el paso a los últimos secretos permanece cerrado."
  },
  {
    "id": "31",
    "chapterId": "8",
    "title": "Los heraldos del juramento",
    "description": "Los heraldos protegen la Casa del Juramento porque les enseñaron a obedecer sin hacer preguntas. Xervias sospecha que la promesa fue alterada.",
    "kind": "skirmish",
    "opponent": "Heraldo del juramento",
    "openingLine": "OBJETIVO: Entra a la casa y comprueba qué juraron realmente los soldados.",
    "victoryLine": "Los heraldos reconocen que el juramento fue alterado después de ser pronunciado. ¿Quién cambió las palabras de aquel juramento?",
    "defeatLine": "La guardia sigue confundiendo lealtad con silencio."
  },
  {
    "id": "32",
    "chapterId": "8",
    "title": "El teniente de la Guardia",
    "description": "Un teniente guarda copias antiguas de las promesas. Teme que compararlas revele que el ejército fue engañado.",
    "kind": "subboss",
    "opponent": "Teniente de la Guardia",
    "openingLine": "OBJETIVO: Compara las copias originales con los decretos falsos.",
    "victoryLine": "Una copia original contradice las órdenes distribuidas por Leocadio del Alba. ¿Desde cuándo sabía Sigumán que eran falsas?",
    "defeatLine": "El teniente conserva las copias y niega el acceso a los testigos."
  },
  {
    "id": "33",
    "chapterId": "8",
    "title": "La última guardia",
    "description": "La última guardia impide entrar en la sala donde se escribió el juramento oficial. Dentro podría haber pruebas contra Sigumán.",
    "kind": "skirmish",
    "opponent": "Capitán del juramento",
    "openingLine": "OBJETIVO: Entra a la sala y busca pruebas de lo que sabía Sigumán.",
    "victoryLine": "La cámara queda abierta. Una nota sugiere que Sigumán sabía del fraude desde el inicio. ¿Por qué Sigumán dejó que el fraude continuara?",
    "defeatLine": "El capitán mantiene la cámara cerrada y el origen de las órdenes sigue oculto."
  },
  {
    "id": "34",
    "chapterId": "8",
    "title": "El Caballero del Juramento",
    "description": "El Caballero del Juramento sirvió a Sigumán porque creyó que así protegía la paz. Ahora debe aceptar que su promesa fue cambiada.",
    "kind": "boss",
    "opponent": "Caballero del Juramento",
    "openingLine": "OBJETIVO: Muestra al Caballero la promesa original y abre el camino.",
    "victoryLine": "El Caballero se retira. La puerta de la Casa del Sello se abre y apunta hacia Sigumán. ¿Qué encontrarán tras las puertas de la Casa del Sello?",
    "defeatLine": "Gonzalo conserva el acceso, incapaz todavía de distinguir deber y obediencia."
  },
  {
    "id": "35",
    "chapterId": "f",
    "title": "El Escribano del Alba",
    "description": "Leocadio, antiguo consagrado y Escribano del Alba, cambió decretos para que Sigumán ganara seguidores enfrentando a los pueblos.",
    "kind": "subboss",
    "opponent": "Escribano del Alba",
    "openingLine": "OBJETIVO: Recupera los originales y demuestra cómo se organizó el engaño.",
    "victoryLine": "Los registros de San Jerónimo explican cómo Leocadio alteró la resonancia de los sellos. Sigumán conocía el engaño. ¿Quién intentará detenerlos?",
    "defeatLine": "Leocadio esconde sus matrices y la Revolución Solar conserva su coartada."
  },
  {
    "id": "36",
    "chapterId": "f",
    "title": "La emboscada de Vándalo Rojo",
    "description": "Vándalo Rojo fue compañero de Xervias. Ahora ayuda a Sigumán porque quiere dirigir un ejército, aunque deba traicionar a sus antiguos amigos.",
    "kind": "subboss",
    "opponent": "Vándalo Rojo",
    "openingLine": "OBJETIVO: Detén a Vándalo Rojo y evita que capture a Xervias.",
    "victoryLine": "Vándalo cae derrotado, pero un estruendo sacude las columnas de San Jerónimo. La estructura empieza a ceder. ¿Conseguirán salir a tiempo?",
    "defeatLine": "Vándalo escapa y Zhinchi queda expuesto a su emboscada."
  },
  {
    "chapterId": "f",
    "title": "La última promesa de Zhinchi",
    "description": "Zhinchi desapareció entre los escombros al salvar a Xervias. Nadie sabe si pudo escapar. La última guardia protege los archivos de San Jerónimo.",
    "kind": "skirmish",
    "opponent": "Guardia de Sigumán",
    "openingLine": "OBJETIVO: Recupera la última pista de Zhinchi y llega hasta la sala de Sigumán.",
    "victoryLine": "Xervias descubre cómo se manipularon los modelos originales del sello en San Jerónimo. Su mentor sigue desaparecido. ¿Logrará detener a Sigumán?",
    "defeatLine": "Bruno Serrat cierra el acceso y se pierde el rastro de Zhinchi.",
    "id": "37"
  },
  {
    "id": "38",
    "chapterId": "f",
    "title": "La Casa del Sello",
    "description": "Sigumán, antiguo comandante de la Orden de la Corona Solar, usó decretos falsos para someter al reino. Xervias debe detenerlo.",
    "kind": "final",
    "opponent": "Sigumán",
    "openingLine": "OBJETIVO: Detén a Sigumán y termina con el control de la Revolución Solar.",
    "victoryLine": "Sigumán es derrotado y detenido. Las pruebas de San Jerónimo desmantelan la falsificación; Xervias sigue su camino, sin saber qué fue de Zhinchi. ¿Qué aprenderá ahora?",
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
