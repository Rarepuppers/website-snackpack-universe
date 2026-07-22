import { describe, expect, it } from "vitest";
import { CORRUPTED_HUMAN_WAVES, validateCorruptedHumanWave } from "./CorruptedHumanWaves";
import { CombatSimulation } from "./CombatSimulation";
import { offscreenWarningPosition } from "./TelegraphRules";

describe("Corrupted Human mixed-wave plans", () => {
  it("stays inside live, threat, and ranged-windup budgets", () => {
    for (const wave of CORRUPTED_HUMAN_WAVES) {
      expect(validateCorruptedHumanWave(wave)).toEqual([]);
      expect(wave.plans.length).toBeLessThanOrEqual(wave.liveCap);
      expect(wave.plans.filter((plan) => plan.type === "corrupted-marine").length).toBeLessThanOrEqual(2);
    }
  });

  it("ramps from one readable role pair to the complete family", () => {
    expect(new Set(CORRUPTED_HUMAN_WAVES[0]!.plans.map((plan) => plan.type)))
      .toEqual(new Set(["infected-survivor", "corrupted-marine"]));
    expect(new Set(CORRUPTED_HUMAN_WAVES[1]!.plans.map((plan) => plan.type)))
      .toEqual(new Set(["infected-survivor", "corrupted-marine", "abomination"]));
    expect(CORRUPTED_HUMAN_WAVES.map((wave) => wave.threatBudget)).toEqual([10, 22, 32]);
  });

  it("rejects cap and budget regressions", () => {
    const base = CORRUPTED_HUMAN_WAVES[0]!;
    expect(validateCorruptedHumanWave({ ...base, liveCap: 1 })).toContain("live cap exceeded");
    expect(validateCorruptedHumanWave({ ...base, threatBudget: 1 })).toContain("threat budget exceeded");
  });

  it("populates the complete deterministic lab roster with an off-screen Marine", () => {
    const simulation = new CombatSimulation({ scenario: "corrupted-human", seed: 62062 });
    const snapshot = simulation.snapshot();
    const counts = Object.fromEntries(["infected-survivor", "corrupted-marine", "abomination"].map((type) => [
      type, snapshot.enemies.filter((enemy) => enemy.type === type).length,
    ]));
    expect(counts).toEqual({ "infected-survivor": 6, "corrupted-marine": 2, abomination: 1 });
    const viewport = {
      x: snapshot.playerPosition.x - 15,
      y: snapshot.playerPosition.y - 16.875 / 2,
      width: 30,
      height: 16.875,
    };
    expect(snapshot.enemies.some((enemy) => (
      enemy.type === "corrupted-marine" && offscreenWarningPosition(enemy.position, viewport) !== null
    ))).toBe(true);
  });
});
