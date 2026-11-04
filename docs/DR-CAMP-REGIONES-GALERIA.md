# Galería de escenarios — Decreto Real

Vista comparativa de los **ocho territorios de campaña y el escenario central**. Las imágenes son fondos vectoriales de primera iteración, sin texto, marcadores ni estrellas incrustados: los elementos de juego se colocan en React.

<table>
<tr>
<td align="center"><img src="../public/campania/regiones/region-1.svg" width="190" alt="Callao: puerto, barco y fortificaciones"/><br/><b>1 · Baltasar de Fierro</b><br/>Puerto del Callao</td>
<td align="center"><img src="../public/campania/regiones/region-2.svg" width="190" alt="Camino escarlata: posta y caballo"/><br/><b>2 · Leandro Valcázar</b><br/>Caminos escarlatas</td>
<td align="center"><img src="../public/campania/regiones/region-3.svg" width="190" alt="Galerías de minas serranas"/><br/><b>3 · Octavio Argento</b><br/>La plata enterrada</td>
</tr>
<tr>
<td align="center"><img src="../public/campania/regiones/region-4.svg" width="190" alt="Murallas y cañones"/><br/><b>4 · Jerónimo Arrellano</b><br/>Bastión del Trueno</td>
<td align="center"><img src="../public/campania/regiones/region-5.svg" width="190" alt="Selva y río verde"/><br/><b>5 · Nayisa de Sombras</b><br/>Frontera oriental</td>
<td align="center"><img src="../public/campania/regiones/region-6.svg" width="190" alt="Ciudad de dos banderas"/><br/><b>6 · Isabela Valdierra</b><br/>Ciudad de estandartes</td>
</tr>
<tr>
<td align="center"><img src="../public/campania/regiones/region-7.svg" width="190" alt="Cóndor sobre cumbres nevadas"/><br/><b>7 · Aukan del Cóndor</b><br/>Fortaleza de las cumbres</td>
<td align="center"><img src="../public/campania/regiones/region-8.svg" width="190" alt="Palacio ceremonial del juramento"/><br/><b>8 · Gonzalo de Montes</b><br/>Casa del Juramento</td>
<td align="center"><img src="../public/campania/regiones/region-f.svg" width="190" alt="Casa del Sello, fortaleza final"/><br/><b>Final · Sigumán</b><br/>Casa del Sello</td>
</tr>
</table>

## Dirección de arte aprobada como base

- **Relación de aspecto:** 720 × 1100, vertical, para las pantallas móviles sin desplazamiento.
- **Separación visual:** capa de paisaje distinta para cada región; el camino de cuatro nodos, estrellas y botones no forman parte del archivo de imagen.
- **Paletas independientes:** azul marítimo, terracota, gris plata, bronce, verde profundo, granate, celeste de montaña, ocre ceremonial y púrpura del final.
- **Accesibilidad:** contrastes y textos controlados por componentes HTML; los territorios se distinguen también por su monumento, no solo por color.
- **Reutilización:** el mismo SVG se utiliza como fondo del mapa regional y como escena temática del duelo de campaña, manteniendo separado el duelo libre.
- **Pendiente:** validación visual en teléfono físico y sustitución progresiva por ilustraciones de calidad final conservando nombres y dimensiones de los recursos.

[Ver el PR de implementación](https://github.com/Afelex/Decreto-Real/pull/57)
