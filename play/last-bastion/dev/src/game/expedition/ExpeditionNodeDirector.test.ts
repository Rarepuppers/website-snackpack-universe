import { describe, expect, it } from "vitest";
import { buildBudgetDensityWave } from "../combat/DensityDirector";
import { buildExpeditionWavePlan, combatNodeBudgets } from "./ExpeditionNodeDirector";

describe("Task 48 expedition node director with Task 49 tuning", () => {
  it("locks the campaign budget curve and fourth-wave threshold", () => {
    expect(combatNodeBudgets(0)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(2)).toEqual([45, 65, 90]);
    expect(combatNodeBudgets(3)).toEqual([65, 90, 120, 140]);
    expect(combatNodeBudgets(7)).toEqual([120, 140, 160, 180]);
  });

  it("builds exact ordinary budgets without importing boss ranks", () => {
    for (const budget of [30, 45, 52, 65, 72, 90, 96, 108, 112, 120, 140, 160, 180]) {
      const wave = buildBudgetDensityWave(budget, 5, budget >= 65);
      expect(wave.plans.reduce((sum, spawn) => sum + spawn.threatCost, 0)).toBe(budget);
      expect(wave.plans.some((spawn) => spawn.rank === "boss" || spawn.rank === "mini-boss")).toBe(false);
    }
  });

  it("gives Elite, Mini-boss, and Boss nodes authored terminal waves", () => {
    const elite = buildExpeditionWavePlan("elite", 6, "razorlord", null);
    expect(elite.map((wave) => wave.kind)).toEqual(["ordinary", "ordinary", "elite"]);
    expect(elite[2]!.eliteKind).toBe("razorlord");
    expect(elite[2]!.timerEndsWave).toBe(false);

    const mini = buildExpeditionWavePlan("mini-boss", 6, null, "rift-stalker");
    expect(mini.map((wave) => wave.kind)).toEqual(["ordinary", "mini-boss"]);
    expect(mini[1]!.miniBossKind).toBe("rift-stalker");

    expect(buildExpeditionWavePlan("boss", 7, null, null).map((wave) => wave.kind)).toEqual(["boss"]);
    expect(buildExpeditionWavePlan("supply-depot", 4, null, null)).toEqual([]);
  });

  it("inherits the conservative Corrupted Human depth curve without changing node routes", () => {
    const family = (budget: number) => buildBudgetDensityWave(budget, 6, true).plans
      .filter((spawn) => ["infected-survivor", "corrupted-marine", "abomination"].includes(spawn.type))
      .map((spawn) => spawn.type);
    expect(family(45)).toEqual([]);
    expect(family(65)).toContain("infected-survivor");
    expect(family(65)).not.toContain("corrupted-marine");
    expect(family(90)).toContain("corrupted-marine");
    expect(family(120)).not.toContain("abomination");
    expect(family(140)).toContain("abomination");
    expect(combatNodeBudgets(0)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(7)).toEqual([120, 140, 160, 180]);
  });
});
