import type { PendingDecision } from "../combat/CombatSimulation";

export const SHOP_PAGE_SIZE = 7;
export function shopDecisionPages(decision: PendingDecision): PendingDecision["options"][] {
  if (decision.kind !== "scrap-shop" || decision.options.length <= 10) return [decision.options];
  const navigation = decision.options.filter(option => isShopNavigation(option.id));
  const choices = decision.options.filter(option => !isShopNavigation(option.id));
  const size = Math.max(1, SHOP_PAGE_SIZE + 1 - navigation.length);
  const count = Math.ceil(choices.length / size);
  return Array.from({ length: count }, (_, page) => [
    ...choices.slice(page * size, (page + 1) * size),
    ...navigation,
    { id: "decision-page-previous", name: "Previous Page", description: "Show earlier choices.", affordable: page > 0 },
    { id: "decision-page-next", name: "Next Page", description: "Show more choices.", affordable: page + 1 < count },
  ]);
}

export function isShopNavigation(id: string): boolean {
  return ["decision-page-previous", "decision-page-next", "shop-back", "shop-leave", "shop-manage", "shop-sell-menu"].includes(id);
}
