export type ScrapShopAction =
  | { readonly kind: "open-mode"; readonly mode: "offers" | "manage" | "sell" }
  | { readonly kind: "toggle-lock"; readonly offerId: string }
  | { readonly kind: "ban-offer"; readonly offerId: string }
  | { readonly kind: "reroll" }
  | { readonly kind: "sell-weapon"; readonly instanceId: number }
  | { readonly kind: "purchase"; readonly optionId: string }
  | { readonly kind: "leave" };

/** Routes authored shop option ids without reading or mutating simulation state. */
export function routeScrapShopAction(optionId: string): ScrapShopAction {
  if (optionId === "shop-manage") return { kind: "open-mode", mode: "manage" };
  if (optionId === "shop-back") return { kind: "open-mode", mode: "offers" };
  if (optionId === "shop-sell-menu") return { kind: "open-mode", mode: "sell" };
  if (optionId.startsWith("shop-lock:")) {
    return { kind: "toggle-lock", offerId: optionId.slice("shop-lock:".length) };
  }
  if (optionId.startsWith("shop-ban:")) {
    return { kind: "ban-offer", offerId: optionId.slice("shop-ban:".length) };
  }
  if (optionId === "shop-reroll") return { kind: "reroll" };
  if (optionId.startsWith("shop-sell:")) {
    return { kind: "sell-weapon", instanceId: Number(optionId.slice("shop-sell:".length)) };
  }
  if (optionId === "shop-leave") return { kind: "leave" };
  return { kind: "purchase", optionId };
}
