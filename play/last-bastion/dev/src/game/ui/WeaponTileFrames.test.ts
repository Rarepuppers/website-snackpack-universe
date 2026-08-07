import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { canonicalWeaponTileFrame } from "./WeaponTileFrames";

const PENDING_ART_WEAPON_IDS: readonly WeaponId[] = [
  "railspike", "seeker-swarm", "cryo-lance", "tesla-coil", "flamethrower", "sawblade", "event-horizon",
  // Elemental balance pass (31 July 2026), art pending on the same terms.
  "corrosive-lobber", "scourge-repeater", "bile-lance", "hoarfrost-scatter", "glacier-ward", "tether-harpoon",
  // First deployable, art pending on the same terms.
  "sentry-stake",
  // Tier 1 hole-fillers (8 Aug 2026), art pending on the same terms — they
  // borrow by attack pattern until asset batch 80 lands.
  "emberlance", "storm-coil-beam",
];

/**
 * The close-quarters family (25 July 2026) has no Batch I slots yet either, but
 * borrows the Patrol Blade's blade frame rather than the rifle's so the
 * placeholder at least reads as melee.
 */
const PENDING_MELEE_WEAPON_IDS: readonly WeaponId[] = ["combat-knife", "machete", "fire-axe", "shock-baton", "breaching-maul", "plasma-saber", "rime-cleaver", "blight-scythe"];

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
  // Elemental balance pass. Same rules: shells to the tube, chains and orbits
  // to the arc carbine, jets and spreads to the scattergun.
  "corrosive-lobber": 3,
  "tether-harpoon": 3,
  "scourge-repeater": 4,
  "glacier-ward": 4,
  "bile-lance": 0,
  "hoarfrost-scatter": 0,
  // A planted stake reads as ordnance, so it borrows the launcher tile.
  "sentry-stake": 3,
  // Lobbed and explosive → grenade tube; the sustained arc joins the other
  // beams on the scattergun spread tile.
  emberlance: 3,
  "storm-coil-beam": 0,
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
