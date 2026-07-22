import { describe, expect, it } from "vitest";
import {
  buildDensityCapacityRoster,
  buildDensityWave,
  DENSITY_CAPACITY_ENEMY_COUNT,
  DENSITY_LIVE_CAPS,
  pressureRoleOf,
  pressureShares,
  WAVE_DURATIONS_SECONDS,
  WAVE_THREAT_BUDGETS,
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
    expect(DENSITY_LIVE_CAPS).toEqual([18, 24, 32, 42, 46, 52, 52, 56, 56, 56]);
    expect(Array.from({ length: 10 }, (_, index) => buildDensityWave(index).liveCap)).toEqual(DENSITY_LIVE_CAPS);
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
    const pursuitCount = roster.filter((type) => pressureRoleOf(type) === "pursuit").length;
    const rangedCount = roster.filter((type) => pressureRoleOf(type) === "ranged").length;
    expect(pursuitCount / roster.length).toBeGreaterThanOrEqual(0.65);
    expect(rangedCount / roster.length).toBeLessThanOrEqual(0.25);
  });

  it("produces stable sorted wave plans", () => {
    const first = buildDensityWave(3).plans;
    const second = buildDensityWave(3).plans;
    expect(first).toEqual(second);
    expect(first.every((plan, index) => index === 0 || plan.atSeconds >= first[index - 1]!.atSeconds)).toBe(true);
  });

  it("deploys the wave-two swarm as one readable speed pulse", () => {
    const swarm = buildDensityWave(1).plans.filter((plan) => plan.type === "swarm-scuttler");
    expect(swarm).toHaveLength(10);
    expect(new Set(swarm.map((plan) => plan.atSeconds))).toEqual(new Set([5.2]));
  });

  it("spends each authored threat budget in readable pulses", () => {
    for (let index = 0; index < WAVE_THREAT_BUDGETS.length; index += 1) {
      const wave = buildDensityWave(index);
      expect(wave.threatBudget).toBe(WAVE_THREAT_BUDGETS[index]);
      expect(wave.durationSeconds).toBe(WAVE_DURATIONS_SECONDS[index]);
      expect(wave.plans.reduce((sum, plan) => sum + plan.threatCost, 0)).toBe(wave.threatBudget);
      if (wave.plans.length > 1) {
        expect(new Set(wave.plans.map((plan) => plan.atSeconds)).size).toBeLessThan(wave.plans.length);
      }
    }
  });

  it("carries the authored elite cadence into waves six through nine", () => {
    for (let index = 5; index <= 8; index += 1) {
      const elites = buildDensityWave(index).plans.filter((plan) => plan.rank === "elite");
      expect(elites.length).toBe(index >= 7 ? 2 : 1);
      expect(elites.filter((plan) => plan.threatCost === 18).length).toBeLessThanOrEqual(1);
    }
    expect(buildDensityWave(9).plans).toMatchObject([{ type: "bastion-eater", rank: "boss" }]);
  });

  it("promotes Corrupted Humans gradually without changing threat or pressure shares", () => {
    const expected = [
      [0, 0, 0], [0, 0, 0], [6, 0, 0], [6, 1, 0], [6, 1, 0],
      [8, 1, 0], [10, 1, 1], [10, 2, 1], [12, 2, 2], [0, 0, 0],
    ] as const;
    for (let index = 0; index < expected.length; index += 1) {
      const wave = buildDensityWave(index);
      const counts = ["infected-survivor", "corrupted-marine", "abomination"].map((type) => (
        wave.plans.filter((plan) => plan.type === type).length
      ));
      expect(counts, `wave ${index + 1}`).toEqual(expected[index]);
      if (index >= 2 && index <= 8) {
        const shares = pressureShares(wave.plans);
        expect(shares.pursuitShare).toBeGreaterThanOrEqual(0.65);
        expect(shares.rangedShare).toBeLessThanOrEqual(0.25);
        expect(wave.plans.filter((plan) => plan.type === "corrupted-marine").length).toBeLessThanOrEqual(2);
        expect(wave.plans.filter((plan) => plan.type === "abomination").length).toBeLessThanOrEqual(2);
      }
    }
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
