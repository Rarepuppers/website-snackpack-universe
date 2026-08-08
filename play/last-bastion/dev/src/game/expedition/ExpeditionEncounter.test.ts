import { describe, expect, it } from "vitest";
import { generateExpeditionMap } from "./ExpeditionMap";
import { expeditionEncounterForNode, expeditionEncounterUrl } from "./ExpeditionEncounter";

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
    expect(rapid.waves.filter((wave) => wave.kind === "elite")).toHaveLength(1);
    expect(rapid.waves.every((wave) => wave.spawnCadenceMultiplier === 1.2)).toBe(true);
  });
});
