/** Consecuencias breves, claras y específicas de las 38 victorias.
 * Progresión no lineal: un diálogo nunca presupone que otra región se superó.
 */
import { getCampaignMission } from './campaign.ts';

export type AfterVictoryLine = Readonly<{ speaker: 'Xervias' | 'Zhinchi'; text: string }>;
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
  {speaker:'Xervias',text:'Nayisa ha comprendido que también la engañaron. Su carta está conmigo.'},
  {speaker:'Zhinchi',text:'Su pueblo merece protección, no miedo. La mística permanecerá sellada mientras continuamos.'}
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
  {speaker:'Xervias',text:'Ya sabemos cómo el Escribano cambió los decretos. ¿Qué le queda a Sigumán?'},
  {speaker:'Zhinchi',text:'Aún tiene aliados. No subestimes a Vándalo Rojo: conoce nuestros pasos y podría intentar detenernos.'}
 ],
 '36': [
  {speaker:'Zhinchi',text:'Xervias, toma mi bastón. Despertará las cartas místicas. No abandones a quienes confían en ti.'},
  {speaker:'Xervias',text:'¡Zhinchi! Te buscaré. No dejaré que tu sacrificio sea en vano.'}
 ],
 '37': [
  {speaker:'Xervias',text:'He encontrado tu última pista, Zhinchi. Aunque no estés aquí, sé qué debo hacer.'},
  {speaker:'Xervias',text:'Conservaré tu bastón. Ahora debo enfrentar a Sigumán y proteger al reino.'}
 ],
 '38': [
  {speaker:'Xervias',text:'Sigumán ha caído, pero la verdad exige algo más que una victoria.'},
  {speaker:'Xervias',text:'Reconstruiremos lo que su mentira destruyó. Y encontraré a Zhinchi, dondequiera que esté.'}
 ],
};

export function afterVictoryLines(id: string): readonly AfterVictoryLine[] {
  if (!getCampaignMission(id)) return [];
  return AFTER_VICTORY[id] ?? [];
}
