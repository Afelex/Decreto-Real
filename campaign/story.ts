/** DR-C02 · Lore and 38 missions of Decreto Real I: El Sello y la Falsa Luz.
 * X, Zero, Vile and Sigma remain provisional names. Regional minor opponents
 * and the connecting dialogue are UI adaptations pending final editorial review.
 * The eight general names, regions, special cards and overarching conclusion
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
    "summary": "Un soldado joven recibe una misión de Zero. Decretos contradictorios anuncian una rebelión que mezcla agravios reales y documentos falsos.",
    "color": "#caa873"
  },
  {
    "id": "1",
    "title": "El puerto de hierro",
    "region": "Puerto del Callao",
    "subtitle": "General I · Almirante de Hierro",
    "summary": "En el Callao, el control de la costa y los suministros decide la primera victoria. El Almirante custodia rutas que podrían revelar la verdad.",
    "general": "Almirante de Hierro",
    "specialCard": "Bombardeo naval",
    "color": "#6b99ac"
  },
  {
    "id": "2",
    "title": "Los caminos escarlata",
    "region": "Caminos del Reino",
    "subtitle": "General II · Jinete Escarlata",
    "summary": "Los caminos se llenan de patrullas que repiten proclamas incompatibles. El Jinete Escarlata mueve órdenes por el reino.",
    "general": "Jinete Escarlata",
    "specialCard": "Carga de caballería",
    "color": "#c47562"
  },
  {
    "id": "3",
    "title": "La plata enterrada",
    "region": "Minas de la Sierra",
    "subtitle": "General III · Señor de la Plata",
    "summary": "Las minas esconden abusos verdaderos y registros manipulados. Es preciso separar los hechos de la propaganda.",
    "general": "Señor de la Plata",
    "specialCard": "Pólvora enterrada",
    "color": "#a3a0af"
  },
  {
    "id": "4",
    "title": "El trueno del bastión",
    "region": "Fortaleza de Artillería",
    "subtitle": "General IV · Artillero del Trueno",
    "summary": "Una fortaleza artillada bloquea el paso. El enemigo se sirve del estruendo para hacer creer que su causa es invencible.",
    "general": "Artillero del Trueno",
    "specialCard": "Fuego concentrado",
    "color": "#cba36b"
  },
  {
    "id": "5",
    "title": "Sombras de la frontera",
    "region": "Frontera Oriental",
    "subtitle": "General V · Fantasma de la Selva",
    "summary": "En la frontera oriental las noticias llegan distorsionadas. Los senderos ocultos permiten seguir a quienes fabrican la Falsa Luz.",
    "general": "Fantasma de la Selva",
    "specialCard": "Sendero secreto",
    "color": "#779e7b"
  },
  {
    "id": "6",
    "title": "La ciudad de los estandartes",
    "region": "Ciudad de los Estandartes",
    "subtitle": "General VI · Dama del Estandarte",
    "summary": "Los colores y juramentos dividen a la ciudad. La Dama exige lealtad a un símbolo cuya legitimidad empieza a resquebrajarse.",
    "general": "Dama del Estandarte",
    "specialCard": "Estandarte de resistencia",
    "color": "#b8848c"
  },
  {
    "id": "7",
    "title": "El cóndor y las cumbres",
    "region": "Fortaleza de las Cumbres",
    "subtitle": "General VII · Cóndor de los Andes",
    "summary": "Las montañas separan las fuerzas de Zero de la verdad. El paso de las cumbres es la última defensa del interior.",
    "general": "Cóndor de los Andes",
    "specialCard": "Ataque de las cumbres",
    "color": "#8aadd0"
  },
  {
    "id": "8",
    "title": "La casa del juramento",
    "region": "Casa del Juramento",
    "subtitle": "General VIII · Caballero del Juramento",
    "summary": "El último general guarda promesas y documentos que conducen hasta Sigma. ¿Es posible mantener un juramento fundado en una mentira?",
    "general": "Caballero del Juramento",
    "specialCard": "Último juramento",
    "color": "#c8af7d"
  },
  {
    "id": "f",
    "title": "La Falsa Luz",
    "region": "Casa del Sello",
    "subtitle": "Final · Vile, el Escribano y Sigma",
    "summary": "Tras los generales llegan Vile, las falsificaciones del Escribano del Alba y la confrontación con Sigma. El secreto de San Jerónimo permanece.",
    "color": "#ba8394"
  }
];

export const STORY_STAGES: readonly StoryStage[] = [
  {
    "id": "01",
    "chapterId": "p",
    "title": "El pregón alterado",
    "description": "Una proclamación contradictoria llega al puesto de guardia.",
    "kind": "skirmish",
    "opponent": "Guardia del pregón",
    "openingLine": "Zero te llama: «No repitas una orden cuyo origen no conoces».",
    "victoryLine": "Has protegido a los testigos. La primera contradicción ya no puede ocultarse.",
    "defeatLine": "El pregón se extiende antes de que puedas investigar."
  },
  {
    "id": "02",
    "chapterId": "p",
    "title": "La orden sin sello",
    "description": "Una orden llega sin la marca que debería autenticarla.",
    "kind": "skirmish",
    "opponent": "Mensajero encapuchado",
    "openingLine": "Zero: «Un sello puede legitimar una orden; su ausencia también dice mucho».",
    "victoryLine": "Encuentras una pista que señala hacia la costa.",
    "defeatLine": "La pista desaparece entre los mensajeros."
  },
  {
    "id": "03",
    "chapterId": "p",
    "title": "Juramento de campaña",
    "description": "Antes de partir, el joven soldado debe demostrar que merece la confianza de Zero.",
    "kind": "subboss",
    "opponent": "Capitán de prueba",
    "openingLine": "Zero: «Defiende a los inocentes, incluso cuando la victoria parezca sencilla».",
    "victoryLine": "Zero te encomienda seguir el rastro de la Falsa Luz.",
    "defeatLine": "Aún debes demostrar que puedes soportar la misión."
  },
  {
    "id": "04",
    "chapterId": "1",
    "title": "Niebla sobre el Callao",
    "description": "Los muelles ocultan un cargamento de pólvora.",
    "kind": "skirmish",
    "opponent": "Guardia del muelle",
    "openingLine": "«Lo que entra por mar puede alimentar una guerra», advierte Zero.",
    "victoryLine": "Aparecen órdenes firmadas por distintas autoridades.",
    "defeatLine": "Los muelles vuelven a quedar bajo vigilancia enemiga."
  },
  {
    "id": "05",
    "chapterId": "1",
    "title": "El vigía de la costa",
    "description": "Un vigía controla todas las comunicaciones del puerto.",
    "kind": "subboss",
    "opponent": "Vigía de la costa",
    "openingLine": "«Corta sus señales antes de que cierre el paso».",
    "victoryLine": "Las comunicaciones quedan interrumpidas.",
    "defeatLine": "El vigía mantiene abierto el aviso al Almirante."
  },
  {
    "id": "06",
    "chapterId": "1",
    "title": "El arsenal del puerto",
    "description": "El arsenal guarda pruebas y municiones en igual medida.",
    "kind": "skirmish",
    "opponent": "Custodio del arsenal",
    "openingLine": "«No destruyas las pruebas; necesitamos saber quién las envió».",
    "victoryLine": "Recuperas un manifiesto que remite a los caminos reales.",
    "defeatLine": "El arsenal permanece inaccesible."
  },
  {
    "id": "07",
    "chapterId": "1",
    "title": "El Almirante de Hierro",
    "description": "El general del Callao protege la primera pieza del engaño.",
    "kind": "boss",
    "opponent": "Almirante de Hierro",
    "openingLine": "Almirante: «Mi flota obedece al único mando que queda».",
    "victoryLine": "El Almirante cae. Sus registros relacionan el puerto con el siguiente general.",
    "defeatLine": "El puerto sigue cerrado y la trama permanece oculta."
  },
  {
    "id": "08",
    "chapterId": "2",
    "title": "Polvo en el camino",
    "description": "Un convoy lleva decretos sellados hacia el interior.",
    "kind": "skirmish",
    "opponent": "Escolta del camino",
    "openingLine": "«Cada ruta conduce a la misma voz», murmura Zero.",
    "victoryLine": "Interceptas un mensaje con un sello sospechoso.",
    "defeatLine": "El convoy escapa hacia la sierra."
  },
  {
    "id": "09",
    "chapterId": "2",
    "title": "La avanzada escarlata",
    "description": "Una patrulla desafía a cualquiera que dude de las proclamas.",
    "kind": "subboss",
    "opponent": "Capitán de avanzada",
    "openingLine": "«La velocidad del enemigo también puede ser su debilidad».",
    "victoryLine": "La patrulla revela la ubicación del puesto de mando.",
    "defeatLine": "La avanzada corta la ruta."
  },
  {
    "id": "10",
    "chapterId": "2",
    "title": "La posta intervenida",
    "description": "Una estación postal guarda registros de envíos contradictorios.",
    "kind": "skirmish",
    "opponent": "Custodio de la posta",
    "openingLine": "«No es una sola mentira: alguien organizó toda una cadena».",
    "victoryLine": "Las rutas empiezan a dibujar la extensión de la conspiración.",
    "defeatLine": "Las pruebas son destruidas antes de recuperarlas."
  },
  {
    "id": "11",
    "chapterId": "2",
    "title": "El Jinete Escarlata",
    "description": "El general dirige mensajeros y caballería por todo el reino.",
    "kind": "boss",
    "opponent": "Jinete Escarlata",
    "openingLine": "Jinete: «Una orden veloz vale más que mil dudas».",
    "victoryLine": "Sus cartas confirman que las noticias vienen de una misma fuente.",
    "defeatLine": "El Jinete mantiene su control del camino."
  },
  {
    "id": "12",
    "chapterId": "3",
    "title": "El precio de la plata",
    "description": "Los mineros denuncian abusos reales, mezclados con proclamas falsas.",
    "kind": "skirmish",
    "opponent": "Guardia de la mina",
    "openingLine": "«Escucha primero a quienes sufrieron», aconseja Zero.",
    "victoryLine": "Las quejas auténticas quedan separadas de las falsificaciones.",
    "defeatLine": "La confusión mantiene a los trabajadores enfrentados."
  },
  {
    "id": "13",
    "chapterId": "3",
    "title": "La galería cerrada",
    "description": "Una galería oculta documentos bajo la roca.",
    "kind": "subboss",
    "opponent": "Capataz de galería",
    "openingLine": "«Una verdad enterrada sigue siendo verdad».",
    "victoryLine": "Aseguras los registros antes del derrumbe.",
    "defeatLine": "Los archivos continúan inaccesibles."
  },
  {
    "id": "14",
    "chapterId": "3",
    "title": "La pólvora escondida",
    "description": "Un depósito minero amenaza las rutas de salida.",
    "kind": "skirmish",
    "opponent": "Custodio de pólvora",
    "openingLine": "«No permitas que conviertan la mina en una tumba».",
    "victoryLine": "El depósito queda a salvo y descubres otra pieza del fraude.",
    "defeatLine": "La salida permanece bloqueada."
  },
  {
    "id": "15",
    "chapterId": "3",
    "title": "El Señor de la Plata",
    "description": "El general se niega a perder su poder sobre la sierra.",
    "kind": "boss",
    "opponent": "Señor de la Plata",
    "openingLine": "Señor: «Todos tienen un precio, hasta los juramentos».",
    "victoryLine": "Sus libros de cuentas indican pagos a emisarios del Alba.",
    "defeatLine": "El Señor conserva sus libros y su influencia."
  },
  {
    "id": "16",
    "chapterId": "4",
    "title": "Camino de los cañones",
    "description": "La artillería impide llegar al bastión.",
    "kind": "skirmish",
    "opponent": "Explorador artillero",
    "openingLine": "«Avanza cuando calle el trueno», ordena Zero.",
    "victoryLine": "Superas el primer cinturón defensivo.",
    "defeatLine": "El avance queda detenido."
  },
  {
    "id": "17",
    "chapterId": "4",
    "title": "El maestro de pólvora",
    "description": "Un subjefe prepara las piezas para la próxima ofensiva.",
    "kind": "subboss",
    "opponent": "Maestro de pólvora",
    "openingLine": "«La precisión vence a la fuerza sin juicio».",
    "victoryLine": "Las piezas quedan inutilizadas para el siguiente enfrentamiento.",
    "defeatLine": "El enemigo mantiene sus suministros."
  },
  {
    "id": "18",
    "chapterId": "4",
    "title": "La puerta del bastión",
    "description": "Un último destacamento protege la fortaleza.",
    "kind": "skirmish",
    "opponent": "Guardia del bastión",
    "openingLine": "«Aquí no basta resistir; debemos abrir el camino».",
    "victoryLine": "La puerta se abre y el Artillero queda expuesto.",
    "defeatLine": "El bastión no cede."
  },
  {
    "id": "19",
    "chapterId": "4",
    "title": "El Artillero del Trueno",
    "description": "El general utiliza su fortaleza para intimidar a todo el reino.",
    "kind": "boss",
    "opponent": "Artillero del Trueno",
    "openingLine": "Artillero: «Mi voz es la de los cañones».",
    "victoryLine": "El silencio de la fortaleza permite escuchar nuevos testimonios.",
    "defeatLine": "Los cañones siguen imponiendo su ley."
  },
  {
    "id": "20",
    "chapterId": "5",
    "title": "Sendero sin nombre",
    "description": "Las rutas de la frontera no aparecen en los mapas reales.",
    "kind": "skirmish",
    "opponent": "Guardián del sendero",
    "openingLine": "«Seguir el rastro exige aprender a perderse», dice Zero.",
    "victoryLine": "Encuentras una ruta usada por los emisarios de la Falsa Luz.",
    "defeatLine": "El sendero se desvanece antes de completarlo."
  },
  {
    "id": "21",
    "chapterId": "5",
    "title": "El puente de raíces",
    "description": "Un subjefe controla el único paso firme sobre las aguas.",
    "kind": "subboss",
    "opponent": "Centinela del puente",
    "openingLine": "«No confundas silencio con ausencia».",
    "victoryLine": "El puente queda abierto.",
    "defeatLine": "Los centinelas retienen el paso."
  },
  {
    "id": "22",
    "chapterId": "5",
    "title": "Voces entre las hojas",
    "description": "Las proclamas se repiten con cambios cuidadosamente calculados.",
    "kind": "skirmish",
    "opponent": "Emisario del Alba",
    "openingLine": "«La mentira cambia de voz según quien la escuche».",
    "victoryLine": "Distingues la firma del Escribano del Alba entre los papeles.",
    "defeatLine": "El mensaje falso alcanza nuevas aldeas."
  },
  {
    "id": "23",
    "chapterId": "5",
    "title": "El Fantasma de la Selva",
    "description": "El general domina las rutas ocultas de la frontera.",
    "kind": "boss",
    "opponent": "Fantasma de la Selva",
    "openingLine": "Fantasma: «Jamás encontrarás al enemigo que no ves».",
    "victoryLine": "El Fantasma pierde su red de mensajeros secretos.",
    "defeatLine": "La selva sigue ocultando a sus emisarios."
  },
  {
    "id": "24",
    "chapterId": "6",
    "title": "La plaza dividida",
    "description": "Dos banderas reclaman obediencia sobre la misma ciudad.",
    "kind": "skirmish",
    "opponent": "Guardia de la plaza",
    "openingLine": "«No elijas un color antes de conocer la causa».",
    "victoryLine": "La plaza recupera una tregua frágil.",
    "defeatLine": "La disputa se extiende por la ciudad."
  },
  {
    "id": "25",
    "chapterId": "6",
    "title": "El portador del pendón",
    "description": "Un subjefe protege el símbolo de la rebelión.",
    "kind": "subboss",
    "opponent": "Portador del pendón",
    "openingLine": "«Un estandarte no debe sustituir la verdad».",
    "victoryLine": "El pendón pierde su poder sobre la multitud.",
    "defeatLine": "Las proclamas continúan dominando la plaza."
  },
  {
    "id": "26",
    "chapterId": "6",
    "title": "Los libros del cabildo",
    "description": "Los archivos civiles contienen decretos contradictorios.",
    "kind": "skirmish",
    "opponent": "Escribano de guardia",
    "openingLine": "«Los archivos recuerdan lo que los pregones esconden».",
    "victoryLine": "Los libros confirman la mano del falsificador.",
    "defeatLine": "Los archivos quedan sellados."
  },
  {
    "id": "27",
    "chapterId": "6",
    "title": "La Dama del Estandarte",
    "description": "La general custodia la última defensa de la ciudad.",
    "kind": "boss",
    "opponent": "Dama del Estandarte",
    "openingLine": "Dama: «El pueblo necesita un símbolo, no tus preguntas».",
    "victoryLine": "Su derrota libera los testimonios y una nueva ruta hacia las cumbres.",
    "defeatLine": "La ciudad continúa bajo su estandarte."
  },
  {
    "id": "28",
    "chapterId": "7",
    "title": "El paso de las nubes",
    "description": "El ejército debe atravesar un sendero de altura.",
    "kind": "skirmish",
    "opponent": "Guardián de altura",
    "openingLine": "«La altura exige paciencia», advierte Zero.",
    "victoryLine": "El paso queda asegurado.",
    "defeatLine": "El frío y los guardias obligan a retroceder."
  },
  {
    "id": "29",
    "chapterId": "7",
    "title": "El vigía del cóndor",
    "description": "Un subjefe domina el desfiladero desde una atalaya.",
    "kind": "subboss",
    "opponent": "Vigía del cóndor",
    "openingLine": "«No mires solo al frente; mira también arriba».",
    "victoryLine": "La atalaya pierde el dominio de la ruta.",
    "defeatLine": "La atalaya conserva su vigilancia."
  },
  {
    "id": "30",
    "chapterId": "7",
    "title": "El filo de la cordillera",
    "description": "La fortaleza utiliza el terreno como última muralla.",
    "kind": "skirmish",
    "opponent": "Defensor de la cumbre",
    "openingLine": "«El camino más corto no siempre es el más seguro».",
    "victoryLine": "El acceso a la cumbre se abre.",
    "defeatLine": "El desfiladero queda bloqueado."
  },
  {
    "id": "31",
    "chapterId": "7",
    "title": "El Cóndor de los Andes",
    "description": "El general espera en la última posición de altura.",
    "kind": "boss",
    "opponent": "Cóndor de los Andes",
    "openingLine": "Cóndor: «Nadie cruza mis cumbres sin mi permiso».",
    "victoryLine": "Caen las defensas del Cóndor; el camino conduce a la Casa del Juramento.",
    "defeatLine": "La montaña continúa en manos del general."
  },
  {
    "id": "32",
    "chapterId": "8",
    "title": "Los heraldos del juramento",
    "description": "Una vieja promesa obliga a soldados a obedecer sin preguntar.",
    "kind": "skirmish",
    "opponent": "Heraldo del juramento",
    "openingLine": "«La lealtad sin justicia se vuelve una cadena».",
    "victoryLine": "Los heraldos admiten dudas sobre las órdenes recibidas.",
    "defeatLine": "Los heraldos rechazan cualquier testimonio."
  },
  {
    "id": "33",
    "chapterId": "8",
    "title": "La capilla de los papeles",
    "description": "Un archivo religioso guarda copias de decretos reales.",
    "kind": "subboss",
    "opponent": "Custodio de la capilla",
    "openingLine": "«No permitas que utilicen la fe como máscara», dice Zero.",
    "victoryLine": "Las copias muestran la manipulación del Escribano.",
    "defeatLine": "Las copias permanecen fuera de alcance."
  },
  {
    "id": "34",
    "chapterId": "8",
    "title": "La última guardia",
    "description": "Un subjefe defiende la sala donde se custodian los compromisos.",
    "kind": "skirmish",
    "opponent": "Capitán del juramento",
    "openingLine": "«Detrás de esta puerta está el origen de la orden».",
    "victoryLine": "La última guardia cede y la verdad se aproxima.",
    "defeatLine": "La sala continúa cerrada."
  },
  {
    "id": "35",
    "chapterId": "8",
    "title": "El Caballero del Juramento",
    "description": "El último general se enfrenta a la contradicción de su propio juramento.",
    "kind": "boss",
    "opponent": "Caballero del Juramento",
    "openingLine": "Caballero: «Todo juramento exige un sacrificio».",
    "victoryLine": "La Casa del Juramento abre el camino hasta Sigma y la Falsa Luz.",
    "defeatLine": "El Caballero sigue guardando el acceso a la verdad."
  },
  {
    "id": "36",
    "chapterId": "f",
    "title": "La emboscada de Vile",
    "description": "Vile, antiguo compañero de armas, busca el triunfo por la fuerza y el poder.",
    "kind": "subboss",
    "opponent": "Vile",
    "openingLine": "Vile: «No me importa la verdad. Me importa quién quede de pie».",
    "victoryLine": "Vile es derrotado y capturado, pero Zero desaparece gravemente herido tras protegerte.",
    "defeatLine": "Vile escapa y Zero queda a merced de su ataque."
  },
  {
    "id": "37",
    "chapterId": "f",
    "title": "El Escribano del Alba",
    "description": "La falsificación queda expuesta: agravios reales fueron usados para fabricar una causa falsa.",
    "kind": "subboss",
    "opponent": "Escribano del Alba",
    "openingLine": "«Sigma conoció parte del engaño y aun así continuó», revela un testimonio.",
    "victoryLine": "El fraude del Escribano queda descubierto y la Casa del Sello se abre.",
    "defeatLine": "Los documentos vuelven a ocultar el origen de la Falsa Luz."
  },
  {
    "id": "38",
    "chapterId": "f",
    "title": "La Casa del Sello",
    "description": "Sigma se presenta como redentor y pretende imponer autoridad mediante la Falsa Luz.",
    "kind": "final",
    "opponent": "Sigma",
    "openingLine": "Sigma: «Si la verdad no une al reino, mi voluntad lo hará».",
    "victoryLine": "Sigma muere en el derrumbe de la Casa del Sello. La rebelión termina; San Jerónimo y el destino de Zero permanecen abiertos.",
    "defeatLine": "La Falsa Luz domina todavía la Casa del Sello."
  }
];

export function chapterForStage(id: string): StoryChapter | undefined {
  const stage = STORY_STAGES.find(stage => stage.id === id);
  return STORY_CHAPTERS.find(chapter => chapter.id === stage?.chapterId);
}
export function stagesForChapter(id: string): readonly StoryStage[] {
  return STORY_STAGES.filter(stage => stage.chapterId === id);
}
