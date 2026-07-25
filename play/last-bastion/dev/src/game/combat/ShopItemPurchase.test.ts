import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { itemById } from "../content/itemCatalog";

/** Opens a scrap-shop scenario with enough scrap to buy anything on the rack. */
function shop(seed = 11, startingScrap = 400): CombatSimulation {
  return new CombatSimulation({ scenario: "scrap-shop", seed, startingScrap });
}

/** The first item offer on the current rack, if the seeded draw produced one. */
function firstItemOffer(simulation: CombatSimulation): { id: string; cost: number } | null {
  const options = simulation.snapshot().pendingDecision?.options ?? [];
  const offer = options.find((option) => option.id.startsWith("shop-item:"));
  return offer ? { id: offer.id, cost: offer.cost ?? 0 } : null;
}

/** Rerolls (free, by rebuilding) until an item offer appears, or gives up. */
function findSeedWithItemOffer(): { simulation: CombatSimulation; offerId: string; cost: number } {
  for (let seed = 1; seed < 60; seed += 1) {
    const simulation = shop(seed);
    const offer = firstItemOffer(simulation);
    if (offer) return { simulation, offerId: offer.id, cost: offer.cost };
  }
  throw new Error("no seed produced an item offer");
}

describe("shop item purchases (Phase 2)", () => {
  it("offers catalogue items on the rack", () => {
    const { offerId } = findSeedWithItemOffer();
    const itemId = offerId.slice("shop-item:".length);
    expect(itemById(itemId)).not.toBeNull();
  });

  it("buying an item spends scrap and records it as owned", () => {
    const { simulation, offerId, cost } = findSeedWithItemOffer();
    const before = simulation.snapshot();
    expect(before.ownedItemIds).toEqual([]);

    expect(simulation.chooseOption(offerId)).toBe(true);

    const after = simulation.snapshot();
    expect(after.securedScrap).toBe(before.securedScrap - cost);
    expect(after.ownedItemIds).toEqual([offerId.slice("shop-item:".length)]);
  });

  it("an item's stats take effect immediately, mid-run", () => {
    // Ration Pack: +8 max HP. Bought mid-shop, the ceiling must rise right away
    // (and the gained max HP heals for the same amount).
    const simulation = shop(5);
    const beforeMax = simulation.snapshot().playerMaxHealth;
    simulation.grantItem("ration-pack");
    const after = simulation.snapshot();
    expect(after.playerMaxHealth).toBe(beforeMax + 8);
  });

  it("armour items reconcile by delta rather than double-applying", () => {
    const simulation = shop(6);
    const baseArmour = simulation.snapshot().playerArmour;

    simulation.grantItem("plate-fragment"); // +2 armour
    expect(simulation.snapshot().playerArmour).toBe(baseArmour + 2);

    simulation.grantItem("plate-fragment"); // +2 again (items stack)
    // The refresh must apply only the *delta* each time. A naive implementation
    // that re-added the accumulated total would land on +6 here, not +4.
    expect(simulation.snapshot().playerArmour).toBe(baseArmour + 4);
  });

  it("owned items survive the snapshot round-trip into the next node's build", () => {
    const simulation = shop(7);
    simulation.grantItem("whetstone");
    const carried = simulation.snapshot().ownedItemIds;
    expect(carried).toEqual(["whetstone"]);

    // Rebuilding a combat from the carried ids keeps the stat effect.
    const next = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: {
        health: 10, shield: 0, level: 1, experience: 0, scrap: 0,
        weapons: [{ weaponId: "bolt-carbine", tier: 1 }], upgrades: [],
        ownedItemIds: [...carried],
      },
    });
    expect(next.snapshot().ownedItemIds).toEqual(["whetstone"]);
  });

  it("banning an offer removes it from the rack and stops it restocking", () => {
    const simulation = shop(9);
    const rack = simulation.snapshot().pendingDecision!.options;
    const target = rack.find((option) => (option.cost ?? 0) > 0)!;

    simulation.chooseOption("shop-manage");
    expect(simulation.chooseOption(`shop-ban:${target.id}`)).toBe(true);

    const after = simulation.snapshot().pendingDecision!.options;
    expect(after.map((option) => option.id)).not.toContain(target.id);

    // Even a paid reroll can never bring it back.
    simulation.chooseOption("shop-manage");
    simulation.chooseOption("shop-reroll");
    const rerolled = simulation.snapshot().pendingDecision!.options;
    expect(rerolled.map((option) => option.id)).not.toContain(target.id);
  });
});
