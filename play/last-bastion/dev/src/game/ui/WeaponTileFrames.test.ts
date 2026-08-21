import { describe, expect, it } from "vitest";
import {
  HERO_STARTING_WEAPONS,
  UNIQUE_SLOT_WEAPONS,
  WEAPON_CATALOG,
  WEAPON_CHEST_POOL,
  type WeaponId,
} from "../content/weaponCatalog";
import {
  WEAPON_BATCH_68A_FRAMES,
  WEAPON_BATCH_68B_FRAMES,
  WEAPON_BATCH_68C_FRAMES,
  canonicalWeaponTileFrame,
  weaponTilePresentation,
  shopWeaponTilePresentation,
} from "./WeaponTileFrames";

const PENDING_ART_WEAPON_IDS: readonly WeaponId[] = [
  "railspike", "seeker-swarm", "cryo-lance", "tesla-coil", "flamethrower", "sawblade", "event-horizon",
  // Elemental balance pass (31 July 2026), art pending on the same terms.
  "corrosive-lobber", "scourge-repeater", "bile-lance", "hoarfrost-scatter", "glacier-ward", "tether-harpoon",
  // First deployable, art pending on the same terms.
  "sentry-stake",
  // Transformation-bound support entity; never appears in the weapon ring.
  "auxiliary-drone",
  // Tier 1 hole-fillers (8 Aug 2026), art pending on the same terms — they
  // borrow by attack pattern until asset batch 80 lands.
  "emberlance", "storm-coil-beam",
];

const STANDALONE_TILE_WEAPON_IDS: readonly WeaponId[] = ["marauder-ar"];

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
  "auxiliary-drone": 7,
  // Lobbed and explosive → grenade tube; the sustained arc joins the other
  // beams on the scattergun spread tile.
  emberlance: 3,
  "storm-coil-beam": 0,
};

describe("canonical Batch I weapon tile mapping", () => {
  it("maps every Batch I weapon to one unique atlas frame", () => {
    const batchIIds = (Object.keys(WEAPON_CATALOG) as WeaponId[])
      .filter((id) => !PENDING_ART_WEAPON_IDS.includes(id) && !PENDING_MELEE_WEAPON_IDS.includes(id) && !STANDALONE_TILE_WEAPON_IDS.includes(id));
    const frames = batchIIds.map(canonicalWeaponTileFrame);
    expect(batchIIds).toHaveLength(8);
    expect(new Set(frames).size).toBe(8);
    expect([...frames].sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("selects Marauder's standalone tile without expanding the stable Batch I atlas", () => {
    expect(weaponTilePresentation("marauder-ar")).toEqual({ texture: "marauder-ar-tile-v1" });
    expect(weaponTilePresentation("bastion-service-rifle")).toEqual({
      texture: "batch-i-weapon-tiles-v1", frame: 7,
    });
  });

  it("selects every dedicated Batch 68A tile and the existing Event Horizon tile", () => {
    expect(WEAPON_BATCH_68A_FRAMES).toEqual({
      railspike: 0,
      "seeker-swarm": 1,
      "cryo-lance": 2,
      "tesla-coil": 3,
      flamethrower: 4,
      sawblade: 5,
      "combat-knife": 6,
      machete: 7,
    });
    for (const [weaponId, frame] of Object.entries(WEAPON_BATCH_68A_FRAMES)) {
      expect(weaponTilePresentation(weaponId as WeaponId)).toEqual({
        texture: "weapon-identity-atlas-68a-v1",
        frame,
      });
    }
    expect(weaponTilePresentation("event-horizon")).toEqual({ texture: "event-horizon-tile-v1" });
  });

  it("selects every dedicated Batch 68B tile", () => {
    expect(WEAPON_BATCH_68B_FRAMES).toEqual({
      "fire-axe": 0,
      "shock-baton": 1,
      "breaching-maul": 2,
      "plasma-saber": 3,
      "corrosive-lobber": 4,
      "scourge-repeater": 5,
      "bile-lance": 6,
      "rime-cleaver": 7,
    });
    for (const [weaponId, frame] of Object.entries(WEAPON_BATCH_68B_FRAMES)) {
      expect(weaponTilePresentation(weaponId as WeaponId)).toEqual({
        texture: "weapon-identity-atlas-68b-v1",
        frame,
      });
    }
  });

  it("selects every dedicated Batch 68C tile", () => {
    expect(WEAPON_BATCH_68C_FRAMES).toEqual({
      "hoarfrost-scatter": 0,
      "glacier-ward": 1,
      "tether-harpoon": 2,
      "sentry-stake": 3,
      emberlance: 4,
      "storm-coil-beam": 5,
      "blight-scythe": 6,
    });
    for (const [weaponId, frame] of Object.entries(WEAPON_BATCH_68C_FRAMES)) {
      expect(weaponTilePresentation(weaponId as WeaponId)).toEqual({
        texture: "weapon-identity-atlas-68c-v1",
        frame,
      });
    }
  });

  it("never gives a released expansion weapon a borrowed Batch I tile", () => {
    const acceptedBatchIIds = new Set<WeaponId>([
      "bastion-service-rifle", "scattergun", "arc-carbine", "patrol-blade",
      "bolt-carbine", "bulwark-rotary-cannon", "grenade-tube", "injector-carbine",
    ]);
    const playerFacingIds = [...WEAPON_CHEST_POOL, ...UNIQUE_SLOT_WEAPONS, ...HERO_STARTING_WEAPONS];
    for (const weaponId of playerFacingIds) {
      if (acceptedBatchIIds.has(weaponId)) continue;
      expect(weaponTilePresentation(weaponId).texture).not.toBe("batch-i-weapon-tiles-v1");
    }
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

describe("Scrap Shop weapon tile presentation", () => {
  it("uses the offered weapon's dedicated identity", () => {
    expect(shopWeaponTilePresentation("shop-weapon:railspike"))
      .toEqual(weaponTilePresentation("railspike"));
    expect(shopWeaponTilePresentation("shop-weapon:storm-coil-beam"))
      .toEqual(weaponTilePresentation("storm-coil-beam"));
  });

  it("leaves non-weapon and invalid stock on its existing presentation path", () => {
    expect(shopWeaponTilePresentation("shop-repair")).toBeNull();
    expect(shopWeaponTilePresentation("shop-weapon:not-a-weapon")).toBeNull();
  });
});
