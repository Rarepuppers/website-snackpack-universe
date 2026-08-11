import { describe, expect, it } from "vitest";
import { upgradeTilePresentation } from "./UpgradeTilePresentation";

describe("upgradeTilePresentation", () => {
  it("maps the four elemental upgrade paths in stable atlas order", () => {
    expect(upgradeTilePresentation("incendiary-rounds")).toEqual({ texture: "elemental-upgrade-tiles-v1", frame: 0 });
    expect(upgradeTilePresentation("cryo-coating")).toEqual({ texture: "elemental-upgrade-tiles-v1", frame: 1 });
    expect(upgradeTilePresentation("chain-lightning")).toEqual({ texture: "elemental-upgrade-tiles-v1", frame: 2 });
    expect(upgradeTilePresentation("corrosive-rounds")).toEqual({ texture: "elemental-upgrade-tiles-v1", frame: 3 });
  });

  it("supports shop offer ids and rejects unrelated upgrades", () => {
    expect(upgradeTilePresentation("shop-upgrade:corrosive-rounds")?.frame).toBe(3);
    expect(upgradeTilePresentation("rapid-cycling")).toBeNull();
    expect(upgradeTilePresentation("shop-repair")).toBeNull();
  });
});
