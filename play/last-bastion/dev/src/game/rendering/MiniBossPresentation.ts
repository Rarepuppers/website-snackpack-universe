import type { MiniBossKind } from "../combat/CombatSimulation";

const MINI_BOSS_SPRITE_SCALES: Readonly<Record<MiniBossKind, number>> = Object.freeze({
  "siege-crusher": 1.34,
  "brood-warden": 1.3,
  "rift-stalker": 1.25,
  "synapse-herald": 1.28,
  "assembly-prime": 1.32,
  "storm-regent": 1.3,
  "abomination-prime": 1.34,
});

/** Gameplay-scale silhouette contract; collision radii remain simulation-owned. */
export function miniBossSpriteScale(kind: MiniBossKind): number {
  return MINI_BOSS_SPRITE_SCALES[kind];
}
