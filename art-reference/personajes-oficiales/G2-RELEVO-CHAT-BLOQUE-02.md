# Decreto Real · G2 — Bloque 02 · seis generales recuperados

**Fecha de comprobación:** 10 de noviembre de 2026 (Ecuador). **Estado:** seis originales localizados, inspeccionados y verificados con huella SHA-256 exacta respecto de `catalogo.json`. **No implica que el creador haya aprobado expresiones nuevas ni que los binarios se hayan subido a GitHub.**

## 1. Identidades localizadas sin rediseñar

| ID | Misión | Nombre original de la copia | SHA-256 verificado | Dimensiones | Formato real | Alfa |
|---|---:|---|---|---|---|---|
| `leandro-valcazar` | M10 | `leandro-valcazar.png` | `0bcfe3a9c18aa1062f77fb0f9040d788686482077939de82d7b6f9d3694de25f` | 1152×1536 | JPEG (nombre .png) | No |
| `octavio-argento` | M14 | `octavio-argento.png` | `531bb124d8779caa67323336c9e03b3ee561a6118a150bfd3cf463f9e831bb1d` | 1125×1398 | PNG | Sí |
| `jeronimo-arrellano` | M18 | `jeronimo-arrellano.png` | `d9f6a440f102e5354e7dbcac4a0bf21bb6019c91898224ceb5e483da4d14c821` | 1125×1398 | PNG | Sí |
| `isabela-valdierra` | M26 | `isabela-valdierra.png` | `9e6f72964d6db122d038dda3446ade3792c2d3fbcbd5910af74f8e2c60652d0a` | 1125×1398 | PNG | Sí |
| `aukan-del-condor` | M30 | `aukan-del-condor.png` | `b1d93fabf62a18f7451697cc170d8f210ed8995538968b40a971cf730a814c7e` | 1229×1536 | JPEG (nombre .png) | No |
| `gonzalo-de-montes` | M34 | `gonzalo-de-montes.png` | `ad52f79a641eb0cd699f984ac118c90f47ae47c5ed8b7e78804da80a0982fced` | 1229×1536 | JPEG (nombre .png) | No |

**Procedencia:** seis archivos con estos nombres recuperados de la Biblioteca de archivos del creador. El hash entero de cada copia coincide con el prefijo previamente registrado para su imagen original en `catalogo.json`; eso verifica su integridad y procedencia respecto del catálogo. Las copias se han conservado intactas para construir un paquete de recuperación externo.

**Estado en este repositorio:** las rutas de `art-reference/personajes-oficiales/imagenes/` siguen reservadas, **sin binarios**. El catálogo mantiene `imagenEnRepositorio=false` y `avanceCanonVisual.perfilesConfirmados` sigue con seis perfiles del bloque 01. No registrar falsamente como publicados estos seis originales, y no activar retratos nuevos en tiempo de ejecución todavía.

## 2. Continuidad visual de los seis generales

Las fichas completas y rasgos que no se pueden modificar constan en `catalogo.json`, bajo `perfilVisualCanon`. Resumen de controles clave:

- **Leandro:** melena castaña ondulada, pluma roja enorme, piel blanca en hombros, capa carmesí, caballo dorado en pecho de armadura oscura con oro.
- **Octavio:** melena plateada de bucles, iris violeta, pendiente de diamante, broche oval violeta, jabot blanco, hombrera plateada labrada y piel blanca del otro lado.
- **Jerónimo:** barba y cabello castaño revuelto, cicatriz frontal, ojos claros, bufanda roja, armadura oscura con engranaje/rayo dorado, gran cañón al hombro; **sin sombrero, plumas o corbatín blanco**.
- **Isabela:** largos rizos castaños, ojos cobrizos rojizos, flores blancas y perlas en tocado, pendientes dorados, manto blanco/oro con banda roja y broche floral central.
- **Aukan:** dos trenzas largas, vincha roja con placa de oro escalonada, pintura roja simétrica en mejillas, pendientes y collares solares, manto magenta con geometría andina; **sin inventar plumas**.
- **Gonzalo:** melena rubia ondulada, ojos azules, armadura plata/oro, capa blanca y roja, broche floral dorado, escudo con **cruz roja recta original** en hombrera (no aspa de Borgoña ni estandarte).

En todas las escenas y materiales nuevos, las banderas o estandartes deben ser blancos o rojos sencillos, sin cruces de Borgoña ni otros emblemas. Esto no autoriza alterar los símbolos que ya son parte de los atuendos maestros.

## 3. Familia de expresiones propuesta

Se sugieren seis variantes individuales por general, en el orden de `expresionesG2Previstas` del catálogo: neutral, orden/acción característica, desafiante/enojo, tensión, sorpresa, derrota. **Son objetivos de producción, no archivos existentes.**

Cada derivado debe:
1. Partir de la **imagen maestra con SHA verificado**, sin reimaginar rostro o uniforme.
2. Mantener rasgos faciales, peinado, colores, proporciones, insignias, joyas y accesorios.
3. Entregarse como PNG RGBA de **768×1152 px (2:3)** cuando sea retrato de misión, sin textos ni fondo. Una variante de escena puede tener otra medida si su destino lo exige.
4. Incluir ficha de control o comparación con la maestra antes de generar toda su familia.
5. Verificar firma PNG, dimensiones, canal alfa **no totalmente opaco**, composición sobre fondo oscuro y claro, encuadre móvil y continuidad en las líneas de diálogo.
6. Guardar el original intacto, cada expresión en ruta versionada propia; ofrecer vuelta a G1.
7. No integrar en `main` sin QA de DRStudio, juego y móvil.

## 4. Integración DRStudio — secuencia

**Fase A — preservación:** incorporar los seis originales recuperados como archivos binarios a GitHub, registrar sus hashes y no modificar las imágenes existentes.

**Fase B — calidad artística:** primer control de una expresión por personaje; comparar rostro y accesorios con la fuente. Revisar y aprobar antes de producir todas las variantes.

**Fase C — galería:** indexar **solo los derivados aprobados**, con vínculo a la maestra, ID del personaje, expresión y tamaño, junto al catálogo G1/G2 sin eliminación de imágenes anteriores.

**Fase D — escena:** habilitar elección de variantes en la biblioteca de DRStudio, con copia local reversible e identidad estable. Mantener fondos G2 aprobados y continuidad de M35 (Zhinchi desaparece tras derrumbe; Xervias derrota Vándalo Rojo) y M36 (Gaspar de Armenta / León del Edicto).

**Fase E — publicación:** probar PNG/alpha y asignaciones con pruebas automatizadas y revisión móvil; publicar cuando esté verificado.

## 5. Limitación registrada al cierre

El conector GitHub de este chat dispone de operaciones de contenido textual y objetos Git, pero los **bytes binarios recuperados en la biblioteca** no pueden transferirse directamente con estas operaciones sin un canal de carga de bytes verificado. Se ha preparado una copia en paquete descargable en el entorno del chat, pero **todavía no existe una subida binaria al repositorio**. No marcar `imagenEnRepositorio=true`, no agregar rutas rotas al runtime, ni declarar la integración como completada.

## 6. Referencias y relevo

- Bloque 01: [G2-RELEVO-CHAT-BLOQUE-01.md](G2-RELEVO-CHAT-BLOQUE-01.md)
- Canon y hashes actuales: [catalogo.json](catalogo.json)
- Estado general: [G2-CONTINUIDAD.md](G2-CONTINUIDAD.md)
- Guía de fondos ya publicados: [DR-G2-INTEGRACION-DRSTUDIO.md](../../docs/DR-G2-INTEGRACION-DRSTUDIO.md)

**Corte correcto:** seis primeras identidades aprobadas; seis originales adicionales exactos recuperados, con fichas preparadas; expresiones G2 e integración de retratos aún pendientes.
