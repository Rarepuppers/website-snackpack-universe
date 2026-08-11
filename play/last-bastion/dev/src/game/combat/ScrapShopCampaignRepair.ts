export interface ScrapShopOfferIdentity {
  readonly id: string;
}

/** Reserves campaign repair when required and prepares the remaining weighted pool. */
export function prepareCampaignRepairDraw<T extends ScrapShopOfferIdentity>(input: {
  readonly candidates: readonly T[];
  readonly excludedIds: ReadonlySet<string>;
  readonly hasCampaignEncounter: boolean;
  readonly playerHealth: number;
  readonly playerMaxHealth: number;
  readonly lockedOfferId: string | null;
  readonly repairOfferId?: string;
}): { readonly reservedRepair: T | null; readonly candidates: T[] } {
  const repairOfferId = input.repairOfferId ?? "shop-repair";
  const reservedRepair = input.hasCampaignEncounter
    && input.playerHealth < input.playerMaxHealth
    && input.lockedOfferId !== repairOfferId
    ? input.candidates.find((candidate) => candidate.id === repairOfferId) ?? null
    : null;
  return {
    reservedRepair,
    candidates: input.candidates.filter((candidate) => (
      candidate.id !== reservedRepair?.id && !input.excludedIds.has(candidate.id)
    )),
  };
}
