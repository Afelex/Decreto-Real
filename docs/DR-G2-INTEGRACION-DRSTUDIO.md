# Integración G2 en Decreto Real Studio

Esta rama incorpora **25 fondos aprobados** al catálogo técnico: 20 fondos regionales y 5 imágenes especiales para misiones 35 y 36. **Los archivos WebP deben instalarse antes de que G2 se active en el juego.** La bandera `campaign/g2Published.ts` está vacía para que el juego use G1 sin mostrar enlaces rotos.

## Instalación única de los binarios

1. Descarga el paquete `Decreto_Real_G2_25_fondos_para_integrar.zip` proporcionado en la conversación.
2. En una copia local del repositorio, ejecuta `npm run g2:import -- ruta/al/archivo.zip` (requiere `unzip` instalado; también acepta la carpeta descomprimida).
3. Ejecuta `npm run test`, `npm run test:ui`, `npm run build` y publica la PR tras la revisión.

El importador copia los 25 WebP a `public/artes/generaciones/DR-G2-2026/`, comprueba su cabecera, crea la lista de archivos activos y actualiza `public/artes/catalogo.json`. Después se pueden revisar en **Galería de artes → G2 · Fondos de campaña**, e incorporar a la biblioteca local de DRStudio con «Usar en DRStudio».

## Escenas mapeadas

- M35: preludio 1–5 casona intacta (A), 6–10 derrumbe (B), 11–12 ruinas (C); combate y diálogo posterior usan C.
- M36: primera línea de presentación acceso a prisión (A), las siguientes y el combate usan interior (B).
- M37: exterior final G2-FON-019 (si está activo). M38: cámara del Decreto Viviente G2-FON-020.
- Resto de capítulos: fondo G2 regional base o arena de jefe por misión.
- Las escenas del preludio son editables por separado en DRStudio y mantienen sus claves `mision-35/preludio-01` etc.

No se cambian los efectos, la baraja, la IA, ni las reglas del combate. Los fondos G1 **no se eliminan** y conservan prioridad como reemplazo cuando G2 no está instalado. Los efectos especiales del derrumbe y del León del Edicto se trabajan por capas PNG transparentes, no se incrustan en el fondo.

**Nota:** La corrección de banderas de G2-FON-010 fue cancelada por decisión expresa del autor; se utiliza el archivo original aprobado.
