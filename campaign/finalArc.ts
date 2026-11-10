/**
 * Escenas previas a los cuatro combates finales. Estas intervenciones
 * preceden a la moneda; las misiones conservan sus IDs 35–38 y DRStudio
 * mantiene sus claves de briefing existentes.
 */
export type FinalPreludeBeat = Readonly<{ name: string; text: string }>;
export const FINAL_PRELUDES: Readonly<Record<string, readonly FinalPreludeBeat[]>> = {
  '35': [
    { name:'Crónica', text:'Ante la Casa del Sello, Zhinchi y Xervias encuentran al Vándalo Rojo. El mercenario reconoce a su antiguo compañero de academia.' },
    { name:'Vándalo Rojo', text:'¡Zhinchi! Todavía obedeces a otros. Yo ya derrotaba a los maestros cuando tú seguías estudiando.' },
    { name:'Zhinchi', text:'Eras el mejor de nuestra promoción, pero dejaste la academia después de dos años. Vendiste lo que habíamos jurado defender.' },
    { name:'Crónica', text:'Por un instante, Zhinchi recuerda cuando estudiaban juntos. El Vándalo, invicto, se marchó convencido de que nadie podía enseñarle nada.' },
    { name:'Vándalo Rojo', text:'¡Sigumán me dio un poder que tus profesores jamás habrían imaginado! ¡Contémplalo!' },
    { name:'Crónica', text:'El mercenario revela su carta mística. Zhinchi responde con un decreto de capitán y ambos chocan; las columnas comienzan a ceder.' },
    { name:'Xervias', text:'¡Capitán! ¡Las piedras van a caer sobre nosotros!' },
    { name:'Zhinchi', text:'Toma mi Sello de Mando, Xervias. Mi tercer año me enseñó que el poder debe servir para proteger. Ahora lo dejo en tus manos.' },
    { name:'Crónica', text:'La pequeña vara de mando enciende el anillo de Xervias. La carta Decreto del Legado despierta y sus místicas dejan de estar selladas.' },
    { name:'Zhinchi', text:'¡Continúa! ¡Yo mantendré este paso abierto!' },
    { name:'Crónica', text:'Una nube de polvo oculta a Zhinchi. No se ve qué ocurrió con él. El Vándalo Rojo emerge del otro lado de los escombros.' },
    { name:'Vándalo Rojo', text:'¿Crees que podrás vencerme con el juguete de tu maestro? ¡Ni siquiera Zhinchi pudo detenerme!' },
    { name:'Xervias', text:'Mi capitán me enseñó algo que tú nunca comprendiste. ¡No voy a permitir que sigas adelante!' },
  ],
  '36': [
    { name:'Crónica', text:'Xervias llega solo a los calabozos de la fortaleza. Varios inocentes están detenidos por decretos falsificados.' },
    { name:'Gaspar de Armenta', text:'Soy Gaspar, custodio del Edicto. Nadie entra al trono de Sigumán sin su permiso.' },
    { name:'Xervias', text:'Estas personas no han cometido ningún delito. ¡Déjalas salir!' },
    { name:'Gaspar de Armenta', text:'Mi deber es obedecer. Si Sigumán ordenó encerrarlos, no hay nada que discutir.' },
    { name:'Xervias', text:'Zhinchi me enseñó que obedecer no significa dejar de pensar. Debo decidir por mí mismo.' },
    { name:'Gaspar de Armenta', text:'Entonces enfrentarás a mi León del Edicto. Tiene cuatro puntos de vida, ataca con dos y no se retira hasta ser destruido.' },
  ],
  '37': [
    { name:'Crónica', text:'Xervias alcanza el trono. Tras ocho regiones liberadas, por fin encuentra al hombre que ordenó alterar los sellos.' },
    { name:'Sigumán', text:'Fui comandante de la Corona Solar. Quise poner fin al caos, pero nadie obedecía mientras existieran demasiadas voluntades.' },
    { name:'Xervias', text:'Provocaste conflictos para que todos te temieran. Eso no es paz, Sigumán.' },
    { name:'Sigumán', text:'La paz absoluta exige una sola voz y una sola ley. Cuando me derrotes, quizá descubras cuán necesaria es.' },
  ],
  '38': [
    { name:'Crónica', text:'Después de la primera derrota, los ocho sellos elevan el cuerpo de Sigumán. El salón se convierte en un inmenso decreto luminoso.' },
    { name:'Sigumán', text:'¡Yo soy el Decreto Viviente! ¡Las leyes de este reino ya no existirán fuera de mí!' },
    { name:'Xervias', text:'Ninguna corona puede convertir a las personas en prisioneras. ¡Terminaré con tus decretos falsos!' },
    { name:'Crónica', text:'Los sellos se transforman en guardianes invocados. Xervias debe enfrentarse a la forma definitiva de Sigumán.' },
  ],
};
