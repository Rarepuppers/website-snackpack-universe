import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";

describe("combat perk integration", () => {
  it("applies Veteran growth and Quartermaster stash capacity at construction", () => {
    const veteran = new CombatSimulation({ autoStartWaves: false, perkId: "perk-veteran" }).snapshot();
    const quartermaster = new CombatSimulation({ autoStartWaves: false, perkId: "perk-quartermaster" }).snapshot();
    expect(veteran.level).toBe(2);
    expect(veteran.playerMaxHealth).toBe(11);
    expect(quartermaster.weaponInventory.capacity).toBe(6);
  });

  it("applies Fast Learner before the fourth wave and Scrapper to shop resale", () => {
    const learner = new CombatSimulation({ autoStartWaves: false, perkId: "perk-fast-learner" });
    learner.addExperience(20);
    expect(learner.snapshot().level).toBe(2);
    expect(learner.snapshot().experience).toBe(13);

    const scrapper = new CombatSimulation({ scenario: "scrap-shop", startingWeaponCount: 2, perkId: "perk-scrapper" });
    expect(scrapper.chooseOption("shop-manage")).toBe(true);
    expect(scrapper.chooseOption("shop-sell-menu")).toBe(true);
    const sale = scrapper.snapshot().pendingDecision!.options.find((option) => option.id.startsWith("shop-sell:"))!;
    expect(sale.description).toContain("45 Scrap");
    expect(scrapper.chooseOption(sale.id)).toBe(true);
    expect(scrapper.snapshot().securedScrap).toBe(195);
  });

  it("applies the Gunsmith multiplier when a duplicate merges in the active rack", () => {
    const normal = new CombatSimulation({ scenario: "weapon-gate", startingWeaponIds: ["scattergun"] });
    const gunsmith = new CombatSimulation({ scenario: "weapon-gate", startingWeaponIds: ["scattergun"], perkId: "perk-gunsmith" });
    const normalMerge = normal.snapshot().pendingDecision!.options.find((option) => option.id.startsWith("place:merge:rack:"))!;
    const gunsmithMerge = gunsmith.snapshot().pendingDecision!.options.find((option) => option.id.startsWith("place:merge:rack:"))!;
    expect(normal.chooseOption(normalMerge.id)).toBe(true);
    expect(gunsmith.chooseOption(gunsmithMerge.id)).toBe(true);
    expect(gunsmith.snapshot().equippedWeapons[0]!.stats.projectileDamage)
      .toBeCloseTo(normal.snapshot().equippedWeapons[0]!.stats.projectileDamage * 1.1, 5);
  });
});
