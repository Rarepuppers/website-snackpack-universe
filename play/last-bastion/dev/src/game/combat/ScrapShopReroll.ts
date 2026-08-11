export interface ScrapShopRerollOffer {
  readonly id: string;
}

export type PaidScrapShopRerollPlan =
  | { readonly ok: false; readonly reason: "already-used" | "insufficient-scrap" }
  | { readonly ok: true; readonly cost: number; readonly remainingScrap: number };

/** Validates the once-per-visit paid reroll before the adapter spends Scrap or draws replacements. */
export function planPaidScrapShopReroll(input: {
  readonly rerollUsed: boolean;
  readonly cost: number;
  readonly securedScrap: number;
}): PaidScrapShopRerollPlan {
  if (input.rerollUsed) return { ok: false, reason: "already-used" };
  if (input.cost > input.securedScrap) return { ok: false, reason: "insufficient-scrap" };
  return { ok: true, cost: input.cost, remainingScrap: input.securedScrap - input.cost };
}

export function scrapShopRerollExcludedIds(
  offers: readonly ScrapShopRerollOffer[] | null,
): ReadonlySet<string> {
  return new Set(offers?.map((offer) => offer.id) ?? []);
}

/** Checks that every declared unlocked slot has a candidate outside the current rack. */
export function canPlanScrapShopReroll(input: {
  readonly offers: readonly ScrapShopRerollOffer[] | null;
  readonly candidates: readonly ScrapShopRerollOffer[];
  readonly lockedOfferId: string | null;
}): boolean {
  if (!input.offers) return false;
  const excludedIds = scrapShopRerollExcludedIds(input.offers);
  const unlockedCount = input.offers.length - (input.lockedOfferId ? 1 : 0);
  const availableCount = input.candidates.filter((candidate) => !excludedIds.has(candidate.id)).length;
  return availableCount >= unlockedCount;
}

/** Keeps the actual locked offer first and fills the remaining authored rack slots from the full draw. */
export function assembleLockedScrapShopReroll<T extends ScrapShopRerollOffer>(input: {
  readonly offers: readonly T[] | null;
  readonly lockedOfferId: string | null;
  readonly drawnReplacements: readonly T[];
  readonly offerCount: number;
}): T[] {
  const locked = input.offers?.find((offer) => offer.id === input.lockedOfferId) ?? null;
  const replacementCount = locked ? input.offerCount - 1 : input.offerCount;
  const replacements = input.drawnReplacements.slice(0, replacementCount);
  return locked ? [locked, ...replacements] : replacements;
}
