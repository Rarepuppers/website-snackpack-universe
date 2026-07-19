import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  CombatSimulation,
  miniBossRepositionDirection,
  type MiniBossKind,
} from "./CombatSimulation";

describe("mini-boss setup movement", () => {
  it("closes from long range while traversing laterally", () => {
    const direction = miniBossRepositionDirection({ x: 0, y: 0 }, { x: 10, y: 0 }, 4, 1);
    expect(direction.x).toBeGreaterThan(0);
    expect(direction.y).toBeGreaterThan(0);
  });

  it("peels out of crowding range without losing the orbit", () => {
    const direction = miniBossRepositionDirection({ x: 8, y: 0 }, { x: 10, y: 0 }, 4, -1);
    expect(direction.x).toBeLessThan(0);
    expect(direction.y).toBeLessThan(0);
  });

  it("orbits at the preferred range and supports deterministic handedness", () => {
    const clockwise = miniBossRepositionDirection({ x: 6, y: 5 }, { x: 10, y: 5 }, 4, 1);
    const anticlockwise = miniBossRepositionDirection({ x: 6, y: 5 }, { x: 10, y: 5 }, 4, -1);
    expect(Math.abs(clockwise.x)).toBeLessThan(0.001);
    expect(clockwise.y).toBeGreaterThan(0.99);
    expect(anticlockwise.y).toBeLessThan(-0.99);
  });

  it.each([
    ["siege-crusher", "siege-crusher"],
    ["brood-warden", "brood-warden"],
    ["rift-stalker", "rift-stalker"],
  ] as const)("moves %s laterally during its opening setup", (scenario, kind) => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario, seed: 57 });
    const start = bossPosition(simulation, kind);
    let lateralTravel = 0;
    let previous = start;
    for (let frame = 0; frame < 38; frame += 1) {
      const snapshot = simulation.step(idleIntent(), 0.05);
      const current = snapshot.enemies.find((enemy) => enemy.miniBossKind === kind)!.position;
      lateralTravel += Math.abs(current.y - previous.y);
      previous = current;
    }
    expect(lateralTravel).toBeGreaterThan(0.25);
  });
});

function idleIntent(): PlayerIntent {
  return {
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
}

function bossPosition(simulation: CombatSimulation, kind: MiniBossKind) {
  return simulation.snapshot().enemies.find((enemy) => enemy.miniBossKind === kind)!.position;
}
