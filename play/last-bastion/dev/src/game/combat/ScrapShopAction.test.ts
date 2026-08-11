import { describe, expect, it } from "vitest";
import { routeScrapShopAction } from "./ScrapShopAction";

describe("routeScrapShopAction", () => {
  it("routes the three navigation controls", () => {
    expect(routeScrapShopAction("shop-manage")).toEqual({ kind: "open-mode", mode: "manage" });
    expect(routeScrapShopAction("shop-back")).toEqual({ kind: "open-mode", mode: "offers" });
    expect(routeScrapShopAction("shop-sell-menu")).toEqual({ kind: "open-mode", mode: "sell" });
  });

  it("extracts offer and weapon identifiers", () => {
    expect(routeScrapShopAction("shop-lock:shop-repair")).toEqual({
      kind: "toggle-lock",
      offerId: "shop-repair",
    });
    expect(routeScrapShopAction("shop-ban:shop-item:field-kit")).toEqual({
      kind: "ban-offer",
      offerId: "shop-item:field-kit",
    });
    expect(routeScrapShopAction("shop-sell:42")).toEqual({ kind: "sell-weapon", instanceId: 42 });
  });

  it("routes reroll, leave, and all remaining authored offers", () => {
    expect(routeScrapShopAction("shop-reroll")).toEqual({ kind: "reroll" });
    expect(routeScrapShopAction("shop-leave")).toEqual({ kind: "leave" });
    expect(routeScrapShopAction("shop-upgrade:ballistics")).toEqual({
      kind: "purchase",
      optionId: "shop-upgrade:ballistics",
    });
  });
});
