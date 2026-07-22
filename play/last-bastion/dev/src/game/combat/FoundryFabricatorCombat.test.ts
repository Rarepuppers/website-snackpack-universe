import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

const EMPTY_ARENA: ArenaDefinition = {
  id: "foundry-test",
  widthMetres: 30,
  heightMetres: 20,
  tileSizeMetres: 1,
  obstacles: [],
};

function createFoundry(): { simulation: CombatSimulation; ownerId: number } {
  const simulation = new CombatSimulation({
    autoStartWaves: false,
    autoFireEnabled: false,
    arena: EMPTY_ARENA,
    widthMetres: 30,
    heightMetres: 20,
  });
  return { simulation, ownerId: simulation.spawnEnemy("foundry-fabricator", { x: 8, y: 10 }) };
}

function collect(simulation: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...simulation.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Foundry Fabricator live gate", () => {
  it("reserves exact capacity, exposes a six-health pad, and refunds once on destruction", () => {
    const { simulation, ownerId } = createFoundry();
    const startEvents = collect(simulation, 0.05);
    const started = startEvents.find((event) => event.type === "foundry-fabrication-started");
    expect(started).toMatchObject({
      type: "foundry-fabrication-started",
      enemyId: ownerId,
      childType: "foundry-drone",
    });
    if (started?.type !== "foundry-fabrication-started") throw new Error("missing fabrication pad");
    expect(simulation.snapshot().enemies.find((enemy) => enemy.id === started.padId))
      .toMatchObject({ type: "foundry-pad", health: 6, maxHealth: 6, foundryOwnerId: ownerId });
    expect(simulation.snapshot().density).toMatchObject({ reservedLiveSlots: 1, reservedThreat: 2 });

    simulation.dealDamage(started.padId, 99, "physical");
    const interrupted = collect(simulation, 0.05);
    expect(interrupted).toContainEqual(expect.objectContaining({
      type: "foundry-fabrication-interrupted",
      enemyId: ownerId,
      reason: "pad-destroyed",
    }));
    expect(simulation.snapshot().density).toMatchObject({ reservedLiveSlots: 0, reservedThreat: 0 });
    expect(simulation.snapshot().enemies.find((enemy) => enemy.id === ownerId))
      .toMatchObject({ foundryPhase: "recovery", foundryChargesRemaining: 3 });
  });

  it("fabricates one timed non-recursive drone then one turret without exceeding its owner cap", () => {
    const { simulation, ownerId } = createFoundry();
    const events = collect(simulation, 5.6);
    expect(events.filter((event) => event.type === "foundry-fabrication-completed"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ enemyId: ownerId, childType: "foundry-drone" }),
        expect.objectContaining({ enemyId: ownerId, childType: "foundry-turret" }),
      ]));
    const children = simulation.snapshot().enemies.filter((enemy) => enemy.foundryOwnerId === ownerId);
    expect(children.filter((enemy) => enemy.type === "foundry-drone" || enemy.type === "foundry-turret"))
      .toHaveLength(2);
    expect(events.every((event) => (
      event.type !== "foundry-fabrication-started" || event.enemyId === ownerId
    ))).toBe(true);
    expect(events.some((event) => event.type === "foundry-turret-warning")).toBe(true);
    expect(events.some((event) => event.type === "foundry-turret-fired")).toBe(true);
    expect(simulation.snapshot().density).toMatchObject({ reservedLiveSlots: 0, reservedThreat: 0 });
  });

  it("interrupts on owner damage without spending a charge", () => {
    const { simulation, ownerId } = createFoundry();
    collect(simulation, 0.05);
    simulation.dealDamage(ownerId, 1, "physical");
    const events = collect(simulation, 0.05);
    expect(events).toContainEqual(expect.objectContaining({
      type: "foundry-fabrication-interrupted",
      enemyId: ownerId,
      reason: "owner-damage",
    }));
    expect(simulation.snapshot().enemies.find((enemy) => enemy.id === ownerId))
      .toMatchObject({ foundryChargesRemaining: 3 });
  });

  it("powers down all owned children and releases pending reservations when the owner dies", () => {
    const { simulation, ownerId } = createFoundry();
    collect(simulation, 5.2);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.foundryOwnerId === ownerId)).toBe(true);
    simulation.dealDamage(ownerId, 999, "physical");
    collect(simulation, 0.05);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.foundryOwnerId === ownerId)).toBe(false);
    expect(simulation.snapshot().density).toMatchObject({ reservedLiveSlots: 0, reservedThreat: 0 });
  });

  it("authors the mixed-machine route beneath its eight-unit cap", () => {
    const simulation = new CombatSimulation({ scenario: "foundry-fabricator", seed: 65068 });
    expect(simulation.snapshot().enemies.filter((enemy) => enemy.type === "foundry-fabricator"))
      .toHaveLength(1);
    expect(simulation.snapshot().enemies.filter((enemy) => enemy.type === "cyborg-reclaimer"))
      .toHaveLength(1);
    collect(simulation, 5.2);
    const snapshot = simulation.snapshot();
    expect(snapshot.enemies.filter((enemy) => enemy.type === "foundry-drone" || enemy.type === "foundry-turret"))
      .toHaveLength(2);
    expect(snapshot.density.currentLiveEnemies).toBeLessThanOrEqual(8);
    expect(snapshot.density.peakLiveEnemies).toBeLessThanOrEqual(8);
  });
});
