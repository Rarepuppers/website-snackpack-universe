import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, SCRAP_SKITTERER_PACK_CAP, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

function collect(simulation: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...simulation.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Scrap Skitterer live gate", () => {
  it("locks a visible rush and terminates against cover", () => {
    const arena: ArenaDefinition = {
      id: "skitter-cover",
      widthMetres: 12,
      heightMetres: 10,
      tileSizeMetres: 1,
      obstacles: [{ id: "wall", kind: "barricade", x: 5, y: 3, width: 1, height: 4 }],
    };
    const simulation = new CombatSimulation({ autoStartWaves: false, arena, widthMetres: 12, heightMetres: 10 });
    simulation.spawnEnemy("scrap-skitterer", { x: 1, y: 5 });
    const events = collect(simulation, 2.2);
    expect(events.some((event) => event.type === "scrap-skitterer-warning")).toBe(true);
    expect(events.some((event) => event.type === "scrap-skitterer-rush")).toBe(true);
    expect(events.some((event) => event.type === "scrap-skitterer-impact" && event.reason === "cover")).toBe(true);
    expect(simulation.snapshot().enemies[0]?.scrapSkittererPhase).toBe("brake");
  });

  it("takes amplified Shock damage", () => {
    const physical = new CombatSimulation({ autoStartWaves: false });
    const physicalId = physical.spawnEnemy("scrap-skitterer", { x: 3, y: 3 });
    physical.dealDamage(physicalId, 1, "physical");
    const shock = new CombatSimulation({ autoStartWaves: false });
    const shockId = shock.spawnEnemy("scrap-skitterer", { x: 3, y: 3 });
    shock.dealDamage(shockId, 1, "shock");
    expect(physical.snapshot().enemies[0]?.health).toBeCloseTo(3);
    expect(shock.snapshot().enemies[0]?.health).toBeCloseTo(2.5);
  });

  it("leaves a harmless expiring wreck and never applies slime movement", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnEnemy("scrap-skitterer", { ...simulation.snapshot().playerPosition });
    simulation.dealDamage(id, 99, "shock");
    const death = simulation.snapshot();
    expect(death.groundHazards).toHaveLength(1);
    expect(death.groundHazards[0]).toMatchObject({ type: "machine-wreck", durationSeconds: 1.8 });
    expect(death.playerSlowed).toBe(false);
    collect(simulation, 2);
    expect(simulation.snapshot().groundHazards).toHaveLength(0);
  });

  it("authors exactly one capped eight-unit lab pack", () => {
    const simulation = new CombatSimulation({ scenario: "scrap-skitterer", seed: 65065 });
    expect(simulation.snapshot().enemies.filter((enemy) => enemy.type === "scrap-skitterer"))
      .toHaveLength(SCRAP_SKITTERER_PACK_CAP);
    let peak = 0;
    for (let elapsed = 0; elapsed < 10; elapsed += 0.05) {
      peak = Math.max(peak, simulation.step(IDLE, 0.05).enemies.length);
    }
    expect(peak).toBeLessThanOrEqual(SCRAP_SKITTERER_PACK_CAP);
  });
});
