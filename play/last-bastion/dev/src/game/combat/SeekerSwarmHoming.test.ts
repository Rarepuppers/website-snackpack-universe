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

describe("Seeker Swarm homing (Phase 4)", () => {
  it("curves its projectiles to hit a target well outside the initial aim cone", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["seeker-swarm"] });
    const player = simulation.snapshot().playerPosition;
    // Nearly straight "up" from the player, ~90 degrees off the +x aim direction below —
    // outside the swarm's ~0.35 rad forward spread cone, so only homing can reach it.
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 0.1, y: player.y - 3 });
    const before = simulation.snapshot().enemies.find((enemy) => enemy.id === enemyId)!.health;

    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    for (let frame = 0; frame < 24; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    const after = snapshot.enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0;
    expect(after).toBeLessThan(before);
  });

  it("does not curve a non-homing weapon's projectiles toward the same off-axis target", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["bolt-carbine"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 0.1, y: player.y - 3 });
    const before = simulation.snapshot().enemies.find((enemy) => enemy.id === enemyId)!.health;

    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    for (let frame = 0; frame < 24; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    const after = snapshot.enemies.find((enemy) => enemy.id === enemyId)?.health ?? before;
    expect(after).toBe(before);
  });

  it("turns velocity toward the nearest live enemy frame over frame, capped by its turn rate", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["seeker-swarm"] });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("egg-cluster", { x: player.x + 0.1, y: player.y - 3 });

    const fired = simulation.step(intent({ fireHeld: true }), 0.05);
    const projectileId = fired.projectiles[0]!.id;
    const angleAtFire = fired.projectiles.find((projectile) => projectile.id === projectileId)!.rotationRadians;

    const next = simulation.step(intent(), 0.05);
    const angleNextFrame = next.projectiles.find((projectile) => projectile.id === projectileId)?.rotationRadians;
    expect(angleNextFrame).toBeDefined();
    // Steering toward "up" (negative y in this coordinate space) should rotate the
    // angle away from the initial near-zero forward aim, frame over frame.
    expect(Math.abs(angleNextFrame! - angleAtFire)).toBeGreaterThan(0);
  });
});
