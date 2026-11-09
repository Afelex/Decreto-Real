/** Consecuencias breves, claras y específicas de las 38 victorias.
 * Progresión no lineal: un diálogo nunca presupone que otra región se superó.
 */
import { getCampaignMission } from './campaign.ts';

export type AfterVictoryLine = Readonly<{ speaker: 'Xervias' | 'Zhinchi' | 'Crónica' | 'Nayisa' | 'Vándalo Rojo'; text: string }>;
export const AFTER_VICTORY: Readonly<Record<string, readonly AfterVictoryLine[]>> = {
 '01': [
  {speaker:'Xervias',text:'Si los dos decretos tienen el mismo sello, ¿cómo sabremos cuál es verdadero?'},
  {speaker:'Zhinchi',text:'Busca a quien los escribió y a quien los entregó. Un sello auténtico también puede usarse para mentir.'}
 ],
 '02': [
  {speaker:'Xervias',text:'La pista del mensajero llega hasta el Callao. ¿Nos dirigimos allí?'},
  {speaker:'Zhinchi',text:'Es una opción, pero hay otros siete generales moviendo los hilos. Puedes investigar sus regiones en el orden que prefieras.'}
 ],
 '03': [
  {speaker:'Xervias',text:'¿Por qué ocultaban pólvora en cajas de alimentos?'},
  {speaker:'Zhinchi',text:'Porque alguien está preparando un ejército en secreto. Encuentra los registros del puerto.'}
 ],
 '04': [
  {speaker:'Xervias',text:'El contramaestre nos dejó pasar. ¿Será suficiente?'},
  {speaker:'Zhinchi',text:'No todavía. El arsenal guarda pruebas de quién compró esas armas.'}
 ],
 '05': [
  {speaker:'Xervias',text:'¡Los libros vinculan la pólvora con las órdenes falsas!'},
  {speaker:'Zhinchi',text:'Ahora debemos hablar con Baltasar. Él tendrá que decidir si sigue protegiendo a los responsables.'}
 ],
 '06': [
  {speaker:'Xervias',text:'Baltasar ha caído. Su carta mística ha quedado conmigo, pero no responde.'},
  {speaker:'Zhinchi',text:'Está sellada. Consérvala; todavía no podemos despertar su poder. Hay más generales a los que enfrentar.'}
 ],
 '07': [
  {speaker:'Xervias',text:'Detuvimos los decretos antes de que llegaran a los pueblos.'},
  {speaker:'Zhinchi',text:'Bien. Sigamos la ruta para descubrir de dónde salieron las órdenes.'}
 ],
 '08': [
  {speaker:'Xervias',text:'El paso vuelve a estar abierto, aunque muchos siguen asustados.'},
  {speaker:'Zhinchi',text:'La libertad también exige reparar el daño. Reúne los testimonios de los viajeros.'}
 ],
 '09': [
  {speaker:'Xervias',text:'¡Las cartas estaban escritas antes de que ocurrieran los hechos!'},
  {speaker:'Zhinchi',text:'Eso prueba que alguien planeó el engaño. Leandro debe responder por sus mensajeros.'}
 ],
 '10': [
  {speaker:'Xervias',text:'Leandro nos ha entregado su carta mística.'},
  {speaker:'Zhinchi',text:'Su velocidad ya no servirá a las mentiras. Guarda la carta sellada y decide qué región liberar después.'}
 ],
 '11': [
  {speaker:'Xervias',text:'Los mineros protestaban porque los estaban engañando.'},
  {speaker:'Zhinchi',text:'Escúchalos y busca las cuentas. Su sufrimiento es real aunque otros intenten aprovecharse.'}
 ],
 '12': [
  {speaker:'Xervias',text:'El capataz admitió que cambiaba los pagos.'},
  {speaker:'Zhinchi',text:'Hay que devolver lo robado. Las cuentas revelarán quién recibió la plata.'}
 ],
 '13': [
  {speaker:'Xervias',text:'Pudimos sacar las pruebas sin hacer estallar la mina.'},
  {speaker:'Zhinchi',text:'Y ahora sabemos quién se enriqueció. Octavio tendrá que dar explicaciones.'}
 ],
 '14': [
  {speaker:'Xervias',text:'Octavio entregó su carta. Su fortuna ya no comprará nuestra obediencia.'},
  {speaker:'Zhinchi',text:'La justicia no se vende. Conserva esa mística sellada; seguimos necesitando descubrir a Sigumán.'}
 ],
 '15': [
  {speaker:'Xervias',text:'Los caminos de la fortaleza estaban cerrados incluso para las familias.'},
  {speaker:'Zhinchi',text:'Abre un paso seguro y descubre quién controla los cañones.'}
 ],
 '16': [
  {speaker:'Xervias',text:'El bombardero nos entregó los planos de sus baterías.'},
  {speaker:'Zhinchi',text:'Eso permitirá evitar más víctimas. Debemos llegar a los testigos encerrados.'}
 ],
 '17': [
  {speaker:'Xervias',text:'Los testigos están libres. Ya pueden explicar quién dio las órdenes.'},
  {speaker:'Zhinchi',text:'Entonces Jerónimo no podrá esconderse detrás de sus cañones.'}
 ],
 '18': [
  {speaker:'Xervias',text:'Jerónimo ha sido derrotado. El miedo ya no silenciará a esos pueblos.'},
  {speaker:'Zhinchi',text:'Has ganado su carta mística. Recuerda que permanece sellada hasta que descubramos cómo usarla.'}
 ],
 '19': [
  {speaker:'Xervias',text:'Los habitantes de la frontera no confían en los soldados. ¿Cómo los ayudamos?'},
  {speaker:'Zhinchi',text:'Primero escuchemos. Tienen motivos para desconfiar y necesitan garantías.'}
 ],
 '20': [
  {speaker:'Xervias',text:'El explorador solo colaboraba porque amenazaban a su familia.'},
  {speaker:'Zhinchi',text:'Protejámosla. Así podremos seguir la pista sin que más personas sufran.'}
 ],
 '21': [
  {speaker:'Xervias',text:'Encontramos la marca del Escribano del Alba en las órdenes.'},
  {speaker:'Zhinchi',text:'Guárdala. Puede servir para demostrar cómo se organizó la conspiración.'}
 ],
 '22': [
  {speaker:'Nayisa',text:'Mis caminos estaban cerrados porque los soldados atacaron a mi pueblo. No voy a olvidarlo.'},
  {speaker:'Xervias',text:'No te pido que lo olvides. Mira las dos órdenes: alguien utilizó el mismo sello para enfrentarnos.'},
  {speaker:'Nayisa',text:'Sus palabras son distintas, pero ambas parecían auténticas... Engañaron a nuestras comunidades.'},
  {speaker:'Xervias',text:'Podemos reunir las pruebas sin que tengas que abandonar a los tuyos.'},
  {speaker:'Nayisa',text:'Te ayudaré por decisión propia. Defenderé la verdad de mi pueblo.'},
  {speaker:'Xervias',text:'Gracias, Nayisa. Contaremos contigo.'}
 ],
 '23': [
  {speaker:'Xervias',text:'La plaza pertenece a todos. Nadie debería ser expulsado por su bandera.'},
  {speaker:'Zhinchi',text:'Tienes razón. Busquemos a quien alimenta la división.'}
 ],
 '24': [
  {speaker:'Xervias',text:'El predicador prometía una paz que no podía ofrecer.'},
  {speaker:'Zhinchi',text:'Las promesas vacías también hacen daño. Recupera las órdenes que mostraba a la gente.'}
 ],
 '25': [
  {speaker:'Xervias',text:'Las actas originales confirman que alguien cambió las decisiones del cabildo.'},
  {speaker:'Zhinchi',text:'Con esas pruebas, Isabela deberá reconsiderar a quién está defendiendo.'}
 ],
 '26': [
  {speaker:'Xervias',text:'Isabela ha cedido. Su carta mística es una recompensa inesperada.'},
  {speaker:'Zhinchi',text:'La fuerza puede servir para proteger, no para dominar. Mantén la carta sellada y sigamos.'}
 ],
 '27': [
  {speaker:'Xervias',text:'En las montañas encontramos una ruta que no aparecía en los mapas.'},
  {speaker:'Zhinchi',text:'Síguela con cuidado. Allí se ocultan las pruebas del juramento del Cóndor.'}
 ],
 '28': [
  {speaker:'Xervias',text:'Los pasos están abiertos. ¿Dónde estará la carta antigua?'},
  {speaker:'Zhinchi',text:'Preguntemos a los guardianes de las cumbres. Ellos conocen el camino.'}
 ],
 '29': [
  {speaker:'Xervias',text:'Ya tenemos el testimonio sobre la promesa que fue cambiada.'},
  {speaker:'Zhinchi',text:'Muéstraselo a Aukan. Tal vez pueda recordar por qué luchaba.'}
 ],
 '30': [
  {speaker:'Xervias',text:'Aukan dejó de luchar contra nosotros. Su carta mística ahora está sellada en mi colección.'},
  {speaker:'Zhinchi',text:'Su valor ya no está al servicio del orgullo. Decide qué otro general enfrentarás.'}
 ],
 '31': [
  {speaker:'Xervias',text:'Las promesas del heraldo no coinciden con los documentos.'},
  {speaker:'Zhinchi',text:'Comparemos ambos textos. Alguien modificó el juramento.'}
 ],
 '32': [
  {speaker:'Xervias',text:'El teniente dejó de ocultar las órdenes.'},
  {speaker:'Zhinchi',text:'Con cada copia recuperada nos acercamos a la verdad de Gonzalo.'}
 ],
 '33': [
  {speaker:'Xervias',text:'La última guardia ya no impedirá nuestro paso.'},
  {speaker:'Zhinchi',text:'Lleva las pruebas ante el Caballero. Esta vez deberá elegir por sí mismo.'}
 ],
 '34': [
  {speaker:'Xervias',text:'Gonzalo conoce la verdad. Su carta mística ha quedado conmigo.'},
  {speaker:'Zhinchi',text:'Un juramento no obliga a cometer injusticias. Guarda la carta y comprueba si aún quedan generales por liberar.'}
 ],
 '35': [
  {speaker:'Xervias',text:'Leocadio, ¿por qué las órdenes falsas conservaban la energía de un Sello Real?'},
  {speaker:'Crónica',text:'El Escribano muestra un antiguo registro de San Jerónimo, donde se custodiaban los modelos originales de los sellos.'},
  {speaker:'Zhinchi',text:'Copió parte de la resonancia mística del sello y después cambió el texto. Por eso nuestro anillo detectaba algo que no encajaba.'},
  {speaker:'Xervias',text:'¿Sigumán sabía que los documentos habían sido alterados?'},
  {speaker:'Zhinchi',text:'Sus instrucciones están firmadas. Provocó conflictos para que el pueblo aceptara su autoridad por miedo.'},
  {speaker:'Xervias',text:'Con las ocho pruebas y estos registros podremos demostrarlo. Sigamos adelante.'}
 ],
 '36': [
  {speaker:'Vándalo Rojo',text:'¡No puede ser! ¡El techo está cediendo!'},
  {speaker:'Crónica',text:'La energía del duelo ha dañado las columnas. Vándalo Rojo huye por un pasadizo lateral mientras las piedras empiezan a caer.'},
  {speaker:'Zhinchi',text:'¡Xervias, la estructura se viene abajo! ¡Corre!'},
  {speaker:'Xervias',text:'¡Tenemos que salir juntos, capitán!'},
  {speaker:'Crónica',text:'Un bloque cae sobre el camino de Xervias. Zhinchi lo desvía con su cetro y libera a su discípulo.'},
  {speaker:'Zhinchi',text:'Escúchame. Tus cartas místicas siguen selladas. Voy a enseñarte a canalizar su energía. Confío en que sabrás utilizarlas.'},
  {speaker:'Xervias',text:'¡Eso puede esperar! ¡Salgamos de aquí!'},
  {speaker:'Crónica',text:'El cetro ilumina el anillo de Xervias. Las cartas místicas despiertan y se desbloquea la edición de barajas: máximo tres místicas por baraja.'},
  {speaker:'Zhinchi',text:'Ya está. Recuerda lo que aprendimos. ¡Tienes que continuar!'},
  {speaker:'Xervias',text:'¡Zhinchi! ¡Venga conmigo!'},
  {speaker:'Crónica',text:'Un nuevo derrumbe los separa. Xervias escapa entre polvo y escombros. La entrada queda bloqueada. No ve qué ocurrió con Zhinchi.'},
  {speaker:'Xervias',text:'¡Capitán! ¡Responda!'},
  {speaker:'Xervias',text:'No sé si logró salir... Me salvó para que pudiera continuar. No abandonaré lo que comenzamos.'}
 ],
 '37': [
  {speaker:'Xervias',text:'Este archivo contiene los registros originales de San Jerónimo. Allí se guardaban los modelos con los que se comprobaba la energía de cada sello.'},
  {speaker:'Crónica',text:'Una anotación de Zhinchi confirma que Leocadio tuvo acceso a los modelos y pudo alterar la relación entre el sello y su documento.'},
  {speaker:'Xervias',text:'Ahora entiendo cómo engañaron al reino. No bastará con derrotar a Sigumán: tendremos que impedir que vuelvan a utilizar este método.'},
  {speaker:'Xervias',text:'Capitán... No sé dónde está. Pero sus enseñanzas me acompañarán cuando enfrente a Sigumán.'}
 ],
 '38': [
  {speaker:'Crónica',text:'La última carta de Sigumán cae al suelo. Su anillo pierde energía. Los soldados lo detienen y se recuperan los documentos que ordenó falsificar.'},
  {speaker:'Xervias',text:'Ganamos, pero una victoria no reparará por sí sola el daño que causó la Revolución Solar.'},
  {speaker:'Crónica',text:'Las pruebas reunidas en los ocho territorios permitirán retirar los decretos falsificados y escuchar a las familias afectadas.'},
  {speaker:'Xervias',text:'No sé qué ocurrió con Zhinchi después del derrumbe. Pensaré en él cada vez que deba elegir qué es lo correcto.'},
  {speaker:'Xervias',text:'Nuestro trabajo no termina aquí. Todavía hay personas que necesitan ayuda. Seguiré adelante.'}
 ],
};

export function afterVictoryLines(id: string): readonly AfterVictoryLine[] {
  if (!getCampaignMission(id)) return [];
  return AFTER_VICTORY[id] ?? [];
}
