import type { CampaignStorage } from './campaign.ts';

/** One-time, optional transitions. These keys never modify campaign stars or unlocks. */
export const REGION_ENTRANCES_KEY = 'decreto-real.campania.regiones-visitadas.v1';
export const REGION_LIBERATIONS_KEY = 'decreto-real.campania.regiones-liberadas-presentadas.v1';

export const GENERAL_REGIONS = ['1','2','3','4','5','6','7','8'] as const;
export type GeneralRegionId = typeof GENERAL_REGIONS[number];

export function isGeneralRegion(id: string | undefined): id is GeneralRegionId {
  return !!id && GENERAL_REGIONS.some(valid => valid === id);
}

export type RegionMoment = Readonly<{ xervias: string; zhinchi: string; liberated: string }>;

export const REGION_MOMENTS: Readonly<Record<GeneralRegionId, RegionMoment>> = {
  '1': {
    xervias: 'En el puerto están escondiendo armas entre los cargamentos. ¿Por dónde comenzamos?',
    zhinchi: 'Revisa los muelles, sigue las cuentas y entra al arsenal. Baltasar tendrá que responder por lo que encuentres.',
    liberated: 'El puerto ha vuelto a recibir a sus viajeros. Sus registros ya no servirán para encubrir el engaño.',
  },
  '2': {
    xervias: 'Los mensajeros llevan decretos falsos por todos los caminos. Hay que detenerlos.',
    zhinchi: 'Sigue sus rutas, escucha a los viajeros y encuentra la orden original antes de enfrentar a Leandro.',
    liberated: 'Los caminos vuelven a estar abiertos. Las cartas falsas ya no decidirán la suerte de sus pueblos.',
  },
  '3': {
    xervias: 'La plata de las minas está financiando una guerra. ¿Cómo demostramos quién la controla?',
    zhinchi: 'Habla con los mineros, compara los pagos y busca las cuentas secretas. Después enfrenta a Octavio.',
    liberated: 'Las cuentas ocultas han salido a la luz. Los mineros podrán reclamar lo que les corresponde.',
  },
  '4': {
    xervias: 'Jerónimo utiliza sus cañones para mantener callados a los pobladores.',
    zhinchi: 'Atraviesa el bastión, protege a los testigos y llega hasta su sala de mando. No permitas más amenazas.',
    liberated: 'Las murallas han dejado de imponer silencio. Los testigos podrán contar lo que ocurrió.',
  },
  '5': {
    xervias: 'Nayisa conoce la selva mejor que nadie. Tal vez no sepa quién la está engañando.',
    zhinchi: 'Gana la confianza de las comunidades, sigue las pistas y escucha su versión antes de combatir.',
    liberated: 'La frontera recupera sus secretos y su voz. Nayisa ya no tendrá que servir a las mentiras de Sigumán.',
  },
  '6': {
    xervias: 'Dos estandartes dividen una misma ciudad. Sus habitantes eran vecinos antes de esta disputa.',
    zhinchi: 'Reúne los documentos del cabildo y demuestra quién cambió las órdenes. Después habla con Isabela.',
    liberated: 'Las banderas dejan de separar familias. Ahora pueden reconstruir la ciudad juntos.',
  },
  '7': {
    xervias: 'El cóndor guarda las alturas. ¿Por qué nadie puede acercarse a esa antigua carta?',
    zhinchi: 'Cruza los pasos, busca a sus guardianes y descubre el juramento original antes de enfrentar a Aukan.',
    liberated: 'Las cumbres están abiertas otra vez. Aukan conoce finalmente la verdad de su promesa.',
  },
  '8': {
    xervias: 'El último caballero cree que debe obedecer cualquier juramento, aunque haya sido alterado.',
    zhinchi: 'Encuentra las versiones originales y muéstrale la verdad a Gonzalo. Un juramento no exige causar daño.',
    liberated: 'La Casa del Juramento vuelve a representar la justicia y no el miedo. Gonzalo ha escuchado la verdad.',
  },
};

export function hasSeenRegionMoment(storage: Pick<CampaignStorage, 'getItem'> | null | undefined, key: string, id: string): boolean {
  if (!isGeneralRegion(id)) return false;
  try {
    const raw = storage?.getItem(key);
    if (!raw) return false;
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.some(entry => entry === id);
  } catch { return false; }
}

export function rememberRegionMoment(storage: CampaignStorage | null | undefined, key: string, id: string): boolean {
  if (!isGeneralRegion(id) || !storage) return false;
  try {
    const raw = storage.getItem(key);
    let previous: unknown = [];
    try { previous = raw ? JSON.parse(raw) : []; }
    catch { previous = []; }
    if (!Array.isArray(previous)) previous = [];
    const valid = previous.filter((item): item is GeneralRegionId => typeof item === 'string' && isGeneralRegion(item));
    storage.setItem(key, JSON.stringify([...new Set([...valid, id])]));
    return true;
  } catch { return false; }
}
