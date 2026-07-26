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

describe("canonical Batch I weapon tile mapping", () => {
  it("maps every Batch I weapon to one unique atlas frame", () => {
    const batchIIds = (Object.keys(WEAPON_CATALOG) as WeaponId[])
      .filter((id) => !PENDING_ART_WEAPON_IDS.includes(id) && !PENDING_MELEE_WEAPON_IDS.includes(id));
    const frames = batchIIds.map(canonicalWeaponTileFrame);
    expect(batchIIds).toHaveLength(8);
    expect(new Set(frames).size).toBe(8);
    expect([...frames].sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("gives every art-pending weapon a placeholder frame until its own Batch I art lands (Phase 4)", () => {
    for (const id of PENDING_ART_WEAPON_IDS) {
      expect(canonicalWeaponTileFrame(id)).toBe(7);
    }
    for (const id of PENDING_MELEE_WEAPON_IDS) {
      expect(canonicalWeaponTileFrame(id)).toBe(1);
    }
  });
});
