/**
 * Broodbreaker Seal: the egg is held through one final crack window instead of
 * hatching, giving the player a bounded chance to destroy it. One stall per
 * egg, so it delays the hatch rather than preventing it forever.
 */
export const BROODBREAKER_CRACK_SECONDS = 1.2;

export interface EggClusterState {
  readonly hatchRemainingSeconds: number;
  readonly broodbreakerStalled: boolean;
}

export interface EggClusterStepInput {
  readonly deltaSeconds: number;
  readonly preventHatchDuringCrack: boolean;
}

export interface EggClusterStepResult {
  readonly state: EggClusterState;
  /** The simulation owns the hatch itself: the corpse, the event, the spawns. */
  readonly hatches: boolean;
}

export function stepEggClusterBehavior(
  state: EggClusterState,
  input: EggClusterStepInput,
): EggClusterStepResult {
  const hatchRemainingSeconds = state.hatchRemainingSeconds - input.deltaSeconds;

  if (hatchRemainingSeconds <= 0 && input.preventHatchDuringCrack && !state.broodbreakerStalled) {
    return {
      state: { hatchRemainingSeconds: BROODBREAKER_CRACK_SECONDS, broodbreakerStalled: true },
      hatches: false,
    };
  }

  return {
    state: { ...state, hatchRemainingSeconds },
    hatches: hatchRemainingSeconds <= 0,
  };
}
