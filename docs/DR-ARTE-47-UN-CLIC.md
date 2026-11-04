# Decreto Real — generar las 42 imágenes pendientes con un solo botón en GitHub

**Objetivo:** generar las 42 imágenes pendientes de campaña desde GitHub y conservar las cinco del Callao ya aprobadas, para entregar **47 imágenes** en un archivo descargable. No necesitas descargar código ni abrir una terminal.

## 1. Probar gratis

1. Abre [Decreto Real · GENERAR TODO (42 imágenes pendientes)](https://github.com/Afelex/Decreto-Real/actions/workflows/arte-todo-pendiente.yml).
2. Pulsa **Run workflow**.
3. Selecciona **Branch = main**, **modo = plan**, **calidad = low**, **confirmar = NO**.
4. Pulsa el botón verde **Run workflow** una vez.
5. Al concluir, en **Artifacts**, descarga **DECRETO-REAL-47-IMAGENES**. Este plan contiene el catálogo, no las imágenes nuevas. No se envía ninguna generación de pago.

## 2. Generar el lote completo (sí consume créditos)

Antes de empezar, revisa el saldo disponible en la [facturación de OpenAI](https://platform.openai.com/settings/organization/billing/overview). El saldo inicial de 5 USD puede haberse reducido por las pruebas anteriores. **No hay garantía de que alcance para 42 imágenes.** La calidad medium puede costar más. Si hay errores de crédito, no vuelvas a ejecutar todo sin identificar las imágenes ya producidas.

1. Entra en el mismo enlace y pulsa **Run workflow**.
2. Selecciona **Branch = main**.
3. Establece **modo = generar**, **calidad = low**.
4. En **confirmar**, escribe exactamente **GENERAR_42**.
5. Pulsa **Run workflow** una sola vez. Esto autoriza la generación de **42 nuevas imágenes mediante la API**; el importe final depende del consumo real.

GitHub comprueba ANTES de iniciar el lote que la clave de API esté guardada, que existen las cinco imágenes ya aprobadas y que el catálogo contiene exactamente 42 pendientes. Si las comprobaciones fallan, no llama a la API.

## 3. Descargar y revisar

1. Abre la ejecución desde la lista de **Actions**.
2. Busca la sección **Artifacts**.
3. Descarga **DECRETO-REAL-47-IMAGENES** y abre el ZIP.
4. Dentro, abre **galeria.html** para revisar el arte, **manifest.json** para ver el inventario y las carpetas **fondos/** y **retratos/** para los archivos.
5. Revisa las imágenes antes de integrarlas: la automatización **no publica ni modifica automáticamente** el juego.

Los nueve grupos ejecutados son: `prologo` (2), `region-2` a `region-8` (7 grupos de 5) y `final` (5). Total 2 + 35 + 5 = **42 nuevas**. Las cinco imágenes de Callao no se regeneran.

## 4. Composición de los escenarios según el duelo del juego

Se tuvieron en cuenta las capas reales del duelo, con un tablero vertical 2:3 en una sola pantalla y dos filas de cartas. Los fondos de combate se generan sin cartas, barras de vida, botones ni retratos dibujados dentro de la ilustración.

- **Zona superior (0–35 % aprox.):** retrato y mano rival, más indicadores. Mantener detalles secundarios y evitar textos o símbolos importantes detrás de controles.
- **Zona central (aprox. 35–63 %):** campo con dos filas de cartas y espacios de impacto. Mantener fondo relativamente sereno, con siluetas amplias y contraste moderado.
- **Zona inferior (63–100 %):** retrato, mano y botones del jugador. Evitar elementos clave que quedarían ocultos.
- **Bordes y horizonte:** ubicar fortalezas, cañones, barcos y puntos distintivos hacia laterales y parte alta, protegidos contra el recorte de `background-size: cover` en teléfonos.

Estos porcentajes son **guías de dirección artística**, no una máscara exacta; la interfaz adapta su disposición a cada dispositivo. Los fondos de jefe deben ser espacios distintos pero pertenecientes a la misma región, y conservar el estilo anime 2D y la heráldica coherente (aspa de Borgoña donde corresponda).

## 5. Qué ocurre si falla una generación

El sistema conserva los resultados del grupo como artefacto, incluso si la API devuelve un error. El ensamblador intenta reunir lo disponible y describe qué imágenes faltan. **No relances los 42 por segunda vez sin revisar** qué se generó, porque algunas imágenes podrían cobrarse de nuevo.

Los artefactos antiguos de Callao tienen retención limitada. El prechequeo los intenta recuperar al comienzo: si ya no existen, la generación se bloquea antes de producir nuevos recursos.

## Referencias de los cinco recursos aprobados

- Fondo base Puerto del Callao: [run 41907373674](https://github.com/Afelex/Decreto-Real/actions/runs/41907373674).
- Fondo Baltasar de Fierro: [run 41912890625](https://github.com/Afelex/Decreto-Real/actions/runs/41912890625).
- Retratos de Elías Rentería, Bartolomé de Avilés y Tomás Arciniega (estilo Xervias): [run 41918052921](https://github.com/Afelex/Decreto-Real/actions/runs/41918052921).

**No se enviará ninguna solicitud de pago hasta que el propietario seleccione `generar` y escriba `GENERAR_42`.**
