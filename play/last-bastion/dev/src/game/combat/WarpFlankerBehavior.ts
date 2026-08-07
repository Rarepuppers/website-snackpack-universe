import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { NO_MOVEMENT, towardPlayer, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const WARP_FLANKER_STALK_SECONDS = 2.2;
export const WARP_FLANKER_WINDUP_SECONDS = 0.7;
export const WARP_FLANKER_MATERIALIZE_SECONDS = 0.35;
export const WARP_FLANKER_RETRY_SECONDS = 1;
/** Closer than this and warping away would just hand the player a free reset. */
export const WARP_FLANKER_MINIMUM_WARP_RANGE_METRES = 3;

export type WarpFlankerPhase = "stalk" | "warp-windup" | "materialize";

export interface WarpFlankerState {
  readonly phase: WarpFlankerPhase;
  readonly phaseRemainingSeconds: number;
  readonly warpTarget: Vector2Data;
}

export interface WarpFlankerStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly stalkSpeedMetresPerSecond: number;
}

export interface WarpFlankerStepResult {
  readonly state: WarpFlankerState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  /** Set on the windup -> materialize transition; the caller moves the body. */
  readonly teleportTo: Vector2Data | null;
  readonly emitArrival: boolean;
}

export function stepWarpFlankerBehavior(
  state: WarpFlankerState,
  input: WarpFlankerStepInput,
): WarpFlankerStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;

  if (state.phase === "stalk") {
    // The stalk -> warp-windup transition depends on the post-movement
    // distance, so it lives in resolveWarpFlankerAfterMovement.
    return {
      state: { ...state, phaseRemainingSeconds },
      movement: towardPlayer(input.stalkSpeedMetresPerSecond),
      facingDirection: normalizeVector({
        x: input.playerPosition.x - input.position.x,
        y: input.playerPosition.y - input.position.y,
      }),
      teleportTo: null,
      emitArrival: false,
    };
  }

  if (state.phase === "warp-windup") {
    if (!expired) {
      return blocked({ ...state, phaseRemainingSeconds });
    }
    return {
      state: {
        ...state,
        phase: "materialize",
        phaseRemainingSeconds: WARP_FLANKER_MATERIALIZE_SECONDS,
      },
      movement: NO_MOVEMENT,
      facingDirection: null,
      teleportTo: { ...state.warpTarget },
      emitArrival: true,
    };
  }

  return blocked(
    expired
      ? { ...state, phase: "stalk", phaseRemainingSeconds: WARP_FLANKER_STALK_SECONDS }
      : { ...state, phaseRemainingSeconds },
  );
}

/**
 * Call with the post-movement position. Only the stalk phase resolves here.
 * `pickWarpTarget` is invoked at most once and only when the warp actually
 * commits — it consumes shared RNG, so calling it speculatively would desync
 * every later draw.
 */
export function resolveWarpFlankerAfterMovement(
  state: WarpFlankerState,
  position: Vector2Data,
  playerPosition: Vector2Data,
  pickWarpTarget: () => Vector2Data,
): WarpFlankerState {
  if (state.phase !== "stalk" || state.phaseRemainingSeconds > 0) return state;
  if (distance(position, playerPosition) <= WARP_FLANKER_MINIMUM_WARP_RANGE_METRES) {
    return { ...state, phaseRemainingSeconds: WARP_FLANKER_RETRY_SECONDS };
  }
  return {
    phase: "warp-windup",
    phaseRemainingSeconds: WARP_FLANKER_WINDUP_SECONDS,
    warpTarget: pickWarpTarget(),
  };
}

function blocked(state: WarpFlankerState): WarpFlankerStepResult {
  return {
    state,
    movement: NO_MOVEMENT,
    facingDirection: null,
    teleportTo: null,
    emitArrival: false,
  };
}
