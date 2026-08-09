import { describe, expect, it } from "vitest";
import { createRunSummary } from "../run/RunSummary";
import {
  ARMORY_NODES,
  ASSAULT_UNLOCK_NODE_ID,
  armoryNode,
  assaultUnlockRequirementText,
  canPurchaseArmoryNode,
  canSelectArmoryNode,
  commandMarksBalance,
  commandMarksForRun,
  commandMarksSpent,
  isHeroDeploymentUnlocked,
  normalizePurchasedArmoryNodeIds,
  selectedArmoryWeapon,
} from "./ArmoryProgression";

function summary(mode: "quick-drop" | "expedition", outcome: "victory" | "defeat", waveReached: number, nodesCleared: number) {
  return createRunSummary({
    mode, outcome, waveReached, nodesCleared, heroId: "marine", perkId: null,
    kills: 0, scrapEarned: 0, scrapBanked: 0, level: 1, damageByWeapon: {}, weapons: [], upgrades: [],
  });
}

describe("ArmoryProgression", () => {
  it("derives balance from lifetime earnings and permanent purchases", () => {
    expect(commandMarksSpent(["armory-scattergun", "armory-arc-carbine"])).toBe(13);
    expect(commandMarksBalance(20, ["armory-scattergun", "armory-arc-carbine"])).toBe(7);
    expect(commandMarksBalance(2, ["armory-scattergun"])).toBe(0);
  });

  it("enforces costs and prerequisites", () => {
    expect(canPurchaseArmoryNode("armory-scattergun", 5, [])).toBe(true);
    expect(canPurchaseArmoryNode("armory-arc-carbine", 20, [])).toBe(false);
    expect(canPurchaseArmoryNode("armory-arc-carbine", 12, ["armory-scattergun"])).toBe(false);
    expect(canPurchaseArmoryNode("armory-arc-carbine", 13, ["armory-scattergun"])).toBe(true);
  });

  it("awards deterministic marks for quick drops and expeditions", () => {
    expect(commandMarksForRun(summary("quick-drop", "defeat", 4, 0))).toBe(1);
    expect(commandMarksForRun(summary("quick-drop", "victory", 10, 0))).toBe(5);
    expect(commandMarksForRun(summary("expedition", "defeat", 0, 8))).toBe(2);
    expect(commandMarksForRun(summary("expedition", "victory", 0, 20))).toBe(9);
  });

  it("sanitizes purchases and only resolves an owned selection", () => {
    expect(normalizePurchasedArmoryNodeIds(["armory-scattergun", "bad", "armory-scattergun"]))
      .toEqual(["armory-scattergun"]);
    expect(selectedArmoryWeapon("armory-scattergun", [])).toBeNull();
    expect(selectedArmoryWeapon("armory-scattergun", ["armory-scattergun"])).toBe("scattergun");
  });

  it("exposes Assault Clearance after C3 acceptance and enforces its path", () => {
    const node = armoryNode(ASSAULT_UNLOCK_NODE_ID);
    expect(node).toMatchObject({
      kind: "hero-unlock",
      heroId: "assault",
      cost: 18,
      prerequisiteIds: ["armory-patrol-blade"],
      released: true,
    });
    expect(ARMORY_NODES.map(({ id }) => id)).toContain(ASSAULT_UNLOCK_NODE_ID);
    expect(canPurchaseArmoryNode(ASSAULT_UNLOCK_NODE_ID, 100, ["armory-scattergun", "armory-patrol-blade"]))
      .toBe(true);
    expect(canPurchaseArmoryNode(ASSAULT_UNLOCK_NODE_ID, 34, ["armory-scattergun", "armory-patrol-blade"]))
      .toBe(false);
    expect(assaultUnlockRequirementText()).toBe("Purchase ASSAULT CLEARANCE for 18 Command Marks after BREACH PROTOCOL.");
  });

  it("never treats a hero unlock as a selectable starting kit or a production shortcut", () => {
    expect(canSelectArmoryNode(ASSAULT_UNLOCK_NODE_ID)).toBe(false);
    expect(selectedArmoryWeapon(ASSAULT_UNLOCK_NODE_ID, [ASSAULT_UNLOCK_NODE_ID])).toBeNull();
    expect(isHeroDeploymentUnlocked("assault", [])).toBe(false);
    expect(isHeroDeploymentUnlocked("assault", [ASSAULT_UNLOCK_NODE_ID])).toBe(true);
    expect(isHeroDeploymentUnlocked("marine", [])).toBe(true);
    expect(isHeroDeploymentUnlocked("medic", [])).toBe(true);
  });
});
