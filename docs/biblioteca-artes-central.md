# Biblioteca artística central · Decreto Real / DRStudio

Acceso de revisión en GitHub Pages: `https://afelex.github.io/Decreto-Real/?drDev=1#/artes`.

## Qué incluye

- Un catálogo de **todos los recursos gráficos versionados**: imágenes PNG, JPEG, WebP, GIF, AVIF, SVG y animaciones MP4/WebM; incluye las referencias de `art-reference/`. El catálogo se regenera en `npm run build` y también registra medios publicados bajo `public/studio/media/`.
- Miniaturas, búsqueda por nombre/carpeta, filtros por grupo, vista ampliada, tamaño en bytes, **dimensiones en píxeles detectadas del archivo real** (y proporción aproximada), observaciones de dirección de arte y decisión de aprobar/corregir.
- «Ocultar» para retirar temporalmente una versión del listado, con opción «Mostrar ocultos y descartados» para recuperarla.
- «Marcar para eliminar» un archivo publicado, sin borrar inmediatamente de GitHub ni romper escenas. Exporta un JSON con archivos, estado y observaciones para revisar la eliminación y preparar cambios en GitHub.
- «Eliminar archivo local» para una subida no usada por los borradores; la biblioteca integrada en Studio mantiene su protección más estricta contra el borrado de recursos usados en escenas, historial y autoguardado.
- «Subir imágenes o videos» y «Subir reemplazo»: guardan en **la misma IndexedDB que DRStudio** (`decreto-real-studio-media-v1`). Comprueban firma real, límite de 25 MB por archivo y evitan duplicados SHA-256. Un reemplazo no modifica directamente el arte publicado.
- «Usar en DRStudio»: incorpora el arte publicado a esa biblioteca local si el formato está admitido (PNG/JPG/WebP/GIF/MP4/WebM), desde donde se usa como sprite, efecto, fondo o reemplazo de un personaje.

DRStudio, desde el botón **🖼 Biblioteca**, ofrece enlace a la galería y muestra dimensiones detectadas de archivos locales. Al regresar a Studio tras una subida desde otra pestaña, la biblioteca se actualiza al recuperar el foco.

## Estado de sincronización (importante)

La aplicación está alojada en GitHub Pages, que es **estática**. No tiene un servidor de subida autenticado. Por ello:

1. Los archivos subidos desde DRStudio o la galería aparecen en **ambos editores del mismo origen web y perfil del mismo navegador**.
2. No se sincronizan automáticamente entre teléfono/ordenador ni se guardan permanentemente en GitHub por el simple acto de subirlos. Exporta el ZIP de Studio para respaldarlos.
3. Las decisiones de ocultar, marcar para eliminar, aprobar, corregir y reemplazar son locales hasta que se revisen y apliquen en GitHub. «Eliminar archivo publicado» se hace mediante un cambio versionado y revisado; no desde una petición anónima del navegador.
4. Para publicar imágenes en el juego para todos los dispositivos se conserva el flujo seguro de `Studio · Preparar publicación mediante PR`, explicado en `docs/decreto-real-studio-v3.md`.
5. Los SVG y AVIF están visibles en la galería pero DRStudio no admite sus firmas directamente; convertir a PNG/WebP antes de importarlos.

No se solicita ni almacena un token de GitHub en el navegador. No se elimina ningún recurso original de la rama `main` con esta funcionalidad.

## Para desarrollo y pruebas

```bash
npm ci
npm test
npm run test:ui
npx tsc --noEmit
npm run build             # Regenera public/artes/catalogo.json
npx playwright test tests/e2e/art-gallery.spec.ts --trace off
```

**Siguiente fase técnica necesaria para la sincronización multidispositivo automática:** establecer un backend de autenticación y almacenamiento persistente con permisos de propietario, subida segura de binarios y versionado/restauración. No corresponde colocar claves secretas en esta aplicación pública.
