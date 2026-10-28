import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { expeditionBuildFromCombatSnapshot as capture } from "../expedition/ExpeditionBuildSnapshot";
import { startExpeditionRun } from "../expedition/ExpeditionRun";
import { LocalSaveStore } from "../save/LocalSaveStore";

// Exercises the real production capture, serialization, normalization and restoration chain.
function roundTrip(sim: CombatSimulation) {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); } };
  const run = startExpeditionRun(117);
  const carried = capture(sim.snapshot());
  new LocalSaveStore(storage).saveExpedition({ ...run.state, clearedNodeIds: [run.map.startNodeId],
    build: { ...carried, weapons: [...carried.weapons], upgrades: [...carried.upgrades] } });
  const build = new LocalSaveStore(storage).load().expedition!.build!;
  return new CombatSimulation({ startingBuild: build, autoStartWaves: false });
}

describe("shop transactions across expedition saves", () => {
  it("retains a purchased item's ownership, stats and exact spend without reapplying it", () => {
    let sim: CombatSimulation | undefined;
    for (let seed = 1; seed < 60; seed++) {
      const candidate = new CombatSimulation({ scenario: "scrap-shop", seed, startingScrap: 400 });
      if (candidate.snapshot().pendingDecision!.options.some(option => option.id.startsWith("shop-item:"))) { sim = candidate; break; }
    }
    expect(sim).toBeDefined();
    const offer = sim!.snapshot().pendingDecision!.options.find(option => option.id.startsWith("shop-item:"))!;
    expect(sim!.chooseOption(offer.id)).toBe(true);
    const expected = sim!.snapshot();
    expect(expected.securedScrap).toBe(400 - offer.cost!);
    for (let hop = 0; hop < 3; hop++) {
      sim = roundTrip(sim!);
      const restored = sim.snapshot();
      expect(restored.ownedItemIds).toEqual(expected.ownedItemIds);
      expect(restored.itemStats).toEqual(expected.itemStats);
      expect(restored.securedScrap).toBe(expected.securedScrap);
      expect(restored.playerMaxHealth).toBe(expected.playerMaxHealth);
      expect(restored.playerArmour).toBe(expected.playerArmour);
    }
  });

  it("keeps a locked offer through its paid reroll, then carries the ban and spend to a new shop", () => {
    const sim = new CombatSimulation({ scenario: "scrap-shop", seed: 37 });
    const offer = sim.snapshot().pendingDecision!.options[0]!;
    expect(sim.chooseOption("shop-manage")).toBe(true);
    expect(sim.chooseOption(`shop-lock:${offer.id}`)).toBe(true);
    const reroll = sim.snapshot().pendingDecision!.options.find(option => option.id === "shop-reroll")!;
    expect(sim.chooseOption("shop-reroll")).toBe(true);
    expect(sim.snapshot().pendingDecision!.options.some(option => option.id === offer.id)).toBe(true);
    expect(sim.chooseOption("shop-manage")).toBe(true);
    expect(sim.chooseOption(`shop-ban:${offer.id}`)).toBe(true);
    const expected = capture(sim.snapshot());
    expect(expected.scrap).toBe(150 - reroll.cost!);
    const restored = roundTrip(sim);
    expect(restored.snapshot().bannedShopIds).toContain(offer.id);
    expect(restored.snapshot().securedScrap).toBe(expected.scrap);
    const nextShop = new CombatSimulation({ scenario: "scrap-shop", seed: 37, startingBuild: capture(restored.snapshot()) });
    expect(nextShop.snapshot().pendingDecision!.options.some(option => option.id === offer.id)).toBe(false);
  });
});
