# Decreto Real · ilustraciones estáticas de campaña

## Estado del arte

La campaña incorpora **47 imágenes WebP** ya generadas, sin realizar nuevas solicitudes a la API:

- **18 fondos:** nueve regiones (las ocho zonas de generales y la Casa del Sello), con dos versiones por zona: `base` y `jefe`.
- **29 retratos:** enemigos secundarios de las misiones 01–38, excluyendo los ocho generales y Sigumán.
- Los **ocho retratos originales de los generales**, la imagen del mapa central `salon-generales.webp`, las ocho capas `seleccion-1..8.webp` y el perfil de Xervias **se conservan**.
- El **prólogo** conserva el paisaje `prologo-ruta.svg`, porque este paquete no incluía un fondo nuevo para sus dos misiones.

Origen: GitHub Actions [ejecución 41921898124](https://github.com/Afelex/Decreto-Real/actions/runs/41921898124), paquete `DECRETO-REAL-47-IMAGENES`. Se verificaron 47/47 archivos válidos WebP de **1024 × 1536** píxeles.

## Directorios y selección

Todos los nuevos recursos se encuentran dentro de `public/campania/arte/`:

| Ruta | Cantidad | Uso |
| --- | ---: | --- |
| `fondos/region-{1..8,f}-base.webp` | 9 | Mapas regionales, pantallas de entrada y liberación, escenas y duelos normales |
| `fondos/region-{1..8,f}-jefe.webp` | 9 | Presentaciones y duelos de los 8 generales y de Sigumán (misión 38) |
| `retratos/rival-{misión}-{nombre}.webp` | 29 | Perfil del rival de cada misión secundaria, incluido prólogo y capítulo final |

El archivo `campaign/regionAssets.ts` establece la correspondencia única entre misión y recurso mediante:
- `campaignLandscape(chapterId)`: región base para mapas y panorámicas.
- `campaignMissionBackground(missionId)`: variante `jefe` en las misiones 06, 10, 14, 18, 22, 26, 30, 34 y 38; `base` para las otras misiones regionales; prólogo mantiene su fondo de combate.
- `campaignOpponentPortrait(missionId)`: retrato generado para los 29 rivales no principales; los generales y Sigumán mantienen sus presentaciones anteriores.

`screens/CampaignMission.tsx` envía los retratos y fondos al combate original, sin modificar el motor. `RegionScene.tsx` muestra el escenario correspondiente en el briefing y `BossConfrontation.tsx` emplea la variante de jefe. La interfaz mantiene sus medidas actuales sin añadir desplazamiento vertical.

## Reimportación

El script `tools/integrate-campaign-art.mjs` copia el paquete ya generado, después de validar el manifiesto y la firma WebP de **los 47 archivos**. No hace llamadas a ninguna API de generación. El workflow de importación de GitHub Actions descarga el ZIP de la ejecución indicada y confirma la integridad, las pruebas de reglas, pruebas de interfaz y la compilación de producción antes de guardar los WebP en la rama de integración.

## Comprobaciones pendientes antes de publicar

1. Abrir las 8 regiones, el mapa central y una pantalla de entrada/liberación para verificar encuadres verticales.
2. Revisar el retrato correcto durante una misión de prólogo, una misión regional y la misión 36 (Vándalo Rojo).
3. Verificar que el escenario cambia entre la misión 05 y la 06, y entre la misión 37 y la 38.
4. Comprobar que los retratos de los generales y el mapa de selección previo se conservan.
5. Revisar en móvil real que las cartas, indicadores y botones siguen siendo legibles y la pantalla no tiene scroll.
