/** Local, versioned duel cosmetics. One device keeps up to four aliases; this is
 * not an account or ranking identity. All effects are cosmetic only. */
export type CosmeticKind = 'portrait' | 'entrance' | 'back' | 'nameFx';
export type Appearance = Record<CosmeticKind, string>;
export type DuelistSlot = { name: string; appearance: Appearance };
export type Progress = { matches: number; wins: number; impacts: number };
export type DuelistProfile = {
  version: 1; active: number; slots: DuelistSlot[]; progress: Progress; rewardedRooms: string[];
};
export type Cosmetic = { id: string; title: string; image?: string; symbol?: string;
  need?: { metric: keyof Progress; amount: number } };
export const DUELIST_KEY = 'decreto-real.pvp.duelist.v1';
export const LEGACY_NICKNAME_KEY = 'decreto-real.pvp.nickname.v1';
export const MAX_ALIASES = 4;
export const COSMETICS: Record<CosmeticKind, Cosmetic[]> = {
  portrait: [
    { id: 'xervias', title: 'Xervias', image: 'retratos/jugador.webp' },
    { id: 'cronista', title: 'Domingo Quispe', image: 'campania/arte/retratos/rival-01-domingo-quispe.webp', need: { metric: 'matches', amount: 3 } },
    { id: 'vandalo', title: 'Vándalo Rojo', image: 'campania/arte/retratos/rival-36-vandalo-rojo.webp', need: { metric: 'wins', amount: 2 } },
    { id: 'amaru', title: 'Amaru', image: 'campania/arte/retratos/rival-20-amaru-llaguno.webp', need: { metric: 'impacts', amount: 5 } },
  ],
  entrance: [
    { id: 'clasica', title: 'Puertas reales', symbol: '♜' },
    { id: 'estandarte', title: 'Estandartes', symbol: '⚑', need: { metric: 'matches', amount: 3 } },
    { id: 'aurea', title: 'Aurora dorada', symbol: '✦', need: { metric: 'wins', amount: 2 } },
  ],
  back: [
    { id: 'clasico', title: 'Sello real', symbol: '✥' },
    { id: 'sol', title: 'Sol del Perú', symbol: '☼', need: { metric: 'matches', amount: 1 } },
    { id: 'carmesi', title: 'Carmesí', symbol: '♛', need: { metric: 'wins', amount: 3 } },
  ],
  nameFx: [
    { id: 'clasico', title: 'Clásico', symbol: 'A' },
    { id: 'brillo', title: 'Destellos', symbol: '✧', need: { metric: 'matches', amount: 2 } },
    { id: 'particulas', title: 'Partículas doradas', symbol: '✦', need: { metric: 'wins', amount: 3 } },
  ],
};
export const DEFAULT_APPEARANCE: Appearance = {
  portrait: 'xervias', entrance: 'clasica', back: 'clasico', nameFx: 'clasico',
};
export const emptyProfile = (name = ''): DuelistProfile => ({
  version: 1, active: 0, slots: [{ name: cleanName(name), appearance: { ...DEFAULT_APPEARANCE } }],
  progress: { matches: 0, wins: 0, impacts: 0 }, rewardedRooms: [],
});
export function cleanName(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) : '';
}
const safeCount = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0 ? n as number : 0;
export function isUnlocked(profile: DuelistProfile, cosmetic: Cosmetic): boolean {
  return !cosmetic.need || profile.progress[cosmetic.need.metric] >= cosmetic.need.amount;
}
export function validAppearance(raw: unknown, profile?: DuelistProfile): Appearance {
  const input = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return (Object.keys(DEFAULT_APPEARANCE) as CosmeticKind[]).reduce((out, kind) => {
    const option = COSMETICS[kind].find(entry => entry.id === input[kind]);
    out[kind] = option && (!profile || isUnlocked(profile, option)) ? option.id : DEFAULT_APPEARANCE[kind];
    return out;
  }, { ...DEFAULT_APPEARANCE });
}
export function loadDuelistProfile(storage?: Pick<Storage, 'getItem'>): DuelistProfile {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (!store) return emptyProfile();
  try {
    const oldName = cleanName(store.getItem(LEGACY_NICKNAME_KEY));
    const raw = store.getItem(DUELIST_KEY);
    if (!raw) return emptyProfile(oldName);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || (parsed as any).version !== 1) return emptyProfile(oldName);
    const data = parsed as Partial<DuelistProfile>;
    const progress = {
      matches: safeCount(data.progress?.matches), wins: safeCount(data.progress?.wins),
      impacts: safeCount(data.progress?.impacts),
    };
    const profile = emptyProfile(oldName);
    profile.progress = progress;
    profile.rewardedRooms = Array.isArray(data.rewardedRooms)
      ? data.rewardedRooms.filter((v): v is string => typeof v === 'string' && /^[0-9a-f]{24}$/.test(v)).slice(-80) : [];
    profile.slots = Array.isArray(data.slots) ? data.slots.slice(0, MAX_ALIASES)
      .filter(s => s && typeof s === 'object').map(s => ({
        name: cleanName(s.name), appearance: validAppearance(s.appearance, profile),
      })) : [];
    if (!profile.slots.length) profile.slots = emptyProfile(oldName).slots;
    profile.active = typeof data.active === 'number' && Number.isInteger(data.active)
      ? Math.max(0, Math.min(profile.slots.length - 1, data.active)) : 0;
    return profile;
  } catch { return emptyProfile(); }
}
export function saveDuelistProfile(profile: DuelistProfile, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const store = storage ?? localStorage;
    store.setItem(DUELIST_KEY, JSON.stringify(profile));
    store.setItem(LEGACY_NICKNAME_KEY, profile.slots[profile.active]?.name || '');
    return true;
  } catch { return false; }
}
export function rewardMatch(profile: DuelistProfile, room: string, won: boolean, impacts: number): DuelistProfile {
  if (!/^[0-9a-f]{24}$/.test(room) || profile.rewardedRooms.includes(room)) return profile;
  return { ...profile, rewardedRooms: [...profile.rewardedRooms, room].slice(-80),
    progress: { matches: profile.progress.matches + 1, wins: profile.progress.wins + (won ? 1 : 0),
      impacts: profile.progress.impacts + Math.max(0, Math.min(4, safeCount(impacts))) } };
}
export function portraitUrl(id: string): string {
  const option = COSMETICS.portrait.find(item => item.id === id) || COSMETICS.portrait[0];
  return import.meta.env.BASE_URL + option.image;
}
export function unlockText(item: Cosmetic): string {
  if (!item.need) return 'Disponible';
  const labels: Record<keyof Progress, string> = { matches: 'duelos completados', wins: 'victorias', impacts: 'Impactos convocados' };
  return item.need.amount + ' ' + labels[item.need.metric];
}
