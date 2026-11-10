# Decreto Real G2 — Dirección artística en definición: casona de la misión 35
**Fecha:** 10/11/2026 · **Estado:** PROPUESTA PARA REVISIÓN (no aprobada) · **No generar imágenes aún**.

## Pendientes antes de iniciar retratos
1. `G2-FON-010` Artillero del Trueno: existe una versión corregida que utiliza estandartes individualmente monocromos rojos o blancos. La imagen original aprobada tiene corrección pendiente; verificar arte binario y aprobar expresamente la variante corregida antes de publicar.
2. `G2-RET-01` Domingo Quispe: no generado satisfactoriamente. Los intentos produjeron escenarios en lugar de retratos. Debe tomarse la dirección oficial 'guardia joven con pliego lacrado', encuadre busto vertical 2:3 y estilo anime cel shading, comprobando referencia de identidad antes de integrarlo. Ninguna sala anterior debe etiquetarse como su retrato.
3. Los 20 fondos G2 constan como aprobados **pendientes de importación**, no publicados en DRStudio. No confundir registro de aprobación con existencia de los binarios dentro del juego.

## Nueva necesidad narrativa: misión 35, Zhinchi contra Vándalo Rojo
**Nombre de trabajo:** 'La Casona del Umbral' (puede cambiarse). Se sitúa ante el acceso a la Casa del Sello, como edificio anciano de archivo/residencia. Construcción virreinal del mundo de Los Reinos del Perú, siglo XVII: zócalos de sillería inca reutilizada, muros de adobe y piedra agrietados, patio interior con galería de arcos barrocos austeros, balcones de madera, vigas y cubiertas de teja envejecidas, documentos y muebles a los lados. No parecer otro palacio ceremonial ni una fortaleza militar.

**Iluminación:** atardecer cobrizo, sombras violáceas, entrada de luz desde un costado; al colapsar hay polvo, contraluz y destellos místicos rojos y dorados. Estética G2 anime cel shading, contornos claros, sin fotorrealismo ni rótulos. Lienzos verticales 2:3 (master 1024×1536 o superior), horizonte/encuadre y puntos de referencia estables entre estados, centro y tercio inferior despejados para HUD.

## Secuencia propuesta, fiel al guion maestro v4 y campaign/finalArc.ts
1. **Antes del colapso:** Zhinchi intercepta al Vándalo Rojo en el patio de la casona; hay huellas de deterioro, pero balcones y columnas siguen en pie. Su duelo es una secuencia cinematográfica/dialogada, no un nuevo combate controlado.
2. **Impacto de los decretos:** la mística Mandato Carmesí del Vándalo y la respuesta de Zhinchi provocan grietas en columnas, crujen vigas, se desprenden tejas y el balcón empieza a ceder. Se aprovechan efectos PNG transparentes y transiciones, no hace falta duplicar todo en cada fotograma.
3. **Legado y protección:** Zhinchi entrega físicamente a Xervias el Sello de Mando y contiene un paso abierto entre escombros. La cámara no muestra a Zhinchi muriendo ni aplastado.
4. **Desaparición ambigua:** polvo y derrumbe tapan la vista de Zhinchi; el Vándalo emerge al otro lado y desafía a Xervias. Nunca mostrar un cadáver ni confirmar muerte.
5. **Duelo jugable M35:** Xervias vs. Vándalo Rojo en la casona **parcialmente destruida**, con una arena limpia y estable para los controles, recibida ya la carta Decreto del Legado. Tras vencerlo, Xervias busca a su mentor entre las ruinas y no lo encuentra; después continúa a las prisiones M36.

## Desglose mínimo para producción (sin duplicaciones)
- `G2-M35-BG-A` Casona intacta, patio y arquitectura estructural (WebP opaco).
- `G2-M35-BG-B` Casona agrietada durante el choque místico, **mismo encuadre** (WebP opaco o transición por capas si QA permite reutilización).
- `G2-M35-BG-C` Casona parcialmente derrumbada, patio libre en primer plano, entorno de combate de Xervias (WebP opaco).
- `G2-M35-FX-01` Chispas y choque de energía roja/dorada (PNG con alfa real).
- `G2-M35-FX-02` Cascajo, vigas y tejas en movimiento (PNG con alfa real).
- `G2-M35-FX-03` Polvo opaco/traslúcido que oculta la posición de Zhinchi (PNG con alfa real).
**Total provisional: 3 estados de fondo + 3 capas de efecto.** Su ID definitivo y efecto sobre las 110 piezas planificadas se resolverá al aprobar el brief. Posibles reutilizaciones: A como entrada, C como combate y epílogo; B solo como fotograma transicional.

## Integración técnica pendiente
- `campaign/regionAssets.ts` asigna actualmente **el mismo fondo base final a M35 y M36**, y el mismo fondo jefe a M37 y M38. Debe añadirse una ruta por misión/escena para M35 sin sobreescribir los fondos G1; M36 debe conservar un entorno propio de prisión.
- En DRStudio: tres estados visuales con claves estables, transiciones, PNG por capas, cámara consistente y HUD siempre legible. La secuencia Zhinchi/Vándalo ocurre en diálogo-cinemática; solo la pelea Xervias/Vándalo corresponde al combate de M35.
- Separar los binarios G2 del archivo histórico G1 y no eliminar archivos anteriores antes de migrar referencias y superar QA.
- Sin banderas de Borgoña ni símbolos; si aparecen estandartes, cada uno es una pieza de tela **completamente blanca** o **completamente roja**. Puede omitirse toda bandera en interiores para mantener limpieza.

## Criterios de aprobación
(1) Identidad arquitectónica distinguible, (2) misma cámara en A/B/C, (3) derrumbe físicamente coherente, (4) desaparición ambigua de Zhinchi, (5) zona libre para cartas y controles, (6) sin insignias, (7) tres momentos claramente comprensibles sin texto superpuesto, (8) no añade una segunda batalla jugable de Zhinchi.

**Importante:** Este documento es solo dirección artística. No crea imágenes, no implementa cinemáticas y no marca nuevos recursos como aprobados.
