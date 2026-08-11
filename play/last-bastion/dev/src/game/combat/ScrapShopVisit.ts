import type { ShopProfileId } from "../content/shopProfiles";

export interface ScrapShopVisitResetPlan {
  readonly offers: null;
  readonly lockedOfferId: null;
  readonly rerollUsed: false;
  readonly mode: "offers";
}

export interface ScrapShopVisitOpenPlan extends ScrapShopVisitResetPlan {
  readonly profileId: ShopProfileId;
}

/** Resets per-visit state while deliberately leaving the current profile untouched. */
export function planScrapShopVisitReset(): ScrapShopVisitResetPlan {
  return { offers: null, lockedOfferId: null, rerollUsed: false, mode: "offers" };
}

/** Opens a fresh visit against the requested stock profile. */
export function planScrapShopVisitOpen(profileId: ShopProfileId): ScrapShopVisitOpenPlan {
  return { ...planScrapShopVisitReset(), profileId };
}
