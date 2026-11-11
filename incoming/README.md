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

## Seis expresiones candidatas G2 · lote 02

**Esta ruta estará disponible tras integrar la PR de importación de expresiones.** El paquete está preservado en la carpeta de Drive `Decreto Real/personajes/G2-Bloque-02-Candidatos`.

- Archivo a subir sin descomprimir: `DR-G2-LOTE-02-SEIS-EXPRESIONES-CANDIDATAS.zip`.
- SHA-256 del ZIP aprobado para control: `8396309193aba69cd42bf0c0dbf7a86007dd3f4534d9b1e0563db9d84760da99`.
- Contiene seis PNG RGBA de 1024×1536 px, una variante de control por general, y un manifiesto de sus hashes vinculados a los seis maestros originales.
- Subir a `incoming/` de `main` en GitHub con «Add file → Upload files» y «Commit changes». El workflow `.github/workflows/g2-personajes-bloque02-candidates.yml` valida el ZIP y extrae las imágenes a `art-reference/personajes-oficiales/candidatos/`.
- La Galería y DRStudio distinguirán **candidatos sin aprobar** de **maestros**. No aparecerán en escenas activas ni sustituirán G1. Solo se aprobarán y publicarán como sprites tras revisión y pruebas por separado.
