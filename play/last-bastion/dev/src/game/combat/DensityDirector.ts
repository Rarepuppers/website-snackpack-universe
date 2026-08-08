import type { EnemyType } from "../content/enemyCatalog";
import { eliteKindsForWave, isFastElite, type EliteKind } from "./EliteCadence";

export type EnemyPressureRole = "pursuit" | "ranged" | "specialist" | "boss";
export type DirectorSpawnRank = "elite" | "mini-boss" | "boss";

export interface DirectorSpawnPlan {
  atSeconds: number;
  type: EnemyType;
  threatCost: number;
  rank?: DirectorSpawnRank;
  eliteKind?: EliteKind;
}

export interface DensityWaveDefinition {
  liveCap: number;
  threatBudget: number;
  durationSeconds: number | null;
  timerEndsWave: boolean;
  plans: readonly DirectorSpawnPlan[];
}

export const DENSITY_LIVE_CAPS = Object.freeze([18, 24, 32, 42, 46, 52, 52, 56, 56, 56] as const);
export const WAVE_THREAT_BUDGETS = Object.freeze([30, 45, 65, 90, 120, 120, 150, 180, 210, 40] as const);
export const WAVE_DURATIONS_SECONDS = Object.freeze([20, 20, 30, 35, null, 40, 45, 50, 60, null] as const);
export const ENEMY_PROJECTILE_BUDGET = 6;
export const MAX_RANGED_WINDUPS = 2;
export const DENSITY_CAPACITY_ENEMY_COUNT = 56;

const ROLE: Readonly<Record<EnemyType, EnemyPressureRole>> = Object.freeze({
  scuttler: "pursuit",
  "swarm-scuttler": "pursuit",
  "infected-survivor": "pursuit",
  "corrupted-marine": "ranged",
  abomination: "specialist",
  "nest-weaver": "specialist",
  "nest-pod": "specialist",
  "nest-hatchling": "pursuit",
  "storm-savant": "ranged",
  "storm-node": "specialist",
  "scrap-skitterer": "pursuit",
  "arc-warden": "ranged",
  "cyborg-reclaimer": "specialist",
  "foundry-fabricator": "specialist",
  "foundry-pad": "specialist",
  "foundry-drone": "pursuit",
  "foundry-turret": "ranged",
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
  "rift-stalker": "boss",
  "synapse-herald": "boss",
  "assembly-prime": "boss",
  "storm-regent": "boss",
  "abomination-prime": "boss",
  "bastion-eater": "boss",
});

export const ENEMY_THREAT_COST: Readonly<Record<EnemyType, number>> = Object.freeze({
  scuttler: 1,
  "swarm-scuttler": 1,
  "infected-survivor": 1,
  "corrupted-marine": 4,
  abomination: 8,
  // Includes three complete pod payloads (pod + three hatchlings) up front.
  "nest-weaver": 25,
  "nest-pod": 2,
  "nest-hatchling": 1,
  // Package cost includes two destructible conductive nodes.
  "storm-savant": 18,
  "storm-node": 2,
  "scrap-skitterer": 1,
  "arc-warden": 4,
  "cyborg-reclaimer": 6,
  // Includes the complete three-charge child package up front.
  "foundry-fabricator": 15,
  "foundry-pad": 0,
  "foundry-drone": 2,
  "foundry-turret": 3,
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
  "rift-stalker": 40,
  "synapse-herald": 40,
  "assembly-prime": 40,
  "storm-regent": 40,
  "abomination-prime": 40,
  "bastion-eater": 40,
});

export function pressureRoleOf(type: EnemyType): EnemyPressureRole {
  return ROLE[type];
}

export function buildDensityWave(index: number): DensityWaveDefinition {
  const waveIndex = Math.max(0, Math.min(index, WAVE_THREAT_BUDGETS.length - 1));
  const durationSeconds: number | null = WAVE_DURATIONS_SECONDS[waveIndex] ?? null;
  const composition: Array<{ type: EnemyType; count: number; rank?: DirectorSpawnRank; eliteKind?: EliteKind }> = waveIndex === 0
    ? [{ type: "scuttler", count: 30 }]
    : waveIndex === 1
      ? [
        { type: "scuttler", count: 27 },
        { type: "swarm-scuttler", count: 10 },
        { type: "egg-cluster", count: 4 },
      ]
      : waveIndex === 2
        ? [
          { type: "scuttler", count: 22 }, { type: "infected-survivor", count: 6 }, { type: "brain-blob", count: 6 },
          { type: "blast-mite", count: 6 }, { type: "slime-spitter", count: 3 },
          { type: "quillback", count: 1 }, { type: "egg-cluster", count: 2 },
          { type: "warp-flanker", count: 1 },
        ]
        : waveIndex === 3
          ? [
            { type: "scuttler", count: 16 }, { type: "infected-survivor", count: 6 }, { type: "brain-blob", count: 4 },
            { type: "blast-mite", count: 6 }, { type: "razor-scuttler", count: 5 },
            { type: "ripper", count: 1 }, { type: "slime-spitter", count: 3 },
            { type: "corrupted-marine", count: 1 }, { type: "warp-flanker", count: 1 },
            { type: "egg-cluster", count: 1 }, { type: "tether-bloom", count: 1 },
            { type: "spinewheel", count: 1 },
            { type: "scuttler", count: 1, rank: "elite", eliteKind: "carapace-scuttler" },
          ]
          : waveIndex === 4
            ? [
            { type: "siege-crusher", count: 1, rank: "mini-boss" },
            { type: "scuttler", count: 21 }, { type: "infected-survivor", count: 6 }, { type: "brain-blob", count: 5 },
            { type: "blast-mite", count: 6 }, { type: "razor-scuttler", count: 4 },
            { type: "ripper", count: 1 }, { type: "slime-spitter", count: 3 },
            { type: "corrupted-marine", count: 1 }, { type: "warp-flanker", count: 2 },
            { type: "tether-bloom", count: 1 }, { type: "spinewheel", count: 1 },
            ]
            : waveIndex >= 5 && waveIndex <= 8
              ? lateWaveComposition(waveIndex + 1)
              : [{ type: "bastion-eater", count: 1, rank: "boss" }];
  const plans = scheduleInPulses(composition, durationSeconds ?? 30);
  if (waveIndex === 1) {
    for (const plan of plans) {
      if (plan.type === "swarm-scuttler") plan.atSeconds = 5.2;
    }
    plans.sort((left, right) => left.atSeconds - right.atSeconds);
  }
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

/**
 * Task 48 node-wave adapter. It preserves the authored pressure mix from the
 * nearest Quick Drop wave while fitting an exact campaign budget. Quick Drop
 * itself continues to call `buildDensityWave` unchanged.
 */
export function buildBudgetDensityWave(
  threatBudget: number,
  depthIndex: number,
  timerEndsWave: boolean,
  allowAmbientElite = true,
  spawnCadenceMultiplier = 1,
): DensityWaveDefinition {
  const budget = Math.max(1, Math.floor(threatBudget));
  const templateIndex = budget <= 30 ? 0
    : budget <= 45 ? 1
      : budget <= 65 ? 2
        : budget <= 90 ? 3
          : budget <= 120 ? 5
            : budget <= 160 ? 6 : 7;
  const template = buildDensityWave(templateIndex);
  const candidates = template.plans.filter((plan) => (
    plan.rank !== "mini-boss"
    && plan.rank !== "boss"
    && (allowAmbientElite || plan.rank !== "elite")
  ));
  const selected: DirectorSpawnPlan[] = [];
  let spent = 0;
  for (const candidate of candidates) {
    if (spent + candidate.threatCost > budget) continue;
    selected.push({ ...candidate });
    spent += candidate.threatCost;
  }
  while (spent < budget) {
    selected.push({ atSeconds: 0, type: "scuttler", threatCost: 1 });
    spent += 1;
  }
  const durationSeconds = budget <= 45 ? 20
    : budget <= 65 ? 30
      : budget <= 90 ? 35
        : budget <= 120 ? 40
          : budget <= 140 ? 45
            : budget <= 160 ? 50 : 55;
  const safeCadenceMultiplier = Number.isFinite(spawnCadenceMultiplier)
    ? Math.max(1, Math.min(2, spawnCadenceMultiplier))
    : 1;
  const pulseIntervalSeconds = 2.5 / safeCadenceMultiplier;
  // Keep the authored number of pulses and compress their spacing. Increasing
  // the count as the interval shrinks would merely spread the same budget back
  // across the full timer and make the modifier imperceptible.
  const pulseCount = Math.max(1, Math.floor((durationSeconds - 0.5) / 2.5) + 1);
  selected.forEach((plan, index) => {
    plan.atSeconds = 0.2 + Math.floor(index * pulseCount / selected.length) * pulseIntervalSeconds;
  });
  selected.sort((left, right) => left.atSeconds - right.atSeconds);
  const depth = Math.max(0, Math.min(8, Math.floor(depthIndex)));
  return {
    liveCap: DENSITY_LIVE_CAPS[depth]!,
    threatBudget: budget,
    durationSeconds,
    timerEndsWave,
    plans: selected,
  };
}

function scheduleInPulses(
  composition: readonly { type: EnemyType; count: number; rank?: DirectorSpawnRank; eliteKind?: EliteKind }[],
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
        eliteKind: entry.eliteKind,
        threatCost: entry.rank === "elite"
          ? (entry.eliteKind && isFastElite(entry.eliteKind) ? 18 : 15)
          : entry.rank === "mini-boss" || entry.rank === "boss" ? 40 : ENEMY_THREAT_COST[entry.type],
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

/**
 * The machine / summoner faction — Scrap Skitterer, Arc Warden, Cyborg
 * Reclaimer, Foundry Fabricator, Storm Savant, Nest Weaver — is fully built,
 * costed and steering-aware, but reachable only via `?scenario=` because it is
 * held out of live waves pending its art batch.
 *
 * **Released 26 July 2026**, alongside the weapon release. The machine-faction
 * art already exists (the outstanding item was mixed-wave acceptance, not
 * production), and shipping twelve new weapons against an unchanged enemy
 * roster would have been a one-sided power spike.
 *
 * The swaps below are threat-neutral by construction: each wave adds exactly as
 * much threat as it removes, so `buildDensityWave`'s exact budget invariant
 * holds in either state, and `machineFactionThreatDelta` is asserted to be zero
 * for every wave. The constant stays so the faction can be pulled back out for a
 * balance probe without unpicking the swaps.
 */
export const MACHINE_FACTION_IN_WAVES = true;

interface MachineWaveSwap {
  /** Machine-faction units introduced to this wave. */
  add: readonly { type: EnemyType; count: number }[];
  /** Existing units removed to pay for them, keyed by type. */
  reduce: Readonly<Partial<Record<EnemyType, number>>>;
}

/**
 * Introduces the faction from wave 6 and escalates: cheap harassers first, then
 * a controller, then the two summoners whose costs already bundle their
 * spawned children.
 */
const MACHINE_WAVE_SWAPS: Readonly<Record<number, MachineWaveSwap>> = Object.freeze({
  6: {
    add: [{ type: "scrap-skitterer", count: 1 }, { type: "arc-warden", count: 1 }],
    reduce: { "tether-bloom": 1, "warp-flanker": 1 },
  },
  7: {
    add: [
      { type: "cyborg-reclaimer", count: 1 },
      { type: "arc-warden", count: 1 },
      { type: "scrap-skitterer", count: 2 },
    ],
    reduce: { "slime-spitter": 2, quillback: 1, "warp-flanker": 1 },
  },
  8: {
    add: [{ type: "foundry-fabricator", count: 1 }],
    reduce: { "slime-spitter": 4, "tether-bloom": 1 },
  },
  9: {
    add: [{ type: "storm-savant", count: 1 }],
    reduce: { "slime-spitter": 6 },
  },
});

/**
 * **Nest Weaver is deliberately absent from these swaps.** At 25 threat it does
 * not fit any late wave under all three standing constraints at once:
 * `buildDensityWave`'s exact-budget invariant, the ≥0.65 pursuit-share floor
 * (so it cannot be paid for with scuttlers), and the authored Corrupted Human
 * promotion curve (so it cannot be paid for with corrupted-marine/abomination).
 * The remaining non-pursuit threat in wave 9 tops out at 29 and is already spent
 * on Storm Savant. It needs either a budget change or a home in the expedition
 * budget waves — a tuning decision, not a wiring one, and better made with
 * playtest data than by arithmetic.
 */
export const MACHINE_FACTION_UNPLACED: readonly EnemyType[] = Object.freeze(["nest-weaver"]);

/**
 * Added threat minus removed threat for one wave's machine swap. Zero means the
 * swap can be flipped on without touching any budget — which the density tests
 * assert for every wave, so a future edit cannot silently unbalance the flip.
 */
export function machineFactionThreatDelta(waveNumber: number): number {
  const swap = MACHINE_WAVE_SWAPS[waveNumber];
  if (!swap) return 0;
  const added = swap.add.reduce((sum, entry) => sum + ENEMY_THREAT_COST[entry.type] * entry.count, 0);
  const removed = (Object.entries(swap.reduce) as [EnemyType, number][])
    .reduce((sum, [type, count]) => sum + ENEMY_THREAT_COST[type] * count, 0);
  return added - removed;
}

function applyMachineFaction(
  waveNumber: number,
  ordinary: Array<{ type: EnemyType; count: number }>,
): Array<{ type: EnemyType; count: number }> {
  const swap = MACHINE_WAVE_SWAPS[waveNumber];
  if (!MACHINE_FACTION_IN_WAVES || !swap) return ordinary;
  const adjusted = ordinary
    .map((slot) => {
      const reduction = swap.reduce[slot.type] ?? 0;
      return reduction > 0 ? { ...slot, count: slot.count - reduction } : slot;
    })
    .filter((slot) => slot.count > 0);
  return [...adjusted, ...swap.add.map((entry) => ({ ...entry }))];
}

function lateWaveComposition(
  waveNumber: number,
): Array<{ type: EnemyType; count: number; rank?: DirectorSpawnRank; eliteKind?: EliteKind }> {
  const elites = eliteKindsForWave(waveNumber, waveNumber % 2 === 0 ? 0.25 : 0.75).map((eliteKind) => ({
    type: eliteKind === "carapace-scuttler" ? "scuttler" as const
      : eliteKind === "razorlord" ? "razor-scuttler" as const
        : eliteKind === "blightspitter" ? "slime-spitter" as const : "quillback" as const,
    count: 1,
    rank: "elite" as const,
    eliteKind,
  }));
  const ordinary = waveNumber === 6
    ? [
      entry("scuttler", 31), entry("infected-survivor", 8), entry("swarm-scuttler", 10), entry("blast-mite", 8), entry("razor-scuttler", 8),
      entry("slime-spitter", 6), entry("corrupted-marine", 1), entry("tether-bloom", 2), entry("warp-flanker", 2),
    ]
    : waveNumber === 7
      ? [
        entry("scuttler", 40), entry("infected-survivor", 10), entry("swarm-scuttler", 10), entry("blast-mite", 8), entry("razor-scuttler", 12),
        entry("slime-spitter", 6), entry("corrupted-marine", 1), entry("quillback", 1), entry("abomination", 1), entry("warp-flanker", 1), entry("spinewheel", 1),
      ]
      : waveNumber === 8
        ? [
          entry("scuttler", 47), entry("infected-survivor", 10), entry("swarm-scuttler", 10), entry("blast-mite", 10), entry("razor-scuttler", 13),
          entry("slime-spitter", 7), entry("corrupted-marine", 2), entry("tether-bloom", 1), entry("warp-flanker", 2), entry("abomination", 1),
        ]
        : [
          entry("scuttler", 58), entry("infected-survivor", 12), entry("swarm-scuttler", 10), entry("blast-mite", 12), entry("razor-scuttler", 16),
          entry("slime-spitter", 9), entry("corrupted-marine", 2), entry("abomination", 2), entry("warp-flanker", 1),
        ];
  return [...applyMachineFaction(waveNumber, ordinary), ...elites];
}

function entry(type: EnemyType, count: number): { type: EnemyType; count: number } {
  return { type, count };
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

export function pressureShares(
  plans: readonly Pick<DirectorSpawnPlan, "type" | "rank" | "eliteKind" | "threatCost">[],
) {
  const counts: Record<EnemyPressureRole, number> = { pursuit: 0, ranged: 0, specialist: 0, boss: 0 };
  const ordinaryCounts: Record<"pursuit" | "ranged" | "specialist", number> = {
    pursuit: 0, ranged: 0, specialist: 0,
  };
  for (const plan of plans) {
    const role = plan.rank ? (plan.rank === "mini-boss" || plan.rank === "boss" ? "boss" : "specialist") : pressureRoleOf(plan.type);
    const cost = plan.rank === "elite" ? plan.threatCost ?? 15 : plan.rank === "mini-boss" || plan.rank === "boss" ? 40 : ENEMY_THREAT_COST[plan.type];
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
