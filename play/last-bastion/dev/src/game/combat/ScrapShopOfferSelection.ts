import { itemById } from "../content/itemCatalog";
import { NON_ITEM_DRAW_WEIGHT, rarityDrawWeight } from "../content/shopProfiles";

/** Resolves one candidate's luck/curse-bent draw weight. */
export function shopOfferDrawWeight(offerId: string, luck: number, curse: number): number {
  if (!offerId.startsWith("shop-item:")) return NON_ITEM_DRAW_WEIGHT;
  const definition = itemById(offerId.slice("shop-item:".length));
  return definition ? rarityDrawWeight(definition.rarity, luck, curse) : NON_ITEM_DRAW_WEIGHT;
}

/** Maps one already-consumed unit RNG value onto an authored weighted candidate index. */
export function selectWeightedOfferIndex(
  weights: readonly number[],
  randomUnit: number,
): number {
  if (weights.length === 0) return -1;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = randomUnit * total;
  let index = 0;
  while (index < weights.length - 1) {
    roll -= weights[index]!;
    if (roll <= 0) break;
    index += 1;
  }
  return index;
}

export function scrapShopWeightedDrawCount(
  initialOfferCount: number,
  candidateCount: number,
  offerCount: number,
): number {
  return Math.min(Math.max(0, offerCount - initialOfferCount), Math.max(0, candidateCount));
}

/** Selects a weighted rack without replacement from already-consumed RNG values. */
export function selectWeightedScrapShopOffers<T extends { readonly id: string }>(input: {
  readonly initialOffers: readonly T[];
  readonly candidates: readonly T[];
  readonly offerCount: number;
  readonly luck: number;
  readonly curse: number;
  readonly randomUnits: readonly number[];
}): T[] {
  const offers = [...input.initialOffers];
  const candidates = [...input.candidates];
  let rollIndex = 0;
  while (offers.length < input.offerCount && candidates.length > 0 && rollIndex < input.randomUnits.length) {
    const weights = candidates.map((candidate) => shopOfferDrawWeight(candidate.id, input.luck, input.curse));
    const index = selectWeightedOfferIndex(weights, input.randomUnits[rollIndex]!);
    offers.push(candidates.splice(index, 1)[0]!);
    rollIndex += 1;
  }
  return offers;
}
