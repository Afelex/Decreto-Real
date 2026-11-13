# Fondo animado del duelo contra IA

El vídeo fuente aprobado es `public/escenarios/gemini_generated_video_b8059a5c.mp4`.

**El navegador debe solicitar únicamente** `/Decreto-Real/escenarios/partida-inicial-loop.mp4`. Ese archivo **se genera en GitHub Actions**, no existe en la carpeta `public` del repositorio. La publicación lo produce con FFmpeg en `dist/escenarios/`, lo convierte a H.264/yuv420p, lo habilita para carga rápida (`faststart`) y comprueba que existe y que su códec sea H.264 antes de subir a Pages.

La pantalla de duelo carga solo el MP4 optimizado, con reproducción automática, silenciada y en bucle. No se monta póster de arcilla detrás del vídeo. El menú inicia su precarga.

El fondo estático `plaza-arcilla-estandar.webp` se conserva como recurso de legado y para escenas sin vídeo, sin superponerse a las partidas con vídeo. Las misiones de campaña conservan sus fondos independientes.

Si se modifica el nombre o la ruta del vídeo, deben actualizarse a la vez `game/battleScenery.ts`, el paso de generación en `.github/workflows/deploy.yml` y la prueba de compatibilidad en `game/battleScenery.test.ts`.
