import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import {
  stepReclaimerRepair,
  tryBeginReclaimerRepair,
  type ReclaimerRepairState,
  type ReclaimerRepairTarget,
  type ReclaimerRepairStepResult,
} from "./CyborgReclaimerRepair";

export interface CyborgReclaimerStepInput {
  readonly deltaSeconds: number;
  readonly ownerId: number;
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
  readonly lockedTarget: ReclaimerRepairTarget | null;
  readonly repairTargets: readonly ReclaimerRepairTarget[];
  readonly activeLinkOwnerId: number | null;
  readonly ownerWasDamaged: boolean;
}

export interface CyborgReclaimerStepResult extends ReclaimerRepairStepResult {
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly startedTarget: ReclaimerRepairTarget | null;
}

export function stepCyborgReclaimerBehavior(
  state: ReclaimerRepairState,
  input: CyborgReclaimerStepInput,
): CyborgReclaimerStepResult {
  const repair = stepReclaimerRepair(
    state,
    input.deltaSeconds,
    input.ownerPosition,
    input.lockedTarget,
    input.ownerWasDamaged,
  );
  if (repair.state.phase === "channel") {
    const target = input.repairTargets.find((candidate) => candidate.id === repair.state.targetId)
      ?? input.lockedTarget;
    return result(
      repair,
      NO_MOVEMENT,
      target ? directionTo(input.ownerPosition, target.position) : null,
      null,
    );
  }
  if (repair.state.phase === "recovery") {
    return result(repair, NO_MOVEMENT, null, null);
  }

  const begun = tryBeginReclaimerRepair(
    repair.state,
    input.ownerId,
    input.ownerPosition,
    input.repairTargets,
    input.activeLinkOwnerId,
  );
  if (begun.phase === "channel" && begun.targetId !== null) {
    const target = input.repairTargets.find((candidate) => candidate.id === begun.targetId) ?? null;
    return result(
      { ...repair, state: begun },
      NO_MOVEMENT,
      target ? directionTo(input.ownerPosition, target.position) : null,
      target,
    );
  }

  const movementTarget = selectReclaimerMovementTarget(
    input.ownerId,
    input.ownerPosition,
    input.repairTargets,
  );
  const facingDirection = directionTo(
    input.ownerPosition,
    movementTarget?.position ?? input.playerPosition,
  );
  return result(
    { ...repair, state: begun },
    fixedDirection(facingDirection, input.movementSpeedMetresPerSecond),
    facingDirection,
    null,
  );
}

export function selectReclaimerMovementTarget(
  ownerId: number,
  ownerPosition: Readonly<Vector2Data>,
  targets: readonly ReclaimerRepairTarget[],
): ReclaimerRepairTarget | null {
  return targets.filter((candidate) => (
    !candidate.dead
    && candidate.id !== ownerId
    && candidate.machine
    && candidate.health > 0
    && candidate.health < candidate.maxHealth
    && candidate.rank !== "mini-boss"
    && candidate.rank !== "boss"
  )).sort((left, right) => (
    distance(ownerPosition, left.position) - distance(ownerPosition, right.position)
    || left.id - right.id
  ))[0] ?? null;
}

function directionTo(from: Readonly<Vector2Data>, to: Readonly<Vector2Data>): Vector2Data {
  return normalizeVector({ x: to.x - from.x, y: to.y - from.y });
}

function result(
  repair: ReclaimerRepairStepResult,
  movement: EnemyMovementIntent,
  facingDirection: Vector2Data | null,
  startedTarget: ReclaimerRepairTarget | null,
): CyborgReclaimerStepResult {
  return { ...repair, movement, facingDirection, startedTarget };
}
