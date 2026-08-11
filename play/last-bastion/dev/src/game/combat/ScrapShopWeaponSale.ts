import type { WeaponTier } from "../equipment/WeaponInventory";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";

export interface ScrapShopSaleTile {
  readonly instanceId: number;
  readonly weaponId: WeaponId;
  readonly tier: WeaponTier;
}

export interface ScrapShopSaleRackSlot {
  readonly tile: ScrapShopSaleTile | null;
}

export const SCRAP_SHOP_WEAPON_BASE_PRICE = 60;

export type ScrapShopWeaponSalePlan =
  | { readonly ok: false; readonly reason: "missing-weapon" | "last-active-weapon" }
  | {
      readonly ok: true;
      readonly tile: ScrapShopSaleTile;
      readonly rackIndex: number;
      readonly stashIndex: number;
      readonly activeIndex: number;
      readonly amount: number;
    };

export function scrapShopWeaponSaleValue(tier: WeaponTier, fraction = 0.5): number {
  return Math.floor(SCRAP_SHOP_WEAPON_BASE_PRICE * (2 ** (tier - 1)) * fraction);
}

export interface ScrapShopPreparedSellEntry {
  readonly instanceId: number;
  readonly displayName: string;
  readonly tier: WeaponTier;
  readonly saleValue: number;
  readonly canSell: boolean;
}

/** Prepares rack-then-stash sale presentation without mutating either inventory collection. */
export function prepareScrapShopSellEntries(input: {
  readonly rack: readonly ScrapShopSaleRackSlot[];
  readonly stash: readonly (ScrapShopSaleTile | null)[];
  readonly equippedInstanceIds: readonly number[];
  readonly saleFraction?: number;
}): ScrapShopPreparedSellEntry[] {
  const tiles = [
    ...input.rack.flatMap((slot) => slot.tile ? [slot.tile] : []),
    ...input.stash.flatMap((tile) => tile ? [tile] : []),
  ];
  return tiles.map((tile) => {
    const active = input.equippedInstanceIds.includes(tile.instanceId);
    return {
      instanceId: tile.instanceId,
      displayName: WEAPON_CATALOG[tile.weaponId].displayName,
      tier: tile.tier,
      saleValue: scrapShopWeaponSaleValue(tile.tier, input.saleFraction),
      canSell: !active || input.equippedInstanceIds.length > 1,
    };
  });
}

/** Locates every mutable slot and validates the last-active-weapon rule before the adapter commits a sale. */
export function planScrapShopWeaponSale(input: {
  readonly instanceId: number;
  readonly rack: readonly ScrapShopSaleRackSlot[];
  readonly stash: readonly (ScrapShopSaleTile | null)[];
  readonly equippedInstanceIds: readonly number[];
  readonly saleFraction?: number;
}): ScrapShopWeaponSalePlan {
  const rackIndex = input.rack.findIndex((slot) => slot.tile?.instanceId === input.instanceId);
  const stashIndex = input.stash.findIndex((tile) => tile?.instanceId === input.instanceId);
  const tile = rackIndex >= 0 ? input.rack[rackIndex]!.tile : stashIndex >= 0 ? input.stash[stashIndex] : null;
  if (!tile) return { ok: false, reason: "missing-weapon" };
  const activeIndex = input.equippedInstanceIds.findIndex((instanceId) => instanceId === input.instanceId);
  if (activeIndex >= 0 && input.equippedInstanceIds.length <= 1) {
    return { ok: false, reason: "last-active-weapon" };
  }
  return {
    ok: true,
    tile,
    rackIndex,
    stashIndex,
    activeIndex,
    amount: scrapShopWeaponSaleValue(tile.tier, input.saleFraction),
  };
}
