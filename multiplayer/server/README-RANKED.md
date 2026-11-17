# PvP: historial, rachas y combates Ranked (piloto)

## Estados
- **Casual**: salas privadas, desafíos y cola «Jugar ahora». No modifica RP.
- **Ranked**: cola independiente para rivales aleatorios, solo habilitada con almacenamiento persistente.
- **Crónicas del duelista**: resultados por rival, victorias, derrotas, empates, racha actual, mejor racha y los últimos 100 encuentros; rivales agrupados por identificador, no por apodo.
- **Clasificación**: Elo de 1000 RP iniciales con K=32, calculado en el servidor a partir de enfrentamientos Ranked. Los empates también actualizan RP cuando hay diferencia de puntuación.

## Requisito para Railway
La variable de entorno **DR_PVP_RECORD_FILE** debe señalar un archivo dentro de un **volumen persistente** montado en el servicio WebSocket, por ejemplo:

    DR_PVP_RECORD_FILE=/data/pvp-records.json

1. Crear y montar un volumen Railway en la ruta \`/data\` del servicio multijugador.
2. Configurar la variable de entorno indicada arriba.
3. Desplegar el backend modificado antes de publicar el cliente actualizado.
4. Validar con dos navegadores distintos: victoria/derrota, empate, rendición, reconexión y reinicio del contenedor.
5. Realizar copias de seguridad del archivo en el volumen. **No** guardarlo en la carpeta normal de la aplicación, pues puede desaparecer en cada despliegue.

Sin volumen ni variable configurada se mantienen registros de prueba **solo en memoria** y se bloquea Ranked para no prometer clasificación permanente.

## Identidad y límites actuales
Este piloto asocia los registros al ID derivado del secreto privado del perfil social local (guest), no a una identidad verificada de Peruanistas. Los cuatro alias del mismo dispositivo comparten historial y RP. Si se pierde el secreto local, se pierde el acceso a ese historial. La integración con la autenticación de Peruanistas es necesaria para permanencia entre dispositivos, recuperación de cuenta y prevención de múltiples identidades. Los registros ya guardados no se migran automáticamente.

El registro JSON está diseñado para **un proceso Node** y una audiencia piloto pequeña. No escalar a múltiples réplicas ni a rankings competitivos públicos de alto volumen sin migrarlo a una base transaccional (por ejemplo PostgreSQL) y usar transacciones/idempotencia a nivel de base de datos.

## Seguridad e idempotencia
- El servidor, no el navegador, decide el resultado; guarda cada \`matchId\` una sola vez.
- Los jugadores no pueden clasificarse combatiendo contra su propia identidad guest.
- El historial presenta nombre, modo, fecha, resultado y turnos, pero nunca secretos de sesión.
- La clasificación solo cambia al finalizar duelos Ranked.
- No hay recompensas económicas ni ventajas en el combate.
