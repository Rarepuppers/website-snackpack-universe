import type { Vector2Data } from "../math/Vector2Data";

export type CardinalFacingColumn = 0 | 1 | 2 | 3;
export type BrainVisualPhase = "drift" | "windup" | "lunge" | "recover";

export function cardinalFacingColumn(
  origin: Vector2Data,
  target: Vector2Data,
): CardinalFacingColumn {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 2 : 3;
  }

  return dy > 0 ? 0 : 1;
}

export function angleToward(origin: Vector2Data, target: Vector2Data): number {
  return Math.atan2(target.y - origin.y, target.x - origin.x);
}

export function offsetGaitRow(timeMilliseconds: number, entityId: number): 0 | 1 {
  return Math.floor(timeMilliseconds / 140 + entityId * 0.5) % 2 === 0 ? 0 : 1;
}

export function eggClusterFrame(hatchProgress: number): 0 | 1 | 2 | 3 {
  const progress = Math.min(Math.max(hatchProgress, 0), 1);
  if (progress < 0.35) return 0;
  if (progress < 0.72) return 1;
  if (progress < 0.94) return 2;
  return 3;
}

export function brainBlobFrame(phase: BrainVisualPhase): 0 | 1 | 2 | 3 {
  switch (phase) {
    case "windup": return 1;
    case "lunge": return 2;
    case "recover": return 3;
    default: return 0;
  }
}
