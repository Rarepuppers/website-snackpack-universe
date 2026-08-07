import { normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  fixedDirection,
  NO_MOVEMENT,
  towardPlayer,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

export const BRAIN_BLOB_WINDUP_SECONDS = 0.45;
export const BRAIN_BLOB_LUNGE_SECONDS = 0.32;
export const BRAIN_BLOB_RECOVER_SECONDS = 0.6;
export const BRAIN_BLOB_LUNGE_SPEED = 6;
export const BRAIN_BLOB_DRIFT_MINIMUM_SECONDS = 1.4;
export const BRAIN_BLOB_DRIFT_RANDOM_SECONDS = 0.8;

export type BrainBlobPhase = "drift" | "windup" | "lunge" | "recover";

export interface BrainBlobState {
  readonly phase: BrainBlobPhase;
  readonly phaseRemainingSeconds: number;
  readonly lungeDirection: Vector2Data;
}

export interface BrainBlobStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly driftSpeedMetresPerSecond: number;
  /**
   * Called at most once per step, and only on the recover -> drift transition.
   * It is a callback rather than a pre-rolled number on purpose: the simulation
   * shares one seeded generator across every system, so drawing a value on a
   * tick that would not have drawn one shifts the whole run's RNG sequence.
   */
  readonly random: () => number;
}

export interface BrainBlobStepResult {
  readonly state: BrainBlobState;
  readonly movement: EnemyMovementIntent;
}

export function stepBrainBlobBehavior(
  state: BrainBlobState,
  input: BrainBlobStepInput,
): BrainBlobStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;

  switch (state.phase) {
    case "drift":
      return {
        state: expired
          ? { ...state, phase: "windup", phaseRemainingSeconds: BRAIN_BLOB_WINDUP_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: towardPlayer(input.driftSpeedMetresPerSecond),
      };

    case "windup":
      return {
        state: expired
          ? {
              phase: "lunge",
              phaseRemainingSeconds: BRAIN_BLOB_LUNGE_SECONDS,
              // The lunge direction is locked at commit time, so dodging after
              // the tell works. Re-aiming here would remove the counterplay.
              lungeDirection: normalizeVector({
                x: input.playerPosition.x - input.position.x,
                y: input.playerPosition.y - input.position.y,
              }),
            }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
      };

    case "lunge":
      return {
        state: expired
          ? { ...state, phase: "recover", phaseRemainingSeconds: BRAIN_BLOB_RECOVER_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: fixedDirection(state.lungeDirection, BRAIN_BLOB_LUNGE_SPEED),
      };

    case "recover":
      return {
        state: expired
          ? {
              ...state,
              phase: "drift",
              phaseRemainingSeconds:
                BRAIN_BLOB_DRIFT_MINIMUM_SECONDS + input.random() * BRAIN_BLOB_DRIFT_RANDOM_SECONDS,
            }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
      };
  }
}
