/** Visual language for the ten story regions.
 * Only presentation metadata lives here. No cards, AI or combat modifiers. */
export type RegionVisual = Readonly<{
  title: string;
  atmosphere: string;
  landmark: string;
  symbol: string;
  sky: string;
  earth: string;
  horizon: string;
}>;

export const REGION_VISUALS: Readonly<Record<string, RegionVisual>> = {
  p: { title: 'El primer juramento', atmosphere: 'Pergaminos y decretos', landmark: 'El puesto de guardia', symbol: '✥', sky: '#5c6372', earth: '#6b5848', horizon: '#3a4149' },
  '1': { title: 'Las velas del Callao', atmosphere: 'Salitre, velas y cañones', landmark: 'El puerto de hierro', symbol: '⚓', sky: '#4f8796', earth: '#687d7e', horizon: '#254451' },
  '2': { title: 'El camino escarlata', atmosphere: 'Caballos y mensajeros', landmark: 'La posta real', symbol: '♞', sky: '#bc826b', earth: '#906048', horizon: '#4b3935' },
  '3': { title: 'Bajo la plata', atmosphere: 'Túneles y montañas', landmark: 'Las minas de la Sierra', symbol: '◆', sky: '#858997', earth: '#716e78', horizon: '#343c48' },
  '4': { title: 'El estruendo del bastión', atmosphere: 'Murallas y artillería', landmark: 'La fortaleza', symbol: '✷', sky: '#a18766', earth: '#786452', horizon: '#3f3733' },
  '5': { title: 'El sendero secreto', atmosphere: 'Ríos y selva', landmark: 'La frontera oriental', symbol: '❧', sky: '#698c76', earth: '#456b55', horizon: '#1f443c' },
  '6': { title: 'Los dos estandartes', atmosphere: 'Plazas y banderas', landmark: 'La ciudad dividida', symbol: '⚑', sky: '#ae8890', earth: '#806a6c', horizon: '#4b4250' },
  '7': { title: 'El vuelo del cóndor', atmosphere: 'Cumbres y abismos', landmark: 'La fortaleza andina', symbol: '◆', sky: '#7397b8', earth: '#6b7b88', horizon: '#303f59' },
  '8': { title: 'La palabra empeñada', atmosphere: 'Escudos y juramentos', landmark: 'La Casa del Juramento', symbol: '♜', sky: '#958b75', earth: '#84745f', horizon: '#3d3b39' },
  f: { title: 'La Falsa Luz', atmosphere: 'El último secreto', landmark: 'La Casa del Sello', symbol: '☼', sky: '#876a79', earth: '#6e505c', horizon: '#302938' },
};

export function regionVisual(id: string | undefined): RegionVisual {
  return REGION_VISUALS[id ?? ''] ?? REGION_VISUALS.p;
}
