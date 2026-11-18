/**
 * Match statistics for the original Versus IA duel. Records effective HP
 * changes at the point of resolution, independently of React renders.
 */
export type BattleHealthSide = 'PLAYER' | 'OPPONENT';
export type BattleHpUpdate = number | ((previous: number) => number);
export type BattleStatsSnapshot = Readonly<{
  durationMs: number;
  healthRecovered: number;
  damageDealt: number;
  impactsSummoned: number;
}>;

export class BattleStatsTracker {
  private playerHp = 20;
  private opponentHp = 20;
  private startAt: number | null = null;
  private endAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedMs = 0;
  private recovered = 0;
  private damage = 0;
  private impacts = 0;

  /** Las estadísticas empiezan con la vida real de la dificultad escogida. */
  constructor(playerHp = 20, opponentHp = 20) {
    this.playerHp = playerHp;
    this.opponentHp = opponentHp;
  }

  start(now = Date.now()): void {
    if (this.startAt === null) this.startAt = now;
  }

  /** Only actual HP recovered or removed counts; callers enforce game limits. */
  updateHealth(side: BattleHealthSide, update: BattleHpUpdate, creditedToPlayer = side === 'OPPONENT'): number {
    const before = side === 'PLAYER' ? this.playerHp : this.opponentHp;
    const after = typeof update === 'function' ? update(before) : update;
    if (!Number.isFinite(after)) return before;
    if (side === 'PLAYER') this.playerHp = after;
    else this.opponentHp = after;
    if (this.startAt !== null && this.endAt === null) {
      if (side === 'PLAYER' && after > before) this.recovered += after - before;
      if (side === 'OPPONENT' && creditedToPlayer && after < before) this.damage += before - after;
    }
    return after;
  }

  summonImpact(isPlayer: boolean): void {
    if (isPlayer && this.startAt !== null && this.endAt === null) this.impacts += 1;
  }

  pause(now = Date.now()): void {
    if (this.startAt !== null && this.endAt === null && this.pausedAt === null) this.pausedAt = now;
  }

  resume(now = Date.now()): void {
    if (this.pausedAt !== null) {
      // Si ya terminó el duelo, cerrar la pausa en el instante exacto del resultado.
      this.pausedMs += Math.max(0, (this.endAt ?? now) - this.pausedAt);
      this.pausedAt = null;
    }
  }

  stop(now = Date.now()): void {
    if (this.endAt === null) this.endAt = now;
  }

  snapshot(now = Date.now()): BattleStatsSnapshot {
    const end = this.endAt ?? now;
    const livePause = this.pausedAt === null ? 0 : Math.max(0, end - this.pausedAt);
    const durationMs = this.startAt === null ? 0 :
      Math.max(0, end - this.startAt - this.pausedMs - livePause);
    return {
      durationMs,
      healthRecovered: this.recovered,
      damageDealt: this.damage,
      impactsSummoned: this.impacts,
    };
  }
}

/** 0:00, 12:34 or 1:02:34; absent legacy results stay explicitly unknown. */
export function formatBattleDuration(milliseconds: number | undefined): string {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds) || milliseconds < 0) return '—';
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  return minutes < 60 ? String(minutes) + ':' + ss :
    String(Math.floor(minutes / 60)) + ':' + String(minutes % 60).padStart(2, '0') + ':' + ss;
}
