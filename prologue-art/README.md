# Decreto Real — Arte del prólogo (lote de 23)

Este directorio contiene el catálogo reproducible del plan de producción artística.

- 18 sprites transparentes: Domingo Quispe (4), madre (4), niño (2), Zhinchi (4), Xervias (4).
- 5 ilustraciones: 2 fondos y 3 primeros planos.
- Modelo de la API: gpt-image-2.5-flare. Calidad por defecto: medium.
- Referencias de identidad: public/retratos/rival.webp (Zhinchi), public/retratos/jugador.webp (Xervias) y public/campania/arte/retratos/rival-01-domingo-quispe.webp (Domingo).
- Las variantes se crean a partir de la primera pose del mismo personaje. Los sprites se solicitan transparentes y los fondos opacos.

## Rutas definitivas

prologue-art/catalog.json contiene los 23 prompts y sus referencias.

tools/generate-prologue-art.mjs llama a Images API, comprueba WebP y evita repetición.

public/campania/prologo/sprites/ contiene 18 sprites.

public/campania/prologo/fondos/ contiene dos fondos.

public/campania/prologo/planos/ contiene tres primeros planos.

public/campania/prologo/manifest.json aparece solo al verificar 23 de 23.

La app consulta el manifiesto: mientras no esté completo usa los recursos anteriores; al completarse activa automáticamente los 23 nuevos.

## Generación y reanudación

Workflow: Decreto Real · Artes del prólogo (23 imágenes).

- La primera fusión a main inicia una producción autorizada de los recursos faltantes.
- Manualmente, modo plan inspecciona sin costo. Modo generar requiere introducir GENERAR_23 y consume créditos de OPENAI_API_KEY en GitHub Secrets.
- Para cada recurso se comprueba si el WebP ya existe. No se vuelve a solicitar a la API un archivo válido.
- Si la generación se interrumpe, se conservan los WebP parciales en GitHub y en el artefacto del run. Una ejecución posterior continúa con los pendientes.
- Tras verificar 23/23 se genera manifest.json, se integran los recursos y se despliega GitHub Pages.

La clave API nunca se guarda en el código ni en el artefacto. Cada petición tiene un costo variable. Inspecciona los resultados para revisar rostro, uniforme, tamaño, proporciones y transparencia antes de aprobar el arte como definitivo.
