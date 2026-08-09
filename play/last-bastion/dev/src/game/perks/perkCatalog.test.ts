import { describe, expect, it } from "vitest";
import { PERK_CATALOG, resolvePerkModifiers, unlockedPerkIds } from "./perkCatalog";
import type { GameProgress } from "../save/LocalSaveStore";

function progress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0,
    bestNodesCleared: 0, totalKills: 0, totalDamage: 0, totalScrapEarned: 0,
    bestiary: {}, ...overrides,
    threatTierBestNodes: overrides.threatTierBestNodes ?? { 0: 0, 1: 0, 2: 0 },
    threatTierVictories: overrides.threatTierVictories ?? { 0: 0, 1: 0, 2: 0 },
    commandMarksLifetime: overrides.commandMarksLifetime ?? 0,
    purchasedArmoryNodeIds: overrides.purchasedArmoryNodeIds ?? [],
  };
}

describe("perk behavior gate", () => {
  it("keeps the original seven perks and adds a victory-gated advanced track", () => {
    expect(PERK_CATALOG).toHaveLength(10);
    expect(unlockedPerkIds(progress())).toEqual(["perk-veteran"]);
    expect(unlockedPerkIds(progress({
      runsFinished: 3, victories: 1, bestWaveReached: 4, nodesCleared: 20,
    }))).toEqual(PERK_CATALOG.slice(0, 7).map((perk) => perk.id));

    const advanced = progress({
      runsFinished: 3, victories: 4, bestWaveReached: 4, nodesCleared: 20,
      threatTierVictories: { 0: 2, 1: 1, 2: 1 },
    });
    expect(unlockedPerkIds(advanced)).toEqual(PERK_CATALOG.map((perk) => perk.id));
  });

  it("requires a victory on each exact threat tier for its advanced perk", () => {
    expect(unlockedPerkIds(progress({ threatTierVictories: { 0: 1, 1: 0, 2: 0 } })))
      .toEqual(["perk-veteran", "perk-vanguard"]);
    expect(unlockedPerkIds(progress({ threatTierVictories: { 0: 0, 1: 1, 2: 0 } })))
      .toEqual(["perk-veteran", "perk-logistician"]);
    expect(unlockedPerkIds(progress({ threatTierVictories: { 0: 0, 1: 0, 2: 1 } })))
      .toEqual(["perk-veteran", "perk-recon-specialist"]);
  });

  it("resolves each perk once into the portable run modifier contract", () => {
    expect(resolvePerkModifiers("perk-veteran").startingLevel).toBe(2);
    expect(resolvePerkModifiers("perk-scrapper").weaponSaleFraction).toBe(0.75);
    expect(resolvePerkModifiers("perk-quartermaster").inventoryBonusSlots).toBe(2);
    expect(resolvePerkModifiers("perk-fast-learner").earlyExperienceMultiplier).toBe(1.15);
    expect(resolvePerkModifiers("perk-gunsmith").mergeDamageMultiplier).toBe(1.1);
    expect(resolvePerkModifiers("perk-survivor").lowHealthDamageMultiplier).toBe(0.75);
    expect(resolvePerkModifiers("perk-pathfinder").mapRevealBonusColumns).toBe(1);
    expect(resolvePerkModifiers("perk-vanguard").startingLevel).toBe(3);
    expect(resolvePerkModifiers("perk-logistician").inventoryBonusSlots).toBe(3);
    expect(resolvePerkModifiers("perk-recon-specialist").mapRevealBonusColumns).toBe(2);
  });
});
