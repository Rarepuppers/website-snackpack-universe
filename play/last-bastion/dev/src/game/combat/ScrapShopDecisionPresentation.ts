export interface ScrapShopDecisionOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost?: number;
  readonly affordable?: boolean;
}

export interface ScrapShopDecisionPresentation {
  readonly kind: "scrap-shop";
  readonly title: string;
  readonly options: readonly ScrapShopDecisionOption[];
  readonly shopMode: "offers" | "manage" | "sell";
  readonly shopLockedOfferId: string | null;
  readonly shopRerollUsed: boolean;
  readonly shopRerollCost: number;
}

export function presentScrapShopOffersDecision(input: {
  readonly offers: readonly ScrapShopDecisionOption[];
  readonly profileName: string;
  readonly securedScrap: number;
  readonly lockedOfferId: string | null;
  readonly rerollUsed: boolean;
  readonly rerollCost: number;
}): ScrapShopDecisionPresentation {
  const options: ScrapShopDecisionOption[] = input.offers.map((offer) => ({
    ...offer,
    name: offer.id === input.lockedOfferId ? `${offer.name} [LOCKED]` : offer.name,
  }));
  options.push({
    id: "shop-manage",
    name: "Manage Stock",
    description: "Lock an offer, use this visit's reroll, or sell a weapon.",
    cost: 0,
    affordable: true,
  });
  options.push({
    id: "shop-leave",
    name: "Leave Shop",
    description: "Bank remaining Scrap for the next terminal.",
    cost: 0,
    affordable: true,
  });
  return {
    kind: "scrap-shop",
    title: `${input.profileName.toUpperCase()} — ${input.securedScrap} SCRAP`,
    options,
    shopMode: "offers",
    shopLockedOfferId: input.lockedOfferId,
    shopRerollUsed: input.rerollUsed,
    shopRerollCost: input.rerollCost,
  };
}

export function presentScrapShopManagementDecision(input: {
  readonly offers: readonly ScrapShopDecisionOption[];
  readonly securedScrap: number;
  readonly lockedOfferId: string | null;
  readonly rerollUsed: boolean;
  readonly rerollCost: number;
  readonly canReroll: boolean;
}): ScrapShopDecisionPresentation {
  const options: ScrapShopDecisionOption[] = input.offers.map((offer, index) => ({
    id: `shop-lock:${offer.id}`,
    name: offer.id === input.lockedOfferId ? `Unlock Offer ${index + 1}` : `Lock Offer ${index + 1}`,
    description: `${offer.name}: ${offer.id === input.lockedOfferId ? "will reroll normally" : "survives the paid reroll"}.`,
    affordable: true,
  }));
  options.push({
    id: "shop-reroll",
    name: input.rerollUsed ? "Reroll Used" : "Reroll Unlocked Stock",
    description: input.rerollUsed
      ? "Only one reroll is available per visit."
      : input.canReroll ? "Replace every offer except the locked one." : "No complete replacement rack is available.",
    cost: input.rerollCost,
    affordable: !input.rerollUsed && input.canReroll && input.rerollCost <= input.securedScrap,
  });
  for (const [index, offer] of input.offers.entries()) {
    options.push({
      id: `shop-ban:${offer.id}`,
      name: `Ban Offer ${index + 1}`,
      description: `${offer.name}: never restocks for the rest of this run.`,
      affordable: true,
    });
  }
  options.push({
    id: "shop-sell-menu",
    name: "Sell Weapon",
    description: "Recover 50% of its total shop value.",
    affordable: true,
  });
  options.push({
    id: "shop-back",
    name: "Back to Offers",
    description: "Return to the salvage counter.",
    affordable: true,
  });
  return {
    kind: "scrap-shop",
    title: `MANAGE STOCK — ${input.securedScrap} SCRAP`,
    options,
    shopMode: "manage",
    shopLockedOfferId: input.lockedOfferId,
    shopRerollUsed: input.rerollUsed,
    shopRerollCost: input.rerollCost,
  };
}

export interface ScrapShopSellEntry {
  readonly instanceId: number;
  readonly displayName: string;
  readonly tier: number;
  readonly saleValue: number;
  readonly canSell: boolean;
}

export function presentScrapShopSellDecision(input: {
  readonly entries: readonly ScrapShopSellEntry[];
  readonly securedScrap: number;
  readonly lockedOfferId: string | null;
  readonly rerollUsed: boolean;
  readonly rerollCost: number;
}): ScrapShopDecisionPresentation {
  const options: ScrapShopDecisionOption[] = input.entries.map((entry) => ({
    id: `shop-sell:${entry.instanceId}`,
    name: `${entry.displayName} — Tier ${entry.tier}`,
    description: entry.canSell ? `Sell for ${entry.saleValue} Scrap.` : "Keep at least one active weapon.",
    affordable: entry.canSell,
  }));
  options.push({
    id: "shop-back",
    name: "Back to Stock",
    description: "Return without selling.",
    affordable: true,
  });
  return {
    kind: "scrap-shop",
    title: `SELL WEAPON — ${input.securedScrap} SCRAP`,
    options,
    shopMode: "sell",
    shopLockedOfferId: input.lockedOfferId,
    shopRerollUsed: input.rerollUsed,
    shopRerollCost: input.rerollCost,
  };
}
