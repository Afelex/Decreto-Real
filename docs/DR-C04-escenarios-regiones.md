# DR-C04 · Identidad visual de las regiones y generales

## Alcance

Actualiza la presentación de los diez capítulos de `Decreto Real I: El Sello y la Falsa Luz`, sin alterar las reglas del duelo.

1. Los capítulos emplean diez paletas, símbolos y paisajes vectoriales originales y locales: pregón, Callao, caballería, minas, artillería, selva, ciudad, Andes, juramento y Falsa Luz.
2. El mapa virreinal conserva su ilustración de pergamino, posición de nodos y progresión bloqueada. Añade una atmósfera cromática y un símbolo suave detrás de la ruta, para reconocer visualmente el capítulo.
3. Los encuentros reutilizan un componente `RegionScene` con siluetas propias de cada región. Las escenas de generales destacan por un contorno dorado y su nombre explícito.
4. Las cartas especiales de los generales se **mencionan únicamente en el lore**. No se incorporan a la baraja, ni se alteran probabilidades, IA, reglas o dificultad.
5. Al vencer la última misión de una región y guardar correctamente, la pantalla de resultado anuncia la siguiente región y el botón permite entrar a ella.
6. No se modifica el formato de guardado `decreto-real.campania.v1` ni las 38 misiones originales.

## Pruebas y criterios de salida

- Node 22 y 24: reglas, motor, React, TypeScript y build.
- Chromium: cinco viewports, incluido 360×480 y 844×390; no deben cortarse botones de misión ni el texto vital.
- Casos adicionales: paletas para los diez capítulos, bloqueo al cambiar de región, escena del prólogo, Almirante de Hierro en Callao, Cóndor de los Andes en las cumbres y regreso al mapa.
- La decoración debe quedar detrás de los nodos del mapa y no interceptar pulsaciones.
- Los paisajes no representan fronteras históricas exactas y no deben presentarse como reconstrucciones cartográficas.
- Mantener el juego clásico y el duelo libre accesibles.
- Publicar mediante PR y fusionar solo si los tres trabajos de CI concluyen en éxito. Probar también táctilmente en un teléfono físico.

## Próxima etapa, no incluida

Desarrollar retratos originales de los ocho generales y transiciones de victoria basadas en eventos del motor, usando ilustraciones definitivas separadas de esta geometría SVG provisional.
