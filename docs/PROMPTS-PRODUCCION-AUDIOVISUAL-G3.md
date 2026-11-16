# DECRETO REAL — KIT DE PRODUCCIÓN AUDIOVISUAL G3

> **Documento de producción — prompts listos para copiar.** Este kit recoge el material preparado el 15/11/2026. No sustituye archivos de producción ni cambia automáticamente el juego. Para las rutas y el proceso de integración consulta [la guía técnica G3](./PRODUCCION-AUDIOVISUAL-G3.md). Los recursos actuales de cintas, barras de vida y retratos aprobados se conservan.

**Fecha:** 15 de noviembre de 2026  
**Alcance:** Versus la IA: menú, introducción, combate, victoria y derrota.  
**Objetivo:** Producir arte y audio definitivos sin sustituir todavía los recursos provisionales publicados. Los archivos finales se aprobarán e integrarán posteriormente con pruebas.

---

## 0. Dirección artística común

**Mundo:** «Los Reinos del Perú», universo fantástico del siglo XVII. Integrar artesanía andina, arquitectura virreinal, detalles barrocos y poder místico de sellos, decretos y cartas. Acabado de videojuego anime-fantasy de cartas, cel-shading limpio, ilustración pulida, ornamentos finos, lectura clara en teléfonos.

**Paleta de referencia (orientativa):** rojo real `#891F30` para Xervias/jugador, azul profundo `#243E68` para el rival, oro envejecido `#D9AC62`, marfil `#F3E4C4`, azul noche `#171B2B`.

**Reglas generales:** respetar retratos oficiales existentes; mantener consistencia G2/G3; no introducir cruces o aspas de Borgoña. Si aparecen banderas, que sean solamente blancas y rojas, sin emblemas. No copiar logos, personajes o composiciones de otros juegos. Generar arte original; no inventar texto en imágenes; mantener amplias zonas libres para textos HTML reales.

**Guía técnica:** PNG con transparencia para ornamentos, puertas, paneles y botones. JPEG/WebP únicamente para fondos opacos. No hace falta convertir a WebM una imagen estática que puede animarse con CSS. Para efectos de partículas, preferir vídeo transparente original; si no es posible, MP4 de croma verde puro `#00FF00` para convertir posteriormente a WebM alfa. Evitar efectos de color verde cerca del fondo de croma.

**Para ChatGPT Images:** adjuntar, siempre que se disponga de ellos, una captura de la interfaz actual y los PNG aprobados de G3 como referencias visuales. Indicar que deben respetarse proporciones, iluminación y acabados sin alterar el diseño oficial de Xervias.

---

## A. MÚSICA — SUNO CUSTOM, INSTRUMENTAL

**Configuración común:** activar `Instrumental`; sin voz ni coros con palabras, sin letra, sin narración. Pedir entradas suaves donde se indiquen y salidas aptas para bucle. Los tiempos sugeridos requieren edición posterior si Suno genera piezas más largas. Guardar, preferiblemente, WAV maestro si está disponible; MP3 también es válido.

### MUS-01 — Menú principal
**Nombre de archivo:** `mus_menu_reinos_del_peru_v01.mp3`  
**Uso:** portada y menú, bucle. **Duración final sugerida:** 90–150 s.

```text
Instrumental original fantasy card-game main menu theme, set in an alternate 17th-century Kingdoms of Peru. Regal, mysterious, inviting and adventurous, not aggressive. Warm Andean quena and pan flute motifs blended with baroque strings, harpsichord, charango-like plucked textures, gentle ceremonial low drums and subtle magical bells. Memorable noble melody in a minor mode with hopeful harmonic movement, 88–100 BPM. Rich but spacious orchestration, soft opening, elegant repeating sections and a seamless looping ending. High-quality game soundtrack, no vocals, no choir words, no modern EDM, no cinematic trailer booms.
```

### MUS-02 — Presentación del duelo
**Nombre de archivo:** `mus_presentacion_duelo_v01.mp3`  
**Uso:** puertas y presentación Xervias vs. IA. **Duración final:** 4–8 s; generar y recortar un pasaje adecuado.

```text
Instrumental short ceremonial duel-introduction sting for an original historical fantasy card game. Two ancient royal gates are opening to reveal a mystical combat arena in the 17th-century Kingdoms of Peru. A rising low drum roll, brief baroque brass and string flourish, bright gold bell accent and restrained Andean flute response. Majestic and anticipatory, clear beginning and decisive finish, about 6 seconds as a final edited cue. No vocals, no spoken words, no long melody, no modern synth lead.
```

### MUS-03 — Combate versus la IA
**Nombre de archivo:** `mus_combate_ia_v01.mp3`  
**Uso:** partida normal, bucle. **Duración final:** 120–180 s.

```text
Instrumental looping tactical battle soundtrack for an original anime fantasy card game set in the 17th-century Kingdoms of Peru. Focused strategy, heroic tension and controlled momentum, 112–124 BPM, clear rhythmic pulse without overwhelming the interface. Driving baroque strings, Andean flutes playing short melodic replies, subtle charango-style plucks, deep ceremonial percussion, restrained brass, mystical chimes and low sustained textures. Memorable recurring motif, dynamic but not chaotic, consistent medium intensity for repeated card turns. Clean game mix that leaves room for attack sound effects. Seamless loop ending. No vocals, no lyrics, no EDM drops, no excessive cymbal crashes.
```

### MUS-04 — Vida crítica (opcional, posterior)
**Nombre de archivo:** `mus_combate_tension_critica_v01.mp3`  
**Uso:** transición a fase crítica, si las pruebas muestran que mejora la experiencia. **Duración final:** 40–70 s, bucle.

```text
Instrumental low-health tension variation of a royal fantasy card battle theme from the alternate 17th-century Kingdoms of Peru. Tight muted drums like a heartbeat, tremolo strings, sparse Andean flute fragments, dark brass pulses, restrained mystical resonance. Urgent but still strategic, about 120 BPM, designed to transition naturally into the main battle music and loop without a dramatic ending. Sparse mix for readable game sound effects. No vocals, no screaming, no sudden volume spikes.
```

### MUS-05 — Victoria
**Nombre de archivo:** `mus_victoria_v01.mp3`  
**Uso:** pantalla de victoria. **Duración final:** 8–15 s.

```text
Instrumental royal victory fanfare for a fantasy card duel set in the 17th-century Kingdoms of Peru. A triumphant but dignified melodic resolution, warm baroque trumpets, noble strings, Andean pan flute answering the melody, ceremonial timpani and a luminous golden bell at the end. A short, memorable celebration suitable for an official video game result screen, approximately 12 seconds after editing. Strong clear opening, resolved ending, no vocals, no spoken words, no extended cinematic trailer build-up.
```

### MUS-06 — Derrota
**Nombre de archivo:** `mus_derrota_v01.mp3`  
**Uso:** pantalla de derrota. **Duración final:** 8–15 s.

```text
Instrumental dignified defeat theme for an original fantasy card duel in the 17th-century Kingdoms of Peru. A short descending string phrase, restrained low brass, distant Andean flute, quiet resonant drum and a final unresolved mystical bell. Melancholic and reflective, not tragic or terrifying; suggest that the player may return and try again. About 12 seconds as a final edited cue, clean ending and restrained dynamics. No vocals, no lyrics, no overly dramatic sound effects.
```

---

## B. EFECTOS SONOROS — SUNO SOUNDS

**Configuración:** Suno `Create → Sounds`; seleccionar **One Shot** salvo que se indique `Loop`. Un sonido por solicitud. En todos los casos: **no speech, no music bed, clean isolated sound, short dry tail** salvo que el prompt pida reverberación. Cortar silencios iniciales y finales en la edición. Los segundos son duración final orientativa, no una garantía de generación.

| ID / archivo recomendado | Duración final | Modo | Prompt listo para Suno Sounds |
|---|---:|---|---|
| SFX-01 `sfx_boton_pulsar` | 0,15–0,3 s | One Shot | `A crisp refined royal interface button click, small wooden tap with soft golden metallic chime, responsive and elegant, clean isolated one-shot, no music, no voice.` |
| SFX-02 `sfx_puertas_abrir` | 1–2 s | One Shot | `Two massive old carved wooden palace doors opening slowly together, subtle hinges, deep wood resonance, gentle ceremonial stone hall echo, no footsteps, no music.` |
| SFX-03 `sfx_moneda_giro` | 0,5–0,9 s | One Shot | `A single heavy antique golden coin spinning rapidly in the air, delicate metallic shimmer and rotational whoosh, clean isolated game sound.` |
| SFX-04 `sfx_moneda_resultado` | 0,2–0,5 s | One Shot | `A thick antique gold coin lands flat on a polished wooden table, sharp metallic ring with short resonance, no rolling, isolated one-shot.` |
| SFX-05 `sfx_robar_carta` | 0,2–0,4 s | One Shot | `Quick elegant card drawn from a deck, crisp parchment and lacquered paper swish, subtle magical sparkle, isolated no music.` |
| SFX-06 `sfx_colocar_carta` | 0,2–0,5 s | One Shot | `A single heavy ornate playing card placed decisively on a wooden combat table, short paper slap and low magical seal click, no music.` |
| SFX-07 `sfx_ataque` | 0,5–0,9 s | One Shot | `Powerful clean sword-like magical slash flying from left to right, sharp air whoosh and strong impact transient, deep restrained resonance, no music.` |
| SFX-08 `sfx_defensa` | 0,6–1,0 s | One Shot | `A noble magical shield materializes and blocks an attack, bright protective metallic chime, deep solid resonance and short crystalline fade, no music.` |
| SFX-09 `sfx_orden` | 0,6–1,0 s | One Shot | `An ancient royal decree parchment unfurls, paper rustle and precise golden wax seal stamp, subtle mystical chime, isolated sound.` |
| SFX-10 `sfx_impacto` | 0,8–1,2 s | One Shot | `Mystical multicolored crystal seal charging and locking into place, resonant layered glass harmonics, low ritual pulse and crisp finishing chime, powerful but controlled, no music.` |
| SFX-11 `sfx_combo_doble` | 0,6–1,0 s | One Shot | `Tactical fantasy card game combo level two achieved, two quick ascending magical metallic notes and a tight gold energy burst, clean and short, no speech.` |
| SFX-12 `sfx_combo_triple` | 0,8–1,4 s | One Shot | `Tactical fantasy card game combo level three achieved, three rising crystalline notes followed by a bold ceremonial bass hit and shimmering magical burst, no music bed.` |
| SFX-13 `sfx_recibir_dano` | 0,3–0,6 s | One Shot | `Controlled battle hit against armored fighter, sharp blunt impact with slight fabric rattle and low thud, suitable for a stylized card game, not graphic.` |
| SFX-14 `sfx_curacion` | 0,6–1,1 s | One Shot | `Gentle restorative magical energy, rising warm crystalline notes with subtle soft wind and pure harmonic shimmer, reassuring and clean, isolated sound.` |
| SFX-15 `sfx_cambio_turno` | 0,4–0,7 s | One Shot | `A large royal silk ribbon swiftly crosses the screen, elegant cloth swoosh with a restrained low ceremonial accent, isolated one-shot, no music.` |
| SFX-16 `sfx_confirmar_reinicio` | 0,25–0,5 s | One Shot | `Firm elegant confirmation button sound, short wooden click followed by a muted warm bronze bell, clean and decisive, no music.` |

**Sugerencia de mezcla:** efectos importantes reconocibles pero no excesivamente fuertes; música de combate a nivel moderado para que los sonidos de cartas se distingan. Ajustar por escucha real en móvil, no por números fijos antes de conocer los archivos.

---

## C. IMÁGENES — PROMPTS PARA CHATGPT

**Instrucción común para añadir a cada solicitud de imagen** (copiar con cada prompt):

```text
Arte oficial original para el videojuego Decreto Real. Universo anime-fantasy virreinal de los Reinos del Perú en el siglo XVII. Cel shading refinado, detalles andinos y barrocos elegantes, paleta coherente G3: rojo granate, azul real, oro envejecido, marfil y azul noche. Alta nitidez en pantallas móviles. Sin textos, letras, números, marcas de agua ni logotipos inventados. Sin cruces ni aspas de Borgoña; si hay banderas, únicamente blancas y rojas sin emblemas. Respetar el estilo de los gráficos oficiales que adjunto. Mantener las zonas destinadas a textos y controles claramente despejadas.
```

### IMG-01 — Puertas reales de la presentación
**Archivo:** `ui_puertas_reales_maestro_v01.png`  
**Destino sugerido:** imagen frontal de alta resolución que luego se divide en dos PNG transparentes de hoja izquierda y derecha.

```text
Genera un conjunto único de DOS grandes puertas reales simétricas, cerradas, vistas completamente de frente y sin perspectiva, sobre fondo TRANSPARENTE. Cada hoja ocupa exactamente una mitad y se une en una costura vertical perfectamente recta en el centro. Madera oscura rojiza, perfiles dorados, grabados finos de geometría andina y tallas barrocas virreinales del siglo XVII. Ornamentos elegantes, no excesivos; silueta clara, bordes limpios, sin jambas exteriores, sin personajes, sin suelo ni escenario. Diseño adecuado para cortar en dos mitades y animar su apertura hacia los laterales con CSS. Estilo anime-fantasy G3 original de Decreto Real. Sin letras ni símbolos heráldicos. No alterar el eje central de las puertas.
```

### IMG-02 — Marco rojo de presentación de Xervias
**Archivo:** `ui_presentacion_jugador_rojo_v01.png`  
**Destino:** PNG transparente, marco vertical aproximadamente 2:3.

```text
Crea un marco ornamental vacío para presentar el retrato oficial de Xervias durante un enfrentamiento de cartas. Interfaz de videojuego anime-fantasy virreinal del siglo XVII, ornamentación roja granate y oro envejecido, geometría andina sutil, contorno bien definido. Centro completamente vacío y transparente, sin personaje, sin fotografía, sin texto. Dejar espacio bajo el retrato para nombre HTML. Vista frontal, composición equilibrada, acabado cel shading limpio; iluminación dramática moderada, sin partículas que estorben el rostro. Producir PNG de fondo transparente con bordes pulidos.
```

### IMG-03 — Marco azul del rival (EDICIÓN DE IMG-02)
**Archivo:** `ui_presentacion_rival_azul_v01.png`  
**Destino:** la misma geometría que la imagen anterior.

```text
Edita el marco rojo que adjunto para crear su versión del rival. CONSERVA EXACTAMENTE la forma, proporciones, grabados, transparencia, grosor del marco, zona vacía central y distribución de luces. Cambia únicamente los materiales rojos a azul real profundo con reflejos plateados muy discretos; conserva los dorados. No inviertas el diseño ni introduzcas un personaje o texto. Debe encajar como pareja visual exacta del marco de Xervias.
```

### IMG-04 — Botón horizontal maestro del menú
**Archivo:** `ui_boton_menu_base_v01.png`  
**Destino:** aspecto ultraancho, aprox. 1360×180 px a 2× si se exporta a ese tamaño.

```text
Diseña un único BOTÓN HORIZONTAL GRANDE para el menú principal de un videojuego de cartas de fantasía virreinal. Forma alargada, esquinas ligeramente ornamentadas, centro amplio y oscuro para agregar después un título HTML de alta legibilidad. Fondo granate muy oscuro con textura esmaltada, borde en oro envejecido y grabados andinos discretos, cel shading limpio, relieve premium. Vista totalmente frontal y simétrica, fondo TRANSPARENTE alrededor, sin sombra grande fuera del botón, sin iconos, sin texto. Debe funcionar indistintamente para «Jugar con la IA» o «Multijugador» mediante texto superpuesto por la aplicación.
```

### IMG-05 — Botón en estado pulsado (EDICIÓN DE IMG-04)
**Archivo:** `ui_boton_menu_pulsado_v01.png`

```text
A partir del PNG del botón que adjunto, genera una versión PULSADA con EXACTAMENTE la misma silueta, transparencia, ornamentación, tamaño y posición. Oscurece suavemente el esmalte, reduce un poco el brillo del borde de oro y añade un relieve interior sutil que sugiera presión. Sin desplazar el botón, sin añadir texto ni iconos. Este PNG se intercambiará mediante CSS al pulsarlo.
```

### IMG-06 — Botón pequeño de confirmación
**Archivo:** `ui_boton_accion_base_v01.png`  
**Destino:** botones «Continuar», «Aceptar», «Cancelar», «Reiniciar», etc.

```text
Crea un BOTÓN HORIZONTAL COMPACTO y original, de la misma familia estética del botón maestro que adjunto. Acabado rojo oscuro y dorado envejecido con elegantes esquinas barroco-andinas, centro plano para añadir texto HTML. Debe conservar excelente legibilidad a tamaño pequeño en un teléfono. Vista frontal, fondo TRANSPARENTE, sin texto, sin iconos, sin detalles finísimos que desaparezcan al reducirlo. PNG de bordes limpios.
```

### IMG-07 — Cartela de victoria
**Archivo:** `ui_victoria_cartela_v01.png`  
**Destino:** elemento central transparente, sin texto.

```text
Diseña una cartela ceremonial VICTORIOSA para la pantalla final de un duelo de cartas del universo Decreto Real. Marco principal centrado, dorado cálido con laurel estilizado, rayos sutiles y geometría andina, detalles granates y marfil, fantasía virreinal del siglo XVII. Área central amplia y vacía para el título HTML «VICTORIA», explicación del resultado y botones externos. Fondo exterior completamente TRANSPARENTE; sin personajes, sin palabras, sin números, sin escudos reales ni cruces de Borgoña. Estética heroica y elegante, no sobrecargada, bordes bien definidos.
```

### IMG-08 — Cartela de derrota
**Archivo:** `ui_derrota_cartela_v01.png`

```text
Diseña la contraparte de la cartela de victoria que adjunto, manteniendo EXACTAMENTE la misma estructura, proporciones y área central vacía. Cambia la atmósfera a azul noche, acero apagado y oro menos luminoso. Evoca una derrota digna y la posibilidad de volver a luchar, sin sangre, cadáveres ni tragedia excesiva. Fondo exterior TRANSPARENTE, sin texto ni personajes, ornamentos virreinales y andinos coherentes con el arte G3.
```

### IMG-09 — Sello decorativo para pantalla de resultados (opcional)
**Archivo:** `ui_sello_resultado_v01.png`

```text
Emblema circular original de Decreto Real para acompañar los resultados de partida: sello místico dorado envejecido, geometrías andinas discretas, filigrana barroca virreinal, centro vacío para insertar después un icono de victoria o derrota por separado. PNG transparente, silueta simple y legible a 96 píxeles, sin letras, cruces, banderas ni personajes.
```

**Nota sobre elementos aprobados:** no es necesario regenerar barras de vida, indicadores «Tu Turno» y «Turno del Rival» ni los retratos oficiales. Se conservan salvo cambio explícito.

---

## D. ANIMACIONES — PROMPTS PARA GENERADOR DE VÍDEO

**No convertir directamente PNG a vídeo si el movimiento se puede lograr con CSS.** Esta sección corresponde a efectos reales de partículas, energía, impactos, cristales o sellos. Si generas primero un fotograma con ChatGPT, adjúntalo como referencia al generador de vídeo y utiliza el prompt respectivo.

**Instrucción técnica global que debe añadirse a CADA prompt:**

```text
Create a short, original 2D anime fantasy VFX overlay for a card combat videogame. Fixed camera, no camera movement, no cut, centered effect, no character, no environment, no captions, no text, no logo. Single visual action with a readable beginning, clear peak and clean ending. Target length 1.5 seconds, 30 FPS, 1920x1080, landscape 16:9, subject fully within safe center and ample empty edges. Prefer true RGBA transparency if supported. Otherwise use an EXACT uniform solid chroma key green (#00FF00) background with no gradient, shadows or texture, and keep the magical effect itself away from green hues to allow clean chroma key removal. No green screen spills, no background objects, no frame-to-frame flicker. Use polished original cel-shaded fantasy VFX, consistent with Decreto Real G3.
```

### VFX-01 — Ataque
**Archivo provisional:** `vfx_ataque_v01.mp4`

```text
A powerful red and gold enchanted sword-energy slash slices diagonally across the center of the frame in a single decisive movement. Sharp luminous edge, fine sparks, brief impact flare, elegant hand-drawn anime cel shading, royal fantasy card-game visual language. The slash appears, reaches one clear impact peak and disappears completely within the clip. No sword wielder, no gore, no repeated slashes.
```

### VFX-02 — Defensa
**Archivo provisional:** `vfx_defensa_v01.mp4`

```text
A luminous deep blue and antique-gold mystical shield materializes at screen center, formed from interlocking royal decree sigils and delicate Andean geometry. One incoming invisible force is blocked, creating a single circular energy ripple and tiny metallic sparks. Then the shield dissolves gracefully. Elegant defensive, not violent, clean 2D cel-shaded game overlay. Avoid green light and green particles.
```

### VFX-03 — Orden
**Archivo provisional:** `vfx_orden_v01.mp4`

```text
An ornate parchment-like royal decree emerges from golden violet magical light and unrolls in the center of the frame, sealed by a glowing wax mark. A single gold glyph pulses and a brief arc of light suggests drawing another card. The parchment and glimmer retract and vanish cleanly. Original 17th-century Peruvian-inspired fantasy card game VFX; no legible writing, no extra floating UI, no characters.
```

### VFX-04 — Impacto I
**Archivo provisional:** `vfx_impacto_1_v01.mp4`

```text
A single small multicolored mystical crystal shard floats at screen center and locks into an invisible royal seal. Precise concentric gold pulse, restrained luminous shimmer, brief crystal resonance visualized as a thin ring, clean disappear. First progression stage, modest power, jewel tones excluding chroma green, no character or text.
```

### VFX-05 — Impacto II
**Archivo provisional:** `vfx_impacto_2_v01.mp4`

```text
Two crystalline fragments of ruby, sapphire and gold orbit once, join into a stronger mystical seal and emit two clearly separated light rings. A little more energy than Impacto I, but controlled, short polished cel-shaded fantasy videogame VFX, fully contained in frame. No green particles, text or scenery.
```

### VFX-06 — Impacto III
**Archivo provisional:** `vfx_impacto_3_v01.mp4`

```text
Three luminous gemstone shards converge in a triangular royal sigil of ruby, sapphire, violet and antique gold. A magical seal completes, the screen-center energy flares once with intricate Andean-inspired geometry and then fades. Stronger than Impacto II, without excessive bloom or repeated explosions. Clean centered transparent visual overlay.
```

### VFX-07 — Impacto Final
**Archivo provisional:** `vfx_impacto_final_v01.mp4`

```text
The completed royal mystical seal materializes from four radiant multicolored gems and a brilliant golden ring. A decisive, elegant burst of magical energy announces the final winning seal in a fantasy card duel. Solemn, magnificent and unmistakably more powerful than earlier Impacto effects, but readable on a phone, a single climax, no whiteout occupying the entire clip, no text or characters.
```

### VFX-08 — Combo ×2
**Archivo provisional:** `vfx_combo_x2_v01.mp4`

```text
Two short red-and-gold energy ribbons converge and interlock as a bright double rune at frame center, then pulse outward once with elegant golden sparks. Quick, energetic, tactical combo achievement, clean polished 2D fantasy game overlay. No numbers or words; the game will render the text '×2' itself.
```

### VFX-09 — Combo ×3
**Archivo provisional:** `vfx_combo_x3_v01.mp4`

```text
Three intense royal-red and antique-gold energy ribbons sweep toward the center and weave into a powerful triple mystical emblem. A single bold impact pulse and short starburst, stronger and more ceremonial than the double combo. Clear start, one brilliant peak and clean end, no numbers or words; the game renders '×3' separately.
```

**Recomendación de efectos:** en la versión definitiva se pueden crear variantes de combo **Daño** (rojo-dorado) y **Curación** (azul-marfil) manteniendo la misma duración y geometría. Para las cartas místicas de los generales se elaborará un paquete posterior, cuando sus efectos y nombres estén cerrados.

---

## E. ORGANIZACIÓN DE LOS ARCHIVOS PARA ENTREGA

```text
DecretoReal_G3_Produccion/
  01_musica/
    mus_menu_reinos_del_peru_v01.mp3
    mus_presentacion_duelo_v01.mp3
    mus_combate_ia_v01.mp3
    mus_combate_tension_critica_v01.mp3
    mus_victoria_v01.mp3
    mus_derrota_v01.mp3
  02_efectos_sonido/
    sfx_boton_pulsar_v01.wav
    sfx_puertas_abrir_v01.wav
    ...
  03_imagenes_ui/
    ui_puertas_reales_maestro_v01.png
    ui_presentacion_jugador_rojo_v01.png
    ui_presentacion_rival_azul_v01.png
    ui_boton_menu_base_v01.png
    ...
  04_animaciones_mp4/
    vfx_ataque_v01.mp4
    vfx_defensa_v01.mp4
    ...
  05_referencias_aprobadas/
    [capturas del juego actual y gráficos G2/G3 aprobados]
```

Conservar originales sin sobrescribir. Al editar, incrementar el sufijo `v02`, `v03` y documentar qué cambió. En la integración técnica se optimizarán pesos, formatos y precarga; el material original permanece como respaldo.

## F. ORDEN DE PRODUCCIÓN SUGERIDO

**Lote 1 — indispensable para Versus IA:** música de menú, combate, victoria y derrota; sonidos de botón, moneda, colocar carta, ataque y defensa; PNG maestro de botones y dos cartelas de resultados. Esto permite definir una identidad audiovisual sin esperar todos los efectos visuales.

**Lote 2 — presentación:** puertas maestras, marco rojo, versión azul exacta, música corta de presentación y sonido de puertas.

**Lote 3 — combate audiovisual definitivo:** animaciones de Ataque, Defensa, Orden y las cuatro etapas de Impacto; sonido de Orden, Impacto, daño, curación y cambio de turno.

**Lote 4 — combos y expansión:** combos ×2/×3, variantes Daño/Curación, música crítica opcional y posteriormente cartas místicas de campaña.

**Criterio de aceptación:** imágenes nítidas en móvil, texto no incrustado, PNG realmente transparente, croma limpio o alfa real, efecto íntegro dentro del recuadro, audio sin silencio inicial, volumen uniforme, arte coherente, ninguna pantalla negra ni animación que bloquee el motor, pruebas de partida real.

---

### Cómo proceder tras generar el material

Enviar los archivos originales con su nombre de catálogo y, si es posible, una captura o nota de qué opción se aprobó. Se revisará calidad, transparencia, códec y duración antes de preparar sus variantes optimizadas. **No sustituir archivos en producción ni fusionar cambios hasta revisar y probar el paquete.** La optimización estructural del juego (carga por rutas, dependencias, sincronización de la IA, pausas y vídeo) puede avanzar en paralelo usando los recursos provisionales.
