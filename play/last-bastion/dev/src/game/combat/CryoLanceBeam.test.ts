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

describe("Cryo Lance beam (Phase 4)", () => {
  it("ticks continuous damage every frame it is held, with no fire-interval cooldown gap", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 2, y: player.y });

    const first = simulation.step(intent({ fireHeld: true }), 0.05).enemies.find((enemy) => enemy.id === enemyId)!.health;
    const second = simulation.step(intent({ fireHeld: true }), 0.05).enemies.find((enemy) => enemy.id === enemyId)!.health;
    // A discrete weapon would need to wait out a cooldown before its second hit;
    // the beam should tick again on the very next frame with no gap.
    expect(second).toBeLessThan(first);
  });

  it("stops dealing damage the instant the trigger is released", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("egg-cluster", { x: player.x + 2, y: player.y });

    simulation.step(intent({ fireHeld: true }), 0.05);
    const held = simulation.snapshot().enemies.find((enemy) => enemy.id === enemyId)!.health;
    simulation.step(intent({ fireHeld: false }), 0.05);
    const released = simulation.snapshot().enemies.find((enemy) => enemy.id === enemyId)!.health;
    expect(released).toBe(held);
  });

  it("hits every enemy standing in its cone, not just the nearest one", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    const player = simulation.snapshot().playerPosition;
    const nearId = simulation.spawnEnemy("egg-cluster", { x: player.x + 1.5, y: player.y });
    const farId = simulation.spawnEnemy("egg-cluster", { x: player.x + 3, y: player.y });
    const before = simulation.snapshot();
    const nearBefore = before.enemies.find((enemy) => enemy.id === nearId)!.health;
    const farBefore = before.enemies.find((enemy) => enemy.id === farId)!.health;

    const after = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(after.enemies.find((enemy) => enemy.id === nearId)!.health).toBeLessThan(nearBefore);
    expect(after.enemies.find((enemy) => enemy.id === farId)!.health).toBeLessThan(farBefore);
  });

  it("never hits an enemy outside its narrow forward cone", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    const player = simulation.snapshot().playerPosition;
    const offAxisId = simulation.spawnEnemy("egg-cluster", { x: player.x, y: player.y - 3 });
    const before = simulation.snapshot().enemies.find((enemy) => enemy.id === offAxisId)!.health;

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 10; frame += 1) {
      snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    }
    const after = snapshot.enemies.find((enemy) => enemy.id === offAxisId)!.health;
    expect(after).toBe(before);
  });

  it("builds Freeze on a sustained target the same way a single big cryo hit does", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["cryo-lance"] });
    const player = simulation.snapshot().playerPosition;
    // An elite is durable enough to survive many small ticks and (unlike a mini-boss) isn't immune to Freeze.
    simulation.spawnElite("carapace-scuttler", { x: player.x + 2, y: player.y });

    // Freeze's own duration is short, so rather than check the final frame's
    // active statuses (it may have already expired), watch for the
    // status-applied event firing at any point across the sustained beam.
    let froze = false;
    for (let frame = 0; frame < 300 && !froze; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      froze = snapshot.events.some((event) => event.type === "status-applied" && event.status === "freeze");
    }
    expect(froze).toBe(true);
  });
});
