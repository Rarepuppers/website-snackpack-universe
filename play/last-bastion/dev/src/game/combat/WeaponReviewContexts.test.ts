import { describe, expect, it } from "vitest";
import { WEAPON_REVIEW_PAGES } from "../ui/WeaponReviewRoutes";
import { CombatSimulation } from "./CombatSimulation";

describe("weapon review contexts", () => {
  it("boots a quiet HUD lab with exactly the requested page equipped", () => {
    const page = WEAPON_REVIEW_PAGES["68a-1"];
    const simulation = new CombatSimulation({
      scenario: "weapon-review",
      startingWeaponIds: page,
      reviewWeaponIds: page,
    });
    const snapshot = simulation.snapshot();

    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.equippedWeapons.map(({ weaponId }) => weaponId)).toEqual(page);
  });

  it("fills the real shop rack from the requested review page", () => {
    const page = WEAPON_REVIEW_PAGES["68b-1"];
    const simulation = new CombatSimulation({
      scenario: "scrap-shop",
      startingScrap: 999,
      reviewWeaponIds: page,
    });
    const offers = simulation.snapshot().pendingDecision?.options
      .filter(({ id }) => id.startsWith("shop-weapon:"))
      .map(({ id }) => id.replace("shop-weapon:", ""));

    expect(offers?.sort()).toEqual([...page].sort());
  });

  it("does not turn earned or hero-bound identities into shop stock", () => {
    const simulation = new CombatSimulation({
      scenario: "scrap-shop",
      startingScrap: 999,
      reviewWeaponIds: WEAPON_REVIEW_PAGES["special-1"],
    });
    const weaponOffers = simulation.snapshot().pendingDecision?.options
      .filter(({ id }) => id.startsWith("shop-weapon:"));

    expect(weaponOffers).toEqual([]);
  });
});
