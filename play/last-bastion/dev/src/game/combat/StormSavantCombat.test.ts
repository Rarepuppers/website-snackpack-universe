import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent, type CombatSnapshot } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
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
  const simulation = new CombatSimulation({ autoStartWaves: false, seed: 64064 });
  simulation.spawnEnemy("storm-savant", { x: 7, y: 12 });
  return simulation;
}

describe("Storm Savant live behavior gate", () => {
  it("places two nodes, warns on fixed rails, discharges once, and overloads", () => {
    const simulation = createLab();
    const result = advance(simulation, 2.2);
    const warnings = result.events.filter((event) => event.type === "storm-chain-warning");
    const discharges = result.events.filter((event) => event.type === "storm-chain-discharged");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ type: "storm-chain-warning", enemyId: 1 });
    expect(warnings[0]?.type === "storm-chain-warning" ? warnings[0].segments.length : 0)
      .toBeLessThanOrEqual(2);
    expect(discharges).toHaveLength(1);
    expect(result.snapshot.enemies.filter((enemy) => enemy.type === "storm-node")).toHaveLength(2);
    expect(result.snapshot.enemies.find((enemy) => enemy.type === "storm-savant")?.stormPhase)
      .toBe("overload-recovery");
  });

  it("destroying a locked node cancels the attack without a discharge", () => {
    const simulation = createLab();
    const warningWindow = advance(simulation, 0.9);
    const node = warningWindow.snapshot.enemies.find((enemy) => enemy.type === "storm-node");
    expect(node).toBeDefined();
    expect(simulation.dealDamage(node!.id, 99)).toBe(true);
    const result = advance(simulation, 0.2);
    expect(result.events.some((event) => event.type === "storm-chain-interrupted")).toBe(true);
    expect(result.events.some((event) => event.type === "storm-chain-discharged")).toBe(false);
    expect(result.snapshot.enemies.find((enemy) => enemy.type === "storm-savant")?.stormPhase)
      .toBe("overload-recovery");
  });

  it("keeps the dedicated route below its authored live cap", () => {
    const simulation = new CombatSimulation({ scenario: "storm-savant", seed: 64064 });
    let peak = 0;
    for (let elapsed = 0; elapsed < 12; elapsed += 0.05) {
      peak = Math.max(peak, simulation.step(IDLE, 0.05).enemies.length);
    }
    expect(peak).toBeLessThanOrEqual(18);
  });
});
