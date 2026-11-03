/** Definitive cast and one original identity for each of the 38 encounters. */
export const MAIN_CHARACTERS = {
  hero: { name: 'Xervias', role: 'Soldado' },
  mentor: { name: 'Zhinchi', role: 'Capitán' },
  outlaw: { name: 'Vándalo Rojo', role: 'Bandido' },
  antagonist: { name: 'Sigumán', role: 'Comandante' },
} as const;

export type EnemyIdentity = Readonly<{
  missionId: string;
  name: string;
  alias: string;
  role: string;
  portraitDirection: string;
}>;

export const ENEMY_ROSTER: readonly EnemyIdentity[] = [
  { missionId: '01', name: 'Domingo Quispe', alias: 'Guardia del pregón', role: 'Guardia', portraitDirection: 'Guardia joven con pliego lacrado' },
  { missionId: '02', name: 'Mateo Salcedo', alias: 'Mensajero encapuchado', role: 'Mensajero', portraitDirection: 'Mensajero reservado, capa gris' },
  { missionId: '03', name: 'Elías Rentería', alias: 'Guardia del muelle', role: 'Guardia del puerto', portraitDirection: 'Vigía del puerto y uniforme azul' },
  { missionId: '04', name: 'Bartolomé de Avilés', alias: 'Contramaestre rebelde', role: 'Contramaestre', portraitDirection: 'Marinero corpulento de barba corta' },
  { missionId: '05', name: 'Tomás Arciniega', alias: 'Custodio del arsenal', role: 'Armero', portraitDirection: 'Armero con peto de cuero y llaves' },
  { missionId: '06', name: 'Baltasar de Fierro', alias: 'Almirante de Hierro', role: 'General', portraitDirection: 'General naval azul acero y oro, mirada fría' },
  { missionId: '07', name: 'Alonso Tarazona', alias: 'Escolta del camino', role: 'Escolta', portraitDirection: 'Lancero de caminos secos, capa arena' },
  { missionId: '08', name: 'Gaspar Montoro', alias: 'Capitán de salteadores', role: 'Capitán de salteadores', portraitDirection: 'Bandido con sombrero ancho y pañuelo rojo' },
  { missionId: '09', name: 'Nicanor Valcárcel', alias: 'Custodio de la posta', role: 'Custodio de posta', portraitDirection: 'Militar archivero con cartera de correos' },
  { missionId: '10', name: 'Leandro Valcázar', alias: 'Jinete Escarlata', role: 'General', portraitDirection: 'General de caballería con armadura roja y penacho' },
  { missionId: '11', name: 'Melchor Quispe', alias: 'Guardia de la mina', role: 'Guardia de la mina', portraitDirection: 'Vigilante serrano con lámpara' },
  { missionId: '12', name: 'Esteban Salvatierra', alias: 'Capataz de la mina', role: 'Capataz', portraitDirection: 'Capataz hosco de chaqueta ceniza' },
  { missionId: '13', name: 'Blas Córdova', alias: 'Custodio de pólvora', role: 'Artillero', portraitDirection: 'Soldado artillero con cinturón de pólvora' },
  { missionId: '14', name: 'Octavio Argento', alias: 'Señor de la Plata', role: 'General', portraitDirection: 'General de coraza plateada y capa fría' },
  { missionId: '15', name: 'Diego Hernán', alias: 'Explorador artillero', role: 'Explorador', portraitDirection: 'Explorador con catalejo y gorjal' },
  { missionId: '16', name: 'Mauro de la Peña', alias: 'Maestro bombardero', role: 'Bombardero', portraitDirection: 'Bombardero veterano con guantes ennegrecidos' },
  { missionId: '17', name: 'Hernando Arce', alias: 'Guardia del bastión', role: 'Guardia del bastión', portraitDirection: 'Custodio de murallas con alabarda' },
  { missionId: '18', name: 'Jerónimo Arrellano', alias: 'Artillero del Trueno', role: 'General', portraitDirection: 'General de armadura bronce y humo de cañones' },
  { missionId: '19', name: 'Uriel Huamán', alias: 'Guardián del sendero', role: 'Guardián del sendero', portraitDirection: 'Explorador de frontera con capa verde' },
  { missionId: '20', name: 'Amaru Llaguno', alias: 'Explorador renegado', role: 'Explorador', portraitDirection: 'Rastreador selvático con manto oscuro' },
  { missionId: '21', name: 'Ivo Maldonado', alias: 'Emisario del Alba', role: 'Emisario', portraitDirection: 'Espía atento con pergamino sellado' },
  { missionId: '22', name: 'Nayisa de Sombras', alias: 'Fantasma de la Selva', role: 'General', portraitDirection: 'General con velo de hojas y armadura verde' },
  { missionId: '23', name: 'Cristóbal Luján', alias: 'Guardia de la plaza', role: 'Guardia', portraitDirection: 'Guardia urbano con estandarte dividido' },
  { missionId: '24', name: 'Pedro Elari', alias: 'Predicador impostor', role: 'Predicador', portraitDirection: 'Orador ambiguo con túnica y pliego falso' },
  { missionId: '25', name: 'Rafael de Trejo', alias: 'Escribano de guardia', role: 'Escribano', portraitDirection: 'Custodio de archivos con tintero' },
  { missionId: '26', name: 'Isabela Valdierra', alias: 'Dama del Estandarte', role: 'General', portraitDirection: 'General de uniforme granate y estandarte bordado' },
  { missionId: '27', name: 'Julián Chambi', alias: 'Guardián de altura', role: 'Guía de montaña', portraitDirection: 'Montañés con poncho oscuro y capa militar' },
  { missionId: '28', name: 'Martín Ancajima', alias: 'Guardián de los pasos', role: 'Guardián', portraitDirection: 'Centinela de montaña con cuerda y espada' },
  { missionId: '29', name: 'Sebastián Vilca', alias: 'Defensor de la cumbre', role: 'Soldado', portraitDirection: 'Soldado veterano de las alturas' },
  { missionId: '30', name: 'Aukan del Cóndor', alias: 'Cóndor de los Andes', role: 'General', portraitDirection: 'General andino con armadura azul y plumas de cóndor' },
  { missionId: '31', name: 'Rodrigo Esquivel', alias: 'Heraldo del juramento', role: 'Heraldo', portraitDirection: 'Heraldo ceremonial con sello y carta' },
  { missionId: '32', name: 'Lucas de Orduña', alias: 'Teniente de la Guardia', role: 'Teniente', portraitDirection: 'Teniente severo con coraza de gala' },
  { missionId: '33', name: 'Alonso Bermúdez', alias: 'Capitán del juramento', role: 'Capitán', portraitDirection: 'Capitán con espada y capa ceremonial' },
  { missionId: '34', name: 'Gonzalo de Montes', alias: 'Caballero del Juramento', role: 'General', portraitDirection: 'General de bronce y marfil, gesto solemne' },
  { missionId: '35', name: 'Leocadio del Alba', alias: 'Escribano del Alba', role: 'Escribano', portraitDirection: 'Falsificador erudito vestido de negro' },
  { missionId: '36', name: 'Vándalo Rojo', alias: 'Bandido escarlata', role: 'Bandido', portraitDirection: 'Rufián de armadura roja desgastada' },
  { missionId: '37', name: 'Bruno Serrat', alias: 'Guardia de Sigumán', role: 'Guardia', portraitDirection: 'Guardaespaldas con armadura de sombra' },
  { missionId: '38', name: 'Sigumán', alias: 'Señor de la Falsa Luz', role: 'Comandante', portraitDirection: 'Antiguo comandante caído, manto oscuro y oro falso' },
] as const;

export function enemyForMission(missionId: string): EnemyIdentity | undefined {
  return ENEMY_ROSTER.find(enemy => enemy.missionId === missionId);
}

const BOSS_IDS: Record<string, string> = {
  '1': '06', '2': '10', '3': '14', '4': '18', '5': '22', '6': '26', '7': '30', '8': '34',
};
export function generalForChapter(chapterId: string): EnemyIdentity | undefined {
  return enemyForMission(BOSS_IDS[chapterId] ?? '');
}
