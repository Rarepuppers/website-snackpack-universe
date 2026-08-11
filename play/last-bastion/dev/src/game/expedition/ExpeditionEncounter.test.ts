import { describe, expect, it } from "vitest";
import { generateExpeditionMap } from "./ExpeditionMap";
import { bossKindForTheme, expeditionEncounterForNode, expeditionEncounterUrl, objectiveModeLabel } from "./ExpeditionEncounter";

describe("Expedition node encounter contract", () => {
  it("maps every node deterministically to its existing encounter family", () => {
    const map = generateExpeditionMap(2026);
    for (const node of map.nodes) {
      const first = expeditionEncounterForNode(map.seed, node);
      const second = expeditionEncounterForNode(map.seed, node);
      expect(second).toEqual(first);
      expect(first.kind).toBe(node.type);
      expect(first.directorWaveIndex).toBe(node.column);
      expect(first.themeId).toBe(node.themeId);
      expect(first.eliteKind === null).toBe(node.type !== "elite");
      expect(first.miniBossKind === null).toBe(node.type !== "mini-boss");
    }
  });

  it("builds an explicit game hand-off without encoding mutable build state", () => {
    const map = generateExpeditionMap(41);
    const node = map.nodes.find((candidate) => candidate.column === 1)!;
    const url = expeditionEncounterUrl(expeditionEncounterForNode(map.seed, node));
    expect(url).toContain("screen=game");
    expect(url).toContain("expedition=1");
    expect(url).toContain(`node=${node.id}`);
    expect(url).toContain("worldseed=");
    expect(url).not.toContain("health");
    expect(url).not.toContain("scrap");
  });

  it("adds one elite patrol at tier 1 and faster spawn cadence at tier 2", () => {
    const map = generateExpeditionMap(73);
    const node = map.nodes.find((candidate) => candidate.type === "combat")!;
    const standard = expeditionEncounterForNode(map.seed, node, 0);
    const elitePatrols = expeditionEncounterForNode(map.seed, node, 1);
    const rapid = expeditionEncounterForNode(map.seed, node, 2);

    expect(standard.waves.some((wave) => wave.kind === "elite")).toBe(false);
    expect(elitePatrols.waves.filter((wave) => wave.kind === "elite")).toHaveLength(1);
    expect(elitePatrols.eliteKind).not.toBeNull();
    expect(rapid.waves.filter((wave) => wave.kind === "elite")).toHaveLength(2);
    expect(new Set(rapid.waves.filter((wave) => wave.kind === "elite").map((wave) => wave.eliteKind)).size).toBe(2);
    expect(rapid.waves.every((wave) => wave.spawnCadenceMultiplier === 1.2)).toBe(true);
  });

  it("seeds all three objective modifiers onto eligible mid-run combat nodes", () => {
    const modes = new Set<string>();
    for (let seed = 1; seed <= 80; seed += 1) {
      const map = generateExpeditionMap(seed);
      for (const node of map.nodes) {
        const encounter = expeditionEncounterForNode(map.seed, node);
        if (!encounter.objectiveMode) continue;
        expect(node.type).toBe("combat");
        expect(node.column).toBeGreaterThanOrEqual(2);
        expect(node.column).toBeLessThanOrEqual(6);
        modes.add(encounter.objectiveMode);
      }
    }
    expect(modes).toEqual(new Set(["escort", "deny", "collect"]));
    expect([objectiveModeLabel("escort"), objectiveModeLabel("deny"), objectiveModeLabel("collect")])
      .toEqual(["ESCORT", "DENY CHANNEL", "TIMED RECOVERY"]);
  });

  it("selects a finale that teaches the region's combat language", () => {
    expect(bossKindForTheme("alien-hive")).toBe("the-choir");
    expect(bossKindForTheme("toxic-bloom")).toBe("the-choir");
    expect(bossKindForTheme("machine-foundry")).toBe("foundry-sovereign");
    expect(bossKindForTheme("science-wing")).toBe("foundry-sovereign");
    expect(bossKindForTheme("ruined-city")).toBe("bastion-eater");
  });
});
