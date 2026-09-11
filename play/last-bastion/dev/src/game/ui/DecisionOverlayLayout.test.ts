import { describe, expect, it } from "vitest";
import { decisionHintY, decisionPanelHeight } from "./DecisionOverlayLayout";

describe("decision overlay layout", () => {
  it("keeps the hint below the fourth mixed level-up card", () => {
    const height = decisionPanelHeight("upgrade", 4);
    const titleY = -height / 2 + 40;
    const lastCardCentre = titleY + 70 + 3 * 92;
    expect(decisionHintY("upgrade", height, titleY) - (lastCardCentre + 41)).toBeGreaterThanOrEqual(24);
  });

  it("keeps a two-row stat grid clear of its hint", () => {
    const height = decisionPanelHeight("level-stat", 4);
    const titleY = -height / 2 + 40;
    const lastCardBottom = titleY + 96 + 132 + 58;
    expect(decisionHintY("level-stat", height, titleY) - lastCardBottom).toBeGreaterThanOrEqual(24);
  });
});
