# DR-UX01 — Mesa interactiva integrada con la campaña

**Rama:** `feat/campania-mesa-integrada-v1` (desde `feat/campania-ia-estrellas-v1`).  
**Estado:** implementación en revisión, **no desplegada ni fusionada a main**.

## Experiencia introducida

Esta entrega integra la campaña de 38 misiones de `DR-C02` con una primera mesa táctil, sin cambiar reglas ni barajas:

1. El mapa presenta un recorrido curvo y conecta sus encuentros por regiones.
2. Cada misión conserva su presentación narrativa, objetivos de estrellas y pantalla de resultado.
3. La mesa de batalla, habilitada **solo en la campaña**, utiliza un tapete verde oscuro con borde de madera y detalles dorados.
4. La mano de cartas se muestra ligeramente superpuesta, con inclinación en abanico.
5. Un toque selecciona la carta y permite confirmar su uso, como antes.
6. Un arrastre ascendente muestra una copia flotante de la carta. El campo resalta al entrar en su superficie y la carta se juega únicamente cuando se suelta dentro.
7. Soltar fuera de la mesa o cancelar el gesto devuelve la carta a la mano sin consumir mando ni registrar eventos.
8. El motor `applyCombatAction` sigue siendo la única fuente de verdad; el arrastre jamás escribe el estado del combate directamente.
9. La mano permite desplazamiento horizontal; el arrastre está limitado al movimiento vertical predominante.
10. Se mantienen el tutorial, el juego antiguo y el duelo libre con sus interfaces e interacciones actuales.

## Aspectos que NO se han implementado

- Cartas nuevas o especiales de generales.
- Mazos simétricos del rival y agotamiento de la baraja.
- Nuevas reglas de victoria, IA propia para cada jefe ni cambios de balance.
- Música, sonidos adicionales, ilustraciones definitivas, partículas y cinemáticas complejas.
- Actualización de `main`, fusión con otros trabajos en curso o despliegue a GitHub Pages.

## Pruebas preparadas

- `tests/integration/drag.test.tsx`: mesa activada, arrastre válido, soltado inválido, cancelación y uso por toque.
- `tests/e2e/campaign.spec.ts`: Playwright del gesto de arrastrar y captura posterior en el viewport `mobile-390`, además de pruebas existentes de mapa y lore.
- Hereda las pruebas de reglas, motor, guardado, tutorial, progresión y navegador de la campaña.

**Estado de QA:** No se ha podido ejecutar localmente `npm test`, `npm run test:ui`, `npx tsc --noEmit`, `npm run build` ni Playwright en este entorno; tampoco se ha confirmado el resultado del workflow de Actions. Las pruebas están **añadidas, no declaradas aprobadas**. Antes de cualquier merge deben ejecutarse y corregirse los fallos.

## Aceptación mínima antes de integrar

1. `npm ci && npm test && npm run test:ui && npx tsc --noEmit && npm run build` en Node 22 y 24.
2. Playwright en los cinco tamaños ya establecidos; inspeccionar artefactos, errores de consola, geometría y accesibilidad.
3. Probar arrastre ascendente, soltar fuera del tablero, desplazamiento lateral de la mano, toque para confirmar, cartas bloqueadas y cancelación por navegación.
4. Probar en un Android real el gesto táctil y la interacción con la barra del sistema; reducir efectos si causan mareo.
5. Verificar que el tutorial puede completarse, que el duelo libre continúa guardando/recuperando y que la campaña registra estrellas sin modificar el guardado libre.
6. Probar una partida completa de cada resultado con narrativa: victoria, derrota, repetición, siguiente misión y retorno al mapa.
7. Comparar los retratos, barajas, Impactos y legibilidad con el diseño de mesa aprobado.

## Próximo tramo sugerido

Tras validar el gesto de jugar una carta, añadir una animación breve de entrada/descarte asociada a eventos del motor, retratos artísticos reales y transiciones entre capítulos. Posteriormente evaluar IA con mano y mazo simétricos y los retos propios de los ocho generales, como un trabajo separado del refinamiento visual.
