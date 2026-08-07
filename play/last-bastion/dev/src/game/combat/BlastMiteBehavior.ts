import { distance, type Vector2Data } from "../math/Vector2Data";
import { NO_MOVEMENT, towardPlayer, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const BLAST_MITE_ARM_RANGE_METRES = 1;
export const BLAST_MITE_FUSE_SECONDS = 0.45;

export type BlastMitePhase = "chase" | "armed";

export interface BlastMiteState {
  readonly phase: BlastMitePhase;
  readonly phaseRemainingSeconds: number;
}

export interface BlastMiteStepInput {
  readonly deltaSeconds: number;
  readonly chaseSpeedMetresPerSecond: number;
}

export interface BlastMiteStepResult {
  readonly state: BlastMiteState;
  readonly movement: EnemyMovementIntent;
  /** The mite kills itself; the simulation owns the damage and the corpse. */
  readonly detonates: boolean;
}

/**
 * Arming is deliberately a second call rather than part of `step`.
 *
 * The mite moves first and is only then tested for range, so evaluating the
 * range against the pre-movement position would arm it a tick early — which
 * shifts the fuse, the explosion, and every RNG draw that follows it. Callers
 * must apply `movement`, then call `armBlastMiteIfInRange` with the resulting
 * position, matching the original ordering exactly.
 */
export function stepBlastMiteBehavior(
  state: BlastMiteState,
  input: BlastMiteStepInput,
): BlastMiteStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;

  if (state.phase === "chase") {
    return {
      state: { ...state, phaseRemainingSeconds },
      movement: towardPlayer(input.chaseSpeedMetresPerSecond),
      detonates: false,
    };
  }

  return {
    state: { ...state, phaseRemainingSeconds },
    movement: NO_MOVEMENT,
    detonates: phaseRemainingSeconds <= 0,
  };
}

/** Call after applying chase movement, with the post-movement position. */
export function armBlastMiteIfInRange(
  state: BlastMiteState,
  position: Vector2Data,
  playerPosition: Vector2Data,
): BlastMiteState {
  if (state.phase !== "chase") return state;
  return distance(position, playerPosition) <= BLAST_MITE_ARM_RANGE_METRES
    ? { phase: "armed", phaseRemainingSeconds: BLAST_MITE_FUSE_SECONDS }
    : state;
}
