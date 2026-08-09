import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { heroGrowthAtLevel } from "../hero/LevelGrowth";
import { TACTICIAN } from "../hero/tactician";
import { HERO_CATALOG, heroDefinition } from "../hero/HeroCatalog";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

describe("Tactician hero mechanics contract", () => {
  it("registers the proposed identity, Event Horizon start, rack, and growth", () => {
    expect(heroDefinition("tactician")).toBe(TACTICIAN);
    expect(Object.values(HERO_CATALOG).map((hero) => hero.id))
      .toEqual(["marine", "medic", "assault", "tactician", "scout"]);
    const snapshot = new CombatSimulation({ heroId: "tactician", autoStartWaves: false }).snapshot();
    expect(snapshot.playerMaxHealth).toBe(11);
    expect(snapshot.equippedWeapons[0]!.weaponId).toBe("event-horizon");
    expect(snapshot.weaponInventory.rack.map((slot) => slot.weaponClass))
      .toEqual(["unique", "light", "medium", "all"]);
    expect(snapshot.heroPresentation).toMatchObject({
      id: "tactician", passiveName: "Designate Priority",
      ultimateName: "Coordinated Strike", ultimateCooldownSeconds: 26,
    });
    expect(heroGrowthAtLevel(TACTICIAN, 5)).toMatchObject({
      maxHealthBonus: 4,
      armourBonus: 2,
      damageMultiplier: 1.04,
      speedMultiplier: 1.03,
    });
    expect(heroGrowthAtLevel(TACTICIAN, 5).proficiencyMultiplier.unique).toBeCloseTo(1.16);
  });

  it("uses Event Horizon contact to designate targets", () => {
    const simulation = new CombatSimulation({ heroId: "tactician", autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnMiniBoss("siege-crusher", { x: player.x + 2, y: player.y });
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 120 && snapshot.tacticianDesignatedTargetCount === 0; frame += 1) {
      snapshot = simulation.step({ ...IDLE, fireHeld: true }, 0.05);
    }
    expect(snapshot.eventHorizonFields.length).toBeGreaterThan(0);
    expect(snapshot.tacticianDesignatedTargetCount).toBeGreaterThan(0);
  });

  it("orders an immediate attack from the equipped Event Horizon", () => {
    const simulation = new CombatSimulation({ heroId: "tactician", autoStartWaves: false });
    const snapshot = simulation.step({ ...IDLE, ultimatePressed: true }, 0.01);
    expect(snapshot.projectiles.filter((projectile) => projectile.weaponId === "event-horizon")).toHaveLength(1);
    expect(snapshot.events.some((event) => event.type === "ultimate-fired")).toBe(true);
    expect(snapshot.ultimateCooldownRemainingSeconds).toBeGreaterThan(25.9);
  });
});
