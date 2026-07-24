import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { canonicalWeaponTileFrame } from "./WeaponTileFrames";

describe("canonical Batch I weapon tile mapping", () => {
  it("maps every Batch I weapon to one unique atlas frame", () => {
    const batchIIds = (Object.keys(WEAPON_CATALOG) as WeaponId[]).filter((id) => id !== "railspike");
    const frames = batchIIds.map(canonicalWeaponTileFrame);
    expect(batchIIds).toHaveLength(8);
    expect(new Set(frames).size).toBe(8);
    expect([...frames].sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("gives Railspike a placeholder frame until its own Batch I art lands (Phase 4)", () => {
    expect(canonicalWeaponTileFrame("railspike")).toBe(7);
  });
});
