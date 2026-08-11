export interface ScrapShopBanOffer {
  readonly id: string;
}

/** Assembles the post-ban rack after the adapter performs its single replacement draw. */
export function planScrapShopBan<T extends ScrapShopBanOffer>(input: {
  readonly offers: readonly T[] | null;
  readonly bannedOfferId: string;
  readonly lockedOfferId: string | null;
  readonly replacement: T | null;
}): { readonly offers: T[]; readonly lockedOfferId: string | null } {
  const offers = (input.offers ?? []).filter((offer) => offer.id !== input.bannedOfferId);
  return {
    offers: input.replacement ? [...offers, input.replacement] : offers,
    lockedOfferId: input.lockedOfferId === input.bannedOfferId ? null : input.lockedOfferId,
  };
}
