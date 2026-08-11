export type ScrapShopPurchaseEffect =
  | { readonly kind: "repair" }
  | { readonly kind: "uranium-kit" }
  | { readonly kind: "armour-retrofit" }
  | { readonly kind: "upgrade"; readonly upgradeId: string }
  | { readonly kind: "weapon"; readonly weaponId: string }
  | { readonly kind: "item"; readonly itemId: string }
  | { readonly kind: "none" };

export type ValidatedScrapShopPurchaseEffect =
  | { readonly kind: "repair" }
  | { readonly kind: "uranium-kit" }
  | { readonly kind: "armour-retrofit" }
  | { readonly kind: "upgrade"; readonly upgradeId: UpgradeId }
  | { readonly kind: "weapon"; readonly weaponId: WeaponId }
  | { readonly kind: "item"; readonly itemId: string }
  | { readonly kind: "none" };

export type ScrapShopPurchasePlan =
  | { readonly ok: false }
  | {
      readonly ok: true;
      readonly optionId: string;
      readonly cost: number;
      readonly remainingScrap: number;
      readonly clearLockedOffer: boolean;
      readonly effect: ScrapShopPurchaseEffect;
    };

/** Validates spend and prepares the effect; the simulation remains responsible for committing both. */
export function planScrapShopPurchase(input: {
  readonly optionId: string;
  readonly declaredCost?: number;
  readonly securedScrap: number;
  readonly lockedOfferId: string | null;
}): ScrapShopPurchasePlan {
  const cost = Math.max(0, input.declaredCost ?? 0);
  if (cost > input.securedScrap) return { ok: false };
  return {
    ok: true,
    optionId: input.optionId,
    cost,
    remainingScrap: input.securedScrap - cost,
    clearLockedOffer: input.lockedOfferId === input.optionId,
    effect: classifyScrapShopPurchase(input.optionId),
  };
}

export function classifyScrapShopPurchase(optionId: string): ScrapShopPurchaseEffect {
  if (optionId === "shop-repair") return { kind: "repair" };
  if (optionId === "shop-uranium-kit") return { kind: "uranium-kit" };
  if (optionId === "shop-armour-retrofit") return { kind: "armour-retrofit" };
  if (optionId.startsWith("shop-upgrade:")) {
    return { kind: "upgrade", upgradeId: optionId.slice("shop-upgrade:".length) };
  }
  if (optionId.startsWith("shop-weapon:")) {
    return { kind: "weapon", weaponId: optionId.slice("shop-weapon:".length) };
  }
  if (optionId.startsWith("shop-item:")) {
    return { kind: "item", itemId: optionId.slice("shop-item:".length) };
  }
  return { kind: "none" };
}

/** Validates catalogue membership and live upgrade eligibility before the adapter commits an effect. */
export function validateScrapShopPurchaseEffect(
  effect: ScrapShopPurchaseEffect,
  isUpgradeEligible: (upgradeId: UpgradeId) => boolean,
): ValidatedScrapShopPurchaseEffect {
  if (effect.kind === "upgrade") {
    if (!(effect.upgradeId in UPGRADE_CATALOG)) return { kind: "none" };
    const upgradeId = effect.upgradeId as UpgradeId;
    return isUpgradeEligible(upgradeId) ? { kind: "upgrade", upgradeId } : { kind: "none" };
  }
  if (effect.kind === "weapon") {
    return effect.weaponId in WEAPON_CATALOG
      ? { kind: "weapon", weaponId: effect.weaponId as WeaponId }
      : { kind: "none" };
  }
  if (effect.kind === "item") {
    return itemById(effect.itemId) ? effect : { kind: "none" };
  }
  return effect;
}
import { itemById } from "../content/itemCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
