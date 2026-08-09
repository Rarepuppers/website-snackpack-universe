import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const NEST_WEAVER_MIN_RANGE_METRES = 4.5;
export const NEST_WEAVER_MAX_RANGE_METRES = 8.5;
export const NEST_WEAVER_PLACEMENT_WINDUP_SECONDS = 0.85;
export const NEST_WEAVER_RECOVERY_SECONDS = 1.4;
export const NEST_WEAVER_POSITIONING_SECONDS = 2.1;
export const NEST_WEAVER_RETRY_SECONDS = 0.5;

export type NestWeaverPhase = "positioning" | "placement-windup" | "recovery";

export interface NestWeaverBehaviorState {
  readonly phase: NestWeaverPhase;
  readonly phaseRemainingSeconds: number;
}

export interface NestWeaverStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
  readonly pendingReservationAvailable: boolean;
}

export interface NestWeaverStepResult {
  readonly state: NestWeaverBehaviorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly laysPod: boolean;
  readonly requestsPlacement: boolean;
}

export function stepNestWeaverBehavior(
  state: NestWeaverBehaviorState,
  input: NestWeaverStepInput,
): NestWeaverStepResult {
  const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - input.deltaSeconds);
  const towardPlayer = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  if (state.phase === "placement-windup") {
    const laysPod = phaseRemainingSeconds <= 0 && input.pendingReservationAvailable;
    return {
      state: laysPod
        ? { phase: "recovery", phaseRemainingSeconds: NEST_WEAVER_RECOVERY_SECONDS }
        : { ...state, phaseRemainingSeconds },
      movement: NO_MOVEMENT,
      facingDirection: towardPlayer,
      laysPod,
      requestsPlacement: false,
    };
  }
  if (state.phase === "recovery") {
    return {
      state: phaseRemainingSeconds <= 0
        ? { phase: "positioning", phaseRemainingSeconds: NEST_WEAVER_POSITIONING_SECONDS }
        : { ...state, phaseRemainingSeconds },
      movement: NO_MOVEMENT,
      facingDirection: towardPlayer,
      laysPod: false,
      requestsPlacement: false,
    };
  }

  const playerDistance = distance(input.position, input.playerPosition);
  let movement: EnemyMovementIntent = NO_MOVEMENT;
  if (playerDistance > NEST_WEAVER_MAX_RANGE_METRES) {
    movement = fixedDirection(towardPlayer, input.movementSpeedMetresPerSecond);
  } else if (playerDistance < NEST_WEAVER_MIN_RANGE_METRES) {
    movement = fixedDirection({ x: -towardPlayer.x, y: -towardPlayer.y }, input.movementSpeedMetresPerSecond);
  }
  return {
    state: { ...state, phaseRemainingSeconds },
    movement,
    facingDirection: towardPlayer,
    laysPod: false,
    requestsPlacement: phaseRemainingSeconds <= 0,
  };
}

export function resolveNestWeaverPlacement(
  state: NestWeaverBehaviorState,
  accepted: boolean,
): NestWeaverBehaviorState {
  if (state.phase !== "positioning") return state;
  return accepted
    ? { phase: "placement-windup", phaseRemainingSeconds: NEST_WEAVER_PLACEMENT_WINDUP_SECONDS }
    : { ...state, phaseRemainingSeconds: NEST_WEAVER_RETRY_SECONDS };
}
