import type { Vector2Data } from "../math/Vector2Data";
import {
  HOLD_RANGE_BAND,
  NO_MOVEMENT,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

export const SLIME_SPITTER_WINDUP_SECONDS = 0.65;
export const SLIME_SPITTER_RECOVER_SECONDS = 1.1;
export const SLIME_SPITTER_POSITION_MINIMUM_SECONDS = 0.85;
export const SLIME_SPITTER_POSITION_RANDOM_SECONDS = 0.35;
export const SLIME_SPITTER_MAXIMUM_RANGE_METRES = 10;

export type SlimeSpitterPhase = "positioning" | "windup" | "recover";

export interface SlimeSpitterState {
  readonly phase: SlimeSpitterPhase;
  readonly phaseRemainingSeconds: number;
}

export interface SlimeSpitterStepInput {
  readonly deltaSeconds: number;
  /**
   * Distance measured BEFORE movement is applied.
   *
   * Note this is the opposite of Carapace Scuttler and Warp Flanker, which test
   * the post-movement position. The inline version read `enemy.position` into a
   * local at the top of the function and then moved, so the range gate saw the
   * old position. Preserved deliberately — "fix" it and the spitter commits to
   * shots from a different set of frames.
   */
  readonly playerDistanceBeforeMovement: number;
  readonly random: () => number;
}

export interface SlimeSpitterStepResult {
  readonly state: SlimeSpitterState;
  readonly movement: EnemyMovementIntent;
  /**
   * Timer and range are satisfied. The caller still has to clear the shared
   * ranged-windup and projectile-slot budgets, which the inline version checked
   * after moving, before committing via `commitSlimeSpitterWindup`.
   */
  readonly readyToWindup: boolean;
  /** Launch the glob before writing the returned state, matching the original. */
  readonly launchGlob: boolean;
}

export function stepSlimeSpitterBehavior(
  state: SlimeSpitterState,
  input: SlimeSpitterStepInput,
): SlimeSpitterStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;

  switch (state.phase) {
    case "positioning":
      return {
        state: { ...state, phaseRemainingSeconds },
        movement: HOLD_RANGE_BAND,
        readyToWindup:
          expired
          && input.playerDistanceBeforeMovement <= SLIME_SPITTER_MAXIMUM_RANGE_METRES,
        launchGlob: false,
      };

    case "windup":
      return {
        state: expired
          ? { phase: "recover", phaseRemainingSeconds: SLIME_SPITTER_RECOVER_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        readyToWindup: false,
        launchGlob: expired,
      };

    case "recover":
      return {
        state: expired
          ? {
              phase: "positioning",
              phaseRemainingSeconds:
                SLIME_SPITTER_POSITION_MINIMUM_SECONDS
                + input.random() * SLIME_SPITTER_POSITION_RANDOM_SECONDS,
            }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        readyToWindup: false,
        launchGlob: false,
      };
  }
}

export interface SlimeSpitterWindup {
  readonly state: SlimeSpitterState;
  readonly target: Vector2Data;
}

/** Call only once the shared ranged-windup and projectile budgets allow it. */
export function commitSlimeSpitterWindup(playerPosition: Vector2Data): SlimeSpitterWindup {
  return {
    state: { phase: "windup", phaseRemainingSeconds: SLIME_SPITTER_WINDUP_SECONDS },
    // The target is snapshotted at commit, so walking out of the marked spot
    // is what dodges the glob.
    target: { ...playerPosition },
  };
}
