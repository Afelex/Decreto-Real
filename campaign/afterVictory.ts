/** Consecuencias breves, claras y específicas de las 38 victorias.
 * Progresión no lineal: un diálogo nunca presupone que otra región se superó.
 */
import { getCampaignMission, bestStars, type CampaignProgress } from './campaign.ts';

export type AfterVictoryLine = Readonly<{ speaker: 'Xervias' | 'Zhinchi' | 'Crónica' | 'Nayisa' | 'Vándalo Rojo' | 'Gaspar de Armenta' | 'Sigumán'; text: string }>;
export const AFTER_VICTORY: Readonly<Record<string, readonly AfterVictoryLine[]>> = {
 '01': [
  {speaker:'Xervias',text:'Si los dos decretos tienen el mismo sello, ¿cómo sabremos cuál es verdadero?'},
  {speaker:'Zhinchi',text:'Busca a quien los escribió y a quien los entregó. Un sello auténtico también puede usarse para mentir.'}
 ],
 '02': [
  {speaker:"Xervias",text:"Mateo ha dejado una pista hacia el Callao. Tenemos que seguirla antes de que desaparezcan los decretos."},
  {speaker:"Crónica",text:"Una figura con capucha roja y antifaz interrumpe el camino. El Vándalo Rojo muestra una carta mística y su energía derriba a Xervias."},
  {speaker:"Vándalo Rojo",text:"¿Esto es lo mejor que puede ofrecer la Orden? Un soldado recién graduado no puede detenerme."},
  {speaker:"Zhinchi",text:"¡Aléjate de él! No permitiré que lastimes a mi discípulo."},
  {speaker:"Vándalo Rojo",text:"Vaya, Zhinchi. Sigues protegiendo a los débiles. ¿Todavía crees que la academia tenía algo que enseñarme?"},
  {speaker:"Zhinchi",text:"Te enseñaron a proteger. Fuiste tú quien decidió vender sus principios."},
  {speaker:"Crónica",text:"Los dos antiguos compañeros se reconocen. El mercenario sonríe, se retira y promete volver a encontrarlos."},
  {speaker:"Xervias",text:"Capitán, ¿quién era ese hombre? Jamás había visto una carta tan poderosa."},
  {speaker:"Zhinchi",text:"Fuimos compañeros de promoción. Algún día te contaré por qué abandonó la academia; ahora debemos seguir las pruebas."}
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
  {speaker:'Crónica',text:'El Vándalo Rojo cae derrotado. El Decreto del Legado ha respondido a Xervias durante su primera gran prueba.'},
  {speaker:'Vándalo Rojo',text:'¡No puede ser! Zhinchi nunca consiguió superarme... y tú has utilizado su sello mejor de lo que esperaba.'},
  {speaker:'Xervias',text:'La academia no lo hizo débil. Le enseñó aquello que tú abandonaste: defender a otros antes que a ti mismo.'},
  {speaker:'Crónica',text:'Xervias regresa al lugar del derrumbe. Busca a Zhinchi entre las piedras, pero no encuentra su cuerpo ni señales de su paradero.'},
  {speaker:'Xervias',text:'Capitán... no sé dónde está. Seguiré adelante, como me pidió. No desperdiciaré su legado.'}
 ],
 '36': [
  {speaker:"Crónica",text:"El León del Edicto se desvanece al perder sus cuatro puntos de vida. Los sellos que cerraban las celdas dejan de brillar."},
  {speaker:"Gaspar de Armenta",text:"¿Por qué me perdonas? Solo obedecí las instrucciones de Sigumán."},
  {speaker:"Xervias",text:"No necesito destruirte para demostrar que estás equivocado. Abre las celdas y ayuda a esas personas."},
  {speaker:"Crónica",text:"Gaspar cede. Los prisioneros recuperan su libertad y Xervias avanza hacia el trono sin las órdenes de su maestro."}
 ],
 '37': [
  {speaker:"Sigumán",text:"Mi cuerpo ha sido vencido, pero los ocho sellos todavía responden a mi voluntad."},
  {speaker:"Crónica",text:"Las inscripciones de toda la sala comienzan a flotar. La corona de Sigumán se fractura y una figura enorme se levanta en el trono."},
  {speaker:"Xervias",text:"Esos sellos fueron creados para proteger al reino. ¡No dejaré que los utilices para someterlo!"},
  {speaker:"Crónica",text:"La voz de Sigumán retumba desde la nueva figura: ahora se hace llamar el Decreto Viviente. Comienza el enfrentamiento definitivo."}
 ],
 '38': [
  {speaker:"Crónica",text:"Los ocho sellos se separan del cuerpo de Sigumán. Su transformación se deshace y la Casa del Sello queda en silencio."},
  {speaker:"Xervias",text:"Ninguna ley puede justificar lo que hiciste. Los pueblos conocerán la verdad y podrán reparar lo que se ha destruido."},
  {speaker:"Crónica",text:"Las pruebas reunidas en los ocho territorios permiten anular los decretos falsos. Sigumán queda derrotado y bajo custodia."},
  {speaker:"Xervias",text:"No sé qué fue de Zhinchi. Pero sé lo que debo hacer: seguir protegiendo a quienes todavía necesitan ayuda."}
 ],
};

/**
 * Revelaciones después de 2, 4, 6 y 8 generales: funcionan con cualquier
 * orden de regiones. Se muestran únicamente al alcanzar el hito exacto.
 */
const SIGUMAN_REVELATIONS: Readonly<Record<number, readonly AfterVictoryLine[]>> = {
  2: [
    {speaker:'Xervias',text:'En dos regiones diferentes han mencionado al mismo hombre. ¿Quién es Sigumán?'},
    {speaker:'Zhinchi',text:'Fue un comandante de la Orden. Prometía restaurar la paz, pero abandonó sus juramentos para dirigir la Revolución Solar.'},
  ],
  4: [
    {speaker:'Crónica',text:'Los informes revelan una idea común: Sigumán pretende imponer una única voluntad sobre todas las leyes del reino.'},
    {speaker:'Zhinchi',text:'Dice buscar la paz, pero confunde la justicia con la obediencia. Ninguna orden debe estar por encima de las personas.'},
  ],
  6: [
    {speaker:'Crónica',text:'Una inscripción recuperada muestra que Sigumán puede canalizar la energía de varios sellos místicos simultáneamente.'},
    {speaker:'Xervias',text:'Entonces no planea simplemente tomar el mando. Está reuniendo algo mucho mayor para la Casa del Sello.'},
  ],
  8: [
    {speaker:'Crónica',text:'Con las ocho regiones libres, las pistas señalan una sola fortaleza: la Casa del Sello, en San Jerónimo.'},
    {speaker:'Xervias',text:'Los documentos mencionan a Leocadio del Alba. ¿Quién es ese Escribano?'},
    {speaker:'Zhinchi',text:'Leocadio conservó la resonancia mística de los sellos y falsificó sus textos por orden de Sigumán. Tenemos pruebas para desenmascararlo.'},
    {speaker:'Zhinchi',text:'Antes de entrar quiero decirte algo, Xervias. Mi antiguo compañero podría estar allí. Nunca subestimes al Vándalo Rojo.'},
    {speaker:'Xervias',text:'Estaremos juntos, capitán. Hemos llegado hasta aquí porque usted me enseñó a pensar antes de obedecer.'},
    {speaker:'Zhinchi',text:'Y si algún día debes avanzar sin mí, recuerda eso. Tu valor no depende de mis órdenes.'},
  ],
};
const GENERAL_MISSION_IDS = ['06', '10', '14', '18', '22', '26', '30', '34'] as const;
export function afterVictoryLines(id: string, progress?: CampaignProgress): readonly AfterVictoryLine[] {
  const mission = getCampaignMission(id);
  if (!mission) return [];
  const base = AFTER_VICTORY[id] ?? [];
  if (!progress || mission.kind !== 'boss' || bestStars(progress, id) <= 0) return base;
  const defeated = GENERAL_MISSION_IDS.filter(generalId => bestStars(progress, generalId) > 0).length;
  return [...base, ...(SIGUMAN_REVELATIONS[defeated] ?? [])];
}
