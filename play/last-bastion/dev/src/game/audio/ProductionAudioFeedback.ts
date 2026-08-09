export interface ProductionFeedbackAsset {
  readonly id: string;
  readonly batch: "batch-s2" | "batch-s3" | "batch-c3-assault" | "batch-c3-tactician" | "batch-c3-scout";
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
const C3_TACTICIAN = ["tactician-damage", "tactician-evade", "tactician-death"] as const;
const C3_SCOUT = ["scout-damage", "scout-evade", "scout-death"] as const;

export const PRODUCTION_AUDIO_FEEDBACK_ASSETS: readonly ProductionFeedbackAsset[] = Object.freeze([
  ...S2.map((fileStem) => Object.freeze({ id: `s2:${fileStem}`, batch: "batch-s2" as const, fileStem })),
  ...S3.map((fileStem) => Object.freeze({ id: `s3:${fileStem}`, batch: "batch-s3" as const, fileStem })),
  ...C3_ASSAULT.map((fileStem) => Object.freeze({
    id: `c3-assault:${fileStem}`,
    batch: "batch-c3-assault" as const,
    fileStem,
  })),
  ...C3_TACTICIAN.map((fileStem) => Object.freeze({
    id: `c3-tactician:${fileStem}`,
    batch: "batch-c3-tactician" as const,
    fileStem,
  })),
  ...C3_SCOUT.map((fileStem) => Object.freeze({
    id: `c3-scout:${fileStem}`,
    batch: "batch-c3-scout" as const,
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

const TACTICIAN_FEEDBACK_BY_CUE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "player-hit": ["c3-tactician:tactician-damage"],
  dodge: ["c3-tactician:tactician-evade"],
  "hero-death": ["c3-tactician:tactician-death"],
});

const SCOUT_FEEDBACK_BY_CUE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "player-hit": ["c3-scout:scout-damage"],
  dodge: ["c3-scout:scout-evade"],
  "hero-death": ["c3-scout:scout-death"],
});

/** Hero-specific cues override the shared set without changing simulation ids. */
export function productionFeedbackAssetIdsForCue(cueId: string, heroId?: string): readonly string[] {
  if (heroId === "assault") {
    const assaultAssets = ASSAULT_FEEDBACK_BY_CUE[cueId];
    if (assaultAssets) return assaultAssets;
  }
  if (heroId === "tactician") {
    const tacticianAssets = TACTICIAN_FEEDBACK_BY_CUE[cueId];
    if (tacticianAssets) return tacticianAssets;
  }
  if (heroId === "scout") {
    const scoutAssets = SCOUT_FEEDBACK_BY_CUE[cueId];
    if (scoutAssets) return scoutAssets;
  }
  return PRODUCTION_AUDIO_FEEDBACK_BY_CUE[cueId] ?? [];
}
