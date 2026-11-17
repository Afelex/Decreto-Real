import { describe, expect, it } from 'vitest';
import { advancePvpStats, confirmedPvpDraws } from '../../game/multiplayerStats';
const snap = (revision: number, meHp: number, opponentHp: number, impact: number,
  meDeck = 24, opponentDeck = 24, turnNumber = 1, status: 'playing' | 'finished' = 'playing') => ({
    revision, me: { hp: meHp, impact, deckCount: meDeck },
    opponent: { hp: opponentHp, deckCount: opponentDeck },
    turnNumber, status,
  });
describe('PvP verified presentation', () => {
  it('only counts server-confirmed HP changes and impacts', () => {
    const a = snap(1,20,20,0);
    const s = advancePvpStats(null,null,a,1000);
    const b = snap(2,20,18,0,24,24);
    const t = advancePvpStats(s,a,b,2000);
    const c = snap(3,19,18,1,24,24);
    const u = advancePvpStats(t,b,c,3000);
    const d = snap(4,20,17,1,23,24,2,'finished');
    const v = advancePvpStats(u,c,d,4200);
    expect(v).toMatchObject({
      complete:true, stopped:true, durationMs:3200, damageDealt:3,
      healthRecovered:1, impactsSummoned:1,
    });
    expect(advancePvpStats(v,d,d,5000)).toEqual(v);
  });
  it('marks counters incomplete after reconnect or missing revisions', () => {
    const late = snap(19,12,8,2,14,16,9);
    const s = advancePvpStats(null,null,late,3000);
    expect(s.complete).toBe(false);
    const skipped = snap(21,14,4,3,12,14,10);
    expect(advancePvpStats(s,late,skipped,4000).complete).toBe(false);
  });
  it('animates actual deck decreases once, not on presence updates', () => {
    const a = snap(3,20,20,0,21,23);
    const b = snap(4,20,20,0,20,22);
    expect(confirmedPvpDraws(a,b)).toEqual([
      {side:'PLAYER',count:1},{side:'OPPONENT',count:1},
    ]);
    expect(confirmedPvpDraws(b,b)).toEqual([]);
    expect(confirmedPvpDraws(a,snap(5,20,20,0,18,20))).toEqual([]);
  });
});