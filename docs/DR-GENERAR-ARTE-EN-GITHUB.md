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
- Las variantes de jefe usan prompts relacionados con la base, pero dos generaciones independientes pueden diferir en arquitectura; usa la base aprobada como referencia más adelante.

## Enlaces útiles
- [Guardar claves en GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Descargar imágenes de Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
- [Tarifas de la API de OpenAI](https://platform.openai.com/pricing)
