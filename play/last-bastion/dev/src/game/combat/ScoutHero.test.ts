import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { heroGrowthAtLevel } from "../hero/LevelGrowth";
import { SCOUT } from "../hero/scout";
import { heroDefinition, isHeroId } from "../hero/HeroCatalog";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

describe("Scout hero mechanics contract", () => {
  it("registers the gated mobility identity, Light rack, and authored growth", () => {
    expect(isHeroId("scout")).toBe(true);
    expect(heroDefinition("scout")).toBe(SCOUT);
    const snapshot = new CombatSimulation({ heroId: "scout", autoStartWaves: false }).snapshot();
    expect(snapshot.playerMaxHealth).toBe(8);
    expect(snapshot.equippedWeapons[0]!.weaponId).toBe("arc-carbine");
    expect(snapshot.weaponInventory.rack.map((slot) => slot.weaponClass))
      .toEqual(["light", "light", "medium", "all"]);
    expect(snapshot.heroPresentation).toMatchObject({
      id: "scout", passiveName: "Slipstream",
      ultimateName: "Deadeye Burst", ultimateCooldownSeconds: 24,
    });
    expect(heroGrowthAtLevel(SCOUT, 5)).toMatchObject({
      maxHealthBonus: 0,
      armourBonus: 0,
      damageMultiplier: 1.08,
      speedMultiplier: 1.12,
    });
    expect(heroGrowthAtLevel(SCOUT, 5).proficiencyMultiplier.light).toBeCloseTo(1.16);
  });

  it("activates Slipstream on dash and shortens the next Arc Carbine cooldown", () => {
    const baseline = new CombatSimulation({ heroId: "scout", autoStartWaves: false });
    const boosted = new CombatSimulation({ heroId: "scout", autoStartWaves: false });
    const player = baseline.snapshot().playerPosition;
    baseline.spawnMiniBoss("siege-crusher", { x: player.x + 4, y: player.y });
    boosted.spawnMiniBoss("siege-crusher", { x: player.x + 4, y: player.y });
    const ordinary = baseline.step({ ...IDLE, fireHeld: true }, 0.05);
    const slipstream = boosted.step({
      ...IDLE, move: { x: 1, y: 0 }, fireHeld: true, evasiveMovePressed: true,
    }, 0.05);
    expect(slipstream.heroState).toBe("evading");
    expect(slipstream.equippedWeapons[0]!.cooldownDurationSeconds)
      .toBeLessThan(ordinary.equippedWeapons[0]!.cooldownDurationSeconds);
  });

  it("fires a tight three-round ultimate with two-target pierce", () => {
    const simulation = new CombatSimulation({ heroId: "scout", autoStartWaves: false });
    const snapshot = simulation.step({ ...IDLE, ultimatePressed: true }, 0.01);
    const burst = snapshot.projectiles.filter((projectile) => projectile.weaponId === "arc-carbine");
    expect(burst).toHaveLength(3);
    expect(burst.every((projectile) => projectile.pierceRemaining === 2)).toBe(true);
    expect(snapshot.ultimateCooldownRemainingSeconds).toBeGreaterThan(23.9);
  });
});
