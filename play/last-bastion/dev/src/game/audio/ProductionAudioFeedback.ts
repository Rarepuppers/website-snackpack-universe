export interface ProductionFeedbackAsset {
  readonly id: string;
  readonly batch: "batch-s2" | "batch-s3" | "batch-c3-assault";
  readonly fileStem: string;
}

const S2 = [
  "marine-knife-warning", "marine-knife-whoosh", "marine-cover-impact", "marine-armour-impact",
  "abomination-low-windup", "abomination-heavy-slam", "abomination-exhausted-recovery", "survivor-pack-rush",
] as const;
const S3 = [
  "flesh-impact-a", "flesh-impact-b", "armour-impact-a", "armour-impact-b", "shield-impact-a", "shield-impact-b",
  "brittle-cover-impact", "reinforced-cover-impact", "pickup-confirm", "xp-tick", "level-up-stinger",
  "chest-shop-confirm", "player-damage-a", "player-damage-b", "boss-warning-stinger", "reward-stinger",
] as const;
const C3_ASSAULT = ["assault-damage", "assault-evade", "assault-death"] as const;

export const PRODUCTION_AUDIO_FEEDBACK_ASSETS: readonly ProductionFeedbackAsset[] = Object.freeze([
  ...S2.map((fileStem) => Object.freeze({ id: `s2:${fileStem}`, batch: "batch-s2" as const, fileStem })),
  ...S3.map((fileStem) => Object.freeze({ id: `s3:${fileStem}`, batch: "batch-s3" as const, fileStem })),
  ...C3_ASSAULT.map((fileStem) => Object.freeze({
    id: `c3-assault:${fileStem}`,
    batch: "batch-c3-assault" as const,
    fileStem,
  })),
]);

/** Stable simulation cue → approved feedback variant stems. */
export const PRODUCTION_AUDIO_FEEDBACK_BY_CUE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "marine-knife-warning": ["s2:marine-knife-warning"],
  "marine-knife-throw": ["s2:marine-knife-whoosh"],
  "cover-break": ["s2:marine-cover-impact", "s3:brittle-cover-impact", "s3:reinforced-cover-impact"],
  "armour-clank": ["s2:marine-armour-impact", "s3:armour-impact-a", "s3:armour-impact-b"],
  "abomination-slam-warning": ["s2:abomination-low-windup"],
  "abomination-slam-impact": ["s2:abomination-heavy-slam"],
  "abomination-recovery": ["s2:abomination-exhausted-recovery"],
  "infected-survivor-rush": ["s2:survivor-pack-rush"],
  "player-hit": ["s3:player-damage-a", "s3:player-damage-b"],
  "player-shield-hit": ["s3:shield-impact-a", "s3:shield-impact-b"],
  "impact": ["s3:flesh-impact-a", "s3:flesh-impact-b"],
  "powerup": ["s3:pickup-confirm"],
  "xp": ["s3:xp-tick"],
  "level-up": ["s3:level-up-stinger"],
  "chest-open": ["s3:chest-shop-confirm"],
  "bastion-phase": ["s3:boss-warning-stinger"],
  "victory-vault": ["s3:reward-stinger"],
});

const ASSAULT_FEEDBACK_BY_CUE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "player-hit": ["c3-assault:assault-damage"],
  dodge: ["c3-assault:assault-evade"],
  "hero-death": ["c3-assault:assault-death"],
});

/** Hero-specific cues override the shared set without changing simulation ids. */
export function productionFeedbackAssetIdsForCue(cueId: string, heroId?: string): readonly string[] {
  if (heroId === "assault") {
    const assaultAssets = ASSAULT_FEEDBACK_BY_CUE[cueId];
    if (assaultAssets) return assaultAssets;
  }
  return PRODUCTION_AUDIO_FEEDBACK_BY_CUE[cueId] ?? [];
}
