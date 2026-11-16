# Entrada temporal para el lote G2 aprobado

Coloca aquí el único archivo `Decreto_Real_G2_25_fondos_para_integrar.zip` y haz commit en esta rama de la PR #112.

El workflow `.github/workflows/g2-import-approved.yml` comprobará su SHA-256, importará los 25 fondos WebP a sus rutas oficiales y ejecutará las pruebas antes de confirmarlos en esta rama.

**SHA-256 aprobado:** `fa01e33e8c339afd445aead6f1e1dd599301ea2077517f1ab5807d438f978f47`.

El ZIP se retirará del árbol de archivos tras importar para evitar duplicarlo en el juego. Esta acción no borra los artes G1, no fusiona la PR y no publica por sí sola en GitHub Pages.

## Recuperación seis generales G2 · bloque 02

El lote de maestros de Leandro, Octavio, Jerónimo, Isabela, Aukan y Gonzalo se recibe como **un único archivo** llamado `DR-G2-BLOQUE-02-ORIGINALES-VERIFICADOS.zip`.

Tras fusionar la PR de preparación del bloque 02, subir **solo ese ZIP** dentro de `incoming/` en `main` mediante GitHub («Add file → Upload files» y «Commit changes»). El workflow `.github/workflows/g2-personajes-bloque02-import.yml` comprobará su hash exacto, validará individualmente los seis archivos, creará sus copias maestras en `art-reference/personajes-oficiales/imagenes/` usando extensiones reales, actualizará el catálogo y retirará el ZIP temporal.

SHA-256 esperado del ZIP: `6a448921391caaa7a2e1c27ae8fe4c0d8fe0579f85e800ce0835f1967d383cd2`.

**No publica expresiones nuevas ni modifica los recursos G1, el juego o DRStudio**. Los derivados G2 se generarán, verificarán e integrarán en una fase posterior.

## Paquete G3 · nueve imágenes de interfaz

Sube **un único archivo** `DecretoReal_G3_Imagenes_Integracion.zip` en `incoming/` de `main` después de que se fusione la PR G3. El workflow `.github/workflows/g3-ui-import.yml` verifica su SHA-256 exacto (`1367e97d3eb8fe114c29b9b2c4311634948375621a32ecef63af154e5ce29716`), valida los diez WebP y sus hashes internos, conserva los nueve PNG maestros fuera de `public/`, ejecuta las pruebas y la compilación, publica únicamente los derivados optimizados y retira el ZIP temporal. Si falla alguna comprobación, no cambia los gráficos activos. La interfaz mantiene las versiones CSS anteriores como respaldo si faltan los archivos G3.

## Música Suno G3 — seis pistas originales

Desde el teléfono, sube un único archivo llamado
`DecretoReal_G3_Audio_Integracion.zip` a esta carpeta `incoming/` en
la rama `main`, una vez fusionada la PR de preparación del audio.
El importador también reconoce el nombre accidental `.zip.zip` de Android.
**No lo descomprimas ni subas los seis MP3 por separado.**

GitHub Actions validará el ZIP exacto (SHA-256
`6f1897fd7a1e73ef32cc0bd4d48f9bdb8b0ceb38adf1949728ce999582bdb375`),
los seis MP3 por SHA-256 y el manifiesto de duraciones y nombres; después
activará `SUNO_G3_READY`, comprobará reglas, interfaz, tipos y compilación,
publicará los MP3 en `public/audio/suno-g3/`, retirará el ZIP temporal
y solicitará un despliegue nuevo de GitHub Pages. Los WAV maestros
quedan en la biblioteca del usuario; las pistas de SFX existentes no se alteran.
