import { describe, expect, it } from "vitest";
import { armourLabel } from "../stats/formatStat";

/**
 * The HUD shows armour as an effective percentage, not the raw stat, because
 * armour is diminishing: `armour / (armour + 15)`. See §11.4 of the improvement
 * plan.
 */
describe("armourLabel", () => {
  it("says nothing when the player has no mitigation", () => {
    expect(armourLabel(0, 0)).toBe("");
  });

  it("converts the raw stat to its effective percentage", () => {
    // 12 / (12 + 15) = 44.4% -> 44
    expect(armourLabel(12, 0)).toContain("ARM 12 (44%)");
  });

  it("shows diminishing returns honestly: doubling armour does not double reduction", () => {
    const twelve = Number(/\((\d+)%\)/.exec(armourLabel(12, 0))![1]);
    const twentyFour = Number(/\((\d+)%\)/.exec(armourLabel(24, 0))![1]);
    expect(twentyFour).toBeGreaterThan(twelve);
    expect(twentyFour).toBeLessThan(twelve * 2);
  });

  it("never reaches 100% no matter how much armour is stacked", () => {
    const extreme = Number(/\((\d+)%\)/.exec(armourLabel(10_000, 0))![1]);
    expect(extreme).toBeLessThan(100);
  });

  it("reports flat reduction separately, since it applies after the percentage", () => {
    expect(armourLabel(12, 0.9)).toContain("-0.9");
  });

  it("omits flat reduction when there is none — the common case", () => {
    expect(armourLabel(12, 0)).not.toContain("-");
  });

  it("still reports flat reduction when armour is zero", () => {
    expect(armourLabel(0, 0.3)).toContain("-0.3");
  });
});
