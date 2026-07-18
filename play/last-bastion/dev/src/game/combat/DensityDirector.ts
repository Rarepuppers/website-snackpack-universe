import type { EnemyType } from "../content/enemyCatalog";

export type EnemyPressureRole = "pursuit" | "ranged" | "specialist" | "boss";
export type DirectorSpawnRank = "elite" | "mini-boss";

export interface DirectorSpawnPlan {
  atSeconds: number;
  type: EnemyType;
  rank?: DirectorSpawnRank;
}

export interface DensityWaveDefinition {
  liveCap: number;
  plans: readonly DirectorSpawnPlan[];
}

export const DENSITY_LIVE_CAPS = Object.freeze([18, 24, 32, 42, 46] as const);
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

export function pressureRoleOf(type: EnemyType): EnemyPressureRole {
  return ROLE[type];
}

export function buildDensityWave(index: number): DensityWaveDefinition {
  const plans: DirectorSpawnPlan[] = [];
  const add = (
    type: EnemyType,
    count: number,
    start: number,
    interval: number,
    rank?: DirectorSpawnRank,
  ): void => {
    for (let item = 0; item < count; item += 1) {
      plans.push({ type, atSeconds: start + item * interval, rank });
    }
  };

  switch (index) {
    case 0:
      add("scuttler", 18, 0.2, 0.62);
      break;
    case 1:
      add("scuttler", 20, 0.2, 0.58);
      add("egg-cluster", 4, 1.4, 2.25);
      break;
    case 2:
      add("scuttler", 19, 0.2, 0.48);
      add("brain-blob", 6, 1.1, 1.45);
      add("blast-mite", 6, 2.1, 1.2);
      add("slime-spitter", 4, 2.8, 2.45);
      add("quillback", 2, 4.4, 3.6);
      add("ripper", 2, 5.2, 3.4);
      add("egg-cluster", 4, 2, 2.2);
      add("warp-flanker", 2, 4.8, 3.5);
      break;
    case 3:
      add("scuttler", 25, 0.2, 0.42);
      add("brain-blob", 6, 1.3, 1.4);
      add("blast-mite", 8, 1.8, 1.05);
      add("razor-scuttler", 4, 3.2, 2.1);
      add("slime-spitter", 5, 2.5, 2.35);
      add("quillback", 2, 4.2, 3.8);
      add("warp-flanker", 3, 3, 2.6);
      add("tether-bloom", 2, 4.5, 3.5);
      add("spinewheel", 2, 5.2, 3.8);
      add("ripper", 2, 5.8, 3.4);
      add("egg-cluster", 2, 2.2, 4.4);
      add("scuttler", 1, 6.5, 1, "elite");
      break;
    default:
      add("siege-crusher", 1, 0.5, 1, "mini-boss");
      add("scuttler", 25, 1.2, 0.58);
      add("brain-blob", 5, 3, 1.9);
      add("blast-mite", 7, 3.8, 1.65);
      add("razor-scuttler", 4, 5, 2.4);
      add("slime-spitter", 5, 5.5, 3.1);
      add("quillback", 2, 7.2, 4.2);
      add("warp-flanker", 2, 6.4, 3.8);
      add("egg-cluster", 4, 3.4, 3.1);
      add("tether-bloom", 2, 7.4, 4.2);
      add("spinewheel", 2, 8.2, 4.4);
      add("ripper", 2, 8, 3.5);
      break;
  }

  return {
    liveCap: DENSITY_LIVE_CAPS[Math.min(index, DENSITY_LIVE_CAPS.length - 1)]!,
    plans: plans.sort((left, right) => left.atSeconds - right.atSeconds),
  };
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
  for (const plan of plans) {
    const role = plan.rank ? (plan.rank === "mini-boss" ? "boss" : "specialist") : pressureRoleOf(plan.type);
    counts[role] += 1;
  }
  const ordinary = counts.pursuit + counts.ranged + counts.specialist;
  return {
    ...counts,
    pursuitShare: ordinary > 0 ? counts.pursuit / ordinary : 0,
    rangedShare: ordinary > 0 ? counts.ranged / ordinary : 0,
    specialistShare: ordinary > 0 ? counts.specialist / ordinary : 0,
  };
}
