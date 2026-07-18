import { describe, expect, it } from "vitest";
import { eliteKindsForWave, isFastElite } from "./EliteCadence";
import { CombatSimulation } from "./CombatSimulation";

describe("elite cadence", () => {
  it("starts at wave four and guarantees elites from wave six", () => {
    expect(eliteKindsForWave(3, 0)).toEqual([]);
    expect(eliteKindsForWave(4, 0)).toEqual(["carapace-scuttler"]);
    for (const wave of [6, 7, 8, 9]) expect(eliteKindsForWave(wave, 0.7).length).toBeGreaterThan(0);
  });

  it("never schedules two fast elites together", () => {
    for (let wave = 1; wave <= 10; wave += 1) {
      for (const roll of [0.1, 0.9]) {
        expect(eliteKindsForWave(wave, roll).filter(isFastElite).length).toBeLessThanOrEqual(1);
      }
    }
  });

  it("maps every elite identity onto its live behavior family", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.spawnElite("carapace-scuttler", { x: 3, y: 3 });
    simulation.spawnElite("razorlord", { x: 4, y: 3 });
    simulation.spawnElite("blightspitter", { x: 5, y: 3 });
    simulation.spawnElite("quillback-matriarch", { x: 6, y: 3 });
    expect(simulation.snapshot().enemies.map(({ type, eliteKind, rank }) => ({ type, eliteKind, rank }))).toEqual([
      { type: "scuttler", eliteKind: "carapace-scuttler", rank: "elite" },
      { type: "razor-scuttler", eliteKind: "razorlord", rank: "elite" },
      { type: "slime-spitter", eliteKind: "blightspitter", rank: "elite" },
      { type: "quillback", eliteKind: "quillback-matriarch", rank: "elite" },
    ]);
  });
});
