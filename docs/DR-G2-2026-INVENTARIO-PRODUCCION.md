# Decreto Real · Inventario maestro G2 (10 de noviembre de 2026)

**Plan de producción inicial: 110 recursos**; inventario derivado de 38 misiones canónicas y componentes reutilizables. **No implica que todos deban generarse**: se podrán reutilizar componentes validados, reducir la cantidad o ampliarla tras QA.

| Grupo | Piezas | Situación |
|---|---:|---|
| Fondos | 20 | 1 generado en conversación, pendiente de importar y aprobar |
| Retratos de rival | 38 | 38 pendientes |
| Sprites transparentes | 24 | 24 pendientes |
| Cartas/invocaciones | 12 | 12 pendientes |
| Cinemáticas ilustradas | 12 | 12 pendientes |
| Mapas y marcos especiales | 4 | 4 pendientes |
| **Total** | **110** | **1 generado para revisión, 0 aprobados, 0 publicados** |

El fichero de control es `public/artes/generaciones/DR-G2-2026/catalogo-produccion.json` y contiene un ID y un destino único por recurso.

## Primera imagen
`G2-FON-001`: **Camino Real de los Reinos del Perú**. Fondo de exterior del prólogo generado en este chat (PNG, 1024×1536), pendiente de aprobación artística. **Su binario NO se encuentra aún en el repositorio**; no referenciarlo desde el juego hasta importarlo y validarlo. El archivo de destino previsto es `public/artes/generaciones/DR-G2-2026/fondos/prologo-camino-real-de-los-reinos-del-peru.png`. No tratar un dibujo ilustrativo o infografía de planificación como asset jugable.

## Método de producción e integración
1. Validar continuidad de los maestros de Xervias, Zhinchi, Sigumán y los 8 generales. La biblia visual documenta rutas previstas, pero los PNG maestros aún deben verificarse/subirse.
2. Continuar con `G2-FON-002` (plaza del pregón) y un piloto limitado del prólogo: fondos, Domingo, familia, Xervias y Zhinchi.
3. Revisar G2 en la galería y DRStudio, sin cambiar narración ni motor de combate.
4. Importar binarios con sus IDs sin sobrescribir arte G1. Actualizar rutas solo al aprobar cada bloque y comprobar test/QA móvil.
5. Archivar G1 ya sustituido fuera de `public/` en PR separada cuando no tenga referencias. No borrar prematuramente.

**Bandera/estandarte:** exclusivamente paños lisos rojos y blancos, sin cruces, aspas, escudos ni otros diseños. **Estado real:** esta lista es planificación, no acredita generación, aprobación o integración de 110 imágenes.
