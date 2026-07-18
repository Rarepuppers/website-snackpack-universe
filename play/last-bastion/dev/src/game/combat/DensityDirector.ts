import type { EnemyType } from "../content/enemyCatalog";

export type EnemyPressureRole = "pursuit" | "ranged" | "specialist" | "boss";
export type DirectorSpawnRank = "elite" | "mini-boss";

export interface DirectorSpawnPlan {
  atSeconds: number;
  type: EnemyType;
  threatCost: number;
  rank?: DirectorSpawnRank;
}

export interface DensityWaveDefinition {
  liveCap: number;
  threatBudget: number;
  durationSeconds: number | null;
  timerEndsWave: boolean;
  plans: readonly DirectorSpawnPlan[];
}

export const DENSITY_LIVE_CAPS = Object.freeze([18, 24, 32, 42, 46] as const);
export const WAVE_THREAT_BUDGETS = Object.freeze([30, 45, 65, 90, 120] as const);
export const WAVE_DURATIONS_SECONDS = Object.freeze([20, 20, 30, 35, null] as const);
export const ENEMY_PROJECTILE_BUDGET = 6;
export const MAX_RANGED_WINDUPS = 2;
export const DENSITY_CAPACITY_ENEMY_COUNT = 56;

const ROLE: Readonly<Record<EnemyType, EnemyPressureRole>> = Object.freeze({
  scuttler: "pursuit",
  "egg-cluster": "specialist",
  "brain-blob": "pursuit",
  "slime-spitter": "ranged",
  "blast-mite": "pursuit",
  "warp-flanker": "specialist",
  ripper: "pursuit",
  "razor-scuttler": "pursuit",
  quillback: "ranged",
  spinewheel: "specialist",
  "tether-bloom": "specialist",
  "aurum-hoarder": "specialist",
  "siege-crusher": "boss",
  "brood-warden": "boss",
  "bastion-eater": "boss",
});

export const ENEMY_THREAT_COST: Readonly<Record<EnemyType, number>> = Object.freeze({
  scuttler: 1,
  "egg-cluster": 2,
  "brain-blob": 2,
  "slime-spitter": 3,
  "blast-mite": 1,
  "warp-flanker": 2,
  ripper: 5,
  "razor-scuttler": 2,
  quillback: 4,
  spinewheel: 4,
  "tether-bloom": 3,
  "aurum-hoarder": 0,
  "siege-crusher": 40,
  "brood-warden": 40,
  "bastion-eater": 40,
});

export function pressureRoleOf(type: EnemyType): EnemyPressureRole {
  return ROLE[type];
}

export function buildDensityWave(index: number): DensityWaveDefinition {
  const waveIndex = Math.max(0, Math.min(index, WAVE_THREAT_BUDGETS.length - 1));
  const durationSeconds: number | null = WAVE_DURATIONS_SECONDS[waveIndex] ?? null;
  const composition: Array<{ type: EnemyType; count: number; rank?: DirectorSpawnRank }> = waveIndex === 0
    ? [{ type: "scuttler", count: 30 }]
    : waveIndex === 1
      ? [{ type: "scuttler", count: 37 }, { type: "egg-cluster", count: 4 }]
      : waveIndex === 2
        ? [
          { type: "scuttler", count: 28 }, { type: "brain-blob", count: 6 },
          { type: "blast-mite", count: 6 }, { type: "slime-spitter", count: 3 },
          { type: "quillback", count: 1 }, { type: "egg-cluster", count: 2 },
          { type: "warp-flanker", count: 1 },
        ]
        : waveIndex === 3
          ? [
            { type: "scuttler", count: 22 }, { type: "brain-blob", count: 4 },
            { type: "blast-mite", count: 6 }, { type: "razor-scuttler", count: 5 },
            { type: "ripper", count: 1 }, { type: "slime-spitter", count: 3 },
            { type: "quillback", count: 1 }, { type: "warp-flanker", count: 1 },
            { type: "egg-cluster", count: 1 }, { type: "tether-bloom", count: 1 },
            { type: "spinewheel", count: 1 }, { type: "scuttler", count: 1, rank: "elite" },
          ]
          : [
            { type: "siege-crusher", count: 1, rank: "mini-boss" },
            { type: "scuttler", count: 27 }, { type: "brain-blob", count: 5 },
            { type: "blast-mite", count: 6 }, { type: "razor-scuttler", count: 4 },
            { type: "ripper", count: 1 }, { type: "slime-spitter", count: 3 },
            { type: "quillback", count: 1 }, { type: "warp-flanker", count: 2 },
            { type: "tether-bloom", count: 1 }, { type: "spinewheel", count: 1 },
          ];
  const plans = scheduleInPulses(composition, durationSeconds ?? 30);
  const threatBudget = WAVE_THREAT_BUDGETS[waveIndex]!;
  const plannedThreat = plans.reduce((sum, plan) => sum + plan.threatCost, 0);
  if (plannedThreat !== threatBudget) {
    throw new Error(`Wave ${waveIndex + 1} threat plan ${plannedThreat} does not match budget ${threatBudget}.`);
  }

  return {
    liveCap: DENSITY_LIVE_CAPS[waveIndex]!,
    threatBudget,
    durationSeconds,
    timerEndsWave: waveIndex >= 2 && durationSeconds !== null,
    plans,
  };
}

function scheduleInPulses(
  composition: readonly { type: EnemyType; count: number; rank?: DirectorSpawnRank }[],
  durationSeconds: number,
): DirectorSpawnPlan[] {
  const unscheduled: Omit<DirectorSpawnPlan, "atSeconds">[] = [];
  let remaining = composition.map((entry) => ({ ...entry }));
  while (remaining.some((entry) => entry.count > 0)) {
    for (const entry of remaining) {
      if (entry.count <= 0) continue;
      entry.count -= 1;
      unscheduled.push({
        type: entry.type,
        rank: entry.rank,
        threatCost: entry.rank === "elite" ? 15 : entry.rank === "mini-boss" ? 40 : ENEMY_THREAT_COST[entry.type],
      });
    }
    remaining = remaining.filter((entry) => entry.count > 0);
  }
  const pulseCount = Math.max(1, Math.floor((durationSeconds - 0.5) / 2.5) + 1);
  return unscheduled.map((plan, item) => ({
    ...plan,
    atSeconds: 0.2 + Math.floor(item * pulseCount / unscheduled.length) * 2.5,
  })).sort((left, right) => left.atSeconds - right.atSeconds);
}

export function buildDensityCapacityRoster(): readonly EnemyType[] {
  return [
    ...Array<EnemyType>(34).fill("scuttler"),
    ...Array<EnemyType>(5).fill("brain-blob"),
    ...Array<EnemyType>(1).fill("ripper"),
    ...Array<EnemyType>(5).fill("slime-spitter"),
    ...Array<EnemyType>(3).fill("quillback"),
    ...Array<EnemyType>(4).fill("warp-flanker"),
    ...Array<EnemyType>(2).fill("tether-bloom"),
    ...Array<EnemyType>(2).fill("spinewheel"),
  ];
}

export function pressureShares(plans: readonly Pick<DirectorSpawnPlan, "type" | "rank">[]) {
  const counts: Record<EnemyPressureRole, number> = { pursuit: 0, ranged: 0, specialist: 0, boss: 0 };
  const ordinaryCounts: Record<"pursuit" | "ranged" | "specialist", number> = {
    pursuit: 0, ranged: 0, specialist: 0,
  };
  for (const plan of plans) {
    const role = plan.rank ? (plan.rank === "mini-boss" ? "boss" : "specialist") : pressureRoleOf(plan.type);
    const cost = plan.rank === "elite" ? 15 : plan.rank === "mini-boss" ? 40 : ENEMY_THREAT_COST[plan.type];
    counts[role] += cost;
    if (!plan.rank && role !== "boss") ordinaryCounts[role] += cost;
  }
  const ordinary = ordinaryCounts.pursuit + ordinaryCounts.ranged + ordinaryCounts.specialist;
  return {
    ...counts,
    pursuitShare: ordinary > 0 ? ordinaryCounts.pursuit / ordinary : 0,
    rangedShare: ordinary > 0 ? ordinaryCounts.ranged / ordinary : 0,
    specialistShare: ordinary > 0 ? ordinaryCounts.specialist / ordinary : 0,
  };
}
