import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  fixedDirection,
  NO_MOVEMENT,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

export const RIPPER_REACH_METRES = 2.55;
/** Slightly beyond reach, so a sweep commits beside the player rather than only on contact. */
export const RIPPER_COMMIT_MARGIN_METRES = 0.35;
export const RIPPER_WINDUP_SECONDS = 0.62;
export const RIPPER_SWEEP_SECONDS = 0.24;
export const RIPPER_RECOVERY_SECONDS = 1.1;
export const RIPPER_PURSUIT_SECONDS = 0.45;

export type RipperPhase = "pursuit" | "windup" | "sweep" | "recovery";

export interface RipperState {
  readonly phase: RipperPhase;
  readonly phaseRemainingSeconds: number;
  readonly sweepDirection: Vector2Data;
}

export interface RipperStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly pursuitSpeedMetresPerSecond: number;
}

export interface RipperStepResult {
  readonly state: RipperState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  /** Set on the windup -> sweep frame; the caller emits the event and tests the hit. */
  readonly sweepFired: boolean;
}

export function stepRipperBehavior(
  state: RipperState,
  input: RipperStepInput,
): RipperStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;

  switch (state.phase) {
    case "pursuit": {
      const facingDirection = normalizeVector({
        x: input.playerPosition.x - input.position.x,
        y: input.playerPosition.y - input.position.y,
      });
      // Measured before movement, and used for BOTH the advance gate and the
      // commit gate — the inline version read it once into a local up front.
      const playerDistance = distance(input.position, input.playerPosition);
      const committing = expired
        && playerDistance <= RIPPER_REACH_METRES + RIPPER_COMMIT_MARGIN_METRES;
      return {
        state: committing
          ? {
              phase: "windup",
              phaseRemainingSeconds: RIPPER_WINDUP_SECONDS,
              sweepDirection: { ...facingDirection },
            }
          : { ...state, phaseRemainingSeconds },
        // Stops advancing once inside reach, so it winds up rather than
        // shouldering the player around.
        movement: playerDistance > RIPPER_REACH_METRES
          ? fixedDirection(facingDirection, input.pursuitSpeedMetresPerSecond)
          : NO_MOVEMENT,
        facingDirection,
        sweepFired: false,
      };
    }

    case "windup":
      return {
        state: expired
          ? { ...state, phase: "sweep", phaseRemainingSeconds: RIPPER_SWEEP_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        facingDirection: null,
        sweepFired: expired,
      };

    case "sweep":
      return {
        state: expired
          ? { ...state, phase: "recovery", phaseRemainingSeconds: RIPPER_RECOVERY_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        facingDirection: null,
        sweepFired: false,
      };

    case "recovery":
      return {
        state: expired
          ? { ...state, phase: "pursuit", phaseRemainingSeconds: RIPPER_PURSUIT_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        facingDirection: null,
        sweepFired: false,
      };
  }
}
