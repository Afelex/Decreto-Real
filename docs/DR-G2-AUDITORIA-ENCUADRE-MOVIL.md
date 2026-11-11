# DR-G2 · Auditoría de encuadre móvil (390 × 844)

## Alcance y resultados
- 25 fondos aprobados G2, en formato WebP **1024 × 1536 (2:3)**.
- 20 correspondientes a prólogo, ocho regiones y final; cinco de las
  transiciones M35 (A/B/C) y M36 (A/B).
- Todos se conservan íntegros en el repositorio. Los fondos G1 no se cambian.
- En pantalla completa de 390 × 844 usando `object-fit:cover` se conserva
  aproximadamente el **69 % del ancho** original. Los bordes se recortan;
  el centro, donde están las puertas, caminos y plazas, permanece visible.
- En una franja horizontal orientativa de 390 × 120, la relación 2:3
  implica mostrar apenas el **20,5 % de la altura** original; por ello
  la posición del foco es importante.
- El foco anterior `50% 52%` mostraba principalmente suelo, especialmente
  en los fondos del camino, el puerto y las plazas. Se fija un foco de
  **`50% 32%`** en las ilustraciones G2 de `RegionScene`. Ese cambio
  no afecta a las ilustraciones G1 ni al motor de combate.

## Comparador visual disponible en la galería
1. Abrir `?drDev=1#/artes` y filtrar por **G2**.
2. Elegir cualquiera de los 25 fondos y pulsar **Original**,
   **Móvil 390 × 844** o **Franja de misión**.
3. «Móvil» representa el recorte `cover` de una pantalla vertical, con
   referencias **orientativas** para cabecera y diálogo. No es una captura
   idéntica de la interfaz de combate, que puede utilizar más superposiciones.
4. «Franja» representa el encuadre del paisaje usado en el briefing
   (relación 390:120), centrado al 32 % de altura.
5. Marcar **Aprobada** o **Corregir**, anotar observaciones y exportar
   las decisiones de revisión, como ya permite la galería.

## Automatización
`tests/e2e/g2-mobile-framing.spec.ts` verifica:
- Las **25** imágenes con dimensiones nativas **1024 × 1536**.
- Para cada imagen, el modo móvil, `object-fit:cover`, su proporción
  física y la presencia de guías.
- Captura de los 25 fondos en la vista móvil (archivos de revisión),
  disponibles en el artefacto `g2-25-encuadres-movil-390x844` del
  flujo **G2 - QA gráfica en navegador**.
- Diez casos representativos en el modo de franja con foco al 32 %.
- En la misión 01, la franja real de `RegionScene` con el foco ajustado.

La revisión visual artística es distinta de estas comprobaciones automáticas.
Las capturas permiten localizar fondos específicos que puedan requerir
ajustes individuales en DRStudio, sin regenerar por defecto el lote aprobado.

## Pendientes de dirección artística
- Una pasada humana en el teléfono sobre el prólogo y la transición
  M35/M36 para confirmar que los personajes y cuadros de diálogo
  no tapan elementos narrativos esenciales.
- Después, preparar la serie de **retratos transparentes G2** para
  Zhinchi, Xervias, personajes y generales, conservando la continuidad
  cromática de los escenarios ya publicados.
