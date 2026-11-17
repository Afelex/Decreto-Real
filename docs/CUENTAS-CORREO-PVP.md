# Decreto Real — cuentas por correo (primera versión)

## Objetivo
Un correo electrónico verificado sirve como llave para una identidad de duelista
persistente. Puede ser Gmail, Outlook, Yahoo o cualquier proveedor que reciba correos.
No se solicitan contraseñas ni formularios adicionales.

- Primera entrada: enviar enlace de un solo uso y abrirlo desde el correo.
- Siguientes entradas: Firebase conserva la sesión en el dispositivo.
- Mi Perfil: mostrar el correo y botón **Cerrar sesión** con confirmación.
- Cambiar de cuenta: cerrar sesión y verificar otro correo; los datos no se mezclan.
- Se guardan en Railway, por UID autenticado: hasta cuatro alias con sus cosméticos,
  amistades, bloqueos, solicitudes y hasta 250 resultados de partidas.
- El servidor (no el navegador) confirma victorias, derrotas, empates e Impactos.
- El correo no se expone a los demás jugadores.
- El acceso a Peruanistas sigue requiriendo invitación; tener cuenta en Decreto Real
  no concede acceso a la plataforma de investigadores.

## Activación segura (pendiente de configurar en producción)
La integración se fusiona **inactiva por defecto** para NO cortar el multijugador
actual antes de preparar la infraestructura.

1. En Firebase Console, proyecto `peruanistas-531e5`, Authentication >
   Sign-in method, habilitar **Email/Password** y **Email link (passwordless sign-in)**.
2. En Authentication > Settings > Authorized domains, agregar `afelex.github.io`.
   Probar primero un enlace real recibido y abierto desde el celular del jugador.
   El dominio `localhost` puede necesitar habilitación explícita para QA local.
3. En Railway, servicio público `Decreto-Real` del proyecto
   `caring-encouragement` (root directory `/multiplayer/server`), montar un
   **volumen persistente** en `/data`, con una sola réplica de backend.
   A continuación configurar `DR_DATA_FILE=/data/decreto-real-accounts.json`.
   El modo invitado seguirá funcionando durante la transición.
   No habilitar este valor sin el volumen: el archivo no sobreviviría un despliegue.
   Opcional: `DR_FIREBASE_PROJECT_ID=peruanistas-531e5` (valor por defecto).
4. Publicar la web de GitHub Pages compilada con
   `VITE_DR_EMAIL_ACCOUNTS=true` solo **después** de confirmar los pasos anteriores,
   coordinada con el despliegue del backend.
5. Validar desde dos navegadores/correos reales: enlace, sesión persistente,
   dos perfiles aislados, solicitud y aceptación de amistad, partida finalizada,
   reconexión, reinicio de Railway y recuperación de estadísticas.
6. Solo entonces configurar `DR_REQUIRE_EMAIL_ACCOUNTS=true` en Railway
   para exigir correo también a clientes antiguos. Si se necesita revertir,
   desactivar primero esta bandera y luego la bandera del navegador.
7. Conservar un respaldo del volumen antes de cualquier cambio de formato;
   no activar varias réplicas que escriban el mismo JSON simultáneamente.

## Seguridad y límites

Se comprueban las firmas de los ID tokens de Firebase contra sus claves públicas,
además de audiencia, emisor, vigencia y la bandera `email_verified`.
Solo se persiste el UID, nunca contraseñas ni enlaces de acceso.
La verificación de correo no depende del proveedor del correo del usuario.

No es posible recuperar automáticamente amistades de sesiones antiguas guardadas
solo en memoria del servidor. Las cuentas nuevas no se apropian de la identidad
de invitado anterior. Los perfiles locales antiguos no se borran.

## Pruebas

Las pruebas del servidor viven en `multiplayer/server/accounts.test.mjs`
y `social.test.mjs`. Ejecutar `npm test` en `multiplayer/server`,
`npm run test:ui`, `npm run test:e2e` y `npm run build` en la raíz.
La validación de envío de correo, autorización del dominio y volumen requiere
prueba real en Firebase/Railway; los tests unitarios no sustituyen esa verificación.
