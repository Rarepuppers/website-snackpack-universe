export interface ScrapShopPricedOffer {
  readonly cost?: number;
  readonly affordable?: boolean;
}

/** Refreshes affordability without mutating the persistent rack objects. */
export function refreshScrapShopAffordability<T extends ScrapShopPricedOffer>(
  offers: readonly T[],
  securedScrap: number,
): (T & { affordable: boolean })[] {
  return offers.map((offer) => ({
    ...offer,
    affordable: (offer.cost ?? 0) <= securedScrap,
  }));
}

/** Stable affordable-first presentation ordering used immediately after a draw. */
export function sortScrapShopOffersAffordableFirst<T extends ScrapShopPricedOffer>(
  offers: readonly T[],
): T[] {
  return [...offers].sort((left, right) => Number(right.affordable) - Number(left.affordable));
}
