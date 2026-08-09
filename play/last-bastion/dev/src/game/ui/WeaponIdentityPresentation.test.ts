import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { WEAPON_IDENTITY_PRESENTATIONS } from "./WeaponIdentityPresentation";

describe("WeaponIdentityPresentation", () => {
  it("covers every catalogued weapon with a stable identity and effect treatment", () => {
    const ids = Object.keys(WEAPON_CATALOG) as WeaponId[];
    expect(Object.keys(WEAPON_IDENTITY_PRESENTATIONS).sort()).toEqual(ids.sort());
    for (const id of ids) {
      expect(WEAPON_IDENTITY_PRESENTATIONS[id]!.silhouetteId).toBeTruthy();
      expect(WEAPON_IDENTITY_PRESENTATIONS[id]!.effectStyle).toBeTruthy();
    }
    expect(WEAPON_IDENTITY_PRESENTATIONS["event-horizon"]!.dedicatedAssetId).toBe("event-horizon-v1");
    expect(WEAPON_IDENTITY_PRESENTATIONS["marauder-ar"]!.dedicatedAssetId).toBe("marauder-ar-v1");
  });
});
