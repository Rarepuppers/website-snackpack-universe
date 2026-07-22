import type { PerkId } from "../perks/perkCatalog";
import {
  cloneTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";

export interface RunMetrics {
  kills: number;
  scrapEarned: number;
  damageByWeapon: Readonly<Record<string, number>>;
}

export interface RunSummary {
  mode: "quick-drop" | "expedition";
  outcome: "victory" | "defeat";
  heroId: string;
  perkId: PerkId | null;
  waveReached: number;
  nodesCleared: number;
  kills: number;
  scrapEarned: number;
  scrapBanked: number;
  level: number;
  damageByWeapon: Readonly<Record<string, number>>;
  weapons: readonly { weaponId: string; tier: number }[];
  upgrades: readonly { upgradeId: string; level: number }[];
  transformation: TransformationAffinityState;
  newlyUnlockedPerkIds: readonly PerkId[];
}

export const EMPTY_RUN_METRICS: Readonly<RunMetrics> = Object.freeze({
  kills: 0,
  scrapEarned: 0,
  damageByWeapon: Object.freeze({}),
});

export function mergeRunMetrics(left: RunMetrics, right: RunMetrics): RunMetrics {
  const damageByWeapon: Record<string, number> = { ...left.damageByWeapon };
  for (const [weaponId, damage] of Object.entries(right.damageByWeapon)) {
    damageByWeapon[weaponId] = (damageByWeapon[weaponId] ?? 0) + Math.max(0, damage);
  }
  return {
    kills: Math.max(0, Math.floor(left.kills)) + Math.max(0, Math.floor(right.kills)),
    scrapEarned: Math.max(0, left.scrapEarned) + Math.max(0, right.scrapEarned),
    damageByWeapon,
  };
}

export function totalRunDamage(metrics: Pick<RunMetrics, "damageByWeapon">): number {
  return Object.values(metrics.damageByWeapon).reduce((sum, damage) => sum + Math.max(0, damage), 0);
}

export function createRunSummary(
  input: Omit<RunSummary, "newlyUnlockedPerkIds" | "transformation"> & {
    newlyUnlockedPerkIds?: readonly PerkId[];
    transformation?: TransformationAffinityState;
  },
): RunSummary {
  return {
    ...input,
    waveReached: Math.max(0, Math.floor(input.waveReached)),
    nodesCleared: Math.max(0, Math.floor(input.nodesCleared)),
    kills: Math.max(0, Math.floor(input.kills)),
    scrapEarned: Math.max(0, input.scrapEarned),
    scrapBanked: Math.max(0, input.scrapBanked),
    level: Math.max(1, Math.floor(input.level)),
    damageByWeapon: { ...input.damageByWeapon },
    weapons: input.weapons.map((weapon) => ({ ...weapon })),
    upgrades: input.upgrades.map((upgrade) => ({ ...upgrade })),
    transformation: cloneTransformationAffinityState(input.transformation),
    newlyUnlockedPerkIds: [...(input.newlyUnlockedPerkIds ?? [])],
  };
}
