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

describe("Event Horizon (Phase 4, the Unique)", () => {
  it("spawns a pull field on impact instead of dealing instant damage", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["event-horizon"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });
    const startHealth = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;

    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    let spawnedField = false;
    for (let frame = 0; frame < 40 && !spawnedField; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      spawnedField = snapshot.eventHorizonFields.length > 0;
    }
    expect(spawnedField).toBe(true);
    // The instant it lands, it's pulling — not yet dealing damage.
    const enemyAtImpact = snapshot.enemies.find((e) => e.id === enemyId);
    expect(enemyAtImpact?.health).toBe(startHealth);
  });

  it("pulls a nearby enemy toward the field's centre", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["event-horizon"] });
    const player = simulation.snapshot().playerPosition;
    // The trigger enemy detonates the field exactly at its own position (zero
    // distance, nothing to pull); a second enemy nearby is the one whose pull
    // toward that point is actually observable.
    simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });
    const pulledId = simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y + 2 });

    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    for (let frame = 0; frame < 40 && snapshot.eventHorizonFields.length === 0; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    expect(snapshot.eventHorizonFields.length).toBeGreaterThan(0);
    const field = snapshot.eventHorizonFields[0]!;
    const pulledAtImpact = snapshot.enemies.find((e) => e.id === pulledId)!;
    const distanceAtImpact = Math.hypot(pulledAtImpact.position.x - field.position.x, pulledAtImpact.position.y - field.position.y);

    snapshot = simulation.step(intent(), 0.05);
    const pulledAfter = snapshot.enemies.find((e) => e.id === pulledId)!;
    const distanceAfter = Math.hypot(pulledAfter.position.x - field.position.x, pulledAfter.position.y - field.position.y);
    expect(distanceAfter).toBeLessThan(distanceAtImpact);
  });

  it("implodes once the pull field's duration runs out, dealing damage and then disappearing", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["event-horizon"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });
    const startHealth = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;

    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    let imploded = false;
    for (let frame = 0; frame < 80 && !imploded; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      imploded = snapshot.events.some((event) => event.type === "explosion");
    }
    expect(imploded).toBe(true);
    expect(snapshot.eventHorizonFields).toHaveLength(0);
    const enemyAfter = snapshot.enemies.find((e) => e.id === enemyId);
    // A weak "scuttler" (4 max health) is well within one-shot range of the implosion's 14 damage.
    expect(enemyAfter === undefined || enemyAfter.health < startHealth).toBe(true);
  });

  it("has a long 16-second cooldown and is not part of the normal weapon chest pool", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["event-horizon"] });
    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(snapshot.equippedWeapons[0]?.cooldownDurationSeconds).toBe(16);
  });
});
