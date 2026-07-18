import { ENEMY_CATALOG } from "../content/enemyCatalog";
import { experienceThreshold } from "../hero/LevelGrowth";
import { buildDensityWave } from "./DensityDirector";

export interface ReferenceWaveResult {
  waveNumber: number;
  availableExperience: number;
  securedExperience: number;
  levelAfterWave: number;
}

export interface ReferenceRunResult {
  waves: readonly ReferenceWaveResult[];
  totalAvailableExperience: number;
  totalSecuredExperience: number;
  finalLevel: number;
}

/**
 * Deterministic tuning harness, not an aim bot. Early and kill-owned waves clear;
 * timed-wave capture falls as pressure rises. Elite XP is secured because elites
 * are priority targets. These assumptions are intentionally explicit and tested.
 */
export function measureReferenceRun(): ReferenceRunResult {
  const timedCapture = [1, 1, 0.35, 0.35, 1, 0.35, 0.3, 0.27, 0.24, 1] as const;
  let level = 1;
  let carriedExperience = 0;
  let totalAvailableExperience = 0;
  let totalSecuredExperience = 0;
  const waves: ReferenceWaveResult[] = [];

  for (let index = 0; index < 10; index += 1) {
    const plans = buildDensityWave(index).plans;
    const ordinaryAvailable = plans
      .filter((plan) => !plan.rank)
      .reduce((sum, plan) => sum + ENEMY_CATALOG[plan.type].experienceValue, 0);
    const priorityExperience = plans.reduce((sum, plan) => {
      if (plan.rank === "mini-boss") return sum + 60;
      if (plan.rank === "elite") return sum + (plan.threatCost === 18 ? 30 : 25);
      return sum;
    }, 0);
    const availableExperience = ordinaryAvailable + priorityExperience;
    const securedExperience = Math.round(ordinaryAvailable * timedCapture[index]!) + priorityExperience;
    totalAvailableExperience += availableExperience;
    totalSecuredExperience += securedExperience;
    carriedExperience += securedExperience;
    while (carriedExperience >= experienceThreshold(level)) {
      carriedExperience -= experienceThreshold(level);
      level += 1;
    }
    waves.push({ waveNumber: index + 1, availableExperience, securedExperience, levelAfterWave: level });
  }

  return { waves, totalAvailableExperience, totalSecuredExperience, finalLevel: level };
}
