import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import type { ArenaDefinition, ArenaHazard } from "../arena/ArenaDefinition";
import { worldObjectById } from "../arena/WorldObjectCatalog";

/**
 * World objects in play (26 July 2026): persistent hazards that tick, and the
 * Fuel Cell — the first object whose destruction is itself a weapon.
 *
 * Everything here asserts what a player would feel: health dropping while stood
 * in acid, a slower walk through slime, a chain of cells clearing a room. The
 * catalogue data was already correct and already inert; only outcomes prove it
 * is not still inert.
 */

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
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
    ...overrides,
  };
}

/** A bare 40×24 room with no props, so each test states its own contents. */
function emptyArena(overrides: Partial<ArenaDefinition> = {}): ArenaDefinition {
  return {
    id: "test-room",
    widthMetres: 40,
    heightMetres: 24,
    tileSizeMetres: 1,
    obstacles: [],
    ...overrides,
  };
}

/** A hazard rectangle centred on the player's spawn (arena centre). */
function hazardAtSpawn(effect: ArenaHazard["effect"]): ArenaHazard {
  return {
    id: "hz-1",
    worldObjectId: "toxic-pool",
    x: 20 - 3,
    y: 12 - 3,
    width: 6,
    height: 6,
    effect,
  };
}

describe("persistent arena hazards", () => {
  it("damages the player who stands in a toxic pool, at roughly its authored rate", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena({
        hazards: [hazardAtSpawn({ type: "damage", damagePerSecond: 4, damageType: "toxic" })],
      }),
    });
    const before = simulation.snapshot().playerHealth;
    // Four seconds stood still, at 4 damage per second.
    for (let frame = 0; frame < 200; frame += 1) simulation.step(intent(), 0.02);
    const lost = before - simulation.snapshot().playerHealth;

    expect(lost).toBeGreaterThan(0);
    // Armour mitigates, so this is a band rather than exactly 16.
    expect(lost).toBeGreaterThanOrEqual(4);
    expect(lost).toBeLessThanOrEqual(16);
  });

  it("scales with the hazard's authored severity — lava bites harder than toxic", () => {
    const damageOver = (damagePerSecond: number): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        arena: emptyArena({
          hazards: [hazardAtSpawn({ type: "damage", damagePerSecond, damageType: "toxic" })],
        }),
      });
      const before = simulation.snapshot().playerHealth;
      for (let frame = 0; frame < 150; frame += 1) simulation.step(intent(), 0.02);
      return before - simulation.snapshot().playerHealth;
    };
    expect(damageOver(10)).toBeGreaterThan(damageOver(4));
  });

  it("leaves a player standing outside the pool alone", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena({
        hazards: [{
          id: "hz-far", worldObjectId: "toxic-pool",
          x: 2, y: 2, width: 3, height: 3,
          effect: { type: "damage", damagePerSecond: 10, damageType: "toxic" },
        }],
      }),
    });
    const before = simulation.snapshot().playerHealth;
    for (let frame = 0; frame < 200; frame += 1) simulation.step(intent(), 0.02);
    expect(simulation.snapshot().playerHealth).toBe(before);
  });

  it("slows a player wading through slime without hurting them", () => {
    const walk = (hazards: ArenaDefinition["hazards"]): number => {
      const simulation = new CombatSimulation({ autoStartWaves: false, arena: emptyArena({ hazards }) });
      const start = simulation.snapshot().playerPosition.x;
      for (let frame = 0; frame < 30; frame += 1) simulation.step(intent({ move: { x: 1, y: 0 } }), 0.02);
      return simulation.snapshot().playerPosition.x - start;
    };
    const clearDistance = walk([]);
    const slimed = walk([hazardAtSpawn({ type: "slow", movementMultiplier: 0.62 })]);

    expect(clearDistance).toBeGreaterThan(0);
    expect(slimed).toBeGreaterThan(0);
    expect(slimed).toBeLessThan(clearDistance);

    // Slime slows; it does not damage. That distinction is in the design doc and
    // it is the whole reason slime and toxic are separate objects.
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena({ hazards: [hazardAtSpawn({ type: "slow", movementMultiplier: 0.62 })] }),
    });
    const before = simulation.snapshot().playerHealth;
    for (let frame = 0; frame < 200; frame += 1) simulation.step(intent(), 0.02);
    expect(simulation.snapshot().playerHealth).toBe(before);
  });

  it("does not hand out invulnerability for standing in fire", () => {
    // A hazard tick must not open the post-hit window, or parking in lava would
    // be the strongest defensive option in the game.
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena({
        hazards: [hazardAtSpawn({ type: "damage", damagePerSecond: 2, damageType: "toxic" })],
      }),
    });
    // Long enough for a hazard tick to have landed, short of lethal.
    for (let frame = 0; frame < 60; frame += 1) simulation.step(intent(), 0.02);
    const beforeHit = simulation.snapshot().playerHealth;
    expect(beforeHit).toBeGreaterThan(0);
    expect(beforeHit).toBeLessThan(simulation.snapshot().playerMaxHealth);

    simulation.spawnEnemy("scuttler", { x: 20, y: 12 });
    for (let frame = 0; frame < 60; frame += 1) simulation.step(intent(), 0.02);
    // Both sources land: the enemy is not being no-op'd by hazard i-frames.
    expect(simulation.snapshot().playerHealth).toBeLessThan(beforeHit);
  });
});

describe("Fuel Cell — destruction as a weapon", () => {
  const cellArena = (cells: readonly { id: string; x: number; y: number }[]): ArenaDefinition => emptyArena({
    obstacles: cells.map((cell) => ({
      id: cell.id,
      worldObjectId: "fuel-cell",
      kind: "power-conduit" as const,
      x: cell.x,
      y: cell.y,
      width: 1,
      height: 1,
      maxDurability: worldObjectById("fuel-cell")!.durability!,
    })),
  });

  it("is authored as a cheap, dangerous, chaining object", () => {
    const cell = worldObjectById("fuel-cell")!;
    expect(cell.durability).toBeLessThanOrEqual(100);
    expect(cell.onDestroyed).toMatchObject({ type: "detonate" });
    expect(cell.onDestroyed!.chainRadiusMetres).toBeGreaterThan(0);
    // It needs no new interaction verb — that is why it is the cheapest possible
    // "the battlefield fights back" object.
    expect(cell.interaction).toBeUndefined();
  });

  it("kills what is standing next to it when it goes up", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: cellArena([{ id: "cell-a", x: 10, y: 10 }]) });
    const victimId = simulation.spawnEnemy("scuttler", { x: 11, y: 10.5 });
    const bystanderId = simulation.spawnEnemy("scuttler", { x: 30, y: 20 });

    simulation.dealDamage(victimId, 0);
    const victimBefore = simulation.snapshot().enemies.find((enemy) => enemy.id === victimId)!.health;
    simulation.damageObstacleForTest("cell-a", 9_999);
    simulation.step(intent(), 0.02);

    const victim = simulation.snapshot().enemies.find((enemy) => enemy.id === victimId);
    const bystander = simulation.snapshot().enemies.find((enemy) => enemy.id === bystanderId);
    expect(victim === undefined || victim.health < victimBefore).toBe(true);
    // Well outside the blast: untouched.
    expect(bystander!.health).toBe(bystander!.maxHealth);
  });

  it("chains through a line of cells, and terminates", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      // Spaced inside the 3 m chain radius, so lighting one takes the row.
      arena: cellArena([
        { id: "cell-a", x: 8, y: 10 },
        { id: "cell-b", x: 10, y: 10 },
        { id: "cell-c", x: 12, y: 10 },
        // Far away: must survive.
        { id: "cell-far", x: 34, y: 20 },
      ]),
    });
    simulation.damageObstacleForTest("cell-a", 9_999);
    const snapshot = simulation.step(intent(), 0.02);

    const destroyed = new Set(snapshot.terrain
      .filter((obstacle) => obstacle.health <= 0)
      .map((obstacle) => obstacle.id));
    expect(destroyed).toContain("cell-a");
    expect(destroyed).toContain("cell-b");
    expect(destroyed).toContain("cell-c");
    expect(destroyed).not.toContain("cell-far");
  });

  it("hurts the player who blew it up from too close", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      // 1.5 m from the player's spawn at (20, 12) — inside the 2.6 m blast.
      arena: cellArena([{ id: "cell-close", x: 21, y: 11.5 }]),
    });
    const before = simulation.snapshot().playerHealth;
    simulation.damageObstacleForTest("cell-close", 9_999);
    simulation.step(intent(), 0.02);
    expect(simulation.snapshot().playerHealth).toBeLessThan(before);
  });

  it("leaves ordinary cover inert when it is destroyed", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: emptyArena({
        obstacles: [{ id: "crate", worldObjectId: "equipment-locker", kind: "cargo-crate", x: 21, y: 11.5, width: 1, height: 1 }],
      }),
    });
    const before = simulation.snapshot().playerHealth;
    simulation.damageObstacleForTest("crate", 9_999);
    simulation.step(intent(), 0.02);
    expect(simulation.snapshot().playerHealth).toBe(before);
  });
});

describe("expedition rooms are furnished from their node theme", () => {
  it("leaves Quick Drop's authored yard exactly as it was", () => {
    const quickDrop = new CombatSimulation({ autoStartWaves: false });
    expect(quickDrop.arena.id).toBe("bastion-outer-yard");
    expect(quickDrop.arena.obstacles.every((obstacle) => obstacle.worldObjectId === undefined)).toBe(true);
    expect(quickDrop.arena.hazards ?? []).toEqual([]);
  });

  it("furnishes a themed room when one is asked for, keeping the fence clear", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 4242, worldObjectTheme: "alien-hive" });
    const furnished = simulation.arena.obstacles;
    expect(furnished.length).toBeGreaterThan(0);
    expect(furnished.every((obstacle) => obstacle.worldObjectId !== undefined)).toBe(true);
    // The signature battlefield interaction survives furnishing.
    expect(simulation.arena.fence).toBeDefined();
    const gate = simulation.arena.fence!.switchPosition;
    for (const obstacle of furnished) {
      const closestX = Math.max(obstacle.x, Math.min(gate.x, obstacle.x + obstacle.width));
      const closestY = Math.max(obstacle.y, Math.min(gate.y, obstacle.y + obstacle.height));
      expect(Math.hypot(closestX - gate.x, closestY - gate.y)).toBeGreaterThanOrEqual(2);
    }
  });
});
