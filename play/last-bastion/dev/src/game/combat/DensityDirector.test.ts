import { describe, expect, it } from "vitest";
import {
  buildDensityCapacityRoster,
  buildDensityWave,
  DENSITY_CAPACITY_ENEMY_COUNT,
  DENSITY_LIVE_CAPS,
  pressureShares,
} from "./DensityDirector";
import { CombatSimulation } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";

const IDLE_INTENT: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 1, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  interactPressed: false,
  ultimatePressed: false,
  kitPressed: false,
  pausePressed: false,
  restartPressed: false,
};

describe("density director v3", () => {
  it("uses the accepted live-cap ladder", () => {
    expect(DENSITY_LIVE_CAPS).toEqual([18, 24, 32, 42, 46]);
    expect(Array.from({ length: 5 }, (_, index) => buildDensityWave(index).liveCap)).toEqual(DENSITY_LIVE_CAPS);
  });

  it("keeps ordinary mixed waves pursuit-led with bounded ranged pressure", () => {
    for (const wave of [buildDensityWave(2), buildDensityWave(3), buildDensityWave(4)]) {
      const shares = pressureShares(wave.plans);
      expect(shares.pursuitShare).toBeGreaterThanOrEqual(0.65);
      expect(shares.pursuitShare).toBeLessThanOrEqual(0.75);
      expect(shares.rangedShare).toBeGreaterThanOrEqual(0.1);
      expect(shares.rangedShare).toBeLessThanOrEqual(0.25);
    }
  });

  it("builds an exact deterministic 56-enemy capacity roster", () => {
    const roster = buildDensityCapacityRoster();
    expect(roster).toHaveLength(DENSITY_CAPACITY_ENEMY_COUNT);
    const shares = pressureShares(roster.map((type) => ({ type })));
    expect(shares.pursuitShare).toBeGreaterThanOrEqual(0.65);
    expect(shares.rangedShare).toBeLessThanOrEqual(0.25);
  });

  it("produces stable sorted wave plans", () => {
    const first = buildDensityWave(3).plans;
    const second = buildDensityWave(3).plans;
    expect(first).toEqual(second);
    expect(first.every((plan, index) => index === 0 || plan.atSeconds >= first[index - 1]!.atSeconds)).toBe(true);
  });

  it("keeps the capacity lab pinned at 56 while enforcing hostile projectile pressure", () => {
    const simulation = new CombatSimulation({ scenario: "density-capacity", seed: 734 });
    for (let frame = 0; frame < 600; frame += 1) {
      simulation.step(IDLE_INTENT, 1 / 60);
    }
    const snapshot = simulation.snapshot();
    expect(snapshot.enemies).toHaveLength(DENSITY_CAPACITY_ENEMY_COUNT);
    expect(snapshot.playerHealth).toBe(snapshot.playerMaxHealth);
    expect(snapshot.pendingDecision).toBeNull();
    expect(snapshot.density.peakLiveEnemies).toBe(DENSITY_CAPACITY_ENEMY_COUNT);
    expect(snapshot.density.peakEnemyProjectiles).toBeLessThanOrEqual(snapshot.density.projectileBudget);
    expect(snapshot.density.pressureSpawned.pursuit).toBe(40);
    expect(snapshot.density.pressureSpawned.ranged).toBe(8);
    expect(snapshot.density.pressureSpawned.specialist).toBe(8);
  });
});
