# Escenarios de combate

- `partida-inicial-loop.mp4`: fondo animado vertical de **la partida estándar** (`/#/game`), en reproducción automática, silenciada y en bucle.
- `plaza-arcilla-estandar.webp`: imagen de respaldo mientras carga el video, si el dispositivo bloquea su reproducción o si el usuario prefiere movimiento reducido.
- Las misiones de campaña mantienen su propio fondo definido en `screens/CampaignMission.tsx`, y podrán configurar `presentation.backgroundVideo` por misión sin afectar a la partida estándar.

El MP4 debe estar físicamente en este directorio y servirse en producción bajo `/Decreto-Real/escenarios/partida-inicial-loop.mp4`. Se recomienda H.264, `yuv420p`, sin audio y `faststart` para el inicio rápido en móviles.
