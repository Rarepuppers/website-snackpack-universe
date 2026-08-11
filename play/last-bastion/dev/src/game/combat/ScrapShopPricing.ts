/** Applies a themed shop profile's multiplier with the authored one-Scrap floor. */
export function profileScaledShopPrice(basePrice: number, profilePriceMultiplier: number): number {
  return Math.max(1, Math.round(basePrice * profilePriceMultiplier));
}

/** Applies item-only depth inflation before any profile multiplier is applied. */
export function depthScaledShopItemPrice(basePrice: number, waveIndex: number): number {
  return Math.round(basePrice * (1 + Math.max(0, waveIndex) * 0.08));
}
