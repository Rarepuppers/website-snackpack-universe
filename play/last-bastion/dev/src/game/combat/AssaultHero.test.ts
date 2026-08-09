import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { ASSAULT } from "../hero/assault";
import { HERO_CATALOG, heroDefinition } from "../hero/HeroCatalog";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 1, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  interactPressed: false,
  ultimatePressed: false,
  kitPressed: false,
  pausePressed: false,
  restartPressed: false,
};

describe("Assault hero mechanics contract", () => {
  it("registers the authored identity, loadout, rack, and upgrade economy", () => {
    expect(heroDefinition("assault")).toBe(ASSAULT);
    expect(Object.values(HERO_CATALOG).map((hero) => hero.id)).toEqual(["marine", "medic", "assault"]);

    const deployed = new CombatSimulation({ heroId: "assault", autoStartWaves: false }).snapshot();
    expect(deployed.heroId).toBe("assault");
    expect(deployed.playerMaxHealth).toBe(9);
    expect(deployed.equippedWeapons[0]!.weaponId).toBe("marauder-ar");
    expect(deployed.weaponInventory.rack.map((slot) => slot.weaponClass))
      .toEqual(["medium", "medium", "heavy", "all"]);
    expect(Object.fromEntries(deployed.upgradeSlots.map((slot) => [slot.category, slot.capacity])))
      .toEqual({ offensive: 4, defensive: 1, support: 1, scavenger: 1 });
    expect(deployed.heroPresentation).toMatchObject({
      id: "assault",
      passiveId: "momentum",
      passiveName: "Momentum",
      ultimateName: "Breach & Clear",
      ultimateCooldownSeconds: 22,
    });
  });

  it("ramps Momentum on one target, caps it, and expires the chain", () => {
    const simulation = new CombatSimulation({ heroId: "assault", autoStartWaves: false, seed: 48 });
    const player = simulation.snapshot().playerPosition;
    const targetId = simulation.spawnMiniBoss("siege-crusher", { x: player.x + 5, y: player.y });
    const hitDamage: number[] = [];

    for (let frame = 0; frame < 90 && hitDamage.length < 7; frame += 1) {
      const snapshot = simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      for (const event of snapshot.events) {
        if (event.type === "enemy-hit" && event.enemyId === targetId) hitDamage.push(event.damage);
      }
    }

    expect(hitDamage.length).toBeGreaterThanOrEqual(6);
    expect(hitDamage[1]).toBeGreaterThan(hitDamage[0]!);
    expect(hitDamage.slice(0, 6).every((damage, index, hits) => index === 0 || damage > hits[index - 1]!)).toBe(true);
    expect(hitDamage[6]).toBeCloseTo(hitDamage[5]!, 5);
    expect(simulation.snapshot().assaultMomentumStacks).toBe(5);

    for (let frame = 0; frame < 26; frame += 1) simulation.step(IDLE, 0.05);
    expect(simulation.snapshot().assaultMomentumStacks).toBe(0);
  });

  it("fires Breach & Clear as nine forward-cone rounds", () => {
    const simulation = new CombatSimulation({ heroId: "assault", autoStartWaves: false });
    const snapshot = simulation.step({ ...IDLE, ultimatePressed: true }, 0.01);
    const rounds = snapshot.projectiles.filter((projectile) => projectile.weaponId === "marauder-ar");

    expect(rounds).toHaveLength(9);
    expect(Math.min(...rounds.map((round) => round.rotationRadians))).toBeCloseTo(-5 * Math.PI / 18, 5);
    expect(Math.max(...rounds.map((round) => round.rotationRadians))).toBeCloseTo(5 * Math.PI / 18, 5);
    expect(rounds.every((round) => Math.cos(round.rotationRadians) > 0)).toBe(true);
    expect(snapshot.ultimateReady).toBe(false);
    expect(snapshot.ultimateCooldownRemainingSeconds).toBeGreaterThan(21.9);
  });
});
