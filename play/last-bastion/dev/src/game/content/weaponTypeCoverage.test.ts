import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, WEAPON_CHEST_POOL, type WeaponId } from "./weaponCatalog";
import { CombatSimulation } from "../combat/CombatSimulation";
import type { DamageType } from "../combat/damageTypes";
import type { WeaponAttackPattern } from "./weaponCatalog";

/**
 * Coverage guards for the damage-type economy (content plan P3).
 *
 * The catalogue had three specific holes on 7 Aug 2026 — Fire had no ranged
 * projectile, Shock had no beam, Toxic had no melee — while physical sat at 52%
 * of the pool. These tests assert the holes stay closed and that the balance
 * does not drift back, which a raw weapon count would never catch.
 */
const ENTRIES = Object.values(WEAPON_CATALOG);

function has(damageType: DamageType, pattern: WeaponAttackPattern): boolean {
  return ENTRIES.some((weapon) => weapon.damageType === damageType && weapon.attackPattern === pattern);
}

const RANGED_PATTERNS: readonly WeaponAttackPattern[] = ["projectile", "scatter", "chain-projectile"];

describe("damage-type coverage", () => {
  it("gives every element at least one way to fight at range", () => {
    for (const damageType of ["fire", "shock", "cryo", "toxic"] as const) {
      const ranged = ENTRIES.some((weapon) =>
        weapon.damageType === damageType
        && (RANGED_PATTERNS.includes(weapon.attackPattern) || weapon.attackPattern === "beam"));
      expect(ranged, `${damageType} has no ranged option`).toBe(true);
    }
  });

  it("closes the three holes the content plan identified", () => {
    expect(has("fire", "projectile"), "fire ranged projectile").toBe(true);
    expect(has("shock", "beam"), "shock beam").toBe(true);
    expect(has("toxic", "melee-sweep"), "toxic melee").toBe(true);
  });

  it("gives every element a close-quarters option", () => {
    for (const damageType of ["fire", "shock", "cryo", "toxic"] as const) {
      const melee = ENTRIES.some((weapon) =>
        weapon.damageType === damageType
        && (weapon.attackPattern === "melee-sweep" || weapon.attackPattern === "orbit-blade"));
      expect(melee, `${damageType} has no melee option`).toBe(true);
    }
  });

  it("keeps physical under half the catalogue", () => {
    // Was 15 of 29 (52%). New weapons should correct the skew, never worsen it.
    const physical = ENTRIES.filter((weapon) => weapon.damageType === "physical").length;
    expect(physical / ENTRIES.length).toBeLessThan(0.5);
  });

  it("makes the shock roster proportionate to how many enemies are shock-weak", () => {
    // 13 of the 24 resistance entries are shock. Three shock weapons for that
    // many shock-weak enemies was the imbalance; four is still lean but real.
    const shock = ENTRIES.filter((weapon) => weapon.damageType === "shock").length;
    expect(shock).toBeGreaterThanOrEqual(4);
  });

  it("makes all three new weapons actually obtainable", () => {
    // A weapon absent from the chest pool is unreachable by any route.
    for (const id of ["emberlance", "storm-coil-beam", "blight-scythe"] as WeaponId[]) {
      expect(WEAPON_CHEST_POOL, id).toContain(id);
    }
  });
});

describe("the new weapons actually deal damage", () => {
  /**
   * Registration is not function: a weapon can be in the catalogue, the pool,
   * the codex and the tile map and still never land a hit. Each of the three
   * uses a different subsystem — projectile, beam, melee sweep — so each is
   * fired at a live target here.
   */
  const NEW_WEAPONS: readonly WeaponId[] = ["emberlance", "storm-coil-beam", "blight-scythe"];

  for (const weaponId of NEW_WEAPONS) {
    it(`${weaponId} damages an enemy it is fired at`, () => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingWeaponIds: [weaponId],
        seed: 31,
      });
      // Spawned relative to the player, not at an absolute point: the arena is
      // ~45x25 m, so a corner spawn sits outside the melee sweep (2.3 m), the
      // beam (5.5 m) and even the Emberlance's 14 m, and every weapon would
      // "fail" for want of a target rather than for want of function.
      const player = simulation.snapshot().playerPosition;
      const enemyId = simulation.spawnEnemy("abomination", { x: player.x + 1.6, y: player.y });
      const before = simulation.snapshot().enemies.find((e) => e.id === enemyId)!;
      const aim = { x: 1, y: 0 };

      let after = before;
      for (let frame = 0; frame < 240; frame += 1) {
        simulation.step({
          move: { x: 0, y: 0 },
          aim,
          fireHeld: true,
          evasiveMovePressed: false,
          interactPressed: false,
          ultimatePressed: false,
          kitPressed: false,
          pausePressed: false,
          restartPressed: false,
        }, 1 / 60);
        const found = simulation.snapshot().enemies.find((e) => e.id === enemyId);
        if (!found) return; // killed outright, which is damage enough
        after = found;
        if (after.health < before.health) return;
      }
      expect(after.health, `${weaponId} never damaged its target`).toBeLessThan(before.health);
    });
  }
});
