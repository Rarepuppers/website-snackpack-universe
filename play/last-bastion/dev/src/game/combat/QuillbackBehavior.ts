import { normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  HOLD_RANGE_BAND,
  NO_MOVEMENT,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

/** Below this the volley would be unavoidable; above it, trivially walked out of. */
export const QUILLBACK_MINIMUM_RANGE_METRES = 4.75;
export const QUILLBACK_MAXIMUM_RANGE_METRES = 10.5;
export const QUILLBACK_BASE_WINDUP_SECONDS = 0.62;
export const QUILLBACK_WINDUP_PER_EXTRA_SHOT_SECONDS = 0.055;
export const QUILLBACK_LAUNCH_SECONDS = 0.22;
export const QUILLBACK_RAIN_RECOVER_SECONDS = 1.55;
export const QUILLBACK_POSITION_SECONDS = 0.4;

export type QuillbackPhase = "positioning" | "windup" | "launch" | "recover";

/** Volleys step 1 -> 3 -> 5 as the Quillback keeps attacking. */
export type QuillbackShotCount = 1 | 3 | 5;

export interface QuillbackState {
  readonly phase: QuillbackPhase;
  readonly phaseRemainingSeconds: number;
  readonly shotCount: QuillbackShotCount;
  readonly attackCount: number;
  readonly direction: Vector2Data;
}

export interface QuillbackStepInput {
  readonly deltaSeconds: number;
  /** Pre-movement, matching the inline version's single read at the top. */
  readonly playerDistanceBeforeMovement: number;
  readonly isMatriarch: boolean;
}

export type QuillbackRelease = "volley" | "rain-of-spines";

export interface QuillbackStepResult {
  readonly state: QuillbackState;
  readonly movement: EnemyMovementIntent;
  /**
   * Timer and range are satisfied. The caller must still clear the shared
   * ranged-windup budget and have room for `quillbackVolleyCount` projectiles,
   * both of which the inline version checked after moving.
   */
  readonly readyToWindup: boolean;
  /** Fire before writing the returned state — the launchers read live fields. */
  readonly release: QuillbackRelease | null;
}

export function stepQuillbackBehavior(
  state: QuillbackState,
  input: QuillbackStepInput,
): QuillbackStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;
  const inBand = input.playerDistanceBeforeMovement >= QUILLBACK_MINIMUM_RANGE_METRES
    && input.playerDistanceBeforeMovement <= QUILLBACK_MAXIMUM_RANGE_METRES;

  switch (state.phase) {
    case "positioning":
      return {
        state: { ...state, phaseRemainingSeconds },
        movement: HOLD_RANGE_BAND,
        readyToWindup: expired && inBand,
        release: null,
      };

    case "windup": {
      if (!expired) {
        return quiet({ ...state, phaseRemainingSeconds });
      }
      // The Matriarch trades the straight volley for a delayed area barrage and
      // routes through an extra `launch` beat before recovering.
      if (input.isMatriarch) {
        return {
          state: {
            ...state,
            phase: "launch",
            phaseRemainingSeconds: QUILLBACK_LAUNCH_SECONDS,
            attackCount: state.attackCount + 1,
          },
          movement: NO_MOVEMENT,
          readyToWindup: false,
          release: "rain-of-spines",
        };
      }
      return {
        state: {
          ...state,
          phase: "recover",
          phaseRemainingSeconds: volleyRecoverySeconds(state.shotCount),
          attackCount: state.attackCount + 1,
        },
        movement: NO_MOVEMENT,
        readyToWindup: false,
        release: "volley",
      };
    }

    case "launch":
      return quiet(
        expired
          ? { ...state, phase: "recover", phaseRemainingSeconds: QUILLBACK_RAIN_RECOVER_SECONDS }
          : { ...state, phaseRemainingSeconds },
      );

    case "recover":
      return quiet(
        expired
          ? { ...state, phase: "positioning", phaseRemainingSeconds: QUILLBACK_POSITION_SECONDS }
          : { ...state, phaseRemainingSeconds },
      );
  }
}

/** Bigger volleys leave a proportionally longer punish window. */
export function volleyRecoverySeconds(shotCount: QuillbackShotCount): number {
  if (shotCount === 1) return 1.15;
  return shotCount === 3 ? 1.45 : 1.75;
}

export interface QuillbackWindup {
  readonly state: QuillbackState;
  readonly direction: Vector2Data;
}

/** Call only once the shared ranged budgets allow the full volley. */
export function commitQuillbackWindup(
  state: QuillbackState,
  position: Vector2Data,
  playerPosition: Vector2Data,
  shotCount: QuillbackShotCount,
): QuillbackWindup {
  const direction = normalizeVector({
    x: playerPosition.x - position.x,
    y: playerPosition.y - position.y,
  });
  return {
    state: {
      ...state,
      phase: "windup",
      shotCount,
      phaseRemainingSeconds:
        QUILLBACK_BASE_WINDUP_SECONDS
        + (shotCount - 1) * QUILLBACK_WINDUP_PER_EXTRA_SHOT_SECONDS,
      direction,
    },
    direction,
  };
}

function quiet(state: QuillbackState): QuillbackStepResult {
  return { state, movement: NO_MOVEMENT, readyToWindup: false, release: null };
}
