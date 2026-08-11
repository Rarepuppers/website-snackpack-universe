import { describe, expect, it } from "vitest";
import { itemById } from "../content/itemCatalog";
import { planBossRewardDecision, planEliteRewardDecision, planMiniBossRewardDecision, planObjectiveRewardDecision, parseRankRewardChoice } from "./RankRewardPlanning";

describe("rank reward planning", () => {
  it("gives each elite a deterministic, behaviour-aligned item choice", () => {
    const decision = planEliteRewardDecision({ eliteKind: "razorlord", randomUnits: [0, 0.5, 0.999] });
    expect(decision.options).toHaveLength(3);
    expect(new Set(decision.options.map(({ id }) => id)).size).toBe(3);
    for (const option of decision.options) {
      const item = itemById(option.id.replace("item:", ""));
      expect(item?.tags.some((tag) => tag === "melee" || tag === "mobility")).toBe(true);
    }
  });

  it("offers unowned relics beside one eligible upgrade after a mini-boss", () => {
    const decision = planMiniBossRewardDecision({
      ownedRelicIds: ["rel-stabiliser-gyro"],
      eligibleUpgradeIds: ["rapid-cycling", "field-magnet"],
      randomUnits: [0, 0.5, 0],
    });
    expect(decision?.options.filter(({ id }) => id.startsWith("relic:"))).toHaveLength(2);
    expect(decision?.options.filter(({ id }) => id.startsWith("upgrade:"))).toHaveLength(1);
    expect(decision?.options.map(({ id }) => id)).not.toContain("relic:rel-stabiliser-gyro");
  });

  it("parses only catalogue-backed reward choices", () => {
    expect(parseRankRewardChoice("item:whetstone")).toEqual({ kind: "item", itemId: "whetstone" });
    expect(parseRankRewardChoice("relic:rel-field-lattice")).toEqual({ kind: "relic", relicId: "rel-field-lattice" });
    expect(parseRankRewardChoice("upgrade:rapid-cycling")).toEqual({ kind: "upgrade", upgradeId: "rapid-cycling" });
    expect(parseRankRewardChoice("item:not-real")).toBeNull();
  });

  it("reserves a utility relic pool for objective completions", () => {
    const decision = planObjectiveRewardDecision(["rel-field-lattice"]);
    expect(decision?.options.map(({ id }) => id)).toEqual([
      "relic:rel-salvage-optics",
      "relic:rel-overwatch-rig",
    ]);
  });

  it("offers three boss artifacts and excludes the equipped artifact", () => {
    const decision = planBossRewardDecision({
      equippedArtifactId: "art-event-horizon-core",
      randomUnits: [0, 0.5, 0.99],
    });
    expect(decision.title).toBe("BOSS VAULT — CHOOSE AN ARTIFACT");
    expect(decision.options).toHaveLength(3);
    expect(decision.options.every(({ id }) => id.startsWith("artifact:"))).toBe(true);
    expect(decision.options.map(({ id }) => id)).not.toContain("artifact:art-event-horizon-core");
    expect(parseRankRewardChoice(decision.options[0]!.id)?.kind).toBe("artifact");
  });
});
