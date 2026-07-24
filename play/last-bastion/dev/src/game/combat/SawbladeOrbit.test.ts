import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";

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

describe("Sawblade orbit (Phase 4)", () => {
  it("damages an enemy standing right at the orbit radius without holding the trigger", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["sawblade"] });
    const player = simulation.snapshot().playerPosition;
    // Orbit radius is 1.1m; place the enemy directly on the blade's starting position (angle 0).
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 1.1, y: player.y });
    const before = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;

    const after = simulation.step(intent(), 0.05).enemies.find((e) => e.id === enemyId)?.health ?? 0;
    expect(after).toBeLessThan(before);
  });

  it("does not damage an enemy standing well outside the orbit ring", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["sawblade"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 5, y: player.y });
    const before = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 20; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    const after = snapshot.enemies.find((e) => e.id === enemyId)?.health ?? before;
    expect(after).toBe(before);
  });

  it("advances its orbit angle every active frame, sweeping around the player", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["sawblade"] });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("egg-cluster", { x: player.x + 5, y: player.y }); // keeps the weapon "active" (in range) without being hit

    const first = simulation.step(intent(), 0.05);
    const bladeFirst = first.events.find((event) => event.type === "weapon-fired");
    const second = simulation.step(intent(), 0.05);
    const bladeSecond = second.events.find((event) => event.type === "weapon-fired");
    expect(bladeFirst).toBeDefined();
    expect(bladeSecond).toBeDefined();
    if (bladeFirst?.type === "weapon-fired" && bladeSecond?.type === "weapon-fired") {
      expect(bladeSecond.position).not.toEqual(bladeFirst.position);
    }
  });

  it("only hits enemies actually touching the blade's current swept position, not everything within the orbit radius", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["sawblade"] });
    const player = simulation.snapshot().playerPosition;
    // Directly behind the player (angle ~180 degrees) — outside the blade's
    // starting position (angle 0, directly ahead) on the very first tick.
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x - 1.1, y: player.y });
    const before = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;
    const after = simulation.step(intent(), 0.05).enemies.find((e) => e.id === enemyId)!.health;
    expect(after).toBe(before);
  });
});
