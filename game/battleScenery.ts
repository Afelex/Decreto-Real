/** Battle background assets are selected per mode, not globally.
 * Free-play (/game) uses the introductory animation. Campaign missions already
 * provide a separate scene and can opt into their own videos later.
 */
export type BattleScenery = Readonly<{ poster: string; video?: string }>;
export type BattleSceneryOverride = Readonly<{
  background?: string;
  backgroundVideo?: string | null;
}>;

export const STANDARD_BATTLE_POSTER = '/Decreto-Real/escenarios/plaza-arcilla-estandar.webp';
export const STANDARD_BATTLE_VIDEO = '/Decreto-Real/escenarios/gemini_generated_video_b8059a5c.mp4';

export function resolveBattleScenery(presentation?: BattleSceneryOverride): BattleScenery {
  const poster = presentation?.background ?? STANDARD_BATTLE_POSTER;
  const video = presentation?.backgroundVideo === null
    ? undefined
    : presentation?.backgroundVideo ?? (presentation?.background ? undefined : STANDARD_BATTLE_VIDEO);
  return video ? { poster, video } : { poster };
}
