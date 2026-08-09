import type { ArenaObstacle } from "../arena/ArenaDefinition";
import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  stepArcWardenBehavior,
  type ArcWardenState,
  type ArcWardenStepResult,
} from "./ArcWardenBeam";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const ARC_WARDEN_RETREAT_RANGE_METRES = 4.5;
export const ARC_WARDEN_APPROACH_RANGE_METRES = 8;

export interface ArcWardenBehaviorInput {
  readonly deltaSeconds: number;
  readonly enemyId: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly obstacles: readonly ArenaObstacle[];
  readonly movementSpeedMetresPerSecond: number;
}

export interface ArcWardenBehaviorResult extends ArcWardenStepResult {
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly warningStarted: boolean;
}

export function stepArcWardenCombatBehavior(
  state: ArcWardenState,
  input: ArcWardenBehaviorInput,
): ArcWardenBehaviorResult {
  const stepped = stepArcWardenBehavior(
    state,
    input.deltaSeconds,
    input.position,
    input.playerPosition,
    input.obstacles,
  );
  const warningStarted = state.phase === "reposition"
    && stepped.state.phase === "charge"
    && stepped.state.lockedLane !== null;
  if (stepped.state.phase !== "reposition") {
    return {
      ...stepped,
      movement: NO_MOVEMENT,
      facingDirection: stepped.state.lockedLane?.direction
        ?? directionTo(input.position, input.playerPosition),
      warningStarted,
    };
  }

  const towardPlayer = directionTo(input.position, input.playerPosition);
  const playerDistance = distance(input.position, input.playerPosition);
  const direction = playerDistance > ARC_WARDEN_APPROACH_RANGE_METRES
    ? towardPlayer
    : playerDistance < ARC_WARDEN_RETREAT_RANGE_METRES
      ? { x: -towardPlayer.x, y: -towardPlayer.y }
      : input.enemyId % 2 === 0
        ? { x: -towardPlayer.y, y: towardPlayer.x }
        : { x: towardPlayer.y, y: -towardPlayer.x };
  return {
    ...stepped,
    movement: fixedDirection(direction, input.movementSpeedMetresPerSecond),
    facingDirection: towardPlayer,
    warningStarted,
  };
}

function directionTo(from: Readonly<Vector2Data>, to: Readonly<Vector2Data>): Vector2Data {
  return normalizeVector({ x: to.x - from.x, y: to.y - from.y });
}
