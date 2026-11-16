# Decreto Real · Integración de recursos audiovisuales G3

> **¿Necesitas los prompts para crear los archivos?** Abre el [Kit completo de producción audiovisual G3](./PROMPTS-PRODUCCION-AUDIOVISUAL-G3.md): 6 músicas para Suno, 16 efectos sonoros, 9 imágenes y 9 animaciones, con instrucciones listas para copiar. **Esta página explica únicamente la integración técnica.**

Este documento indica dónde sustituir los recursos *provisionales* por los recursos aprobados.
No es necesario tener música o vídeo definitivos para continuar las mejoras técnicas.

## Música de Suno

Las ranuras están en `game/audioAssets.ts`, en el objeto `MUSIC_ASSETS`:

| Ranura | Archivo final sugerido | Estado |
| --- | --- | --- |
| DEFAULT | `public/audio/musica/tema-general.mp3` | Música provisional heredada |
| MENU | `public/audio/musica/menu-principal.mp3` | Pendiente |
| BATTLE | `public/audio/musica/combate-ia.mp3` | Pendiente |
| DUEL_ENTRANCE | `public/audio/musica/presentacion-duelo.mp3` | Pendiente |
| VICTORY | `public/audio/musica/victoria.mp3` | Pendiente |
| DEFEAT | `public/audio/musica/derrota.mp3` | Pendiente |

Las seis ranuras son **reservas de catálogo**: no generan solicitudes de descarga mientras
`file: null`. La pista habitual continúa utilizando la URL provisional. No se activan
cambios automáticos por pantallas antes de aprobar las canciones.

Para instalar una canción, copiar el MP3 aprobado a `public/audio/musica/` y editar
solo su `file` (ruta relativa, por ejemplo `audio/musica/combate-ia.mp3`).
No sustituir una URL de prueba con un nombre de archivo que aún no exista.
Conservar los originales de producción en otro lugar; el MP3 optimizado es la copia web.

## Efectos cortos

En `game/audioAssets.ts`, `SOUND_ASSETS` conserva siete claves estables:
`CLICK`, `FLIP`, `ATTACK`, `DEFENSE`, `IMPACT`, `VICTORY` y `DEFEAT`.
Los cinco primeros conservan sus sonidos provisionales. Victoria y derrota
seguirán silenciosas mientras no se aprueben nuevos archivos.

Destinos sugeridos (aún no creados): `public/audio/efectos/clic.mp3`,
`moneda.mp3`, `ataque.mp3`, `defensa.mp3`, `impacto.mp3`,
`victoria.mp3`, `derrota.mp3`. Al aprobarlos, basta con modificar
`file` de su ranura. No cambiar claves, lógica del combate ni las opciones
actuales de activar/desactivar efectos.

El reproductor `SoundEffectPool` crea sonidos solo cuando se necesitan,
reutiliza como máximo dos voces por clave y se limpia al silenciar o salir.
Se puede ajustar esa limitación tras pruebas reales en móvil.

## WebM con transparencia para decretos y combos

Las rutas de cada decreto y combo están en `game/effectCues.ts`. Los
banners rojo y azul también se configuran allí mediante `bannerCueFile()`.

| Recurso | Ruta provisional que deberá reemplazarse cuando se apruebe |
| --- | --- |
| Ataque | `public/efectos/ataque.webm` |
| Defensa | `public/efectos/defensa.webm` |
| Orden | `public/efectos/orden.webm` |
| Combo ataque ×2 / ×3 | `public/efectos/combo-ataque-x2.webm` / `combo-ataque-x3.webm` |
| Combo curación ×2 / ×3 | `public/efectos/combo-defensa-x2.webm` / `combo-defensa-x3.webm` |
| Banner jugador / rival | `public/animaciones/banner-jugador-rojo.webm` / `banner-rival-azul.webm` |

Impacto y Mística no disponen todavía de un efecto de energía definitivo:
`file: null` mantiene su comportamiento existente.

El material original puede llegar como MP4 con croma. Debe quitarse el verde
fuera del juego y generar un WebM con transparencia auténtica, conservando
también el MP4 maestro como respaldo. Evitar subir MP4 opacos con verde directo
a `public/efectos`. Verificar en Android el borde de las partículas y el
soporte de VP9 con alfa antes de reemplazar recursos existentes.

**Sincronización aprobada:** cada anuncio dura 1,5 segundos; los efectos
se muestran después, durante otros 1,5 segundos cuando existen. Cambiar
el archivo no debe alterar el reloj del motor, las reglas, la cola de turnos
ni las cintas G3 aprobadas.

## Checklist de aceptación por cada lote

1. Verificar la licencia de uso en videojuegos y almacenar una copia del
   documento de autorización o las condiciones aplicables al material Suno.
2. Auditar los nombres de archivo, ausencia de 404 y duración del vídeo.
3. Probar en móvil: volumen, latencia, memoria, accesibilidad y pausa.
4. Ejecutar pruebas de reglas, integración y navegación antes de fusionar.
5. Conservar el lote gráfico/sonoro anterior como respaldo; no sobrescribir
   archivos maestros sin autorización.

## Integración visual G3 (noviembre 2026)

Las rutas WebP del nuevo kit de 9 ilustraciones se declaran en `game/g3UiAssets.ts` y se usan en `screens/MainMenu.tsx`, `screens/DuelEntrance.tsx` y `screens/BattleResultScreen.tsx`. Dos hojas de puerta se derivan del maestro original, por lo que se distribuyen 10 WebP optimizados. Las imágenes permanecen desactivadas visualmente cuando falla su carga y la interfaz recupera automáticamente el diseño CSS anterior. El código no depende de recursos ausentes y no cambia el motor ni los tiempos de entrada.

Para publicar los binarios exactos, seguir el flujo de carga única en `incoming/README.md`. Los nueve PNG maestros se guardan después en `art-reference/g3-ui/maestros_png/`, sin borrar los artes G1/G2 o las cintas G3 ya aprobadas. No cargar ZIP de otro origen ni con un hash distinto.

### Estado de publicación gráfica G3 · 16/11/2026

Lote G3 importado y validado por GitHub Actions (ejecución #43908956128): 9 PNG maestros conservados en `art-reference/g3-ui/maestros_png/` y 10 WebP en `public/interfaz/g3/`, incluidas las dos hojas separadas de las puertas. Se verificaron hashes, pruebas automatizadas y compilación. El archivo ZIP temporal se retiró de `incoming/` tras instalarse correctamente. Se mantiene el arte anterior como respaldo y se conserva la lógica del duelo.
