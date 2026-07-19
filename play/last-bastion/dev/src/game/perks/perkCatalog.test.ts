import { describe, expect, it } from "vitest";
import { PERK_CATALOG, resolvePerkModifiers, unlockedPerkIds } from "./perkCatalog";
import type { GameProgress } from "../save/LocalSaveStore";

function progress(overrides: Partial<GameProgress> = {}): GameProgress {
  return { runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0, bestiary: {}, ...overrides };
}

describe("perk behavior gate", () => {
  it("defines seven stable one-slot perks and milestone unlocks", () => {
    expect(PERK_CATALOG).toHaveLength(7);
    expect(unlockedPerkIds(progress())).toEqual(["perk-veteran"]);
    expect(unlockedPerkIds(progress({ runsFinished: 3, victories: 1, bestWaveReached: 4, nodesCleared: 20 })))
      .toEqual(PERK_CATALOG.map((perk) => perk.id));
  });

  it("resolves each perk once into the portable run modifier contract", () => {
    expect(resolvePerkModifiers("perk-veteran").startingLevel).toBe(2);
    expect(resolvePerkModifiers("perk-scrapper").weaponSaleFraction).toBe(0.75);
    expect(resolvePerkModifiers("perk-quartermaster").inventoryBonusSlots).toBe(2);
    expect(resolvePerkModifiers("perk-fast-learner").earlyExperienceMultiplier).toBe(1.15);
    expect(resolvePerkModifiers("perk-gunsmith").mergeDamageMultiplier).toBe(1.1);
    expect(resolvePerkModifiers("perk-survivor").lowHealthDamageMultiplier).toBe(0.75);
    expect(resolvePerkModifiers("perk-pathfinder").mapRevealBonusColumns).toBe(1);
  });
});
