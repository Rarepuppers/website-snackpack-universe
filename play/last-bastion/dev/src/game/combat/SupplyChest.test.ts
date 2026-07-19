import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  CombatSimulation,
  MEDKIT_HEAL_AMOUNT,
  SUPPLY_CHEST_BASE_HEALTH,
} from "./CombatSimulation";

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

/** Drives one real hit through combat so healing tests start from a genuine wound. */
function woundPlayer(simulation: CombatSimulation): void {
  const player = simulation.snapshot().playerPosition;
  simulation.spawnEnemy("razor-scuttler", { x: player.x - 4, y: player.y });
  let snapshot = simulation.snapshot();
  for (let frame = 0; frame < 60 && snapshot.playerHealth === snapshot.playerMaxHealth; frame += 1) {
    snapshot = simulation.step(intent(), 0.05);
  }
  expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
}

describe("Supply chests", () => {
  it("opens a sealed chest on interact within range, dropping one medkit and Scrap", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnSupplyChest("sealed", { x: player.x + 0.5, y: player.y });

    const snapshot = simulation.step(intent({ interactPressed: true }), 0.05);
    expect(snapshot.events.some((event) => event.type === "supply-chest-opened")).toBe(true);
    expect(snapshot.supplyChests).toHaveLength(0);
    expect(snapshot.powerups.filter((powerup) => powerup.type === "medkit")).toHaveLength(1);
    expect(snapshot.securedScrap).toBeGreaterThan(0);
  });

  it("refuses to open a sealed chest out of range", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnSupplyChest("sealed", { x: player.x + 6, y: player.y });

    const snapshot = simulation.step(intent({ interactPressed: true }), 0.05);
    expect(snapshot.events.some((event) => event.type === "supply-chest-opened")).toBe(false);
    expect(snapshot.supplyChests).toHaveLength(1);
  });

  it("gives a freshly spawned armored chest the authored base health and ignores interact", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    const id = simulation.spawnSupplyChest("armored", { x: player.x + 1, y: player.y });
    const chest = simulation.snapshot().supplyChests.find((candidate) => candidate.id === id)!;
    expect(chest.maxHealth).toBe(SUPPLY_CHEST_BASE_HEALTH);

    const snapshot = simulation.step(intent({ interactPressed: true }), 0.05);
    expect(snapshot.supplyChests).toHaveLength(1);
    expect(snapshot.events.some((event) => event.type === "supply-chest-opened")).toBe(false);
  });

  it("breaks an armored chest to gunfire, dropping two medkits and no Scrap", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["bastion-service-rifle"],
    });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnSupplyChest("armored", { x: player.x + 3, y: player.y });

    let destroyed = false;
    for (let frame = 0; frame < 400 && !destroyed; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      destroyed ||= snapshot.events.some((event) => event.type === "supply-chest-destroyed");
    }
    const finalSnapshot = simulation.snapshot();
    expect(destroyed).toBe(true);
    expect(finalSnapshot.supplyChests).toHaveLength(0);
    expect(finalSnapshot.powerups.filter((powerup) => powerup.type === "medkit")).toHaveLength(2);
    expect(finalSnapshot.securedScrap).toBe(0);
  });

  it("emits a hit event with remaining health while an armored chest survives", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["bastion-service-rifle"],
    });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnSupplyChest("armored", { x: player.x + 3, y: player.y });

    let sawHit = false;
    for (let frame = 0; frame < 20 && !sawHit; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      const hit = snapshot.events.find((event) => event.type === "supply-chest-hit");
      if (hit && hit.type === "supply-chest-hit") {
        sawHit = true;
        expect(hit.remainingHealth).toBeLessThan(SUPPLY_CHEST_BASE_HEALTH);
        expect(hit.remainingHealth).toBeGreaterThan(0);
      }
    }
    expect(sawHit).toBe(true);
  });
});

describe("Medkit healing", () => {
  it("heals the Marine on pickup and fires the shared healed event", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    woundPlayer(simulation);
    const wounded = simulation.snapshot().playerHealth;
    const player = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("medkit", { x: player.x + 0.1, y: player.y });

    const snapshot = simulation.step(intent(), 0.05);
    expect(snapshot.playerHealth).toBeCloseTo(
      Math.min(snapshot.playerMaxHealth, wounded + MEDKIT_HEAL_AMOUNT),
      5,
    );
    expect(snapshot.events.some((event) => event.type === "player-healed")).toBe(true);
    expect(snapshot.powerups.filter((powerup) => powerup.type === "medkit")).toHaveLength(0);
  });

  it("never heals a full-health Marine above max, and drops no healed event", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    expect(simulation.snapshot().playerHealth).toBe(simulation.snapshot().playerMaxHealth);
    simulation.spawnPowerup("medkit", { x: player.x + 0.1, y: player.y });

    const snapshot = simulation.step(intent(), 0.05);
    expect(snapshot.playerHealth).toBe(snapshot.playerMaxHealth);
    expect(snapshot.events.some((event) => event.type === "player-healed")).toBe(false);
    expect(snapshot.powerups.filter((powerup) => powerup.type === "medkit")).toHaveLength(0);
  });
});
