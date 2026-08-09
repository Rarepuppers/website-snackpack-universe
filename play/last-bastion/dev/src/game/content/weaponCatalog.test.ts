import { describe, expect, it } from "vitest";
import { HELD_WEAPONS_IN_POOL, shouldWeaponFire, TRANSFORMATION_WEAPONS, UNIQUE_SLOT_WEAPONS, VERTICAL_SLICE_WEAPON_IDS, WEAPON_CATALOG, WEAPON_CHEST_POOL, weaponPoolFor } from "./weaponCatalog";

describe("weaponCatalog", () => {
  it("locks the three vertical-slice weapon families", () => {
    expect(VERTICAL_SLICE_WEAPON_IDS).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    // 29 until 8 Aug 2026, when the three Tier 1 hole-filling weapons landed
    // (Emberlance / Storm Coil Beam / Blight Scythe).
    expect(Object.keys(WEAPON_CATALOG)).toHaveLength(33);
  });

  it("keeps each Phase 4 weapon's contract, and its pool membership in step with the art gate", () => {
    // Flag-aware on purpose: this used to hard-assert "held", which meant art
    // day required editing the test as well as the flag. Now the flip really is
    // one constant, and the tripwire still fires if the pool drifts from it.
    const expectPoolMembership = (id: Parameters<typeof WEAPON_CHEST_POOL.includes>[0]): void => {
      if (HELD_WEAPONS_IN_POOL) expect(WEAPON_CHEST_POOL).toContain(id);
      else expect(WEAPON_CHEST_POOL).not.toContain(id);
    };
    expect(WEAPON_CATALOG.railspike).toBeDefined();
    expect(WEAPON_CATALOG.railspike.pierceCount).toBeGreaterThanOrEqual(6);
    expectPoolMembership("railspike");

    expect(WEAPON_CATALOG["seeker-swarm"]).toBeDefined();
    expect(WEAPON_CATALOG["seeker-swarm"].homingTurnRateRadiansPerSecond).toBeGreaterThan(0);
    expectPoolMembership("seeker-swarm");

    expect(WEAPON_CATALOG["cryo-lance"]).toBeDefined();
    expect(WEAPON_CATALOG["cryo-lance"].attackPattern).toBe("beam");
    expect(WEAPON_CATALOG["cryo-lance"].beamDamagePerSecond).toBeGreaterThan(0);
    expectPoolMembership("cryo-lance");

    expect(WEAPON_CATALOG["tesla-coil"]).toBeDefined();
    expect(WEAPON_CATALOG["tesla-coil"].attackPattern).toBe("orbit");
    expect(WEAPON_CATALOG["tesla-coil"].chainCount).toBeGreaterThan(0);
    expectPoolMembership("tesla-coil");

    expect(WEAPON_CATALOG.flamethrower).toBeDefined();
    expect(WEAPON_CATALOG.flamethrower.attackPattern).toBe("beam");
    expect(WEAPON_CATALOG.flamethrower.meleeArcRadians).toBeGreaterThan(WEAPON_CATALOG["cryo-lance"].meleeArcRadians);
    expectPoolMembership("flamethrower");

    expect(WEAPON_CATALOG.sawblade).toBeDefined();
    expect(WEAPON_CATALOG.sawblade.attackPattern).toBe("orbit-blade");
    expect(WEAPON_CATALOG.sawblade.orbitRadiusMetres).toBeGreaterThan(0);
    expectPoolMembership("sawblade");

    expect(WEAPON_CATALOG["event-horizon"]).toBeDefined();
    expect(WEAPON_CATALOG["event-horizon"].weaponClass).toBe("unique");
    expect(WEAPON_CATALOG["event-horizon"].spawnsGravityWellOnImpact).toBe(true);
    // Never in the *base* pool — uniques are earned, see the weaponPoolFor block.
    expect(WEAPON_CHEST_POOL).not.toContain("event-horizon");
  });

  describe("weaponPoolFor — the single source of truth for both acquisition routes", () => {
    it("withholds Unique-class weapons until the run has earned them", () => {
      const locked = weaponPoolFor({ uniqueUnlocked: false });
      expect(locked).not.toContain("event-horizon");
      expect(locked).toEqual(WEAPON_CHEST_POOL);
    });

    it("admits them once unlocked, without disturbing the base pool", () => {
      const unlocked = weaponPoolFor({ uniqueUnlocked: true });
      expect(unlocked).toContain("event-horizon");
      expect(unlocked).toHaveLength(WEAPON_CHEST_POOL.length + UNIQUE_SLOT_WEAPONS.length);
      expect(new Set(unlocked).size).toBe(unlocked.length);
    });

    it("releases every non-unique weapon in the catalogue", () => {
      // The 26 July release: the only thing a run cannot reach by any route is a
      // Unique it has not earned. If a weapon is ever added and forgotten, this
      // fails rather than shipping another unobtainable subsystem.
      const reachable = new Set([...weaponPoolFor({ uniqueUnlocked: true }), ...TRANSFORMATION_WEAPONS]);
      for (const id of Object.keys(WEAPON_CATALOG) as (keyof typeof WEAPON_CATALOG)[]) {
        expect(reachable.has(id)).toBe(true);
      }
    });
  });

  describe("elemental coverage", () => {
    const byType = (type: string) => Object.values(WEAPON_CATALOG).filter((w) => w.damageType === type);

    it("gives every damage type a reachable weapon in more than one shape", () => {
      // The rack was 13 physical / 3 fire / 3 shock / 1 cryo / 1 toxic while the
      // bestiary priced resistances per type. A player reading the table right
      // still had nothing to swap to, which made the whole system decorative.
      for (const type of ["physical", "fire", "shock", "cryo", "toxic"]) {
        const weapons = byType(type);
        expect(weapons.length, `${type} weapon count`).toBeGreaterThanOrEqual(3);
        expect(new Set(weapons.map((w) => w.attackPattern)).size, `${type} attack patterns`)
          .toBeGreaterThanOrEqual(2);
      }
    });

    it("answers the storm faction's Shock resistance with a non-Shock chaining weapon", () => {
      // storm-savant/storm-node resist Shock at x0.45-0.5. Every chain weapon
      // used to deal Shock, so the counter-play the resistance implies was a
      // dead end.
      const chainers = Object.values(WEAPON_CATALOG).filter((w) => w.chainCount > 0);
      expect(chainers.some((w) => w.damageType !== "shock")).toBe(true);
    });
  });

  it("gives each family a distinct attack contract", () => {
    expect(WEAPON_CATALOG["bastion-service-rifle"].attackPattern).toBe("projectile");
    expect(WEAPON_CATALOG.scattergun.projectileCount).toBe(5);
    expect(WEAPON_CATALOG.scattergun.knockbackMetres).toBeGreaterThan(0);
    expect(WEAPON_CATALOG["arc-carbine"].targetingMode).toBe("nearest-enemy");
    expect(WEAPON_CATALOG["arc-carbine"].chainCount).toBe(1);
    expect(WEAPON_CATALOG["arc-carbine"].firesAutomatically).toBe(true);
    expect(WEAPON_CATALOG["patrol-blade"].attackPattern).toBe("melee-sweep");
    expect(WEAPON_CATALOG["patrol-blade"].firesAutomatically).toBe(true);
    expect(WEAPON_CATALOG["patrol-blade"].fireIntervalSeconds).toBe(2.5);
    expect(WEAPON_CATALOG["bolt-carbine"].targetingMode).toBe("cursor");
    expect(WEAPON_CATALOG["bolt-carbine"].pierceCount).toBe(1);
    expect(WEAPON_CATALOG["bolt-carbine"].fireIntervalSeconds).toBe(1.8);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].fireIntervalSeconds).toBe(0.08);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].weaponClass).toBe("heavy");
    expect(WEAPON_CATALOG["grenade-tube"].explosionRadiusMetres).toBe(2.2);
    expect(WEAPON_CATALOG["grenade-tube"].projectileSpeedMetresPerSecond).toBe(8);
    expect(WEAPON_CATALOG["grenade-tube"].fireIntervalSeconds).toBe(4);
  });

  it("makes Manual mode trigger-owned except for autonomous support weapons", () => {
    const rifle = WEAPON_CATALOG["bastion-service-rifle"];
    const arc = WEAPON_CATALOG["arc-carbine"];
    expect(shouldWeaponFire(rifle, true, false)).toBe(true);
    expect(shouldWeaponFire(rifle, false, false)).toBe(false);
    expect(shouldWeaponFire(rifle, false, true)).toBe(true);
    expect(shouldWeaponFire(arc, false, false)).toBe(true);
  });
});
