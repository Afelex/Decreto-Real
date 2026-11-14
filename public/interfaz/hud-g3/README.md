# HUD G3 — 14 noviembre 2026

Paquete de **12 imágenes reales**, optimizadas a WebP con transparencia alfa (marco, combo, fin turno, mazo, sonido, menú) o PNG RGBA (cinco decretos). Proceden de los gráficos generados y aprobados en la conversación de Decreto Real.

| Archivo | Lienzo | Se usa en |
|---|---:|---|
| `retrato_marco.webp` | 480 × 600 | Marco superior e inferior del retrato; apertura transparente y barra de HP dinámica |
| `combo_panel.webp` | 700 × 523 | Selector de Combo ×2 y ×3; fondo exterior transparente e interior gris opaco |
| `fin_turno.webp` | 256 × 256 | Botón real de fin de turno; estados enabled/disabled mediante CSS, misma acción |
| `mazo.webp` | 224 × 320 | Marcos de los dos mazos; número y rótulo MAZO siguen siendo texto dinámico |
| `sonido_activado.webp` | 192 × 192 | Sonido encendido |
| `sonido_silenciado.webp` | 192 × 192 | Sonido apagado |
| `menu.webp` | 256 × 256 | Menú de tres rayas; control de pausa original |
| `decreto_ataque.png` | 128 × 128 | Espada |
| `decreto_defensa.png` | 128 × 128 | Escudo |
| `decreto_orden.png` | 128 × 128 | Balanza |
| `decreto_impacto.png` | 128 × 128 | Estrellas |
| `decreto_mistico.png` | 128 × 128 | Sol |

**Integración:** `screens/GameBoard.tsx`, `screens/CombatEventUI.tsx`, `screens/LastDecreeIndicator.tsx` y `screens/hud-g3.css`. Los botones siguen siendo controles HTML accesibles; el arte no es interactivo.

**Respaldo:** los recursos anteriores (por ejemplo `retratos-fin-turno.avif` y `combo-estandartes-nuevo.webp`) **no se eliminaron** ni reescribieron. Se mantienen en sus rutas originales para DRStudio y reversión. La nueva carpeta es la generación vigente del HUD del duelo contra IA.

Para sustituir una pieza: reemplazar únicamente su archivo conservando el nombre, proporción y transparencia, sin modificar los cálculos de turno, combo, HP o mazo.
