/** HUD and overlays start at 2000 throughout PrototypeScene and CombatHud. */
export const WORLD_LAYER_DEPTH_CEILING = 2000;

export interface WorldLayerCandidate {
  readonly active: boolean;
  readonly visible: boolean;
  readonly depth: number;
}

/** Pure policy used by the Phaser adapter and locked independently in tests. */
export function isWorldLayerCandidate(candidate: unknown): candidate is WorldLayerCandidate {
  if (typeof candidate !== "object" || candidate === null) return false;
  const value = candidate as Partial<WorldLayerCandidate>;
  return value.active === true
    && value.visible === true
    && typeof value.depth === "number"
    && value.depth < WORLD_LAYER_DEPTH_CEILING;
}
