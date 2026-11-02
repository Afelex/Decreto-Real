# Escenarios de combate

- `partida-inicial-loop.mp4`: fondo animado vertical de **la partida estándar** (`/#/game`), en reproducción automática, silenciada y en bucle.
- `plaza-arcilla-estandar.webp`: imagen de respaldo mientras carga el video, si el dispositivo bloquea su reproducción o si el usuario prefiere movimiento reducido.
- Las misiones de campaña mantienen su propio fondo definido en `screens/CampaignMission.tsx`, y podrán configurar `presentation.backgroundVideo` por misión sin afectar a la partida estándar.

El archivo `gemini_generated_video_b8059a5c.mp4` es la fuente original almacenada en Git. Al desplegar Pages, `.github/workflows/deploy.yml` crea `partida-inicial-loop.mp4` en el mismo directorio **solo en el entorno de compilación** (H.264, 540×960, 24 fps, CRF 26, sin audio, `yuv420p`, `faststart`) y retira la fuente original de la carpeta que se publicará. Así se sirve la versión optimizada en `/Decreto-Real/escenarios/partida-inicial-loop.mp4` sin necesitar otro upload ni duplicar el peso en el sitio. Si se construye localmente con `npm run build`, antes hay que generar el archivo de igual forma.
