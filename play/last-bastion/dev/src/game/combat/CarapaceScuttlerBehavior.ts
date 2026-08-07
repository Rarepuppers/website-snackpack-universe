import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  fixedDirection,
  NO_MOVEMENT,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

export const CARAPACE_PURSUIT_SECONDS = 1.4;
export const CARAPACE_WINDUP_SECONDS = 0.55;
export const CARAPACE_CHARGE_SECONDS = 0.48;
export const CARAPACE_RECOVERY_SECONDS = 1.05;
export const CARAPACE_PURSUIT_SPEED = 1.85;
export const CARAPACE_CHARGE_SPEED = 7.2;
export const CARAPACE_CHARGE_TRIGGER_RANGE_METRES = 8;

export type CarapacePhase = "pursuit" | "windup" | "charge" | "recovery";

export interface CarapaceScuttlerState {
  readonly phase: CarapacePhase;
  readonly phaseRemainingSeconds: number;
  readonly facingDirection: Vector2Data;
}

export interface CarapaceScuttlerStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
}

export interface CarapaceScuttlerStepResult {
  readonly state: CarapaceScuttlerState;
  readonly movement: EnemyMovementIntent;
}

export function stepCarapaceScuttlerBehavior(
  state: CarapaceScuttlerState,
  input: CarapaceScuttlerStepInput,
): CarapaceScuttlerStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;
  const towardPlayerDirection = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });

  switch (state.phase) {
    case "pursuit":
      // Pursuit uses `fixed` rather than `toward-player`: the original moves
      // along its own facing vector with no separation blend, so the elite
      // tracks straight instead of being nudged by the swarm around it.
      return {
        state: { ...state, phaseRemainingSeconds, facingDirection: towardPlayerDirection },
        movement: fixedDirection(towardPlayerDirection, CARAPACE_PURSUIT_SPEED),
      };

    case "windup":
      return {
        state: expired
          ? {
              phase: "charge",
              phaseRemainingSeconds: CARAPACE_CHARGE_SECONDS,
              // Re-aimed at commit, then locked for the charge itself.
              facingDirection: towardPlayerDirection,
            }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
      };

    case "charge":
      // The charge -> recovery transition needs the post-movement position to
      // judge a miss, so it resolves in resolveCarapaceScuttlerAfterMovement.
      return {
        state: { ...state, phaseRemainingSeconds },
        movement: fixedDirection(state.facingDirection, CARAPACE_CHARGE_SPEED),
      };

    case "recovery":
      return {
        state: expired
          ? { ...state, phase: "pursuit", phaseRemainingSeconds: CARAPACE_PURSUIT_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
      };
  }
}

export interface CarapaceResolution {
  readonly state: CarapaceScuttlerState;
  /**
   * Hunter's Beacon: a telegraphed charge that ended without reaching the
   * player is a punishable miss.
   */
  readonly missed: boolean;
}

/** Call with the post-movement position. */
export function resolveCarapaceScuttlerAfterMovement(
  state: CarapaceScuttlerState,
  position: Vector2Data,
  playerPosition: Vector2Data,
  contactRangeMetres: number,
): CarapaceResolution {
  if (state.phaseRemainingSeconds > 0) return { state, missed: false };

  if (state.phase === "pursuit") {
    return distance(position, playerPosition) <= CARAPACE_CHARGE_TRIGGER_RANGE_METRES
      ? {
          state: { ...state, phase: "windup", phaseRemainingSeconds: CARAPACE_WINDUP_SECONDS },
          missed: false,
        }
      : { state, missed: false };
  }

  if (state.phase === "charge") {
    return {
      state: { ...state, phase: "recovery", phaseRemainingSeconds: CARAPACE_RECOVERY_SECONDS },
      missed: distance(position, playerPosition) > contactRangeMetres,
    };
  }

  return { state, missed: false };
}
