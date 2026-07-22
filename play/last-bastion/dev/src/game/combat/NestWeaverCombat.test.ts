import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent, type CombatSnapshot } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  ultimatePressed: false,
  pausePressed: false,
  interactPressed: false,
  kitPressed: false,
  restartPressed: false,
};

function advance(simulation: CombatSimulation, seconds: number): {
  snapshot: CombatSnapshot;
  events: CombatEvent[];
} {
  let snapshot = simulation.snapshot();
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    snapshot = simulation.step(IDLE, 0.05);
    events.push(...snapshot.events);
  }
  return { snapshot, events };
}

function createLab(): CombatSimulation {
  const simulation = new CombatSimulation({ autoStartWaves: false, seed: 63063 });
  simulation.spawnEnemy("nest-weaver", { x: 7, y: 8.4 });
  return simulation;
}

describe("Nest Weaver live behavior gate", () => {
  it("locks placement, lays one destructible pod, and enters exposed recovery", () => {
    const simulation = createLab();
    const result = advance(simulation, 2);
    const warning = result.events.find((event) => event.type === "nest-weaver-placement-warning");
    const laid = result.events.find((event) => event.type === "nest-pod-laid");
    expect(warning).toMatchObject({ type: "nest-weaver-placement-warning", enemyId: 1 });
    expect(laid).toMatchObject({ type: "nest-pod-laid", ownerId: 1, hatchSeconds: 6 });
    expect(result.snapshot.enemies.find((enemy) => enemy.type === "nest-weaver"))
      .toMatchObject({ nestWeaverPhase: "recovery", nestWeaverChargesRemaining: 2 });
    expect(result.snapshot.enemies.find((enemy) => enemy.type === "nest-pod"))
      .toMatchObject({ health: 9, maxHealth: 9, nestPodOwnerId: 1 });
  });

  it("hatches exactly three non-recursive children after the six-second clock", () => {
    const simulation = createLab();
    const result = advance(simulation, 8);
    expect(result.events.filter((event) => event.type === "nest-pod-hatched")).toHaveLength(1);
    expect(result.snapshot.enemies.filter((enemy) => enemy.type === "nest-hatchling")).toHaveLength(3);
    // The finite-charge Weaver may already have laid its second pod; only the
    // first payload may hatch during this window.
    expect(result.snapshot.enemies.filter((enemy) => enemy.type === "nest-pod").length).toBeLessThanOrEqual(1);
    expect(result.snapshot.enemies.filter((enemy) => enemy.type === "nest-weaver")).toHaveLength(1);
  });

  it("releases the reserved hatch payload when the pod is destroyed in time", () => {
    const simulation = createLab();
    const laid = advance(simulation, 2).snapshot.enemies.find((enemy) => enemy.type === "nest-pod");
    expect(laid).toBeDefined();
    expect(simulation.dealDamage(laid!.id, 100)).toBe(true);
    const result = advance(simulation, 6.5);
    expect(result.snapshot.enemies.filter((enemy) => enemy.type === "nest-hatchling")).toHaveLength(0);
    expect(result.events.filter((event) => event.type === "nest-pod-hatched")).toHaveLength(0);
  });

  it("keeps the dedicated route inside its 18-unit reservation cap", () => {
    const simulation = new CombatSimulation({ scenario: "nest-weaver", seed: 63063 });
    let peakReservedFootprint = 0;
    for (let elapsed = 0; elapsed < 18; elapsed += 0.05) {
      const snapshot = simulation.step(IDLE, 0.05);
      const pods = snapshot.enemies.filter((enemy) => enemy.type === "nest-pod").length;
      peakReservedFootprint = Math.max(peakReservedFootprint, snapshot.enemies.length + pods * 3);
    }
    expect(peakReservedFootprint).toBeLessThanOrEqual(18);
  });
});
