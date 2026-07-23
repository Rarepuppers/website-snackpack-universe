import { describe, expect, it } from "vitest";
import {
  EXPEDITION_COLUMNS,
  EXPEDITION_LANES,
  EXPEDITION_NODE_COUNT,
  expeditionNodeById,
  generateExpeditionMap,
  reachableNodes,
  routeLengthRange,
  traversableNodeIds,
  type ExpeditionMapData,
  type ExpeditionNode,
} from "./ExpeditionMap";
import { ARENA_THEMES } from "../rendering/arenaThemes";

const SEEDS = [1, 7, 42, 123, 999, 5150, 88888];

function nodesOfType(map: ExpeditionMapData, type: ExpeditionNode["type"]): ExpeditionNode[] {
  return map.nodes.filter((node) => node.type === type);
}

/** Walks every distinct route from the drop site to a terminus. */
function allRoutes(map: ExpeditionMapData): ExpeditionNode[][] {
  const routes: ExpeditionNode[][] = [];
  const walk = (node: ExpeditionNode, path: ExpeditionNode[]): void => {
    const next = [...path, node];
    if (node.next.length === 0) {
      routes.push(next);
      return;
    }
    for (const id of node.next) {
      walk(expeditionNodeById(map, id)!, next);
    }
  };
  walk(expeditionNodeById(map, map.startNodeId)!, []);
  return routes;
}

describe("generateExpeditionMap", () => {
  it("is deterministic for a seed and differs across seeds", () => {
    expect(generateExpeditionMap(42)).toEqual(generateExpeditionMap(42));
    const first = JSON.stringify(generateExpeditionMap(1).nodes);
    const second = JSON.stringify(generateExpeditionMap(2).nodes);
    expect(first).not.toEqual(second);
  });

  it.each(SEEDS)("builds a 20-node, 8-column chart for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    expect(map.nodes).toHaveLength(EXPEDITION_NODE_COUNT);
    expect(map.columns).toBe(EXPEDITION_COLUMNS);
    expect(new Set(map.nodes.map((node) => node.id)).size).toBe(EXPEDITION_NODE_COUNT);

    for (const node of map.nodes) {
      expect(node.column).toBeGreaterThanOrEqual(0);
      expect(node.column).toBeLessThan(EXPEDITION_COLUMNS);
      expect(node.lane).toBeGreaterThanOrEqual(0);
      expect(node.lane).toBeLessThan(EXPEDITION_LANES);
      expect(ARENA_THEMES.some((theme) => theme.id === node.themeId)).toBe(true);
    }
    // No two nodes may share a grid cell.
    const cells = map.nodes.map((node) => `${node.column}:${node.lane}`);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it.each(SEEDS)("starts at a single drop site and ends at the boss for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    const start = expeditionNodeById(map, map.startNodeId)!;
    const boss = expeditionNodeById(map, map.bossNodeId)!;

    expect(start.column).toBe(0);
    expect(map.nodes.filter((node) => node.column === 0)).toHaveLength(1);
    expect(boss.type).toBe("boss");
    expect(boss.column).toBe(EXPEDITION_COLUMNS - 1);
    expect(nodesOfType(map, "boss")).toHaveLength(1);
    expect(boss.next).toHaveLength(0);
  });

  it.each(SEEDS)("only links forward to adjacent lanes for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    for (const node of map.nodes) {
      for (const nextId of node.next) {
        const target = expeditionNodeById(map, nextId)!;
        expect(target.column).toBe(node.column + 1);
        expect(Math.abs(target.lane - node.lane)).toBeLessThanOrEqual(1);
      }
      expect(new Set(node.next).size).toBe(node.next.length);
    }
  });

  it.each(SEEDS)("leaves no unreachable node or dead end for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    expect(traversableNodeIds(map).size).toBe(EXPEDITION_NODE_COUNT);
    for (const node of map.nodes) {
      if (node.type !== "boss") {
        expect(node.next.length).toBeGreaterThan(0);
      }
    }
    // Every route must terminate at the boss, never at a mid-map leaf.
    for (const route of allRoutes(map)) {
      expect(route[route.length - 1]!.id).toBe(map.bossNodeId);
    }
  });

  it.each(SEEDS)("keeps every route to a sensible encounter length for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    const { shortest, longest } = routeLengthRange(map);
    expect(shortest).toBe(EXPEDITION_COLUMNS);
    expect(longest).toBe(EXPEDITION_COLUMNS);
    expect(longest).toBeLessThan(EXPEDITION_NODE_COUNT);
  });

  it.each(SEEDS)("respects the node-type budget for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    expect(nodesOfType(map, "elite")).toHaveLength(2);
    expect(nodesOfType(map, "mini-boss")).toHaveLength(2);
    expect(nodesOfType(map, "supply-depot")).toHaveLength(2);
    expect(nodesOfType(map, "weapon-cache")).toHaveLength(2);
    expect(nodesOfType(map, "shrine")).toHaveLength(1);
    expect(nodesOfType(map, "event")).toHaveLength(2);
    expect(nodesOfType(map, "combat").length).toBeGreaterThan(0);
  });

  it.each(SEEDS)("keeps shrine and event nodes out of the calm opening for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    for (const node of [...nodesOfType(map, "shrine"), ...nodesOfType(map, "event")]) {
      expect(node.column).toBeGreaterThan(1);
      expect(node.column).toBeLessThan(EXPEDITION_COLUMNS - 1);
    }
  });

  it.each(SEEDS)("opens calmly with ordinary combat for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    for (const node of map.nodes.filter((candidate) => candidate.column <= 1)) {
      expect(node.type).toBe("combat");
    }
  });

  it.each(SEEDS)("never chains two dangerous nodes on a path for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    const dangerous = (node: ExpeditionNode) => node.type === "elite" || node.type === "mini-boss";
    for (const node of map.nodes) {
      if (!dangerous(node)) continue;
      for (const nextId of node.next) {
        expect(dangerous(expeditionNodeById(map, nextId)!)).toBe(false);
      }
    }
  });

  it.each(SEEDS)("offers a Supply Depot before any Mini-boss for seed %i", (seed) => {
    const map = generateExpeditionMap(seed);
    const firstDepotColumn = Math.min(...nodesOfType(map, "supply-depot").map((node) => node.column));
    for (const miniBoss of nodesOfType(map, "mini-boss")) {
      expect(miniBoss.column).toBeGreaterThan(firstDepotColumn);
      expect(miniBoss.column).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("expedition traversal helpers", () => {
  it("exposes only the next column as reachable", () => {
    const map = generateExpeditionMap(42);
    const options = reachableNodes(map, map.startNodeId);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.column).toBe(1);
    }
    expect(reachableNodes(map, map.bossNodeId)).toHaveLength(0);
    expect(reachableNodes(map, 9999)).toHaveLength(0);
  });

  it("returns null for unknown node ids", () => {
    expect(expeditionNodeById(generateExpeditionMap(1), 9999)).toBeNull();
  });
});
