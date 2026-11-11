# Entrada temporal para el lote G2 aprobado

Coloca aquí el único archivo `Decreto_Real_G2_25_fondos_para_integrar.zip` y haz commit en esta rama de la PR #112.

El workflow `.github/workflows/g2-import-approved.yml` comprobará su SHA-256, importará los 25 fondos WebP a sus rutas oficiales y ejecutará las pruebas antes de confirmarlos en esta rama.

**SHA-256 aprobado:** `fa01e33e8c339afd445aead6f1e1dd599301ea2077517f1ab5807d438f978f47`.

El ZIP se retirará del árbol de archivos tras importar para evitar duplicarlo en el juego. Esta acción no borra los artes G1, no fusiona la PR y no publica por sí sola en GitHub Pages.
