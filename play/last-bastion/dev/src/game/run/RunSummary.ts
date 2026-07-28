import type { PerkId } from "../perks/perkCatalog";
import {
  cloneTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";

export interface RunMetrics {
  kills: number;
  scrapEarned: number;
  damageByWeapon: Readonly<Record<string, number>>;
  damageBySecond?: readonly number[];
  elapsedSeconds?: number;
  damageTaken?: number;
  eliteKills?: number;
  bossDamage?: number;
  highestHit?: number;
  criticalHits?: number;
  damageTakenBySource?: Readonly<Record<string, number>>;
  defeatCause?: string | null;
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
  damageBySecond: readonly number[];
  elapsedSeconds: number;
  damageTaken: number;
  eliteKills: number;
  bossDamage: number;
  highestHit: number;
  criticalHits: number;
  damageTakenBySource: Readonly<Record<string, number>>;
  defeatCause: string | null;
  newBestWave: boolean;
  newBestNodes: boolean;
  weapons: readonly { weaponId: string; tier: number }[];
  upgrades: readonly { upgradeId: string; level: number }[];
  transformation: TransformationAffinityState;
  newlyUnlockedPerkIds: readonly PerkId[];
}

export const EMPTY_RUN_METRICS: Readonly<RunMetrics> = Object.freeze({
  kills: 0,
  scrapEarned: 0,
  damageByWeapon: Object.freeze({}),
  damageBySecond: Object.freeze([]),
  elapsedSeconds: 0,
  damageTaken: 0,
  eliteKills: 0,
  bossDamage: 0,
  highestHit: 0,
  criticalHits: 0,
  damageTakenBySource: Object.freeze({}),
  defeatCause: null,
});

export function mergeRunMetrics(left: RunMetrics, right: RunMetrics): RunMetrics {
  const damageByWeapon: Record<string, number> = { ...left.damageByWeapon };
  for (const [weaponId, damage] of Object.entries(right.damageByWeapon)) {
    damageByWeapon[weaponId] = (damageByWeapon[weaponId] ?? 0) + Math.max(0, damage);
  }
  const damageTakenBySource: Record<string, number> = { ...(left.damageTakenBySource ?? {}) };
  for (const [source, damage] of Object.entries(right.damageTakenBySource ?? {})) {
    damageTakenBySource[source] = (damageTakenBySource[source] ?? 0) + Math.max(0, damage);
  }
  const damageBySecond = sanitizeDamageTimeline(left.damageBySecond);
  const rightTimeline = sanitizeDamageTimeline(right.damageBySecond);
  const rightOffset = Math.min(
    MAX_DAMAGE_TIMELINE_SECONDS - 1,
    Math.max(0, Math.floor(left.elapsedSeconds ?? 0)),
  );
  rightTimeline.forEach((damage, index) => {
    const target = Math.min(MAX_DAMAGE_TIMELINE_SECONDS - 1, rightOffset + index);
    damageBySecond[target] = (damageBySecond[target] ?? 0) + damage;
  });
  return {
    kills: Math.max(0, Math.floor(left.kills)) + Math.max(0, Math.floor(right.kills)),
    scrapEarned: Math.max(0, left.scrapEarned) + Math.max(0, right.scrapEarned),
    damageByWeapon,
    damageBySecond,
    elapsedSeconds: Math.max(0, left.elapsedSeconds ?? 0) + Math.max(0, right.elapsedSeconds ?? 0),
    damageTaken: Math.max(0, left.damageTaken ?? 0) + Math.max(0, right.damageTaken ?? 0),
    eliteKills: Math.max(0, Math.floor(left.eliteKills ?? 0)) + Math.max(0, Math.floor(right.eliteKills ?? 0)),
    bossDamage: Math.max(0, left.bossDamage ?? 0) + Math.max(0, right.bossDamage ?? 0),
    highestHit: Math.max(0, left.highestHit ?? 0, right.highestHit ?? 0),
    criticalHits: Math.max(0, Math.floor(left.criticalHits ?? 0)) + Math.max(0, Math.floor(right.criticalHits ?? 0)),
    damageTakenBySource,
    defeatCause: right.defeatCause ?? left.defeatCause ?? null,
  };
}

export function totalRunDamage(metrics: Pick<RunMetrics, "damageByWeapon">): number {
  return Object.values(metrics.damageByWeapon).reduce((sum, damage) => sum + Math.max(0, damage), 0);
}

export function damagePerMinute(
  metrics: Pick<RunMetrics, "damageBySecond" | "elapsedSeconds">,
): readonly number[] {
  const timeline = sanitizeDamageTimeline(metrics.damageBySecond);
  if (timeline.length === 0) return [];
  const minuteCount = Math.max(
    1,
    Math.ceil(Math.max(0, metrics.elapsedSeconds ?? 0) / 60),
    Math.ceil(timeline.length / 60),
  );
  return Array.from({ length: minuteCount }, (_, minute) => {
    const start = minute * 60;
    return timeline.slice(start, start + 60).reduce((sum, damage) => sum + damage, 0);
  });
}

export function cloneRunMetrics(metrics: RunMetrics): RunMetrics {
  return {
    kills: metrics.kills,
    scrapEarned: metrics.scrapEarned,
    damageByWeapon: { ...metrics.damageByWeapon },
    damageBySecond: sanitizeDamageTimeline(metrics.damageBySecond),
    elapsedSeconds: metrics.elapsedSeconds ?? 0,
    damageTaken: metrics.damageTaken ?? 0,
    eliteKills: metrics.eliteKills ?? 0,
    bossDamage: metrics.bossDamage ?? 0,
    highestHit: metrics.highestHit ?? 0,
    criticalHits: metrics.criticalHits ?? 0,
    damageTakenBySource: { ...(metrics.damageTakenBySource ?? {}) },
    defeatCause: metrics.defeatCause ?? null,
  };
}

export function createRunSummary(
  input: Omit<
    RunSummary,
    "newlyUnlockedPerkIds" | "transformation" | "elapsedSeconds" | "damageTaken"
    | "eliteKills" | "bossDamage" | "highestHit" | "criticalHits" | "damageTakenBySource"
    | "damageBySecond"
    | "defeatCause" | "newBestWave" | "newBestNodes"
  > & {
    newlyUnlockedPerkIds?: readonly PerkId[];
    transformation?: TransformationAffinityState;
    elapsedSeconds?: number;
    damageTaken?: number;
    eliteKills?: number;
    bossDamage?: number;
    highestHit?: number;
    criticalHits?: number;
    damageTakenBySource?: Readonly<Record<string, number>>;
    damageBySecond?: readonly number[];
    defeatCause?: string | null;
    newBestWave?: boolean;
    newBestNodes?: boolean;
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
    damageBySecond: sanitizeDamageTimeline(input.damageBySecond),
    elapsedSeconds: Math.max(0, input.elapsedSeconds ?? 0),
    damageTaken: Math.max(0, input.damageTaken ?? 0),
    eliteKills: Math.max(0, Math.floor(input.eliteKills ?? 0)),
    bossDamage: Math.max(0, input.bossDamage ?? 0),
    highestHit: Math.max(0, input.highestHit ?? 0),
    criticalHits: Math.max(0, Math.floor(input.criticalHits ?? 0)),
    damageTakenBySource: { ...(input.damageTakenBySource ?? {}) },
    defeatCause: typeof input.defeatCause === "string" ? input.defeatCause : null,
    newBestWave: input.newBestWave === true,
    newBestNodes: input.newBestNodes === true,
    weapons: input.weapons.map((weapon) => ({ ...weapon })),
    upgrades: input.upgrades.map((upgrade) => ({ ...upgrade })),
    transformation: cloneTransformationAffinityState(input.transformation),
    newlyUnlockedPerkIds: [...(input.newlyUnlockedPerkIds ?? [])],
  };
}

const MAX_DAMAGE_TIMELINE_SECONDS = 6 * 60 * 60;

function sanitizeDamageTimeline(value: readonly number[] | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_DAMAGE_TIMELINE_SECONDS).map((damage) => (
    typeof damage === "number" && Number.isFinite(damage) && damage > 0 ? damage : 0
  ));
}
