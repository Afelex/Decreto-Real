# G2 · Fondos publicados y biblioteca de Decreto Real Studio

## Estado actual
Los **25 WebP G2** (20 fondos de regiones/prólogo y 5 especiales de M35–M36) están
publicados en `main`, activados en `campaign/g2Published.ts` e incluidos en
`public/artes/catalogo.json`. G1 **sigue presente como respaldo**, sin borrados.

## Cómo usar G2 sin importar el ZIP
1. Abrir Decreto Real Studio con modo desarrollador y elegir una intervención del
   prólogo o una pantalla de campaña desde «Escenas».
2. Abrir **Biblioteca 🖼** (en pantallas narrativas también está el botón
   **Fondos G2 publicados**).
3. Filtrar por **25 fondos G2 publicados** y buscar el ID, zona o misión.
4. Elegir **Usar como fondo** o **Como sprite**. El fondo seleccionado se
   descarga del repositorio, se verifica por firma WebP y **solo entonces** se
   incorpora a IndexedDB para su edición, deshacer y exportación.
5. Guardar el borrador. La escena mantiene el recurso elegido tras recargar ese
   mismo navegador. Para llevar el borrador a otro dispositivo, exportar el
   proyecto ZIP de Studio.

**Abrir la biblioteca no descarga 25 imágenes a IndexedDB ni sobrescribe
fondos personalizados.** Los 25 recursos se ven como miniaturas del catálogo
público; solo al elegir uno se guarda una copia local reutilizable por SHA-256.
La pestaña «Mis archivos» muestra las copias locales. La limpieza de archivos
sin uso afecta solo a esas copias, nunca a los recursos del repositorio.

## Vínculos de escena existentes
`campaign/studio/g2SceneAssignments.ts` declara las 110 asignaciones de
fondos por defecto para misiones, duelos, preludios y transiciones regionales.
La biblioteca muestra el número de escenas asociadas a cada G2. El juego ya
utiliza los G2 publicados como fondos por defecto, con alternativa G1 para
fondos no publicados. **No hace falta realizar ninguna importación local para
que esos fondos se vean en el juego**.

- Prólogo: Camino Real y Plaza del Pregón en sus misiones correspondientes.
- M35: preludios 01–05 casona intacta (A); 06–10 derrumbe (B); 11–12
  ruinas (C); el combate utiliza C.
- M36: preludio 01 acceso a prisión (A); siguientes intervenciones y duelo,
  calabozos (B).
- M37: exteriores; M38: arena final.
- El resto de capítulos usa fondos regionales base y arenas de generales.

Las ediciones manuales de DRStudio guardadas para una escena tienen prioridad
sobre los fondos originales y no alteran narrativa, turnos, baraja, IA ni HP.
La versión original **G2-FON-010** se conserva sin correcciones adicionales.

## Herramientas opcionales de mantenimiento
El importador original de la **Galería de artes → Importar lote G2 (25 fondos)**
permanece disponible para recuperar **todos** los recursos y asignaciones en
un borrador local en un único paso, usando un ZIP STORE firmado con SHA-256 por
archivo. No es necesario para usar la biblioteca publicada ni para jugar.

Para reinstalar archivos en una copia *de desarrollo* del repositorio, se puede
usar `npm run g2:import -- ruta/al/ZIP`. Esto se reserva para producción
técnica, no para la revisión cotidiana.

Se recomienda verificar la composición en móvil (390 × 844) y el encuadre de
cada preludio antes de generar nuevas capas transparentes de derrumbe o del
León del Edicto.
