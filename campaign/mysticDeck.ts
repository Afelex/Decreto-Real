import { CAMPAIGN_MISSIONS, bestStars, type CampaignProgress, type CampaignStorage } from './campaign.ts';
import {
  GENERAL_MYSTICS, ZHINCHI_MYSTIC, MAX_MYSTIC_SLOTS,
  type MysticId, type MysticSlot,
} from '../game/mysticCards.ts';

/** Se obtiene una carta por cada general: repetir su misión no concede copias adicionales. */
export const DECK_STORAGE_KEY = 'decreto-real.campania.mazo-mistico.v1';
export const LEGACY_UNLOCK_MISSION = '35';

export function hasZhinchiLegacy(progress: CampaignProgress): boolean {
  return CAMPAIGN_MISSIONS.slice(0, 35).every(mission => bestStars(progress, mission.id) > 0);
}

export function collectedMystics(progress: CampaignProgress): MysticId[] {
  const rewarded: MysticId[] = GENERAL_MYSTICS
    .filter(card => bestStars(progress, card.missionId) > 0)
    .map(card => card.id);
  if (hasZhinchiLegacy(progress)) rewarded.push(ZHINCHI_MYSTIC.id);
  return rewarded;
}

/** Nunca confiar en un archivo de configuración guardado: validar premios, duplicados y tipos. */
export function validateMysticSlots(raw: unknown, progress: CampaignProgress): MysticSlot[] {
  if (!hasZhinchiLegacy(progress) || !Array.isArray(raw)) return [];
  const unlocked = new Set<string>(collectedMystics(progress));
  const seen = new Set<string>();
  const valid: MysticSlot[] = [];
  for (const item of raw) {
    if (valid.length >= MAX_MYSTIC_SLOTS) break;
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    if (typeof entry.mysticId !== 'string' || !unlocked.has(entry.mysticId) || seen.has(entry.mysticId)) continue;
    if (entry.replace !== 'ATTACK' && entry.replace !== 'DEFENSE' && entry.replace !== 'ORDER') continue;
    seen.add(entry.mysticId);
    valid.push({ mysticId: entry.mysticId as MysticId, replace: entry.replace });
  }
  return valid;
}

export function loadMysticSlots(storage: CampaignStorage | null | undefined, progress: CampaignProgress): MysticSlot[] {
  try {
    const raw = storage?.getItem(DECK_STORAGE_KEY);
    if (!raw) return [];
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return [];
    const value = saved as { version?: unknown; slots?: unknown };
    return value.version === 1 ? validateMysticSlots(value.slots, progress) : [];
  } catch { return []; }
}

export function saveMysticSlots(storage: CampaignStorage | null | undefined, slots: readonly MysticSlot[], progress: CampaignProgress): boolean {
  if (!storage || !hasZhinchiLegacy(progress) || slots.length > MAX_MYSTIC_SLOTS) return false;
  const valid = validateMysticSlots([...slots], progress);
  if (valid.length !== slots.length) return false;
  try {
    storage.setItem(DECK_STORAGE_KEY, JSON.stringify({ version: 1, slots: valid }));
    return true;
  } catch { return false; }
}
