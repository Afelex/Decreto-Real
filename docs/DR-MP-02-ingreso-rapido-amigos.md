# DR-MP-02 · Ingreso rápido, identidad y amigos

## Decisión de producto
Una sola entrada **Multijugador** desde el menú principal. En la primera pantalla solo dos acciones principales: **Jugar ahora** (rival aleatorio) e **Invitar a un amigo** (genera enlace de desafío). Como alternativa, un enlace entrante abre **Aceptar desafío** y la opción secundaria **Tengo un código** admite los códigos de sala temporales.

### Piloto actualmente implementado
- El apodo del invitado se introduce solo en la primera visita y se recuerda en el navegador.
- Al invitar, el sistema comparte un enlace de sala; la opción de compartir del teléfono tiene prioridad sobre copiar.
- Al abrir una invitación, el enlace precompleta el código y muestra **Aceptar desafío**; los invitados recurrentes pueden entrar automáticamente.
- El código de sala de 10 caracteres continúa funcionando, pero no aparece permanentemente en el formulario.
- No hay registro obligatorio ni contraseña para probar partidas amistosas.
- El enlace de sala es **temporal** y no representa una identidad de jugador.

## Perfil estable propuesto con Peruanistas (fase posterior, no implementado)
Como en el esquema de BattleTag, el jugador tendrá un **identificador público permanente** —por ejemplo, `Condor#4821`— ligado a la identidad autenticada de Peruanistas, pero sin exponer nombre real, email ni número de documento.

- Autenticación: reutilizar **Firebase Authentication de Peruanistas**, sin pedir al jugador una segunda cuenta. Mantener perfil de juego separado, con alias y retrato.
- La primera entrada crea `playerProfiles/{uid}` con `displayName`, `avatarId`, `playerCode`, `createdAt`, `updatedAt`; el campo `uid` se obtiene del token validado, no de un mensaje del cliente.
- Generar códigos únicos mediante reserva transaccional `playerCodes/{codigo}` -> `uid`. Deben conservarse si el jugador cambia su apodo. Evitar exponer UID/email en invitaciones.
- Relaciones de amistad: `friendRequests` y `friends` con validación de destinatario, aceptación explícita y bloqueo/reportes; no se crea amistad de manera automática por compartir un enlace.
- Desafiar: desde la lista de amigos, elegir un jugador conectado y disponible, **Desafiar**; el receptor acepta o rechaza; solo después se asignan plazas a la partida y comienza el duelo.
- Presencia: estados `disponible`, `en duelo`, `desconectado` con caducidad y reconexión. No asumir conectado solo porque una pestaña quedó abierta.
- Seguridad: WebSocket autenticado con token Firebase verificado por servidor, límites por usuario/IP, permisos sobre amistades, actualización transaccional de estadísticas y protección contra suplantación/duplicación de resultados.
- Permitir invitaciones amistosas como invitado durante el piloto; no conceder ranking ni beneficios a partidas con identidad no autenticada.
- La lista de amigos y los desafíos se muestran **dentro de Multijugador**, no como cinco botones nuevos en el menú principal.

## Flujo UX objetivo
```
Menú principal → Multijugador
                  ├── Jugar ahora → Buscando rival → Duelo
                  └── Amigos → Elegir amigo → Desafiar → Aceptar → Duelo
                      └── Agregar amigo → Buscar por código de jugador

Entrada por enlace → Confirmar apodo solo si es primera vez → Duelo
```

**Importante:** el código de sala no debe confundirse con el código de jugador; los códigos de jugador solo se habilitan una vez que existe una identidad persistente verificable.
