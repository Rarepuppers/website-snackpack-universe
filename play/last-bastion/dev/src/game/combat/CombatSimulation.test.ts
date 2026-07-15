import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import type { ArenaDefinition } from "../arena/ArenaDefinition";

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

describe("CombatSimulation", () => {
  it("fires the Service Rifle and kills a damageable Scuttler", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });

    for (let frame = 0; frame < 80; frame += 1) {
      simulation.step(intent({ fireHeld: true }), 1 / 60);
    }

    const snapshot = simulation.snapshot();
    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.pickups).toHaveLength(1);
  });

  it("hatches an Egg Cluster into two Scuttlers", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.spawnEnemy("egg-cluster", { x: 2, y: 2 });

    for (let frame = 0; frame < 125; frame += 1) {
      simulation.step(intent(), 0.05);
    }

    const enemies = simulation.snapshot().enemies;
    expect(enemies.filter((enemy) => enemy.type === "egg-cluster")).toHaveLength(0);
    expect(enemies.filter((enemy) => enemy.type === "scuttler")).toHaveLength(2);
  });

  it("offers and applies deterministic upgrade choices", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.addExperience(4);

    const choices = simulation.snapshot().pendingUpgradeChoices;
    expect(choices).toHaveLength(3);
    expect(simulation.chooseUpgrade(choices[0]!.id)).toBe(true);
    expect(simulation.snapshot().level).toBe(2);
    expect(simulation.snapshot().pendingUpgradeChoices).toHaveLength(0);
  });

  it("starts the deterministic first wave with Scuttlers", () => {
    const simulation = new CombatSimulation({ seed: 123 });
    simulation.step(intent(), 0.25);

    expect(simulation.snapshot().waveNumber).toBe(1);
    expect(simulation.snapshot().enemies.every((enemy) => enemy.type === "scuttler")).toBe(true);
  });

  it("telegraphs a Brain Blob wind-up before its lunge", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 7 });
    simulation.spawnEnemy("brain-blob", { x: 3, y: 3 });
    const observedPhases = new Set<string>();

    for (let frame = 0; frame < 100; frame += 1) {
      const brain = simulation.step(intent(), 0.05).enemies[0];
      if (brain?.brainPhase) {
        observedPhases.add(brain.brainPhase);
      }
    }

    expect(observedPhases).toContain("windup");
    expect(observedPhases).toContain("lunge");
  });

  it("prevents contact damage during the Marine's invulnerability window", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x, y: player.y });

    const rolling = simulation.step(intent({
      move: { x: 1, y: 0 },
      evasiveMovePressed: true,
    }), 0.05);
    expect(rolling.playerHealth).toBe(rolling.playerMaxHealth);

    let snapshot = rolling;
    for (let frame = 0; frame < 80; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }

    expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
  });

  it("reports roll readiness after the universal prototype recovery", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    let snapshot = simulation.step(intent({ evasiveMovePressed: true }), 0.05);
    expect(snapshot.evasiveReady).toBe(false);

    for (let frame = 0; frame < 30; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }

    expect(snapshot.evasiveReady).toBe(true);
    expect(snapshot.evasiveCooldownRemainingSeconds).toBe(0);
  });

  it("emits typed feedback events for firing and enemy impacts", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x + 2, y: player.y });

    const fired = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(fired.events.some((event) => event.type === "weapon-fired")).toBe(true);

    let observedHit = fired.events.some((event) => event.type === "enemy-hit");
    for (let frame = 0; frame < 20; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      observedHit ||= snapshot.events.some((event) => event.type === "enemy-hit");
    }

    expect(observedHit).toBe(true);
  });

  it("fires every equipped weapon as an independent instance", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponCount: 4,
    });

    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    const firedIds = snapshot.events
      .filter((event) => event.type === "weapon-fired")
      .map((event) => event.weaponInstanceId);

    expect(snapshot.equippedWeapons).toHaveLength(4);
    expect(new Set(firedIds)).toEqual(new Set([1, 2, 3, 4]));
    expect(snapshot.projectiles).toHaveLength(4);
  });

  it("supports a deliberately unarmed review state", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponCount: 0,
    });

    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(snapshot.equippedWeapons).toHaveLength(0);
    expect(snapshot.projectiles).toHaveLength(0);
  });

  it.each([
    [4, 23],
    [12, 45],
  ] as const)("creates the deterministic %i-weapon stress population", (profile, enemyCount) => {
    const simulation = new CombatSimulation({
      stressProfile: profile,
      startingWeaponCount: profile,
      seed: 99,
    });
    const snapshot = simulation.snapshot();

    expect(snapshot.stressProfile).toBe(profile);
    expect(snapshot.equippedWeapons).toHaveLength(profile);
    expect(snapshot.enemies).toHaveLength(enemyCount);
  });

  it("blocks the Marine from crossing an arena obstacle", () => {
    const arena = arenaWithObstacle(16, 7.4, 2, 2);
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 120; frame += 1) {
      snapshot = simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    }

    expect(snapshot.playerPosition.x).toBeLessThanOrEqual(16 - 0.55);
  });

  it("destroys projectiles that strike arena obstacles", () => {
    const arena = arenaWithObstacle(18, 7.4, 1, 2);
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    let observedBlock = false;

    for (let frame = 0; frame < 30; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: frame === 0 }), 0.05);
      observedBlock ||= snapshot.events.some((event) => event.type === "projectile-blocked");
    }

    expect(observedBlock).toBe(true);
    expect(simulation.snapshot().projectiles).toHaveLength(0);
  });
});

function arenaWithObstacle(x: number, y: number, width: number, height: number): ArenaDefinition {
  return {
    id: "test-arena",
    widthMetres: 30,
    heightMetres: 16.875,
    tileSizeMetres: 1,
    obstacles: [{ id: "test-obstacle", kind: "cargo-crate", x, y, width, height }],
  };
}
