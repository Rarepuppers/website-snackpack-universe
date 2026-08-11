import { describe, expect, it } from "vitest";
import { depthScaledShopItemPrice, profileScaledShopPrice } from "./ScrapShopPricing";

describe("ScrapShopPricing", () => {
  it("inflates item prices by eight percent per completed wave and clamps negative depth", () => {
    expect(depthScaledShopItemPrice(25, 3)).toBe(31);
    expect(depthScaledShopItemPrice(25, -4)).toBe(25);
  });

  it("applies profile scaling with nearest-integer rounding and a one-Scrap floor", () => {
    expect(profileScaledShopPrice(31, 1.25)).toBe(39);
    expect(profileScaledShopPrice(0, 0.5)).toBe(1);
  });

  it("preserves the separate depth-then-profile rounding stages", () => {
    const depthPrice = depthScaledShopItemPrice(17, 1);
    expect(depthPrice).toBe(18);
    expect(profileScaledShopPrice(depthPrice, 1.25)).toBe(23);
  });
});
