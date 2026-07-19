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
});
