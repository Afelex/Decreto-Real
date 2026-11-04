# Decreto Real · Generar imágenes desde GitHub

**No necesitas instalar nada ni copiar el repositorio a tu computadora.** La aplicación del juego no se modifica y no se ejecuta ningún pago automáticamente.

## Paso 1. Guardar la clave de forma segura
1. Entra en [Decreto Real](https://github.com/Afelex/Decreto-Real).
2. Pulsa **Settings** → **Secrets and variables** → **Actions**.
3. Pulsa **New repository secret**.
4. En el campo **Name** escribe exactamente **OPENAI_API_KEY**.
5. En el campo **Secret** pega tu clave privada de OpenAI y pulsa **Add secret**.
6. No envíes la clave en el chat, issues, correos ni capturas de pantalla.

## Paso 2. Revisar un plan gratis
Cuando la automatización esté incorporada a la rama principal:
1. Ve a la pestaña **Actions** de GitHub.
2. Abre **Decreto Real · Generador de arte (manual)**.
3. Pulsa **Run workflow**.
4. Configura **grupo = una-imagen**, **modo = plan**, **calidad = low**, **confirmar = NO**.
5. Pulsa el botón verde **Run workflow**.
6. Al terminar, abre la ejecución y descarga el archivo que aparece en **Artifacts**. Ese archivo contiene el plan, no una imagen. No se efectuó una solicitud pagada.

## Paso 3. Generar la primera imagen (sí usa crédito)
1. Vuelve a **Run workflow**.
2. Selecciona **grupo = una-imagen**, **modo = generar**, **calidad = low**.
3. En **confirmar**, escribe exactamente **SI** en mayúsculas.
4. Pulsa **Run workflow**. Se enviará solo **una solicitud** pagada a OpenAI.
5. Cuando finalice, descarga en **Artifacts** el ZIP con la primera imagen: **fondos/region-1-base.webp**.
6. Abre la imagen y decide si te gusta. No continúes con más imágenes hasta revisar el estilo.

## Reutilizar el Callao anime aprobado sin pagar otra vez el fondo base
En la ejecución exitosa [41907373674](https://github.com/Afelex/Decreto-Real/actions/runs/41907373674) se generó `region-1-base.webp`, que ya fue revisado visualmente. El archivo quedó dentro del artefacto **decreto-real-arte-3**.

Para producir solo la variante del Almirante, abre el generador de arte en **Actions** y elige:
- **grupo** `jefe-callao-aprobado`
- **modo** `generar`
- **calidad** `low`
- **confirmar** `SI`

GitHub descargará automáticamente la base aprobada del artefacto anterior y enviará UNA SOLA llamada pagada de **edición de imagen**. No regenerará la vista general del Callao. El resultado será `fondos/region-1-jefe.webp` en el nuevo artefacto descargable. Para solo revisar el catálogo sin gastar, usa **modo = plan** y **confirmar = NO**.

**Importante:** el artefacto anterior tiene retención de 14 días y puede caducar. Si ya caducó, la acción fallará **antes** de llamar a la API: no intentes generar un jefe sin fondo de referencia. Para conservar la imagen a largo plazo hay que guardarla en los archivos de arte del repositorio.

Para generar solamente los tres oponentes secundarios que realmente aparecen en el Puerto del Callao, usa **grupo = rivales-callao** (Elías Rentería, Bartolomé de Avilés y Tomás Arciniega). Ese grupo envía tres solicitudes y sí consume crédito al elegir generar.

## Corrección de escenarios de jefe · versión v3 (noviembre 2026)

La primera edición de Baltasar de Fierro quedó casi igual que el puerto base: solo cambió la iluminación y los estandartes. La nueva dirección artística exige que **cada jefe tenga una arena distinta dentro de la misma región**, con un primer plano, punto de vista, área de combate y objetos relevantes propios. Se mantienen los paisajes, edificios distintivos y sombreado anime del mundo, pero se reinterpreta al menos una parte importante de la composición.

**Callao:** el fondo base conserva su puerto abierto; la nueva escena del Almirante debe representar una **batería naval de mando**, con grandes cañones en primer plano, parapetos de piedra, una posición de combate ceremonial, el mismo faro/atalaya y barcos reconocibles a lo lejos y un cielo más dramático. La bandera correcta es siempre blanca con aspa roja de Borgoña, sin escudo.

Para una tercera prueba que aproveche el fondo de referencia ya aprobado:
- En Actions, selecciona grupo `jefe-callao-aprobado`, modo `generar`, calidad `low` y confirmación `SI`.
- Se realiza **una edición de imagen de pago**. No se vuelve a generar el fondo base.
- La edición se revisa visualmente antes de seguir con otras regiones; un prompt más fuerte no garantiza que el modelo haga cambios suficientes.
- En el archivo `LEEME.txt` aparecerá `anime-2D-jefes-v3`.
- No vuelvas a ejecutar el mismo grupo varias veces sin revisar la imagen ni el consumo del API.

## V4 · Retratos secundarios en el mismo estilo de Xervias

El usuario proporcionó la imagen **Xervias Neutral** como referencia. Se ha incorporado al repositorio un recorte pequeño (`art-reference/xervias-estilo.webp`) que sirve **únicamente para guiar el lenguaje gráfico** de los personajes: ojos anime angulares, línea oscura firme, cabello construido en mechones y sombreado cel-shading de contraste.

**No se debe copiar la identidad de Xervias** a los rivales. La guía exige conservar la edad aparente, el peinado/barba, la personalidad, la vestimenta, los accesorios y la función narrativa de cada oponente. También prohíbe fondos ajedrezados y banderas nacionales modernas.

### Ensayo de un solo rival (recomendado)

En **[Actions → Generador de arte](https://github.com/Afelex/Decreto-Real/actions/workflows/generar-arte.yml)**, pulsa **Run workflow** y selecciona:

- **Branch:** `main`.
- **grupo:** `rival-callao-estilo-prueba` — solo Elías Rentería.
- **modo:** `generar` — sí consume crédito API.
- **calidad:** `low` — ensayo económico; si el estilo da buenos resultados se puede subir a `medium`.
- **confirmar:** `SI` — confirmación explícita de una única edición pagada.

El workflow reutiliza el **Elías original** del lote [41914476805](https://github.com/Afelex/Decreto-Real/actions/runs/41914476805) y la referencia visual de Xervias. Envía **dos imágenes de entrada** al endpoint de edición: primero el retrato de Elías (identidad y ropa) y después Xervias (solo estilo), y entrega un WebP nuevo en el artefacto descargable. **No modifica el juego ni los retratos previamente aprobados**.

### Cuando el ensayo esté aprobado

El selector **grupo = `rivales-callao-estilo`** hace lo mismo con Elías, Bartolomé de Avilés y Tomás Arciniega. Repite Elías: si ya tienes una versión aprobada, no uses este grupo entero sin considerar que generará también otra solicitud pagada para él.

Para nuevos rivales de otras regiones, el workflow usa la referencia de Xervias como **primera y única entrada visual** y construye un personaje original a partir de los nombres y descripciones canónicos de cada misión. No tiene aún una ilustración de identidad previa que preservar.

**No caducar:** el artefacto `decreto-real-arte-6` tiene una retención limitada de 14 días desde el 4 de noviembre de 2026. Si GitHub deja de tenerlo, el paso de descarga fallará antes de llamar a la API. Para restilizar después de su caducidad habría que aportar los originales de otra manera. La referencia comprimida de Xervias sí queda guardada de forma permanente en el código.

**Seguridad:** el botón no envía gastos automáticamente; el modo `plan` sigue siendo gratis, `generar` requiere secreto y confirmación `SI`. Nunca pegues claves de API en el chat.

## Catálogo de las 47 imágenes
- **18 fondos**: base y jefe para cada una de las 8 regiones y la Casa del Sello.
- **29 retratos secundarios**: 2 del prólogo, 24 de las regiones y 3 del capítulo final.
- Grupos de selección: **piloto-4**, **prologo**, **region-1** hasta **region-8** y **final**.
- Cada grupo genera entre 1 y 5 recursos. No hay ningún grupo que dispare accidentalmente las 47 imágenes.
- Los personajes se toman directamente de los archivos de las 38 misiones del juego.

## Seguridad y costes
- **plan** no envía ninguna petición de generación.
- **generar** exige que se escriba **SI** y que exista el secreto OPENAI_API_KEY.
- Cada nueva ejecución de generación puede consumir crédito. No ejecutes otra si una está en curso o muestra error.
- El saldo de 5 USD no equivale a un límite global absoluto de gasto; controla también la facturación de OpenAI.
- Nunca publiques la clave en el repositorio. GitHub Actions la recibe desde su almacén de secretos.
- Este generador no modifica ni despliega el juego. Las imágenes son un artefacto ZIP descargable.
- **Estilo anime 2D corregido (noviembre de 2026):** líneas de contorno visibles, superficies simplificadas y sombreado por capas, sin apariencia fotográfica ni render 3D.
- **Puerto del Callao:** una única bandera claramente visible de fondo blanco o marfil y un aspa roja de Borgoña (dos ramas diagonales dentadas formando una X). Nunca tricolor francesa ni escudo nacional de España.
- **Versión del jefe:** cuando generas `region-1` a `region-8`, `final` o `piloto-4`, el programa genera primero el fondo base y después **edita esa misma imagen** para crear la variante de jefe, usando el endpoint de edición. Son **dos solicitudes de imagen** que pueden consumir crédito, pero se preserva mejor la arquitectura.
- La imagen base obtenida en una ejecución anterior **no se reutiliza automáticamente** en otra ejecución. Por eso, si vuelves a generar una región entera, se generará una nueva base y después se editará para la versión jefe.
- El diseño de una bandera producido por IA debe revisarse visualmente: un prompt estricto reduce los errores, pero no garantiza símbolos históricos perfectos.
- La primera prueba recomendada después de esta corrección sigue siendo **una-imagen / generar / low / SI**, que envía una sola solicitud pagada. El modo **plan** no genera ni cobra.

## Cómo reconocer la versión corregida
En el registro del paso «Crear plan o generar imágenes autorizadas» verás **Versión artística: anime-retratos-xervias-v4**. El archivo `LEEME.txt` del ZIP incluye el mismo identificador. La imagen anterior no se modifica automáticamente: para probar el nuevo estilo es necesario realizar una solicitud nueva, con su coste correspondiente.

## Enlaces útiles
- [Guardar claves en GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Descargar imágenes de Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
- [Tarifas de la API de OpenAI](https://platform.openai.com/pricing)
