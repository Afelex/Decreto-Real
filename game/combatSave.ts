import { ENGINE_VERSION, exportCombat, invalidRecord, LEGACY_VERSIONS, replayCombat, type CombatState } from './combatEngine.ts';

/**
 * Local save for /duelo-v1. Only the engine record (seed, initial difficulty, accepted actions and events)
 * is stored; restoring always goes through replayCombat, never through a stored state object.
 * This is a convenience for one browser: it is not sync between devices nor tamper protection.
 */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const SAVE_KEY = 'decreto-real.duelo-v1.partida';
export const SAVE_FORMAT = 1;
/** Natural games stay under 20 KB; this bound keeps a hostile or runaway save from freezing the page. */
export const MAX_SAVE_CHARS = 2_000_000;

export type SaveProblem = 'corrupt' | 'version' | 'unavailable';
export type LoadResult =
  | { status: 'empty' }
  | { status: 'ready'; state: CombatState }
  | { status: 'invalid'; problem: SaveProblem };
export type WriteResult = { ok: true } | { ok: false; problem: 'quota' | 'unavailable' };

/** Reading window.localStorage itself can throw (blocked cookies, some private modes). */
export function browserStorage(): StorageLike | null {
  try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; } catch { return null; }
}

const isQuota = (error: unknown) => error instanceof DOMException
  && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014);

export function loadSave(storage: StorageLike | null): LoadResult {
  if (!storage) return { status: 'invalid', problem: 'unavailable' };
  let raw: string | null;
  try { raw = storage.getItem(SAVE_KEY); } catch { return { status: 'invalid', problem: 'unavailable' }; }
  if (raw === null) return { status: 'empty' };
  if (raw.length > MAX_SAVE_CHARS) return { status: 'invalid', problem: 'corrupt' };
  let envelope: unknown;
  try { envelope = JSON.parse(raw); } catch { return { status: 'invalid', problem: 'corrupt' }; }
  if (!envelope || typeof envelope !== 'object') return { status: 'invalid', problem: 'corrupt' };
  const { format, record } = envelope as { format?: unknown; record?: { version?: unknown } };
  if (typeof format === 'number' && format !== SAVE_FORMAT) return { status: 'invalid', problem: 'version' };
  if (format !== SAVE_FORMAT || !record || typeof record !== 'object') return { status: 'invalid', problem: 'corrupt' };
  const known = record.version === ENGINE_VERSION || LEGACY_VERSIONS.includes(record.version as typeof LEGACY_VERSIONS[number]);
  if (!known) return { status: 'invalid', problem: 'version' };
  if (invalidRecord(record)) return { status: 'invalid', problem: 'corrupt' };
  let state: CombatState;
  try { state = replayCombat(record as Parameters<typeof replayCombat>[0]); } catch { return { status: 'invalid', problem: 'corrupt' }; }
  // A finished or untouched game is not worth resuming; remove only our own key.
  if (state.phase === 'finished' || state.journal.length === 0) { clearSave(storage); return { status: 'empty' }; }
  return { status: 'ready', state };
}

export function writeSave(storage: StorageLike | null, state: CombatState): WriteResult {
  if (!storage) return { ok: false, problem: 'unavailable' };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ format: SAVE_FORMAT, record: exportCombat(state) }));
    return { ok: true };
  } catch (error) {
    return { ok: false, problem: isQuota(error) ? 'quota' : 'unavailable' };
  }
}

export function clearSave(storage: StorageLike | null) {
  try { storage?.removeItem(SAVE_KEY); return true; } catch { return false; }
}

/** Small preferences next to the save, with the same failure tolerance. */
export function readPreference(storage: StorageLike | null, key: string) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}
export function writePreference(storage: StorageLike | null, key: string, value: string) {
  try { storage?.setItem(key, value); return true; } catch { return false; }
}
