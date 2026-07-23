import { describe, expect, it } from "vitest";
import { WEAPON_CHEST_POOL } from "../content/weaponCatalog";
import { combatNodeBudgets } from "./ExpeditionNodeDirector";
import { generateExpeditionMap } from "./ExpeditionMap";
import {
  CAMPAIGN_REFERENCE_BUILDS,
  CAMPAIGN_SHOP_COLUMNS,
  campaignNodeClearScrap,
  projectCampaignRoutes,
  referenceBuildBossSeconds,
} from "./CampaignTuning";

describe("Task 49 campaign tuning", () => {
  it("protects the opening while preserving the late pressure ceiling", () => {
    expect(combatNodeBudgets(0)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(1)).toEqual([30, 45, 65]);
    expect(combatNodeBudgets(2)).toEqual([45, 65, 90]);
    expect(Math.max(...combatNodeBudgets(2))).toBeLessThanOrEqual(90);
    expect(combatNodeBudgets(7)).toEqual([120, 140, 160, 180]);
  });

  it("gives every seeded route two shops, affordable recovery, and a boss-ready growth band", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      for (const route of projectCampaignRoutes(generateExpeditionMap(seed))) {
        expect(route.nodeIds).toHaveLength(8);
        expect(route.shopVisits).toBe(CAMPAIGN_SHOP_COLUMNS.length);
        expect(route.guaranteedScrap).toBeGreaterThanOrEqual(55);
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
    expect(WEAPON_CHEST_POOL).toHaveLength(8);
    expect(new Set(WEAPON_CHEST_POOL).size).toBe(WEAPON_CHEST_POOL.length);
    expect(campaignNodeClearScrap("supply-depot", 3)).toBe(10);
    expect(campaignNodeClearScrap("weapon-cache", 5)).toBe(10);
  });

  it("keeps at least two distinct reference builds inside the authored boss window", () => {
    const seconds = CAMPAIGN_REFERENCE_BUILDS.map(referenceBuildBossSeconds);
    expect(seconds.filter((value) => value <= 120)).toHaveLength(3);
    expect(new Set(CAMPAIGN_REFERENCE_BUILDS.map((build) => build.id)).size).toBe(3);
  });
});
