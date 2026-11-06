# Decreto Real Studio — Editor de escenas (versión 1)

Este módulo de desarrollo trabaja **sobre el renderer real de CampaignOpening**: no es una maqueta ni sustituye GameBoard.

## Acceso
1. Abre \`https://afelex.github.io/Decreto-Real/?drDev=1#/\`.
2. En **QA · Historia** elige **✦ Abrir Decreto Real Studio · Editar escenas**.
3. O abre directamente \`https://afelex.github.io/Decreto-Real/?drDev=1#/studio\`.

El editor está habilitado solo en QA (en modo desarrollo local, o mediante \`?drDev=1\`). El público normal no ve el editor ni las correcciones de autoría locales.

## Qué funciona hoy
- Navegar las **21 intervenciones anteriores al duelo** y las **28 posteriores** (no modifica GameBoard ni las reglas).
- Tocar un personaje para seleccionarlo. El **niño se edita por separado** de la madre, aunque está dibujado en su mismo contenedor teatral.
- Arrastrar con el dedo; controlar X/Y en % del viewport; escala de 35 a 275%; invertir horizontalmente; visibilidad; orden de capa de 1 a 30.
- Los cambios son **por intervención** (ej. \`opening:1\`, \`after:2\`), y no afectan otras apariciones del personaje.
- Deshacer, restaurar el elemento a su posición original y **guardar un borrador local**.
- Exportar un **JSON versionado** de respaldo; volver a importarlo en el editor.
- Al recargar o abrir la escena habitual **en QA del mismo navegador**, se refleja el borrador guardado. El público permanece con la versión publicada.

## Límites deliberados de V1
- Guardar en localStorage solo conserva transformaciones. **No publica cambios para todos los usuarios** ni los escribe en GitHub; exporta el JSON para conservarlo fuera del dispositivo.
- No incluye todavía subida de PNG, WebP, GIF, videos, edición de textos ni línea de tiempo de animaciones.
- No se edita la pantalla de duelo: los retratos del motor siguen independientes.
- La posición queda proporcional al ancho/alto de cada viewport. Se recomienda verificar los ajustes en 360×800 y 390×844.

## Próximos incrementos
1. Biblioteca de imágenes y reemplazo de sprites con carga/almacenamiento central.
2. Línea de tiempo de movimientos, expresiones y efectos de video.
3. Guardado central con usuarios autorizados, revisión por versiones y botón de publicación.
4. Mismo editor para misiones de los ocho generales, batallas finales y créditos.

## Reglas de seguridad
- JSON con versión 1 y nombres de actor permitidos. Entradas inválidas rechazadas; transformaciones normalizadas y acotadas.
- El editor no modifica el estado de la campaña ni desbloquea contenido.
- No hay escrituras remotas, llamadas pagadas a imágenes, ni cambios a las reglas del combate.
