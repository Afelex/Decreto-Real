# Navegador QA de campaña · 04/11/2026

## Propósito
Esta es una herramienta temporal y exclusiva de revisión: permite saltar a escenas narrativas, prólogo, mapas de región, las 38 misiones, presentaciones de generales, combates, diálogos tras victorias, liberaciones, revelación del centro, batalla con Sigumán, epílogo y créditos provisionales. No modifica el progreso de la partida normal.

## Cómo abrirla
En el despliegue de prueba de GitHub Pages, abrir:

https://afelex.github.io/Decreto-Real/?drDev=1#/campania/inicio

Aparece un pequeño botón fijo **⚙ QA · Historia** (también en modo `npm run dev`). Pulsarlo para desplegar el navegador:
- **Desde el inicio** carga la introducción como si fuera la primera vez, sin borrar el guardado real.
- **Anterior / Siguiente** recorre los puntos de inspección registrados.
- **Capítulo o sección** filtra el listado de escenas y misiones disponibles.
- **Salir de prueba · Partida real** devuelve el menú con el guardado verdadero.

Cada salto prepara **únicamente una copia de progreso temporal en sessionStorage**, con los requisitos legítimos del punto inspeccionado. Los diálogos, introducción de generales, editor de baraja y región también leen y guardan exclusivamente en esa copia durante QA. No se escriben estrellas, introducciones ni barajas en localStorage.

## Verificaciones
- Un salto a un capítulo regional requiere el prólogo, pero no desbloquea artificialmente regiones ajenas.
- Saltar a la fase 4 de un jefe concede las primeras 3 fases de esa región, no la victoria del jefe.
- Saltar a diálogos después de una victoria sí simula el triunfo necesario.
- La revelación central simula las 34 misiones previas. El epílogo y los créditos simulan las 38 completadas.
- El acceso al combate puede saltarse briefing/confrontación mediante `qaEscena=combate`, únicamente con QA activo.
- La pantalla de créditos es **provisional** y no atribuye roles a personas no confirmadas.

## Lanzamiento final
**No mostrar el panel a jugadores**: compilar producción con `VITE_ENABLE_CAMPAIGN_QA=false`. Se conserva el código sin necesidad de eliminarlo. El parámetro `drDev=1` no podrá habilitarlo con dicha variable. Recomendable también retirar las otras herramientas DEV de combate al publicar.

## Archivos
`campaign/campaignQA.ts`, `screens/CampaignQaNavigator.tsx`, `screens/campaign-qa.css`, `screens/CampaignCredits.tsx`; los componentes de campaña ahora obtienen su storage desde `getCampaignStorage`.
