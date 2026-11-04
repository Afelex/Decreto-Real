# DR-CAMP-UX · Nueva navegación narrativa de campaña (04/11/2026)

## Principio de diseño
La campaña es una aventura, no una lista global de retos. Toda pantalla ocupa **100dvh**; los fondos son decorativos, los objetivos, medallas y botones son elementos HTML accesibles e interactivos.

## Flujo del jugador
1. **Introducción breve**. Al entrar por primera vez desde Menú se ven exactamente tres párrafos sobre el Virreinato ficticio, decretos contradictorios, Xervias, Zhinchi y Sigumán. Acciones: Continuar al prólogo / Volver al Menú. Se guarda exclusivamente la confirmación de lectura, sin mutar estrellas.
2. **Prólogo**. Mapa de dos nodos, misiones 01 y 02 («El pregón alterado» y «La orden sin sello»). La segunda misión se abre tras ganar la primera. Los diálogos existentes se muestran antes y después de los combates. Acciones: seleccionar misión / objetivos / volver al menú.
3. **Introducción de los ocho generales**. Tras ganar misión 02, diálogo de Xervias y Zhinchi presentado general a general. Cada general tiene rol, territorio y carta mística. Primer acceso desde Menú también presenta esta conversación si no se había concluido. El botón de repetición permite volver a escucharla.
4. **Mapa central de ocho zonas**. Mantener la imagen base ilustrada y sus ocho capas de selección ya existentes. Los retratos son botones; la ficha inferior muestra nombre, descripción, carta mística, efecto, cuatro fases y porcentaje. **Los ocho generales quedan disponibles simultáneamente** al superar el prólogo.
5. **Mapa de región**. Elegir un general abre un mapa específico de cuatro misiones; se puede regresar al mapa de ocho zonas, no hay paso automático de un general al siguiente. Cada región aplica desbloqueo secuencial de sus cuatro misiones; no requiere completar otro general.
6. **Centro final**. El área central es inicialmente un botón bloqueado. Solo se habilita al ganar las 32 misiones regionales (ocho generales derrotados). Abre las cuatro misiones finales (35-38) con diálogos y desenlace existente.

## Reglas de progreso y compatibilidad
- Conservar 38 misiones y máximo 114 estrellas; una estrella basta para marcar una misión ganada.
- La introducción y la presentación de generales se guardan en claves nuevas para no alterar los guardados existentes.
- Las ocho regiones pueden completarse en cualquier orden. Las estrellas de una región ya superada cuentan aunque otra región anterior en el catálogo esté incompleta.
- Guardados externos o alterados con victorias imposibles se validan por prólogo -> orden interno de cada capítulo -> final. Las cartas místicas y el editor siguen condicionados a los hitos ya existentes.
- La navegación de regreso desde una misión va a su región, salvo prólogo, que va al mapa del prólogo.
- La interfaz principal de campaña elimina accesos redundantes «Historia» y «Generales». Se preserva la ruta /campania/historia como referencia no vinculada para compatibilidad; «Baraja» sigue accesible desde el mapa.
- El escenario final requiere ocho generales derrotados, no haber seleccionado un número determinado de capítulos.

## Alcance de esta primera rama
Implementados: la introducción breve, mapa ilustrado simplificado del prólogo, acceso permanente a «Volver al Menú», presentación de los generales, navegación por cuatro misiones de región, desbloqueo central, conteo de progreso por regiones y pruebas correspondientes.

Pendientes de una fase posterior: mejorar los fondos definitivos de cada región, diseñar las transiciones cinematográficas con imágenes de diálogos y la escena específica de revelación del escenario central, pulir el monólogo de Xervias cuando Zhinchi desaparezca y verificar en Android físico la legibilidad de escenas en distintas relaciones de aspecto.

## Criterios de revisión antes de fusionar
1. CI TypeScript y compilación Vite.
2. Vitest (integración) y pruebas de progreso de campaña.
3. Playwright en tamaños móviles con controles dentro de la pantalla y cero desplazamiento.
4. Verificar visualmente la posición de los ocho retratos y el botón central frente a la imagen real de fondo.
5. Revisión manual de Android: entrada nueva, retorno a Menú, 8 zonas libres, estrellas y mapa central.
