import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import {
  beginFoundryFabrication,
  stepFoundryFabrication,
  type FoundryChildReservation,
  type FoundryChildType,
  type FoundryFabricatorState,
  type FoundryStepResult,
} from "./FoundryFabricatorLifecycle";

export const FOUNDRY_FABRICATOR_APPROACH_RANGE_METRES = 7.5;

export interface FoundryFabricatorStepResult extends FoundryStepResult {
  readonly requestedChildType: FoundryChildType | null;
}

export interface FoundryFabricationResolution {
  readonly state: FoundryFabricatorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly startedFabrication: {
    readonly target: Vector2Data;
    readonly reservation: FoundryChildReservation;
  } | null;
}

export function stepFoundryFabricatorBehavior(
  state: FoundryFabricatorState,
  deltaSeconds: number,
  ownerWasDamaged: boolean,
): FoundryFabricatorStepResult {
  const stepped = stepFoundryFabrication(state, deltaSeconds, ownerWasDamaged);
  const canRequest = state.phase === "positioning" && stepped.state.phase === "positioning";
  return {
    ...stepped,
    requestedChildType: canRequest
      ? stepped.state.chargesRemaining === 2 ? "foundry-turret" : "foundry-drone"
      : null,
  };
}

export function resolveFoundryFabricationRequest(
  state: FoundryFabricatorState,
  input: {
    readonly position: Vector2Data;
    readonly playerPosition: Vector2Data;
    readonly movementSpeedMetresPerSecond: number;
    readonly arenaWidthMetres: number;
    readonly arenaHeightMetres: number;
    readonly reservation: FoundryChildReservation | null;
  },
): FoundryFabricationResolution {
  if (!input.reservation) {
    const facingDirection = normalizeVector({
      x: input.playerPosition.x - input.position.x,
      y: input.playerPosition.y - input.position.y,
    });
    const movement = distance(input.position, input.playerPosition) > FOUNDRY_FABRICATOR_APPROACH_RANGE_METRES
      ? fixedDirection(facingDirection, input.movementSpeedMetresPerSecond)
      : NO_MOVEMENT;
    return { state, movement, facingDirection, startedFabrication: null };
  }

  const side = state.chargesRemaining % 2 === 0 ? -1 : 1;
  const target = {
    x: clamp(input.position.x + side * 2.2, 0.7, input.arenaWidthMetres - 0.7),
    y: clamp(input.position.y + 0.9, 0.7, input.arenaHeightMetres - 0.7),
  };
  return {
    state: beginFoundryFabrication(state, target, input.reservation),
    movement: NO_MOVEMENT,
    facingDirection: null,
    startedFabrication: { target, reservation: input.reservation },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
