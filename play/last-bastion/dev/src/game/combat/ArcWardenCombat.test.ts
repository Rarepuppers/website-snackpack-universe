import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { ARC_WARDEN_LAB_CAP, CombatSimulation, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

function emptyArena(obstacles: ArenaDefinition["obstacles"] = []): ArenaDefinition {
  return { id: "arc-test", widthMetres: 20, heightMetres: 12, tileSizeMetres: 1, obstacles };
}

function collect(simulation: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...simulation.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Arc Warden live gate", () => {
  it("emits one fixed warning and damages the player on discharge", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena(),
      widthMetres: 20,
      heightMetres: 12,
    });
    simulation.spawnEnemy("arc-warden", { x: 2, y: 6 });
    const events = collect(simulation, 2);
    const warning = events.find((event) => event.type === "arc-warden-warning");
    const discharge = events.find((event) => event.type === "arc-warden-discharged");
    expect(warning).toMatchObject({ type: "arc-warden-warning" });
    if (warning?.type !== "arc-warden-warning") throw new Error("missing Arc Warden warning");
    expect(Math.hypot(warning.lane.direction.x, warning.lane.direction.y)).toBeCloseTo(1);
    expect(discharge).toMatchObject({ type: "arc-warden-discharged", hitPlayer: true, damage: 2.6 });
    expect(events.filter((event) => event.type === "arc-warden-discharged")).toHaveLength(1);
  });

  it("lets cover own the endpoint and prevents player damage behind it", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena([{ id: "wall", kind: "barricade", x: 6, y: 4, width: 1, height: 4 }]),
      widthMetres: 20,
      heightMetres: 12,
    });
    simulation.spawnEnemy("arc-warden", { x: 2, y: 6 });
    const discharge = collect(simulation, 2)
      .find((event) => event.type === "arc-warden-discharged");
    expect(discharge).toMatchObject({
      type: "arc-warden-discharged",
      endpoint: { x: 6 },
      blockedByObstacleId: "wall",
      hitPlayer: false,
      damage: 0,
    });
  });

  it("takes amplified Shock damage", () => {
    const physical = new CombatSimulation({ autoStartWaves: false });
    const physicalId = physical.spawnEnemy("arc-warden", { x: 3, y: 3 });
    physical.dealDamage(physicalId, 2, "physical");
    const shock = new CombatSimulation({ autoStartWaves: false });
    const shockId = shock.spawnEnemy("arc-warden", { x: 3, y: 3 });
    shock.dealDamage(shockId, 2, "shock");
    expect(shock.snapshot().enemies[0]!.health).toBeLessThan(physical.snapshot().enemies[0]!.health);
  });

  it("authors an exact two-specialist lab cap", () => {
    const simulation = new CombatSimulation({ scenario: "arc-warden", seed: 65066 });
    const wardens = simulation.snapshot().enemies.filter((enemy) => enemy.type === "arc-warden");
    expect(wardens).toHaveLength(ARC_WARDEN_LAB_CAP);
    expect(wardens.some((enemy) => enemy.arcWardenLane?.blockedByObstacleId === "west-biomass"))
      .toBe(true);
  });
});
