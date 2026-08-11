import type { EliteKind } from "../combat/EliteCadence";
import { elitePatrolKinds } from "../combat/EliteCadence";
import type { MiniBossKind } from "../combat/CombatSimulation";
import type { ExpeditionEncounterKind } from "./ExpeditionEncounter";
import { threatTierDefinition, type ThreatTier } from "./ThreatTier";

export type ExpeditionWaveKind = "ordinary" | "elite" | "mini-boss" | "boss";

export interface ExpeditionWavePlan {
  kind: ExpeditionWaveKind;
  directorWaveIndex: number;
  /** Ordinary escort budget. Authored elite/boss costs are additional. */
  threatBudget: number;
  timerEndsWave: boolean;
  eliteKind: EliteKind | null;
  miniBossKind: MiniBossKind | null;
  spawnCadenceMultiplier: number;
}

/** Task 48's pure, zero-based column-to-budget contract. */
export function combatNodeBudgets(column: number): readonly number[] {
  const depth = Math.max(0, Math.min(7, Math.floor(column)));
  if (depth <= 1) return Object.freeze([30, 45, 65]);
  // Task 49 protects the final onboarding column before mid-run shops begin.
  if (depth === 2) return Object.freeze([45, 65, 90]);
  if (depth <= 5) return Object.freeze([65, 90, 120, 140]);
  return Object.freeze([120, 140, 160, 180]);
}

export function buildExpeditionWavePlan(
  kind: ExpeditionEncounterKind,
  column: number,
  eliteKind: EliteKind | null,
  miniBossKind: MiniBossKind | null,
  threatTier: ThreatTier = 0,
): readonly ExpeditionWavePlan[] {
  const depth = Math.max(0, Math.min(8, Math.floor(column)));
  const combat = combatNodeBudgets(depth);
  const threat = threatTierDefinition(threatTier);
  const ordinary = (budget: number): ExpeditionWavePlan => ({
    kind: "ordinary",
    directorWaveIndex: depth,
    threatBudget: budget,
    timerEndsWave: budget >= 65,
    eliteKind: null,
    miniBossKind: null,
    spawnCadenceMultiplier: threat.spawnCadenceMultiplier,
  });

  if (kind === "combat") {
    const waves = combat.map(ordinary);
    for (const patrolKind of elitePatrolKinds(eliteKind ?? "carapace-scuttler", threat.elitePatrolCount)) {
      waves.push({
        kind: "elite",
        directorWaveIndex: depth,
        threatBudget: 0,
        timerEndsWave: false,
        eliteKind: patrolKind,
        miniBossKind: null,
        spawnCadenceMultiplier: threat.spawnCadenceMultiplier,
      });
    }
    return Object.freeze(waves);
  }
  if (kind === "liberation") {
    // Free the location, then trade. One ordinary wave at 0.9 of the node's top
    // budget — enough to be a real fight, short enough that the shop is the
    // point of the node rather than the reward for a slog.
    return Object.freeze([ordinary(Math.round(combat[combat.length - 1]! * 0.9))]);
  }
  if (kind === "elite") {
    // Phase 5: denser escorts. A rank fight should feel like a fight for the
    // arena, not a duel with bystanders.
    const lead = combat.slice(-2).map((budget) => ordinary(Math.round(budget * 0.9)));
    return Object.freeze([...lead, {
      kind: "elite",
      directorWaveIndex: depth,
      threatBudget: 0,
      timerEndsWave: false,
      eliteKind: eliteKind ?? "carapace-scuttler",
      miniBossKind: null,
      spawnCadenceMultiplier: threat.spawnCadenceMultiplier,
    }]);
  }
  if (kind === "mini-boss") {
    return Object.freeze([
      ordinary(Math.round(combat[combat.length - 1]! * 0.75)),
      {
        kind: "mini-boss",
        directorWaveIndex: depth,
        threatBudget: 0,
        timerEndsWave: false,
        eliteKind: null,
        miniBossKind: miniBossKind ?? "siege-crusher",
        spawnCadenceMultiplier: threat.spawnCadenceMultiplier,
      },
    ]);
  }
  if (kind === "boss") {
    return Object.freeze([{
      kind: "boss",
      directorWaveIndex: 9,
      threatBudget: 0,
      timerEndsWave: false,
      eliteKind: null,
      miniBossKind: null,
      spawnCadenceMultiplier: threat.spawnCadenceMultiplier,
    }]);
  }
  return Object.freeze([]);
}
