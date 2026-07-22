import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { canonicalWeaponTileFrame } from "./WeaponTileFrames";

describe("canonical Batch I weapon tile mapping", () => {
  it("maps every live weapon to one unique atlas frame", () => {
    const ids = Object.keys(WEAPON_CATALOG) as WeaponId[];
    const frames = ids.map(canonicalWeaponTileFrame);
    expect(ids).toHaveLength(8);
    expect(new Set(frames).size).toBe(8);
    expect([...frames].sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
