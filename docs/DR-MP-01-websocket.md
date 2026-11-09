# DR-MP-01 — Multijugador WebSocket (piloto 1v1)

## Estado y alcance
Esta rama incorpora un **piloto de partidas amistosas** y no modifica el duelo contra la IA ni las pantallas de la campaña.

- Ruta del cliente: `#/multijugador`, accesible desde el menú principal.
- Servidor autoritativo: `multiplayer/server/index.mjs`, Node.js 22 + biblioteca `ws`.
- Reglas aisladas, verificables: `multiplayer/server/engine.mjs`.
- Dos usuarios por sala; crear sala, entrar con código o buscar emparejamiento aleatorio.
- Control de turno y acciones en servidor. El navegador envía intenciones, **nunca valores de vida o estados de cartas calculados por el cliente**.
- Cada persona ve únicamente su propia mano y conteos de la rival; el orden de los mazos y los tokens no salen del servidor.
- Control de versiones de estado (`revision`), identificador de acción para evitar repetir jugadas y reconexión mediante token efímero guardado en `sessionStorage`.
- Cierre por desconexión tras 120 s. Salas sin actividad expiradas tras 30 minutos. Sin registros persistentes.

**Esta primera implementación usa WebSocket nativo en navegador y `ws` en servidor**, no Socket.IO. Para 1v1 evita añadir una librería al cliente; Socket.IO y un adaptador Redis pueden evaluarse si el tráfico lo exige. Redis no es necesario en un servidor único.

## Reglas compatibles con el duelo clásico (alcance de esta primera versión)
- 20 PV iniciales, 28 cartas por jugador: 10 Ataque, 10 Defensa, 4 Orden y 4 Impacto.
- Robo inicial de 3 cartas por persona y 1 al empezar cada turno.
- Ataque: 2 daños. Defensa: +1 PV sin sobrepasar 20. Orden: roba una carta.
- Impacto I–Final en orden; uno por turno. I–III: inflige 1 daño y cura 1. Final: victoria.
- Dos cartas consecutivas del mismo tipo: elegir entre -1 PV rival o +1 propio. Tres cartas consecutivas: -3 o +3; contador reiniciado.
- Rendirse produce derrota. Al terminar 120 turnos o agotarse manos y mazos de ambos, se declara empate.
- **No se incluyen todavía cartas místicas, editor de barajas ni partidas clasificatorias.** Las reglas de IA de `/game` y `/duelo-v1` no se usan para el PvP.

## Desarrollo local
1. En una terminal: `cd multiplayer/server && npm install && npm start`. Expone `http://localhost:3001/health` y WebSocket en puerto 3001.
2. En otra terminal, desde la raíz del proyecto: `npm install && npm run dev`.
3. Abre `http://localhost:5173/Decreto-Real/#/multijugador` (o la URL que muestre Vite). En una sesión privada del navegador, abre la misma ruta.
4. Un jugador pulsa **Crear sala privada**, copia la invitación; el otro entra con código. Alternativamente, ambos pulsan **Buscar rival aleatorio**.
5. Comprueba turnos, combos, Impactos, rendición y desconexión/reconexión.
6. Pruebas puras: `node --test multiplayer/server/engine.test.mjs` o `npm test` en la raíz.

## Despliegue
GitHub Pages ofrece archivos estáticos y **no puede hospedar este servidor**. Hostinger Business tampoco recibe WebSockets entrantes. Despliega `multiplayer/server` por separado, por ejemplo en un VPS o plataforma compatible con conexiones WebSocket persistentes.

Variables del servidor:
- `PORT`: puerto HTTP/WebSocket proporcionado por la plataforma.
- `ALLOWED_ORIGINS`: lista separada por comas de orígenes HTTPS permitidos, p. ej. `https://afelex.github.io,https://tu-dominio.com` (no incluyas rutas ni barras finales).
- Exponer el servicio detrás de TLS; el cliente de GitHub Pages debe utilizar `wss://`, no `ws://`.

Variable de compilación de Vite:
- `VITE_MULTIPLAYER_WS_URL=wss://servidor-de-partidas.tu-dominio.com`. Debe estar presente **durante la compilación** de GitHub Pages; no se lee dinámicamente después de publicar.
- Sin variable, la pantalla muestra un aviso, y solo usa `ws://localhost:3001` al abrir en localhost.

## Contrato de mensajes
- Cliente -> servidor: `create` {name}, `join` {code,name}, `queue` {name}, `resume` {code,token}, `action` {id,revision,action}.
- Las acciones son: `play` {cardId}, `end_turn`, `combo` {choice:'DAMAGE'|'HEAL'}, `surrender`.
- Servidor -> cliente: `session` {code,token,slot,name}, `waiting`, `state` {view}, `ack` {id}, `error` {reason,id?}.
- La lista de cartas completa y el mazo se mantienen en el servidor. Nunca confíes en la `revision` o `cardId` suministrados sin validar.

## Seguridad y evolución necesaria antes de un lanzamiento público
Este piloto usa apodos locales, **no identidad autenticada**. No registrar resultados competitivos ni otorgar premios hasta integrar Firebase Authentication de Peruanistas, validar tokens en el servidor y almacenar resultados mediante transacciones idempotentes. Los tokens de reconexión están limitados a cada sala y no equivalen a una cuenta de usuario.

Antes de producción general: pruebas E2E reales con dos clientes y red inestable, observabilidad, control de abuso por IP/usuario, políticas de privacidad, almacenamiento recuperable entre reinicios y reglas compartidas entre el modo IA y PvP. Si se usan varios procesos, externalizar salas/estado a una base transaccional o arquitectura de estado compartido; un pub/sub Redis por sí solo no hace atómica la validación del turno.

### Próximo hito
Integrar esta misma fuente de estado al HUD definitivo de `GameBoard` y al botón único **Multijugador** con perfil independiente de Peruanistas (alias y retrato), amistades, desafíos y ranking público. El editor y la campaña quedan desacoplados.
