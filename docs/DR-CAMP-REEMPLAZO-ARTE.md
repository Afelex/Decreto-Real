# Decreto Real · sustitución de ilustraciones de campaña

**Los fondos actuales son provisionales.** Toda la navegación ya funciona independientemente del diseño final y no hace falta cambiar el motor ni las misiones para poner arte nuevo.

## Manifiesto único

Los diez paisajes (prólogo, ocho territorios y escenario central) se configuran en `campaign/regionAssets.ts`, propiedad `CAMPAIGN_LANDSCAPE_FILES`.

| Pantalla | Recurso actual en `public/campania/` | Tamaño base | Tema |
|---|---|---|---|
| Prólogo, 2 misiones | `prologo-ruta.svg` | 768 × 1120 | Camino costero andino |
| Baltasar, región 1 | `regiones/region-1.svg` | 720 × 1100 | Puerto y barcos |
| Leandro, región 2 | `regiones/region-2.svg` | 720 × 1100 | Posta y caballería |
| Octavio, región 3 | `regiones/region-3.svg` | 720 × 1100 | Plata y minas |
| Jerónimo, región 4 | `regiones/region-4.svg` | 720 × 1100 | Cañones y bastión |
| Nayisa, región 5 | `regiones/region-5.svg` | 720 × 1100 | Selva y río |
| Isabela, región 6 | `regiones/region-6.svg` | 720 × 1100 | Ciudad y estandartes |
| Aukan, región 7 | `regiones/region-7.svg` | 720 × 1100 | Cóndor y nevados |
| Gonzalo, región 8 | `regiones/region-8.svg` | 720 × 1100 | Casa del Juramento |
| Sigumán, capítulo final | `regiones/region-f.svg` | 720 × 1100 | Casa del Sello |

**Recomendación de entrega final:** WebP optimizado a 1080 × 1650 o 1440 × 2200 para los territorios, manteniendo la proporción aproximada 720:1100; PNG si se necesita transparencia. El archivo original puede ser mucho más grande, pero no conviene cargar imágenes de varios megabytes en cada pantalla.

**Cómo reemplazar:** colocar el recurso definitivo en `public/campania/regiones/` y cambiar únicamente el valor de la región correspondiente dentro de `campaign/regionAssets.ts` de `.svg` a `.webp` o `.png`. La misma imagen se emplea automáticamente en mapa regional, vista previa del general, escena de entrada/liberación, encuentro antes del combate y fondo del duelo de campaña.

## Retratos de los generales y mapa de selección

- Los ocho retratos conceptuales **no son archivos independientes**: están generados como SVG en `screens/GeneralPortrait.tsx` (marco circular interno 120 × 120). Cuando se apruebe el arte, sustituir el componente por imágenes en `public/campania/retratos/` o añadir una tabla de recursos similar al manifiesto.
- El **mapa general de los ocho retratos** permanece en `public/campania/salon-generales.webp` y está alineado en 941 × 1672 píxeles con las selecciones `public/campania/seleccion-1.webp` ... `seleccion-8.webp`. No cambiar su proporción ni recortar las capas por separado: los botones táctiles y las posiciones comparten coordenadas.
- Las cartas místicas se presentan con nombre, efecto y estado desde `game/mysticCards.ts`. No hay una dependencia entre el dibujo de cada carta y la lógica de sus poderes.

## Indicaciones para la ilustración

- Mantener el centro y los puntos recorridos **libres de textos**: las cuatro misiones, estrellas, porcentajes y controles se dibujan como HTML.
- Prever legibilidad en móviles: los paisajes se oscurecen ligeramente debajo de los textos. La ilustración no debe contener diálogos ni botones.
- Arte acorde a fantasía virreinal-andina y anime del juego; sin necesidad de símbolos incas explícitos.
- En la pantalla de combate, las cartas deben seguir contrastando contra el fondo. Evitar saturación y detalles excesivos detrás de la mano.
- Al sustituir una ilustración verificar: recorte en vertical, posiciones de los cuatro nodos, claridad del retrato del jefe y ausencia de desplazamiento vertical.

## Criterios finales de aceptación

1. Probar una partida nueva: introducción, 2 misiones de prólogo y diálogo de los ocho generales.
2. Entrar a las 8 regiones en cualquier orden. Confirmar 4 etapas, retrato del jefe y carta mística.
3. Completar una región: conversación, liberación y carta mística sellada (antes del legado de Zhinchi).
4. Tras 8/8 regiones, verificar la revelación de la Casa del Sello y cuatro misiones finales.
5. Comprobar que Zhinchi deja de dialogar tras el capítulo correspondiente, que el editor de baraja habilita el máximo de 3 cartas místicas y que Sigumán aparece con sus tres poderes.
6. Verificar pantalla sin scroll, controles táctiles y guardado de estrellas en Android real antes de fusionar a `main`.

[PR de la campaña](https://github.com/Afelex/Decreto-Real/pull/57)
