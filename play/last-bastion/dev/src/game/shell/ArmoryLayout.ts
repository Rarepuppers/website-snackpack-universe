import type { ArmoryNodeId } from "../progression/ArmoryProgression";

export interface ArmoryNodePosition {
  readonly x: number;
  readonly y: number;
}

export interface ArmoryLayout {
  readonly nodeWidth: number;
  readonly positionById: ReadonlyMap<ArmoryNodeId, ArmoryNodePosition>;
}

/**
 * Keeps the accepted five-node tree unchanged while reserving a non-overlapping
 * three-column clearance row for Scout's eventual release.
 */
export function armoryLayout(nodeIds: readonly ArmoryNodeId[]): ArmoryLayout {
  const scoutReleased = nodeIds.includes("armory-scout-clearance");
  return {
    nodeWidth: scoutReleased ? 280 : 300,
    positionById: new Map<ArmoryNodeId, ArmoryNodePosition>([
      ["armory-scattergun", { x: 480, y: scoutReleased ? 105 : 150 }],
      ["armory-arc-carbine", { x: 260, y: scoutReleased ? 245 : 295 }],
      ["armory-patrol-blade", { x: 700, y: scoutReleased ? 245 : 295 }],
      ["armory-tactician-clearance", { x: scoutReleased ? 160 : 260, y: scoutReleased ? 405 : 445 }],
      ["armory-scout-clearance", { x: 480, y: 405 }],
      ["armory-assault-clearance", { x: scoutReleased ? 800 : 700, y: scoutReleased ? 405 : 445 }],
    ]),
  };
}
