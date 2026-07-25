import { describe, expect, it } from "vitest";
import { ITEM_CATALOG } from "./itemCatalog";
import {
  LIBERATION_SHOP_PROFILES,
  NON_ITEM_DRAW_WEIGHT,
  SHOP_PROFILES,
  liberationProfileForSeed,
  profileStocksItem,
  rarityDrawWeight,
  shopProfileById,
} from "./shopProfiles";
import {
  CombatSimulation,
  SCRAP_SHOP_OFFER_COUNT,
  shopOfferDrawWeight,
} from "../combat/CombatSimulation";
import { generateExpeditionMap } from "../expedition/ExpeditionMap";
import { expeditionEncounterForNode } from "../expedition/ExpeditionEncounter";

describe("themed shop profiles", () => {
  it("stocks every liberation shop with enough items to fill an offer rack", () => {
    // The failure this guards is silent and total: a tag filter crossed with a
    // rarity floor that matches nothing yields a shop with no stock, which reads
    // as a broken node rather than a themed one.
    for (const id of LIBERATION_SHOP_PROFILES) {
      const profile = SHOP_PROFILES[id];
      const stocked = ITEM_CATALOG.filter((item) => profileStocksItem(profile, item));
      expect(stocked.length, `${id} stocks too few items`).toBeGreaterThanOrEqual(SCRAP_SHOP_OFFER_COUNT);
    }
  });

  it("honours the rarity floor and tag filter", () => {
    const church = SHOP_PROFILES.church;
    const stocked = ITEM_CATALOG.filter((item) => profileStocksItem(church, item));
    expect(stocked.every((item) => item.tags.includes("risk"))).toBe(true);
    // `cursed` ranks with `rare`, not at the bottom — it is cheap for its power.
    expect(stocked.some((item) => item.rarity === "cursed")).toBe(true);
    expect(stocked.some((item) => item.rarity === "common")).toBe(false);
  });

  it("falls back to the plain scrap market for an unknown or absent profile", () => {
    expect(shopProfileById(undefined).id).toBe("scrap-market");
    expect(shopProfileById("not-a-shop").id).toBe("scrap-market");
    // The default market filters nothing.
    const market = SHOP_PROFILES["scrap-market"];
    expect(ITEM_CATALOG.every((item) => profileStocksItem(market, item))).toBe(true);
  });

  it("is deterministic for a seed", () => {
    expect(liberationProfileForSeed(11)).toBe(liberationProfileForSeed(11));
  });
});

describe("luck / curse rarity weighting", () => {
  it("orders the base odds by rarity — rarity used to affect price only", () => {
    expect(rarityDrawWeight("common")).toBeGreaterThan(rarityDrawWeight("uncommon"));
    expect(rarityDrawWeight("uncommon")).toBeGreaterThan(rarityDrawWeight("rare"));
    expect(rarityDrawWeight("rare")).toBeGreaterThan(rarityDrawWeight("legendary"));
  });

  it("lets luck lift the rarer tiers hardest and leave commons nearly alone", () => {
    const commonLift = rarityDrawWeight("common", 100) / rarityDrawWeight("common");
    const legendaryLift = rarityDrawWeight("legendary", 100) / rarityDrawWeight("legendary");
    expect(commonLift).toBe(1); // rank 0 — luck is applied per rarity rank
    expect(legendaryLift).toBeGreaterThan(commonLift);
  });

  it("makes curse cut both ways: worse good stock, far more cursed stock", () => {
    expect(rarityDrawWeight("legendary", 0, 50)).toBeLessThan(rarityDrawWeight("legendary"));
    expect(rarityDrawWeight("cursed", 0, 100)).toBeGreaterThan(rarityDrawWeight("cursed"));
  });

  it("weights non-item stock flat so the shop is not crowded out by the item catalogue", () => {
    expect(shopOfferDrawWeight("shop-repair", 0, 0)).toBe(NON_ITEM_DRAW_WEIGHT);
    expect(shopOfferDrawWeight("shop-item:not-a-real-item", 0, 0)).toBe(NON_ITEM_DRAW_WEIGHT);
    expect(shopOfferDrawWeight("shop-item:cursed-idol", 0, 0)).toBe(rarityDrawWeight("cursed"));
  });

  it("actually shifts what a real shop offers", () => {
    // End-to-end rather than formula-only: draw many seeded shops and compare
    // how often high-rarity stock reaches the rack.
    const highRarityOffers = (itemStats: Record<string, number>): number => {
      let count = 0;
      for (let seed = 1; seed <= 120; seed += 1) {
        const simulation = new CombatSimulation({
          seed,
          scenario: "scrap-shop",
          autoStartWaves: false,
          startingBuild: {
            health: 20, shield: 0, level: 1, experience: 0, scrap: 500,
            weapons: [], upgrades: [], itemStats,
          },
        });
        for (const offer of simulation.snapshot().pendingDecision?.options ?? []) {
          const item = offer.id.startsWith("shop-item:")
            ? ITEM_CATALOG.find((candidate) => `shop-item:${candidate.id}` === offer.id)
            : undefined;
          if (item && (item.rarity === "rare" || item.rarity === "legendary")) count += 1;
        }
      }
      return count;
    };

    expect(highRarityOffers({ luck: 150 })).toBeGreaterThan(highRarityOffers({}));
  });
});

describe("liberation nodes", () => {
  it("places them with a themed shop and a real fight to clear first", () => {
    let found = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const map = generateExpeditionMap(seed);
      const liberations = map.nodes.filter((node) => node.type === "liberation");
      for (const node of liberations) {
        found += 1;
        expect(node.shopProfileId, `seed ${seed} node ${node.id}`).toBeDefined();
        const encounter = expeditionEncounterForNode(map.seed, node);
        expect(encounter.shopProfileId).toBe(node.shopProfileId);
        // The fight is the price of entry — a liberation node with no wave
        // would resolve for free and hand over the premium stock.
        expect(encounter.waves).toHaveLength(1);
        expect(encounter.waves[0]!.threatBudget).toBeGreaterThan(0);
      }
      // Two per chart keeps them an event rather than the shape of the run.
      expect(liberations.length).toBeLessThanOrEqual(2);
    }
    expect(found).toBeGreaterThan(0);
  });
});
