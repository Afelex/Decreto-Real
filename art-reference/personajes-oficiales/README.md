# Decreto Real · Biblia visual oficial de personajes

**Propósito:** preservar sin ambigüedades las identidades visuales de los 12 personajes principales de Decreto Real, mientras se amplía la galería de subjefes y NPC para DRStudio.

## Estado de la incorporación

- **Registrado en GitHub:** este documento y `catalogo.json` con nombres, rasgos, fuente original de la conversación y ruta reservada de cada imagen.
- **Pendiente:** subir los 13 PNG maestros del paquete `decreto_real_biblia_visual_12_personajes.zip` a `art-reference/personajes-oficiales/imagenes/`. **No considerar publicados esos binarios hasta comprobarlos en GitHub.**
- **Sin cambios en el juego:** los sprites de producción, retratos de misión y escenas existentes permanecen intactos. No hay cambios funcionales en DRStudio.

## Reglas de continuidad de diseño

1. Los retratos originales proporcionados por el creador mandan sobre cualquier regeneración.
2. El estilo compartido es **anime cel shading**, con sombras planas, contornos nítidos y proporciones adultas dentro de una fantasía de los Reinos del Perú, siglo XVII.
3. Al crear retratos, gestos, poses y sprites, conservar **rostro, peinado, ojos, edad aparente, uniforme, paleta, insignias y accesorios**. No agregar sombreros, cicatrices ni emblemas inventados.
4. Todas las expresiones y poses derivadas deben referenciar el ID del personaje y su retrato maestro.
5. Un fondo negro o de cuadrícula **no equivale** a transparencia real; comprobar alfa antes de usar en escenas de DRStudio.
6. **Vándalo Rojo confirmado:** seguir la referencia maestra recibida como `168753.png`, con capucha amplia carmesí, máscara angular rojo oscuro/oro que oculta los ojos, cordones bajo la barbilla, sin bigote ni barba, y capa con medallón dorado. La aprobación está cerrada para esta referencia; las variantes expresivas siguen pendientes. El archivo mostrado tenía firma JPEG pese a la extensión .png y fondo negro sin transparencia; comprobarlo antes de generar sprites.

**Avance de validación visual G2:** 6/12 referencias confirmadas por el creador: Xervias, Zhinchi, Sigumán, Vándalo Rojo, Nayisa de Sombras y Baltasar de Fierro. La imagen reciente del almirante se recibió como `168782.png` (1152 × 1536) con datos JPEG y fondo negro sin alfa; es la referencia maestra actual aunque difiera de la huella del archivo anterior. La imagen de Nayisa tiene PNG RGBA. **Los seis binarios maestros aún no están publicados en este repositorio.** Primer bloque documentado en [`G2-RELEVO-CHAT-BLOQUE-01.md`](G2-RELEVO-CHAT-BLOQUE-01.md).

## Índice de personajes

| ID | Identidad | Papel | Imagen maestra |
|---|---|---|---|
| `xervias` | Xervias | protagonista | `imagenes/xervias.png` (pendiente de subida) |
| `zhinchi` | Zhinchi | mentor | `imagenes/zhinchi.png` (pendiente de subida) |
| `siguman` | Sigumán | jefe final | `imagenes/siguman.png` (pendiente de subida) |
| `aukan-del-condor` | Aukan del Cóndor | general | `imagenes/aukan-del-condor.png` (pendiente de subida) |
| `gonzalo-de-montes` | Gonzalo de Montes | general | `imagenes/gonzalo-de-montes.png` (pendiente de subida) |
| `isabela-valdierra` | Isabela Valdierra | general | `imagenes/isabela-valdierra.png` (pendiente de subida) |
| `jeronimo-arrellano` | Jerónimo Arrellano | general | `imagenes/jeronimo-arrellano.png` (pendiente de subida) |
| `nayisa-de-sombras` | Nayisa de Sombras | general | `imagenes/nayisa-de-sombras.png` (pendiente de subida) |
| `octavio-argento` | Octavio Argento | general | `imagenes/octavio-argento.png` (pendiente de subida) |
| `leandro-valcazar` | Leandro Valcázar | general | `imagenes/leandro-valcazar.png` (pendiente de subida) |
| `baltasar-de-fierro` | Baltasar de Fierro | general | `imagenes/baltasar-de-fierro.png` (pendiente de subida) |
| `vandalo-rojo` | Vándalo Rojo | antagonista secundario | `imagenes/vandalo-rojo.png` (pendiente de subida) |

La segunda pose de Sigumán, con el guantelete místico, se registra como `imagenes/siguman-guantelete.png` (pendiente de subida).

## Fuente de verdad

`catalogo.json` conserva una descripción única y el prefijo de comprobación SHA-256 de cada archivo original. Los nombres de las imágenes coinciden con el paquete curado descargable y sus rutas finales están reservadas aquí. No usar esas rutas en tiempo de ejecución hasta que sus archivos existan en GitHub.

## Subjefes y secundarios

Los siguientes diseños deben derivarse de esta guía, conservando cada identidad principal, sin sobrescribir las imágenes existentes de `public/campania/arte/retratos/`.

## Segundo bloque de generales G2

La recuperación exacta de seis originales con hashes verificados, rasgos invariables y proceso de incorporación por un ZIP se documenta en [G2-RELEVO-CHAT-BLOQUE-02.md](G2-RELEVO-CHAT-BLOQUE-02.md). En el corte previo a subir el ZIP, sus `imagenEnRepositorio` siguen en `false`; no se sustituyen sprites de producción.

## Referencias del bloque 02 publicadas

Los seis originales de Leandro, Octavio, Jerónimo, Isabela, Aukan y Gonzalo se incorporaron mediante importación SHA-256 y constan como archivos en `imagenes/` (tres JPEG reales con extensión `.jpg` y tres PNG RGBA). Los otros seis maestros del bloque 01 siguen pendientes de publicación binaria. Ver `G2-RELEVO-CHAT-BLOQUE-02.md` para el estado detallado y `G2-EXPRESIONES-BLOQUE-02.json` para las 36 expresiones previstas. La Galería y DRStudio podrán mostrar estas seis fuentes **solo como referencias**; no se activan retratos G2 en juego ni se sustituyen los G1.
