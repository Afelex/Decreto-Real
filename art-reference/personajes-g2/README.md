# Decreto Real · Producción gráfica G2 de personajes — lote 01

## Estado verificable (noviembre 2026)

**Preparados y validados:** 8 encargos individuales para Xervias y Zhinchi, cada uno vinculado a sprites reales existentes del prólogo. **No afirmar que los 8 PNG nuevos estén generados o aprobados** antes de verificar la salida de la API y la revisión artística.

### Ocho imágenes del primer lote

| ID | Personaje | Variante | Referencias existentes |
|---|---|---|---|
| G2-PER-XERVIAS-01 | Xervias | Neutro | xervias_01_objecion.webp, xervias_02_invoca.webp |
| G2-PER-XERVIAS-02 | Xervias | Decidido | mismas referencias |
| G2-PER-XERVIAS-03 | Xervias | Dolor contenido | mismas referencias |
| G2-PER-XERVIAS-04 | Xervias | Sorpresa | mismas referencias |
| G2-PER-ZHINCHI-01 | Zhinchi | Neutro | zhinchi_01_entrada.webp, zhinchi_03_cetro.webp |
| G2-PER-ZHINCHI-02 | Zhinchi | Advertencia | mismas referencias |
| G2-PER-ZHINCHI-03 | Zhinchi | Combate | mismas referencias |
| G2-PER-ZHINCHI-04 | Zhinchi | Legado | mismas referencias |

Fuente editable: `art-reference/personajes-g2/lote-01.json`.
Las cuatro variantes de cada personaje mantienen su **mismo vestuario, rostro y paleta**. Xervias: castaño oscuro, ojos marrones, uniforme azul oscuro y capa roja. Zhinchi: **rubio, ojos azules, capa azul y gema azul**. Ambos con cel shading, 1024 × 1536 PNG y transparencia verdadera, sin texto, marcos ni decorado.

## Distinción fundamental entre referencias y producto final

`art-reference/personajes-oficiales/catalogo.json` registra las identidades de los 12 personajes principales, pero los **13 PNG maestros originalmente aprobados no constan incorporados en GitHub**. Por eso los recursos se generan como **propuestas** basadas en los sprites aprobados **que sí existen** dentro de `public/campania/prologo/sprites/`, no como identidades sustituidas ni sprites automáticamente oficiales.

Las láminas/infografías generadas fuera de este flujo (por ejemplo las que representaron erróneamente a Zhinchi como mujer de cabello oscuro) **no son candidatos G2 ni arte oficial**. No incorporarlas ni utilizarlas como referencia.

## Cómo ejecutar el pipeline sin gastar

En GitHub → Actions → **Decreto Real · G2 Personajes (lote 01, ocho retratos)** → Run workflow:
- `modo=plan`: inventario sin llamadas a API; `personajes=ambos` produce un plan de 8 archivos.
- `modo=generar`: **gasta créditos de la API personal del proyecto**; solo se habilita si se escribe `GENERAR_8_PERSONAJES_G2` en `confirmar`.
- Empezar por `personajes=xervias` o `zhinchi`, 4 imágenes a la vez, calidad `medium` o `low` para un primer ensayo.
- El flujo guarda `resultado.json` y los PNG de **propuesta** como artefacto descargable 30 días. **Nunca realiza commit de las imágenes en main ni actualiza el catálogo público**, incluso después de pagar.
- Cada PNG se inspecciona en Node para exigir RGBA de 1024 × 1536 y transparencia real de al menos el 10 % de píxeles; una imagen plana/falsa cuadrícula no pasa la validación.
- Para un solo grupo, el script produce 4 variantes; para ambos, 8. Toda ejecución requiere el secreto `OPENAI_API_KEY` ya registrado en el repositorio.

**La autorización de gasto tiene que ser voluntaria y explícita.** El simple `push` a la rama de planificación ejecuta únicamente el modo gratuito. Las imágenes solo se publicarán en el juego después de revisar al menos proporciones, expresiones, similitud facial, transparencias y encuadre móvil.

## Próximos lotes previstos

Lote 02: Sigumán (normal y guantelete), Vándalo Rojo y Nayisa; priorizar M35–M38.  
Lote 03: ocho generales y sus expresiones.  
Lote 04: secundarios y sub-jefes todavía sin maestro consistente.

Al cerrar un conjunto visible de **varios personajes efectivamente generados, aprobados e integrados**, preparar un documento de relevo y comunicar al creador que puede abrir un chat nuevo. No hacerlo mientras solo existan encargos o borradores.

**Reglas generales:** siglo XVII, Reinos del Perú, anime cel shading, sin emblemas nuevos ni cruces de Borgoña; solo estandartes lisos blancos o rojos cuando aparezcan (los retratos transparentes no requieren banderas). El fondo G2 y los G1 históricos se conservan.
