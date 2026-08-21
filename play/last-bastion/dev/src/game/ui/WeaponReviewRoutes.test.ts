import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { WEAPON_REVIEW_PAGES, weaponReviewPage } from "./WeaponReviewRoutes";

describe("weapon review routes", () => {
  it("partitions every player-facing tile identity exactly once", () => {
    const reviewed = Object.values(WEAPON_REVIEW_PAGES).flat();
    const playerFacing = Object.keys(WEAPON_CATALOG).filter((id) => id !== "auxiliary-drone");

    expect(new Set(reviewed).size).toBe(reviewed.length);
    expect([...reviewed].sort()).toEqual(playerFacing.sort());
    expect(Object.values(WEAPON_REVIEW_PAGES).every((page) => page.length <= 4)).toBe(true);
  });

  it("resolves valid pages and rejects unknown review input", () => {
    expect(weaponReviewPage("?weaponreview=68A-1")).toEqual(WEAPON_REVIEW_PAGES["68a-1"]);
    expect(weaponReviewPage("?weaponreview=unknown")).toBeNull();
    expect(weaponReviewPage("")).toBeNull();
  });
});
