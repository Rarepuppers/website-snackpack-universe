import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { HOLD_RANGE_BAND, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const CORRUPTED_MARINE_WINDUP_SECONDS = 0.72;
export const CORRUPTED_MARINE_KNIFE_SPEED = 6;
export const CORRUPTED_MARINE_KNIFE_DAMAGE = 1.8;
export const CORRUPTED_MARINE_RECOVERY_SECONDS = 0.65;
export const CORRUPTED_MARINE_COOLDOWN_SECONDS = 2.8;
export const CORRUPTED_MARINE_RANGE_METRES = 11;

export type CorruptedMarinePhase = "positioning" | "windup" | "throw" | "recovery";

export interface CorruptedMarineBehaviorState {
  readonly phase: CorruptedMarinePhase;
  readonly phaseRemainingSeconds: number;
  readonly attackCooldownSeconds: number;
  readonly lockedTarget: Vector2Data;
}

export interface CorruptedMarineStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly projectileSlotAvailable: boolean;
}

export interface CorruptedMarineStepResult {
  readonly state: CorruptedMarineBehaviorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly firesKnife: boolean;
}

export interface CorruptedMarineResolveResult {
  readonly state: CorruptedMarineBehaviorState;
  readonly facingDirection: Vector2Data;
  readonly warningStarted: boolean;
}

export function stepCorruptedMarineBehavior(
  state: CorruptedMarineBehaviorState,
  input: CorruptedMarineStepInput,
): CorruptedMarineStepResult {
  let next: CorruptedMarineBehaviorState = {
    ...state,
    phaseRemainingSeconds: state.phaseRemainingSeconds - input.deltaSeconds,
  };
  let firesKnife = false;
  if (state.phase === "windup" && next.phaseRemainingSeconds <= 0) {
    if (!input.projectileSlotAvailable) {
      next = { ...next, phaseRemainingSeconds: 0.1 };
    } else {
      next = {
        ...next,
        phase: "throw",
        phaseRemainingSeconds: 0.12,
        attackCooldownSeconds: CORRUPTED_MARINE_COOLDOWN_SECONDS,
      };
      firesKnife = true;
    }
  } else if (state.phase === "throw" && next.phaseRemainingSeconds <= 0) {
    next = { ...next, phase: "recovery", phaseRemainingSeconds: CORRUPTED_MARINE_RECOVERY_SECONDS };
  } else if (state.phase === "recovery" && next.phaseRemainingSeconds <= 0) {
    next = { ...next, phase: "positioning", phaseRemainingSeconds: 0 };
  }
  return {
    state: next,
    movement: state.phase === "positioning" ? HOLD_RANGE_BAND : NO_MOVEMENT,
    facingDirection: normalizeVector({
      x: input.playerPosition.x - input.position.x,
      y: input.playerPosition.y - input.position.y,
    }),
    firesKnife,
  };
}

/** Positioning moves first, then locks a target using the post-movement range. */
export function resolveCorruptedMarineAfterMovement(
  state: CorruptedMarineBehaviorState,
  position: Vector2Data,
  playerPosition: Vector2Data,
): CorruptedMarineResolveResult {
  if (
    state.phase !== "positioning"
    || state.attackCooldownSeconds > 0
    || distance(position, playerPosition) > CORRUPTED_MARINE_RANGE_METRES
  ) {
    return {
      state,
      facingDirection: normalizeVector({ x: playerPosition.x - position.x, y: playerPosition.y - position.y }),
      warningStarted: false,
    };
  }
  const lockedTarget = { ...playerPosition };
  return {
    state: {
      ...state,
      phase: "windup",
      phaseRemainingSeconds: CORRUPTED_MARINE_WINDUP_SECONDS,
      lockedTarget,
    },
    facingDirection: normalizeVector({ x: lockedTarget.x - position.x, y: lockedTarget.y - position.y }),
    warningStarted: true,
  };
}
