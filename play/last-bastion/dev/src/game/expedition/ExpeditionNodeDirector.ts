import type { EliteKind } from "../combat/EliteCadence";
import type { MiniBossKind } from "../combat/CombatSimulation";
import type { ExpeditionEncounterKind } from "./ExpeditionEncounter";

export type ExpeditionWaveKind = "ordinary" | "elite" | "mini-boss" | "boss";

export interface ExpeditionWavePlan {
  kind: ExpeditionWaveKind;
  directorWaveIndex: number;
  /** Ordinary escort budget. Authored elite/boss costs are additional. */
  threatBudget: number;
  timerEndsWave: boolean;
  eliteKind: EliteKind | null;
  miniBossKind: MiniBossKind | null;
}

/** Task 48's pure, zero-based column-to-budget contract. */
export function combatNodeBudgets(column: number): readonly number[] {
  const depth = Math.max(0, Math.min(7, Math.floor(column)));
  if (depth <= 1) return Object.freeze([30, 45, 65]);
  if (depth === 2) return Object.freeze([65, 90, 120]);
  if (depth <= 5) return Object.freeze([65, 90, 120, 140]);
  return Object.freeze([120, 140, 160, 180]);
}

export function buildExpeditionWavePlan(
  kind: ExpeditionEncounterKind,
  column: number,
  eliteKind: EliteKind | null,
  miniBossKind: MiniBossKind | null,
): readonly ExpeditionWavePlan[] {
  const depth = Math.max(0, Math.min(8, Math.floor(column)));
  const combat = combatNodeBudgets(depth);
  const ordinary = (budget: number): ExpeditionWavePlan => ({
    kind: "ordinary",
    directorWaveIndex: depth,
    threatBudget: budget,
    timerEndsWave: budget >= 65,
    eliteKind: null,
    miniBossKind: null,
  });

  if (kind === "combat") return Object.freeze(combat.map(ordinary));
  if (kind === "elite") {
    const lead = combat.slice(-2).map((budget) => ordinary(Math.round(budget * 0.8)));
    return Object.freeze([...lead, {
      kind: "elite",
      directorWaveIndex: depth,
      threatBudget: 0,
      timerEndsWave: false,
      eliteKind: eliteKind ?? "carapace-scuttler",
      miniBossKind: null,
    }]);
  }
  if (kind === "mini-boss") {
    return Object.freeze([
      ordinary(Math.round(combat[combat.length - 1]! * 0.6)),
      {
        kind: "mini-boss",
        directorWaveIndex: depth,
        threatBudget: 0,
        timerEndsWave: false,
        eliteKind: null,
        miniBossKind: miniBossKind ?? "siege-crusher",
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
    }]);
  }
  return Object.freeze([]);
}
