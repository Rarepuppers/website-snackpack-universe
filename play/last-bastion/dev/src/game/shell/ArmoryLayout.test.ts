import { describe, expect, it } from "vitest";
import { ARMORY_NODES, type ArmoryNodeId } from "../progression/ArmoryProgression";
import { armoryLayout } from "./ArmoryLayout";

describe("ArmoryLayout", () => {
  it("preserves the historical five-node layout when Scout is absent", () => {
    const fiveNodeIds = ARMORY_NODES.map(({ id }) => id)
      .filter((id) => id !== "armory-scout-clearance");
    const layout = armoryLayout(fiveNodeIds);
    expect(layout.nodeWidth).toBe(300);
    expect(layout.positionById.get("armory-scattergun")).toEqual({ x: 480, y: 150 });
    expect(layout.positionById.get("armory-tactician-clearance")).toEqual({ x: 260, y: 445 });
    expect(layout.positionById.get("armory-assault-clearance")).toEqual({ x: 700, y: 445 });
  });

  it("fits the live three-card clearance row without overlap", () => {
    const liveIds = ARMORY_NODES.map(({ id }) => id) as ArmoryNodeId[];
    expect(liveIds).toContain("armory-scout-clearance");
    const layout = armoryLayout(liveIds);
    const clearanceIds = [
      "armory-tactician-clearance", "armory-scout-clearance", "armory-assault-clearance",
    ] as const;
    const positions = clearanceIds.map((id) => layout.positionById.get(id)!);
    expect(layout.nodeWidth).toBe(280);
    expect(positions.map(({ x }) => x)).toEqual([160, 480, 800]);
    expect(positions.every(({ y }) => y === 405)).toBe(true);
    expect(positions[1]!.x - positions[0]!.x).toBeGreaterThan(layout.nodeWidth);
    expect(positions[2]!.x - positions[1]!.x).toBeGreaterThan(layout.nodeWidth);
    expect(positions[0]!.x - layout.nodeWidth / 2).toBeGreaterThanOrEqual(0);
    expect(positions[2]!.x + layout.nodeWidth / 2).toBeLessThanOrEqual(960);
  });
});
