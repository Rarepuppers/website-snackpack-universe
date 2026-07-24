import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";
import type { PlayerIntent } from "../input/PlayerIntent";
import type { WeaponId } from "../content/weaponCatalog";

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

function build(weaponId: WeaponId, itemStats?: Partial<PlayerStatBlock>): ExpeditionBuildSnapshot {
  return {
    health: 10,
    shield: 0,
    level: 1,
    experience: 0,
    scrap: 0,
    weapons: [{ weaponId, tier: 1 }],
    upgrades: [],
    ...(itemStats ? { itemStats } : {}),
  };
}

/**
 * Fires a single shot into a durable dummy and returns the damage it dealt.
 * The target sits beyond the weapon muzzle (a single equipped weapon fires from
 * ~0.82m ahead of the player); the 5-frame window (0.25s) is long enough for the
 * projectile to travel yet shorter than every test weapon's re-fire interval, so
 * exactly one shot lands. nest-pod has 9 HP, no armour/flat-reduction, and no
 * physical/toxic resistance, so the boosted hit can't clamp against enemy health.
 */
function firstHitDamage(weaponId: WeaponId, itemStats?: Partial<PlayerStatBlock>): number {
  const sim = new CombatSimulation({ autoStartWaves: false, startingBuild: build(weaponId, itemStats) });
  const player = sim.snapshot().playerPosition;
  const enemyId = sim.spawnEnemy("nest-pod", { x: player.x + 1.5, y: player.y });
  const before = sim.snapshot().enemies.find((e) => e.id === enemyId)!.health;
  let after = before;
  for (let frame = 0; frame < 5; frame += 1) {
    after = sim.step(intent({ fireHeld: true }), 0.05).enemies.find((e) => e.id === enemyId)?.health ?? after;
  }
  return before - after;
}

describe("PlayerStatBlock damage stats reach real combat (Phase 1)", () => {
  it("global %-damage scales a physical ranged weapon's hit", () => {
    // bolt-carbine: ranged (projectile), physical damage.
    const base = firstHitDamage("bolt-carbine");
    const boosted = firstHitDamage("bolt-carbine", { damagePercent: 50 });
    expect(base).toBeGreaterThan(0);
    expect(boosted).toBeCloseTo(base * 1.5, 4);
  });

  it("ranged damage buffs a ranged weapon but melee damage does not", () => {
    const base = firstHitDamage("bolt-carbine");
    const ranged = firstHitDamage("bolt-carbine", { rangedDamagePercent: 40 });
    const melee = firstHitDamage("bolt-carbine", { meleeDamagePercent: 40 });
    expect(ranged).toBeCloseTo(base * 1.4, 4);
    expect(melee).toBeCloseTo(base, 4);
  });

  it("melee damage buffs a melee weapon but ranged damage does not", () => {
    // patrol-blade: melee-sweep, physical.
    const base = firstHitDamage("patrol-blade");
    const melee = firstHitDamage("patrol-blade", { meleeDamagePercent: 40 });
    const ranged = firstHitDamage("patrol-blade", { rangedDamagePercent: 40 });
    expect(base).toBeGreaterThan(0);
    expect(melee).toBeCloseTo(base * 1.4, 4);
    expect(ranged).toBeCloseTo(base, 4);
  });

  it("elemental damage buffs an elemental weapon but not a physical one", () => {
    // injector-carbine: ranged, toxic (elemental). bolt-carbine: ranged, physical.
    const elementalBase = firstHitDamage("injector-carbine");
    const elementalBoosted = firstHitDamage("injector-carbine", { elementalDamagePercent: 50 });
    const physicalBase = firstHitDamage("bolt-carbine");
    const physicalWithElemental = firstHitDamage("bolt-carbine", { elementalDamagePercent: 50 });
    expect(elementalBoosted).toBeCloseTo(elementalBase * 1.5, 4);
    expect(physicalWithElemental).toBeCloseTo(physicalBase, 4);
  });

  it("a guaranteed crit multiplies a hit by the crit multiplier; zero crit chance leaves it unchanged", () => {
    const base = firstHitDamage("bolt-carbine");
    const noCrit = firstHitDamage("bolt-carbine", { critChancePercent: 0 });
    const alwaysCrit = firstHitDamage("bolt-carbine", { critChancePercent: 100 });
    expect(noCrit).toBeCloseTo(base, 4); // default crit multiplier is 1.5 but 0% chance never fires
    expect(alwaysCrit).toBeCloseTo(base * 1.5, 4);
  });

  it("respects a custom crit multiplier bonus from item stats", () => {
    // critMultiplier is an additive bonus on the 1.5 baseline: +0.5 -> x2.0.
    // injector-carbine's small base hit keeps even a x2 crit under the dummy's health.
    const base = firstHitDamage("injector-carbine");
    const bigCrit = firstHitDamage("injector-carbine", { critChancePercent: 100, critMultiplier: 0.5 });
    expect(bigCrit).toBeCloseTo(base * 2.0, 4);
  });

  it("crits a melee weapon at the melee-sweep damage site too", () => {
    const base = firstHitDamage("patrol-blade");
    const alwaysCrit = firstHitDamage("patrol-blade", { critChancePercent: 100 });
    expect(alwaysCrit).toBeCloseTo(base * 1.5, 4);
  });
});
