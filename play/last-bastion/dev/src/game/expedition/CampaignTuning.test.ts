import { describe, expect, it } from "vitest";
import { combatNodeBudgets } from "./ExpeditionNodeDirector";
import { generateExpeditionMap } from "./ExpeditionMap";
import {
  CAMPAIGN_REFERENCE_BUILDS,
  campaignNodeClearScrap,
  projectCampaignRoutes,
  referenceBuildBossSeconds,
} from "./CampaignTuning";
import { ITEM_RARITY_BASE_PRICE } from "../content/itemCatalog";
import { HELD_WEAPONS_IN_POOL, WEAPON_CHEST_POOL } from "../content/weaponCatalog";

describe("Task 49 campaign tuning", () => {
  it("protects the opening while preserving the late pressure ceiling", () => {
    expect(combatNodeBudgets(0)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(1)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(2)).toEqual([45, 65, 90]);
    expect(Math.max(...combatNodeBudgets(2))).toBeLessThanOrEqual(90);
    expect(combatNodeBudgets(7)).toEqual([120, 140, 160, 180]);
  });

  it("gives every seeded route a shop per fight, affordable recovery, and a boss-ready growth band", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      for (const route of projectCampaignRoutes(generateExpeditionMap(seed))) {
        expect(route.nodeIds).toHaveLength(8);
        // Phase 3B: every node except the boss (and the Shrine/Event nodes that
        // resolve without a fight) ends in a shop, so a route of 8 nodes offers
        // between 4 and 7 spend decisions depending on how many it spends on choice.
        expect(route.shopVisits).toBeGreaterThanOrEqual(4);
        expect(route.shopVisits).toBeLessThanOrEqual(7);
        // A shop is only a decision if you can buy something at it. Guaranteed
        // income alone must cover a common-tier item at every visit, on every
        // route — kill drops and treasure enemies stay pure upside on top.
        expect(route.scrapPerShopVisit).toBeGreaterThan(ITEM_RARITY_BASE_PRICE.common);
        expect(route.guaranteedScrap).toBeGreaterThanOrEqual(85);
        expect(route.healingOpportunities).toBeGreaterThanOrEqual(2);
        // Shrine/Event nodes carry no waves, so a route that chooses the maximum
        // number of decision nodes trades one combat's guaranteed XP for choice,
        // economy, and healing the projection cannot score — worst-case boss
        // entry is level 8 rather than 9. Those routes arrive richer instead.
        expect(route.projectedBossEntryLevel).toBeGreaterThanOrEqual(8);
        expect(route.projectedBossEntryLevel).toBeLessThanOrEqual(20);
      }
    }
  });

  it("keeps all live weapons in the chest pool and makes safe routes economically useful", () => {
    // Size follows the art gate rather than a literal, so art day stays a
    // one-constant change; uniqueness is the part that must always hold.
    expect(WEAPON_CHEST_POOL).toHaveLength(HELD_WEAPONS_IN_POOL ? 27 : 8);
    expect(new Set(WEAPON_CHEST_POOL).size).toBe(WEAPON_CHEST_POOL.length);
    expect(campaignNodeClearScrap("supply-depot", 3)).toBe(15);
    expect(campaignNodeClearScrap("weapon-cache", 5)).toBe(15);
  });

  it("keeps every distinct reference build inside the authored boss window", () => {
    const seconds = CAMPAIGN_REFERENCE_BUILDS.map(referenceBuildBossSeconds);
    expect(seconds.filter((value) => value <= 120)).toHaveLength(4);
    expect(new Set(CAMPAIGN_REFERENCE_BUILDS.map((build) => build.id)).size).toBe(4);
    // The close-quarters build joined with the 26 July weapon release: half the
    // rack is melee now, so projecting pacing from ranged builds alone would
    // measure a game the player need not be playing.
    expect(CAMPAIGN_REFERENCE_BUILDS.map((build) => build.id)).toContain("close-quarters");
  });
});
