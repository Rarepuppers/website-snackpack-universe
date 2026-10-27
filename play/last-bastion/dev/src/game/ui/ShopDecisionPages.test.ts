import { expect, it } from "vitest";
import { shopDecisionPages } from "./ShopDecisionPages";
import { decisionPanelHeight } from "./DecisionOverlayLayout";
import type { PendingDecision } from "../combat/CombatSimulation";

it("retains every sale exactly once and Back on every bounded page", () => {
  for (const count of [0, 7, 9, 10, 12, 16, 19]) {
    const sales = Array.from({ length: count }, (_, i) => ({ id: `shop-sell:${i}`, name: `Sale ${i}`, description: "Sell", affordable: true }));
    const decision: PendingDecision = { kind: "scrap-shop", title: "SELL", options: [...sales, { id: "shop-back", name: "Back", description: "Return" }] };
    const pages = shopDecisionPages(decision);
    expect(pages.flatMap(page => page.filter(choice => choice.id.startsWith("shop-sell:")))).toEqual(sales);
    for (const page of pages) {
      expect(page.some(choice => choice.id === "shop-back")).toBe(true);
      expect(page.length).toBeLessThanOrEqual(10);
      expect(decisionPanelHeight("scrap-shop", page.length, page.length > 5 ? 2 : 1)).toBeLessThanOrEqual(510);
    }
    expect(pages[0]!.find(choice => choice.id === "decision-page-previous")?.affordable ?? false).toBe(false);
    expect(pages[pages.length - 1]!.find(choice => choice.id === "decision-page-next")?.affordable ?? false).toBe(false);
  }
});
