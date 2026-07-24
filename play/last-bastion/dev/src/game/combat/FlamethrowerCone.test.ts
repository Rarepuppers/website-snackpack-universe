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

describe("Flamethrower cone (Phase 4)", () => {
  it("hits an enemy well off the aim line that Cryo Lance's narrow beam would miss", () => {
    const flamethrower = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["flamethrower"] });
    const cryoLance = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    // ~17 degrees (0.3 rad) off the +x aim direction, measured from the weapon's
    // muzzle anchor (a single equipped weapon sits 0.82m ahead of the player
    // along the aim direction, not at the player's own position) — within
    // Flamethrower's wide cone (meleeArcRadians 0.9, half-angle 0.45) but
    // outside Cryo Lance's narrow one (half-angle 0.08).
    const flamePlayer = flamethrower.snapshot().playerPosition;
    const cryoPlayer = cryoLance.snapshot().playerPosition;
    const dx = 0.82 + 2 * Math.cos(0.3);
    const dy = -2 * Math.sin(0.3);
    const flameEnemyId = flamethrower.spawnEnemy("egg-cluster", { x: flamePlayer.x + dx, y: flamePlayer.y + dy });
    const cryoEnemyId = cryoLance.spawnEnemy("egg-cluster", { x: cryoPlayer.x + dx, y: cryoPlayer.y + dy });
    const flameBefore = flamethrower.snapshot().enemies.find((e) => e.id === flameEnemyId)!.health;
    const cryoBefore = cryoLance.snapshot().enemies.find((e) => e.id === cryoEnemyId)!.health;

    const flameAfter = flamethrower.step(intent({ fireHeld: true }), 0.05)
      .enemies.find((e) => e.id === flameEnemyId)!.health;
    const cryoAfter = cryoLance.step(intent({ fireHeld: true }), 0.05)
      .enemies.find((e) => e.id === cryoEnemyId)!.health;

    expect(flameAfter).toBeLessThan(flameBefore);
    expect(cryoAfter).toBe(cryoBefore);
  });

  it("stops ticking the instant the trigger releases, same as Cryo Lance", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["flamethrower"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 2, y: player.y });

    simulation.step(intent({ fireHeld: true }), 0.05);
    const held = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;
    simulation.step(intent({ fireHeld: false }), 0.05);
    const released = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;
    expect(released).toBe(held);
  });

  it("builds Blaze on a sustained target", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["flamethrower"] });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnElite("carapace-scuttler", { x: player.x + 2, y: player.y });

    let blazed = false;
    for (let frame = 0; frame < 300 && !blazed; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      blazed = snapshot.events.some((event) => event.type === "status-applied" && event.status === "blaze");
    }
    expect(blazed).toBe(true);
  });
});
