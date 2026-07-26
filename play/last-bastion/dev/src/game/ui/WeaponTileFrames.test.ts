import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { canonicalWeaponTileFrame } from "./WeaponTileFrames";

const PENDING_ART_WEAPON_IDS: readonly WeaponId[] = ["railspike", "seeker-swarm", "cryo-lance", "tesla-coil", "flamethrower", "sawblade", "event-horizon"];

/**
 * The close-quarters family (25 July 2026) has no Batch I slots yet either, but
 * borrows the Patrol Blade's blade frame rather than the rifle's so the
 * placeholder at least reads as melee.
 */
const PENDING_MELEE_WEAPON_IDS: readonly WeaponId[] = ["combat-knife", "machete", "fire-axe", "shock-baton", "breaching-maul", "plasma-saber"];

/** The tile each art-pending weapon borrows, chosen by attack pattern. */
const EXPECTED_PLACEHOLDER_FRAME: Readonly<Record<string, number>> = {
  // Projectiles → rifle; the gravitic/explosive shell → grenade tube.
  railspike: 7,
  "seeker-swarm": 7,
  "event-horizon": 3,
  // Sustained cones → scattergun's spread tile.
  "cryo-lance": 0,
  flamethrower: 0,
  // Orbiting coil → arc carbine, its own damage family.
  "tesla-coil": 4,
  // Orbiting blade and every contact weapon → patrol blade.
  sawblade: 1,
};

describe("canonical Batch I weapon tile mapping", () => {
  it("maps every Batch I weapon to one unique atlas frame", () => {
    const batchIIds = (Object.keys(WEAPON_CATALOG) as WeaponId[])
      .filter((id) => !PENDING_ART_WEAPON_IDS.includes(id) && !PENDING_MELEE_WEAPON_IDS.includes(id));
    const frames = batchIIds.map(canonicalWeaponTileFrame);
    expect(batchIIds).toHaveLength(8);
    expect(new Set(frames).size).toBe(8);
    expect([...frames].sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("groups every art-pending weapon onto the tile closest to how it plays", () => {
    for (const id of PENDING_ART_WEAPON_IDS) {
      expect(canonicalWeaponTileFrame(id)).toBe(EXPECTED_PLACEHOLDER_FRAME[id]);
    }
    // Contact weapons all read as a blade.
    for (const id of PENDING_MELEE_WEAPON_IDS) {
      expect(canonicalWeaponTileFrame(id)).toBe(1);
    }
  });

  it("never hands a released weapon a frame outside the atlas", () => {
    for (const id of Object.keys(WEAPON_CATALOG) as WeaponId[]) {
      const frame = canonicalWeaponTileFrame(id);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThanOrEqual(7);
    }
  });
});
