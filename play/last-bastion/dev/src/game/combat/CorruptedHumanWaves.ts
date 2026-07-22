import { ENEMY_THREAT_COST, MAX_RANGED_WINDUPS, type DirectorSpawnPlan } from "./DensityDirector";

export interface CorruptedHumanWavePlan {
  readonly id: "introduction" | "crossfire" | "overrun";
  readonly liveCap: number;
  readonly threatBudget: number;
  readonly plans: readonly DirectorSpawnPlan[];
}

export const CORRUPTED_HUMAN_WAVES: readonly CorruptedHumanWavePlan[] = Object.freeze([
  wave("introduction", 8, [
    ...repeat("infected-survivor", 6, 0.55),
    spawn("corrupted-marine", 1.6),
  ]),
  wave("crossfire", 10, [
    ...repeat("infected-survivor", 6, 0.48),
    spawn("corrupted-marine", 1.4),
    spawn("corrupted-marine", 4.2),
    spawn("abomination", 5.5),
  ]),
  wave("overrun", 12, [
    ...repeat("infected-survivor", 8, 0.42),
    spawn("corrupted-marine", 1.2),
    spawn("corrupted-marine", 4.8),
    spawn("abomination", 3.2),
    spawn("abomination", 8.2),
  ]),
]);

export function validateCorruptedHumanWave(wavePlan: CorruptedHumanWavePlan): readonly string[] {
  const errors: string[] = [];
  if (wavePlan.plans.length > wavePlan.liveCap) errors.push("live cap exceeded");
  const threat = wavePlan.plans.reduce((total, plan) => total + plan.threatCost, 0);
  if (threat > wavePlan.threatBudget) errors.push("threat budget exceeded");
  const ranged = wavePlan.plans.filter((plan) => plan.type === "corrupted-marine").length;
  if (ranged > MAX_RANGED_WINDUPS) errors.push("ranged windup cap exceeded");
  if (wavePlan.plans.some((plan) => !["infected-survivor", "corrupted-marine", "abomination"].includes(plan.type))) {
    errors.push("foreign enemy family");
  }
  return errors;
}

function wave(id: CorruptedHumanWavePlan["id"], liveCap: number, plans: readonly DirectorSpawnPlan[]): CorruptedHumanWavePlan {
  return Object.freeze({
    id,
    liveCap,
    threatBudget: plans.reduce((total, plan) => total + plan.threatCost, 0),
    plans: Object.freeze([...plans].sort((left, right) => left.atSeconds - right.atSeconds)),
  });
}

function repeat(type: "infected-survivor", count: number, interval: number): readonly DirectorSpawnPlan[] {
  return Array.from({ length: count }, (_, index) => spawn(type, index * interval));
}

function spawn(type: "infected-survivor" | "corrupted-marine" | "abomination", atSeconds: number): DirectorSpawnPlan {
  return { type, atSeconds, threatCost: ENEMY_THREAT_COST[type] };
}
