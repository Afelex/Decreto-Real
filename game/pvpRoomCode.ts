/** Public, human-friendly room invitation codes: exactly two digits then two letters.
 * A room code is only an invite locator, never an authentication credential. */
export const PRIVATE_ROOM_CODE_RE = /^[0-9]{2}[A-HJ-NP-Z]{2}$/;

export function normalizeRoomCode(input: unknown): string {
  return typeof input === 'string' ? input.trim().toUpperCase() : '';
}

export function isPrivateRoomCode(input: unknown): boolean {
  return PRIVATE_ROOM_CODE_RE.test(normalizeRoomCode(input));
}
