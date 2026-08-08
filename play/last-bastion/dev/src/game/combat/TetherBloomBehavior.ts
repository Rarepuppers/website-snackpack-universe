import type { Vector2Data } from "../math/Vector2Data";

export const TETHER_BLOOM_ACQUISITION_RANGE_METRES = 3.5;
export const TETHER_BLOOM_HARD_RANGE_METRES = 5;
export const TETHER_BLOOM_BREAK_DAMAGE = 6;
export const TETHER_BLOOM_WINDUP_SECONDS = 0.7;
export const TETHER_BLOOM_DURATION_SECONDS = 1.8;
export const TETHER_BLOOM_PULL_SPEED_METRES_PER_SECOND = 1.15;
export const TETHER_BLOOM_RECOVERY_SECONDS = 3.2;
export const TETHER_BLOOM_IDLE_SECONDS = 0.6;

export type TetherBloomPhase = "idle" | "windup" | "tethering" | "recovery";
export type TetherBloomBreakReason = "evasive" | "damage" | "range";
export type TetherBloomEvent =
  | "windup"
  | "latched"
  | "released"
  | "ownership-lost"
  | `broken-${TetherBloomBreakReason}`
  | null;

export interface TetherBloomState {
  readonly phase: TetherBloomPhase;
  readonly phaseRemainingSeconds: number;
  readonly target: Vector2Data;
  readonly damageDuringGrab: number;
}

export interface TetherBloomStepInput {
  readonly deltaSeconds: number;
  readonly playerPosition: Vector2Data;
  readonly playerDistanceMetres: number;
  readonly hasClearPath: boolean;
  readonly heroEvading: boolean;
  readonly tetherAvailable: boolean;
  readonly ownsTether: boolean;
  readonly minimumPullDistanceMetres: number;
}

export interface TetherBloomStepResult {
  readonly state: TetherBloomState;
  readonly event: TetherBloomEvent;
  readonly claimTether: boolean;
  readonly releaseTether: boolean;
  /** The caller resolves this distance through player/arena collision. */
  readonly pullDistanceMetres: number;
}

export function stepTetherBloomBehavior(
  state: TetherBloomState,
  input: TetherBloomStepInput,
): TetherBloomStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const advanced = { ...state, phaseRemainingSeconds };

  switch (state.phase) {
    case "idle": {
      const acquires = phaseRemainingSeconds <= 0
        && input.tetherAvailable
        && input.playerDistanceMetres <= TETHER_BLOOM_ACQUISITION_RANGE_METRES
        && input.hasClearPath;
      return acquires
        ? {
            state: {
              ...advanced,
              phase: "windup",
              phaseRemainingSeconds: TETHER_BLOOM_WINDUP_SECONDS,
              target: { ...input.playerPosition },
            },
            event: "windup",
            claimTether: true,
            releaseTether: false,
            pullDistanceMetres: 0,
          }
        : unchanged(advanced);
    }

    case "windup":
      if (input.heroEvading) return breakTetherBloomBehavior(advanced, "evasive", input.ownsTether);
      if (input.playerDistanceMetres > TETHER_BLOOM_HARD_RANGE_METRES || !input.hasClearPath) {
        return breakTetherBloomBehavior(advanced, "range", input.ownsTether);
      }
      return phaseRemainingSeconds <= 0
        ? {
            state: {
              ...advanced,
              phase: "tethering",
              phaseRemainingSeconds: TETHER_BLOOM_DURATION_SECONDS,
              damageDuringGrab: 0,
            },
            event: "latched",
            claimTether: false,
            releaseTether: false,
            pullDistanceMetres: 0,
          }
        : unchanged(advanced);

    case "tethering": {
      if (!input.ownsTether) {
        return {
          state: enterRecovery(advanced),
          event: "ownership-lost",
          claimTether: false,
          releaseTether: false,
          pullDistanceMetres: 0,
        };
      }
      if (input.heroEvading) return breakTetherBloomBehavior(advanced, "evasive", true);
      if (input.playerDistanceMetres > TETHER_BLOOM_HARD_RANGE_METRES || !input.hasClearPath) {
        return breakTetherBloomBehavior(advanced, "range", true);
      }

      // Pull still resolves on the final tether tick before release. This order
      // is part of the existing simulation contract and must not be reversed.
      const pullDistanceMetres = Math.min(
        TETHER_BLOOM_PULL_SPEED_METRES_PER_SECOND * input.deltaSeconds,
        Math.max(0, input.playerDistanceMetres - input.minimumPullDistanceMetres),
      );
      return phaseRemainingSeconds <= 0
        ? {
            state: enterRecovery(advanced),
            event: "released",
            claimTether: false,
            releaseTether: true,
            pullDistanceMetres,
          }
        : { ...unchanged(advanced), pullDistanceMetres };
    }

    case "recovery":
      return phaseRemainingSeconds <= 0
        ? {
            ...unchanged({
              ...advanced,
              phase: "idle",
              phaseRemainingSeconds: TETHER_BLOOM_IDLE_SECONDS,
            }),
          }
        : unchanged(advanced);
  }
}

export function applyTetherBloomDamage(
  state: TetherBloomState,
  damage: number,
  ownsTether: boolean,
): TetherBloomStepResult {
  if (state.phase !== "tethering") return unchanged(state);
  const damaged = {
    ...state,
    damageDuringGrab: state.damageDuringGrab + damage,
  };
  return damaged.damageDuringGrab >= TETHER_BLOOM_BREAK_DAMAGE
    ? breakTetherBloomBehavior(damaged, "damage", ownsTether)
    : unchanged(damaged);
}

function breakTetherBloomBehavior(
  state: TetherBloomState,
  reason: TetherBloomBreakReason,
  ownsTether: boolean,
): TetherBloomStepResult {
  return {
    state: enterRecovery(state),
    event: `broken-${reason}`,
    claimTether: false,
    releaseTether: ownsTether,
    pullDistanceMetres: 0,
  };
}

function enterRecovery(state: TetherBloomState): TetherBloomState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: TETHER_BLOOM_RECOVERY_SECONDS,
  };
}

function unchanged(state: TetherBloomState): TetherBloomStepResult {
  return {
    state,
    event: null,
    claimTether: false,
    releaseTether: false,
    pullDistanceMetres: 0,
  };
}
