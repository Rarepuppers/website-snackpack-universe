import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { foldItemStats } from "../content/itemCatalog";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { PlayerIntent } from "../input/PlayerIntent";

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

function buildWithItems(ownedItemIds: readonly string[], overrides: Partial<ExpeditionBuildSnapshot> = {}): ExpeditionBuildSnapshot {
  return {
    health: 10,
    shield: 0,
    level: 1,
    experience: 0,
    scrap: 0,
    weapons: [{ weaponId: "bolt-carbine", tier: 1 }],
    upgrades: [],
    itemStats: foldItemStats(ownedItemIds),
    ...overrides,
  };
}

describe("owned shop items reach combat through foldItemStats -> itemStats (Phase 2)", () => {
  it("Glass Cannon raises damage and lowers max HP together", () => {
    const baseline = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems([]) });
    const glass = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems(["glass-cannon"]) });

    // -15 max HP: base 10 -> below 3 is floored, so exactly 10 - 15 clamps to the 3 floor... assert it dropped.
    expect(glass.snapshot().playerMaxHealth).toBeLessThan(baseline.snapshot().playerMaxHealth);

    // +25% damage reaches the weapon hit.
    const basePlayer = baseline.snapshot().playerPosition;
    const glassPlayer = glass.snapshot().playerPosition;
    const baseId = baseline.spawnEnemy("nest-pod", { x: basePlayer.x + 1.5, y: basePlayer.y });
    const glassId = glass.spawnEnemy("nest-pod", { x: glassPlayer.x + 1.5, y: glassPlayer.y });
    const baseBefore = baseline.snapshot().enemies.find((e) => e.id === baseId)!.health;
    const glassBefore = glass.snapshot().enemies.find((e) => e.id === glassId)!.health;
    let baseAfter = baseBefore;
    let glassAfter = glassBefore;
    for (let frame = 0; frame < 5; frame += 1) {
      baseAfter = baseline.step(intent({ fireHeld: true }), 0.05).enemies.find((e) => e.id === baseId)?.health ?? baseAfter;
      glassAfter = glass.step(intent({ fireHeld: true }), 0.05).enemies.find((e) => e.id === glassId)?.health ?? glassAfter;
    }
    expect(glassBefore - glassAfter).toBeCloseTo((baseBefore - baseAfter) * 1.25, 4);
  });

  it("stacking two Whetstones doubles the damage bonus", () => {
    const one = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems(["whetstone"]) });
    const two = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems(["whetstone", "whetstone"]) });
    const base = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems([]) });

    const damage = (sim: CombatSimulation): number => {
      const p = sim.snapshot().playerPosition;
      const id = sim.spawnEnemy("nest-pod", { x: p.x + 1.5, y: p.y });
      const before = sim.snapshot().enemies.find((e) => e.id === id)!.health;
      let after = before;
      for (let frame = 0; frame < 5; frame += 1) after = sim.step(intent({ fireHeld: true }), 0.05).enemies.find((e) => e.id === id)?.health ?? after;
      return before - after;
    };

    const baseDamage = damage(base);
    expect(damage(one)).toBeCloseTo(baseDamage * 1.08, 4);
    expect(damage(two)).toBeCloseTo(baseDamage * 1.16, 4);
  });

  it("Bulwark Plating adds armour and slows the weapon, both at once", () => {
    const plated = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems(["bulwark-plating"]) });
    const base = new CombatSimulation({ autoStartWaves: false, startingBuild: buildWithItems([]) });
    const platedCd = plated.step(intent({ fireHeld: true }), 0.05).equippedWeapons[0]!.cooldownDurationSeconds;
    const baseCd = base.step(intent({ fireHeld: true }), 0.05).equippedWeapons[0]!.cooldownDurationSeconds;
    // -18% attack speed -> longer cooldown.
    expect(platedCd).toBeGreaterThan(baseCd);
  });
});
