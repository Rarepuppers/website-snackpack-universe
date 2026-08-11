import { describe, expect, it } from "vitest";
import { prepareCampaignRepairDraw } from "./ScrapShopCampaignRepair";

const candidates = [{ id: "shop-repair" }, { id: "item-a" }, { id: "item-b" }];

describe("ScrapShopCampaignRepair", () => {
  it("reserves repair for a damaged campaign player even when the rack exclusion contains it", () => {
    const result = prepareCampaignRepairDraw({
      candidates,
      excludedIds: new Set(["shop-repair", "item-a"]),
      hasCampaignEncounter: true,
      playerHealth: 5,
      playerMaxHealth: 10,
      lockedOfferId: null,
    });
    expect(result.reservedRepair).toBe(candidates[0]);
    expect(result.candidates).toEqual([{ id: "item-b" }]);
  });

  it("leaves a locked repair in the normal weighted pool", () => {
    const result = prepareCampaignRepairDraw({
      candidates,
      excludedIds: new Set(),
      hasCampaignEncounter: true,
      playerHealth: 5,
      playerMaxHealth: 10,
      lockedOfferId: "shop-repair",
    });
    expect(result.reservedRepair).toBeNull();
    expect(result.candidates).toEqual(candidates);
  });

  it("does not reserve repair outside a damaged campaign encounter", () => {
    expect(prepareCampaignRepairDraw({
      candidates,
      excludedIds: new Set(["item-a"]),
      hasCampaignEncounter: false,
      playerHealth: 10,
      playerMaxHealth: 10,
      lockedOfferId: null,
    })).toEqual({ reservedRepair: null, candidates: [candidates[0], candidates[2]] });
  });
});
