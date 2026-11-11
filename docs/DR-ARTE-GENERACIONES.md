# Decreto Real · Gestión de generaciones (10 de noviembre de 2026)

## G1 y G2
- **DR-G1:** todas las imágenes anteriores; siguen EN USO hasta que sean reemplazadas y comprobadas.
- **DR-G2-2026:** nueva generación. Destino `public/artes/generaciones/DR-G2-2026/`, con subcarpetas para fondos, personajes, retratos, mapas y efectos. Cada lote generado lleva un `generacion.json` con identificador, destinos propuestos y estado `sin-publicar`.
- Los G2 subidos a galería/DRStudio permanecen en IndexedDB del navegador como **borradores** hasta su publicación revisada vía GitHub. La galería distingue G1 y G2; sus opciones Ocultar/Eliminar no afectan por sí solas al juego desplegado.

Cada recurso debe conservar ID estable, generación, escena/misión, formato, dimensiones, origen, estado de aprobación y una ruta única. Para personajes usar PNG transparente; para escenarios fondos JPG/WebP optimizados y mantener originales de alta calidad.

**Regla gráfica:** solo banderas y estandartes completamente lisos de color blanco o rojo, sin cruces, aspas, insignias ni símbolos. El nuevo generador reemplaza la normativa anterior.

## Retiro G1 después de terminar G2
1. Inventariar todas las referencias G1 en escenas, rutas dinámicas, DRStudio, archivos JSON y animaciones. Las 38 misiones deben continuar funcionando durante la transición.
2. Generar y aprobar G2, importar bajo su carpeta exclusiva y actualizar escenas y composición; **no reemplazar en su ruta antigua**.
3. Completar QA de prólogo, ocho generales, cuatro finales, UI y controles en móvil. Pasar pruebas de reglas, interfaces, build y E2E.
4. Solo entonces preparar PR aparte para mover cada G1 ya sustituido a `archivo-historico/artes/DR-G1/` **FUERA de `public/`**. Regenerar catálogo y verificar que no entra a `dist/`. No mover recursos con referencias activas.
5. Moverlos fuera de `public/` reduce peso y descargas de GitHub Pages; **no** reduce historial/tamaño de Git. Para ahorrar además espacio de repositorio, guardar respaldo en un artefacto persistente externo (p. ej., GitHub Release o almacenamiento externo verificado) antes de retirar la copia activa.

**Advertencia:** el importador antiguo `tools/integrate-campaign-art.mjs` escribe en rutas G1 y no debe usarse para G2; habrá que hacer una integración versionada durante la etapa gráfica. Esta entrega no borra archivos G1 ni usa créditos API.
