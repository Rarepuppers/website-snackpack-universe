/**
 * Fixed-timestep accumulator for game speed (§11.5).
 *
 * The repo has a deterministic replay fixture (`ReplayFixture.ts`,
 * `ReferenceRun.ts`) that the enemy-behaviour-extraction refactors depend on
 * for equivalence proofs. Scaling `deltaSeconds` to implement game speed would
 * change how many integration steps happen per second and therefore change
 * results — determinism, replays, and the equivalence harness all break, and
 * floating-point drift makes those failures intermittent rather than obvious.
 *
 * Instead the simulation always advances in constant `1/60` steps
 * (`REPLAY_FIXED_DELTA_SECONDS` — the same constant the replay fixture uses,
 * so live play and replay share one definition of a "tick"), and the speed
 * multiplier decides *how many steps run per rendered frame*. 2x is two steps
 * per frame, 0.5x is one step every other frame. Non-integer multipliers
 * (1.1x, 1.25x) fall out of the accumulator carrying its remainder.
 *
 * Phaser-free and stateless by design: the caller owns the accumulator value
 * across frames, this module only computes the next one. That keeps it usable
 * from `PrototypeScene.update` without dragging Phaser into a unit test.
 */

export const FIXED_STEP_SECONDS = 1 / 60;

/**
 * Ceiling on steps produced in one call, independent of speed or a stalled
 * frame. Without this, a tab returning from a backgrounded state (a multi-
 * second `deltaSeconds`) or a high speed multiplier could demand hundreds of
 * simulation steps in a single rendered frame and stall the game trying to
 * catch up — a "spiral of death". Five steps is enough to absorb an ordinary
 * hitch at up to 2x speed without visibly falling behind wall-clock time.
 */
export const MAX_STEPS_PER_FRAME = 5;

export interface FixedTimestepPlan {
  /** How many `FIXED_STEP_SECONDS` simulation steps to run this frame. */
  readonly steps: number;
  /** The accumulator value to carry into the next frame. */
  readonly nextAccumulatorSeconds: number;
  /**
   * True when the frame was clamped by `MAX_STEPS_PER_FRAME` — the simulation
   * is intentionally falling behind wall-clock time rather than spiralling.
   * Exposed so a caller could surface it (e.g. in a debug overlay); nothing
   * reads it yet.
   */
  readonly clamped: boolean;
}

/**
 * Advances the accumulator by `deltaSeconds * speedMultiplier` and reports how
 * many fixed steps to run. `deltaSeconds` should already be clamped by the
 * caller against its own frame-time ceiling (`PrototypeScene` clamps to 0.05s)
 * — this function's own `MAX_STEPS_PER_FRAME` ceiling is a second, independent
 * guard against a large multiplier turning even a clamped delta into a stall.
 */
export function planFixedSteps(
  accumulatorSeconds: number,
  deltaSeconds: number,
  speedMultiplier: number,
): FixedTimestepPlan {
  const safeAccumulator = Number.isFinite(accumulatorSeconds) ? Math.max(0, accumulatorSeconds) : 0;
  const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
  const safeMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1;

  let accumulator = safeAccumulator + safeDelta * safeMultiplier;
  let steps = 0;
  while (accumulator >= FIXED_STEP_SECONDS && steps < MAX_STEPS_PER_FRAME) {
    accumulator -= FIXED_STEP_SECONDS;
    steps += 1;
  }
  // On a clamp, drop the unconsumed remainder rather than banking it: banking
  // it would spend the next several frames catching up in a burst, which is
  // the same stall this guard exists to prevent, just deferred by one frame.
  const clamped = steps >= MAX_STEPS_PER_FRAME && accumulator >= FIXED_STEP_SECONDS;
  const nextAccumulatorSeconds = clamped ? 0 : accumulator;
  return { steps, nextAccumulatorSeconds, clamped };
}
