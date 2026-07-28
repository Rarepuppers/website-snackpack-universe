import { describe, expect, it } from "vitest";
import { CombatSimulation } from "../combat/CombatSimulation";
import { createBuildViewModel, previewShopPurchase } from "./BuildViewModel";

describe("BuildViewModel", () => {
  it("creates a non-mutating, deterministic build inspection", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const snapshot = simulation.snapshot();
    const before = snapshot.securedScrap;
    const model = createBuildViewModel(snapshot);
    expect(model.hero.name).toBe("Marine");
    expect(model.rack.some(Boolean)).toBe(true);
    expect(model.rack.find(Boolean)?.dpsLabel).toBe("estimated");
    expect(previewShopPurchase(snapshot, { cost: 3, statDelta: { damagePercent: 5 }, itemId: "damage" }).scrapAfter).toBe(before);
    expect(simulation.snapshot().securedScrap).toBe(before);
  });
});
