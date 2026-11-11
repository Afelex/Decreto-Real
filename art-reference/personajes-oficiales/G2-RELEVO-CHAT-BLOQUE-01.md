# Decreto Real · Relevo de chat — arte de personajes G2 (bloque 01)

**Corte:** 10 de noviembre de 2026 (Ecuador). **Hito: 6 de 12 referencias maestras confirmadas.**
Este documento es el punto de entrada verificable para un nuevo chat de producción artística.
Fuente técnica: `art-reference/personajes-oficiales/catalogo.json` y `G2-CONTINUIDAD.md`.

## 1. Qué está hecho (y qué NO)

- El creador confirmó directamente **seis diseños de personaje** mediante una imagen por personaje: Xervias, Zhinchi, Sigumán, Vándalo Rojo, Nayisa de Sombras y Baltasar de Fierro.
- Las **descripciones canónicas**, rasgos invariables, variantes previstas, procedencia y metadatos de archivos se documentaron en GitHub; **no** se han subido sus imágenes maestras originales como binarios a `art-reference/personajes-oficiales/imagenes/`.
- **No se han generado, aprobado ni publicado nuevas familias de expresiones G2** para estos seis personajes en esta ronda.
- **No se han sustituido** los sprites G1, retratos existentes ni el arte actual del juego; tampoco se modificaron mecánicas.
- Los **25 fondos G2** de la etapa anterior están publicados y revisados en móvil; no deben confundirse con retratos G2. Los fondos G1 se conservan.

## 2. Fichas confirmadas

| ID / papel | Archivo recibido | Rasgos visuales que no se deben alterar | Variantes previstas |
|---|---|---|---|
| `xervias` / protagonista | `163480.png` | Joven, cabello castaño oscuro despeinado, ojos marrones, uniforme azul oscuro y oro, capa roja, corbatín blanco con broche floral dorado | Neutral, decidido, sorprendido, herido sin lágrimas, invocación, reflexivo |
| `zhinchi` / mentor | `163479.png` | Cabello rubio dorado en mechones, ojos azules, uniforme azul y dorado, capa azul sobre un hombro, corbatín blanco con gema azul | Neutral, investigando, ordenando, invocando poder, agotado/herido, desaparición tras derrumbe |
| `siguman` / jefe final | `167111.png` | Calvo, ojos verdes, cicatriz en ojo derecho, bigote muy grande curvado, sonrisa intimidante; casaca púrpura/granate/oro, piel clara, jabot blanco, gran cruz con gema roja | Sonrisa amenazante, calculador, furioso, guantelete dorado de poder, sorprendido ante derrota |
| `vandalo-rojo` / antagonista M35 | `168753.png` | Joven sin bigote, cabello granate, capucha roja amplia con filo dorado y cordones bajo barbilla, antifaz angular vino/oro que **oculta los ojos**, capa carmesí y medallón de flor de lis | Sonrisa desafiante, calculador, furioso, sorprendido ante el legado, derrotado |
| `nayisa-de-sombras` / general M22 | `168754.png` | Ojos azul turquesa, dos bandas rojas en cada mejilla, trenza larga oscura y gruesa, capucha verde bordada en oro con plumas, pendientes de oro, broche esmeralda, carcaj y piel moteada | Neutral vigilante, decidida, enojada, alerta, serena, acción con arco |
| `baltasar-de-fierro` / general M06 | `168782.png` | Anciano de cejas blancas, cabello largo y barba/bigote blancos, bicornio azul con ancla de oro y pluma blanca, casaca naval azul/oro, charreteras, anclas, corbatín y motivo de olas | Neutral severo, ordenando, desafiante, sorprendido, derrotado con dignidad, mando en cubierta |

**Importante:** el nombre canónico es **Baltasar de Fierro**. El usuario también lo ha llamado «Baltazar», sin que eso cambie el ID ni el nombre del juego.

## 3. Estado de los archivos originales

| Personaje | Copia recibida | Datos comprobados | Subido a GitHub |
|---|---|---|---|
| Xervias | `163480.png` | Referencia visual confirmada | No |
| Zhinchi | `163479.png` | Referencia visual confirmada | No |
| Sigumán | `167111.png` | Referencia visual confirmada | No |
| Vándalo Rojo | `168753.png` | 1236 × 1536, datos JPEG bajo nombre .png, fondo negro sin alfa | No |
| Nayisa | `168754.png` | 1125 × 1398, PNG RGBA transparente; SHA coincide con el original antes documentado | No |
| Baltasar | `168782.png` | 1152 × 1536, datos JPEG bajo nombre .png, RGB, 502339 bytes, sin alfa | No |

Baltasar SHA-256: `03b01e7aa58c3785cf267a50da516e00949a4f52199e2bb70d3e7bfcf71c3643`.
La copia reciente **difiere** del SHA parcial de `163481.png`; el retrato `168782.png` es la referencia vigente aprobada. Mantener la imagen original sin modificaciones como fuente y crear un derivado con alfa real para escenas.

Las referencias visuales confirmadas están adjuntas al chat original, **no dentro de este documento**. En un nuevo chat, para una edición exacta o generación derivada de una imagen, hay que adjuntar la referencia maestra necesaria si no está accesible allí.

## 4. Estilo y restricciones de continuidad

- Identidad visual del juego: **anime fantasy del siglo XVII, Reinos del Perú, cel shading de contornos claros y sombras planas**, proporciones de adulto; predominio de detalles virreinales fantásticos.
- Nunca modificar peinado, rasgos, edad aparente, color de ojos, uniforme, insignias, broches, joyas o armas sin aprobación del creador.
- **Variantes de expresión** cambian emociones, pose o acción, no la identidad.
- Para sprites de DRStudio: versiones individuales con **fondo verdaderamente transparente**, alpha validado; mantener originales intactos.
- Usar la misma proporción y resolución aprobadas por función; para retratos de misión la especificación documentada es **2:3, 768 × 1152 px**, sin texto incrustado. Un retrato maestro puede tener otra proporción.
- Producir primero **una ficha/model sheet de control** y comprobar rostro, uniforme y accesorios antes de multiplicar imágenes.
- No integrar a `main` ni reemplazar recursos existentes sin verificar el arte resultante y QA móvil.

## 5. Historia relevante

- **Xervias** recibe por primera vez el poder de **Zhinchi** en misión **M35**, tras el enfrentamiento de Zhinchi contra **Vándalo Rojo** y un derrumbe. Zhinchi **desaparece**, pero su muerte **no se confirma**; Xervias derrota personalmente al Vándalo Rojo y continúa.
- En **M36**, **Gaspar de Armenta** invoca el **León del Edicto**, criatura persistente con 4 PV y ataque propio de 2.
- **Sigumán** es el jefe principal del arco final; Nayisa y Baltasar forman parte de los ocho generales.
- Los originales de fondos G2 y G1 se preservan.

## 6. Seis referencias pendientes de este catálogo de 12

- Leandro Valcázar
- Octavio Argento
- Jerónimo Arrellano
- Isabela Valdierra
- Gonzalo de Montes
- Aukan del Cóndor

La referencia visual anterior de cada uno consta descrita en `catalogo.json`, pero no está confirmada **en esta ronda**. El próximo chat puede continuar recibiendo sus imágenes maestras una a una o iniciar variantes de Xervias y Zhinchi si el creador lo prefiere.

## 7. Enlaces útiles

- Repositorio: https://github.com/Afelex/Decreto-Real
- Biblia visual: https://github.com/Afelex/Decreto-Real/tree/main/art-reference/personajes-oficiales
- Catálogo de personajes: https://github.com/Afelex/Decreto-Real/blob/main/art-reference/personajes-oficiales/catalogo.json
- Continuidad detallada: https://github.com/Afelex/Decreto-Real/blob/main/art-reference/personajes-oficiales/G2-CONTINUIDAD.md
- DRStudio: https://afelex.github.io/Decreto-Real/?drDev=1#/studio
- Galería: https://afelex.github.io/Decreto-Real/?drDev=1#/artes
- PR de Xervias, Zhinchi, Sigumán: https://github.com/Afelex/Decreto-Real/pull/117
- PR de Vándalo Rojo: https://github.com/Afelex/Decreto-Real/pull/118
- PR de Nayisa: https://github.com/Afelex/Decreto-Real/pull/119
- PR de Baltasar y este relevo: ver PR del bloque 01.

## 8. Mensaje inicial sugerido para el nuevo chat

> Continuemos la etapa de personajes G2 del videojuego Decreto Real. Ya completamos el primer bloque de seis referencias maestras confirmadas: Xervias, Zhinchi, Sigumán, Vándalo Rojo, Nayisa de Sombras y Baltasar de Fierro. Lee primero el registro en `art-reference/personajes-oficiales/G2-RELEVO-CHAT-BLOQUE-01.md` y el catálogo `catalogo.json` del repositorio `Afelex/Decreto-Real`. Conserva estrictamente su canon visual y los recursos del juego. El registro está aprobado, pero los seis archivos maestros aún no se han cargado como binarios a GitHub, y todavía no hemos generado variantes de expresiones. Quiero continuar con las seis referencias restantes y luego crear variantes fieles, con alfa real, verificadas para DRStudio. Procura pedirme el mínimo de intervenciones.
