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

describe("Tesla Coil orbit zap (Phase 4)", () => {
  it("fires automatically without holding the trigger, since it's a passive emitter", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["tesla-coil"] });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("egg-cluster", { x: player.x + 1, y: player.y });
    const snapshot = simulation.step(intent(), 0.05); // fireHeld: false
    expect(snapshot.events.some((event) => event.type === "weapon-fired")).toBe(true);
  });

  it("does nothing when no enemy is within range (no zap into empty space)", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["tesla-coil"] });
    const snapshot = simulation.step(intent(), 0.05);
    expect(snapshot.events.some((event) => event.type === "weapon-fired")).toBe(false);
  });

  it("chains from the nearest enemy to further nearby enemies, each hop weaker than the last", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["tesla-coil"] });
    const player = simulation.snapshot().playerPosition;
    // Three enemies close enough together that all three fall within chain range of each other.
    const nearId = simulation.spawnEnemy("scuttler", { x: player.x + 1, y: player.y });
    const midId = simulation.spawnEnemy("scuttler", { x: player.x + 2, y: player.y });
    const farId = simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });
    const before = simulation.snapshot();
    const nearBefore = before.enemies.find((e) => e.id === nearId)!.health;
    const midBefore = before.enemies.find((e) => e.id === midId)!.health;
    const farBefore = before.enemies.find((e) => e.id === farId)!.health;

    const after = simulation.step(intent(), 0.05);
    const nearAfter = after.enemies.find((e) => e.id === nearId)?.health ?? 0;
    const midAfter = after.enemies.find((e) => e.id === midId)?.health ?? 0;
    const farAfter = after.enemies.find((e) => e.id === farId)?.health ?? 0;

    const nearDamage = nearBefore - nearAfter;
    const midDamage = midBefore - midAfter;
    const farDamage = farBefore - farAfter;
    expect(nearDamage).toBeGreaterThan(0);
    expect(midDamage).toBeGreaterThan(0);
    expect(farDamage).toBeGreaterThan(0);
    // Falloff: each hop carries 70% of the previous hop's damage.
    expect(midDamage).toBeCloseTo(nearDamage * 0.7, 1);
    expect(farDamage).toBeCloseTo(nearDamage * 0.49, 1);
  });

  it("never hits the same enemy twice in one zap, even when only one enemy exists", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: ["tesla-coil"] });
    const player = simulation.snapshot().playerPosition;
    const enemyId = simulation.spawnEnemy("scuttler", { x: player.x + 1, y: player.y });
    const before = simulation.snapshot().enemies.find((e) => e.id === enemyId)!.health;
    const after = simulation.step(intent(), 0.05).enemies.find((e) => e.id === enemyId)!.health;
    const singleHopDamage = before - after;

    // A lone enemy should only ever take the first hop's damage, not extra
    // chain hops re-hitting it.
    expect(singleHopDamage).toBeGreaterThan(0);
    expect(singleHopDamage).toBeLessThan(before);
  });
});
