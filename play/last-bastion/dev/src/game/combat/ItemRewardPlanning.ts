import { foldItemStats, itemById, ITEM_CATALOG } from "../content/itemCatalog";
import { rarityDrawWeight } from "../content/shopProfiles";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";
import { selectWeightedOfferIndex } from "./ScrapShopOfferSelection";

export interface ItemGrantPlan {
  readonly itemId: string;
}

export function planWeightedRewardItem(input: {
  readonly luck: number;
  readonly curse: number;
  readonly randomUnit: number;
}): ItemGrantPlan | null {
  if (ITEM_CATALOG.length === 0) return null;
  const weights = ITEM_CATALOG.map((entry) => rarityDrawWeight(entry.rarity, input.luck, input.curse));
  const index = selectWeightedOfferIndex(weights, input.randomUnit);
  const chosen = ITEM_CATALOG[index];
  return chosen ? { itemId: chosen.id } : null;
}

export function planItemGrant(itemId: string): ItemGrantPlan | null {
  return itemById(itemId) ? { itemId } : null;
}

export function foldRunItemStats(input: {
  readonly baseItemStats: Readonly<Partial<PlayerStatBlock>>;
  readonly ownedItemIds: readonly string[];
}): Partial<PlayerStatBlock> {
  const combined: Partial<PlayerStatBlock> = { ...input.baseItemStats };
  const owned = foldItemStats(input.ownedItemIds);
  for (const key of Object.keys(owned) as (keyof PlayerStatBlock)[]) {
    const value = owned[key];
    if (typeof value === "number") combined[key] = (combined[key] ?? 0) + value;
  }
  return combined;
}
