# Escenario animado del duelo estándar

- `gemini_generated_video_b8059a5c.mp4`: vídeo existente y versionado de la partida contra IA (`/#/game`).
- El componente `BattleSceneryLayer` muestra exclusivamente este MP4 en el modo estándar; **no se monta** la imagen de arcilla debajo ni se usa como póster.
- `plaza-arcilla-estandar.webp` permanece como recurso legado, sin mostrarse cuando existe un vídeo.
- Los fondos propios de las misiones siguen independientes: pueden tener una imagen o un vídeo especificado en `presentation.backgroundVideo`.
- El menú principal sugiere al navegador la precarga del vídeo estándar para reducir la pantalla negra al iniciar el duelo.

**Control de publicación:** la ruta configurada en `game/battleScenery.ts` tiene que corresponder a un archivo físico de `public/escenarios/`. Los tests impiden volver a apuntar a un MP4 inexistente.
