/**
 * How input moves the selection on a combat decision overlay.
 *
 * QA-06's first extraction, and the smallest one worth doing: this is the only
 * part of the decision screen with real branching — skipping disabled options,
 * wrapping, re-arming the gamepad stick, and quick-picking by digit — and until
 * now it lived inside a 5,900-line Phaser scene where none of it could be tested
 * without a renderer.
 *
 * Deliberately pure. It takes the current selection and a description of what
 * was pressed, and returns the next selection. It never touches Phaser, never
 * reads scene state, and never applies the choice: the caller owns mutation, so
 * the boundary the plan asks for ("keep mutation authority explicit") is the
 * function signature itself.
 *
 * Mirrors `ui/DebriefNavigation.ts`, which did the same for the debrief.
 */

export interface DecisionNavigationInput {
  readonly selectedIndex: number;
  /** One entry per option; a disabled option cannot be landed on by stepping. */
  readonly enabled: readonly boolean[];
  /** -1 up, +1 down, 0 none — from the keyboard. */
  readonly keyboardDelta: -1 | 0 | 1;
  /** Vertical stick position, -1..1. */
  readonly stickY: number;
  /** False while the stick is still pushed from the previous step. */
  readonly stickReady: boolean;
  /** Index of a pressed quick-pick digit, or null. */
  readonly digitIndex: number | null;
  readonly confirmPressed: boolean;
}

export interface DecisionNavigationResult {
  readonly selectedIndex: number;
  readonly stickReady: boolean;
  /** True when the caller should apply the selected option this frame. */
  readonly confirm: boolean;
}

/** Below this the stick counts as centred and re-arms. */
const STICK_RELEASE = 0.35;
/** Above this a re-armed stick counts as one step. */
const STICK_ENGAGE = 0.6;

export function stepDecisionNavigation(input: DecisionNavigationInput): DecisionNavigationResult {
  const count = input.enabled.length;
  if (count === 0) {
    return { selectedIndex: input.selectedIndex, stickReady: true, confirm: false };
  }

  let stickReady = input.stickReady;
  let delta: number = input.keyboardDelta;
  if (Math.abs(input.stickY) < STICK_RELEASE) {
    stickReady = true;
  } else if (stickReady && Math.abs(input.stickY) > STICK_ENGAGE) {
    delta += input.stickY > 0 ? 1 : -1;
    stickReady = false;
  }

  let selectedIndex = clampIndex(input.selectedIndex, count);
  if (delta !== 0) {
    // Step until an enabled option is found. Bounded by `count`, so a decision
    // where every option is unaffordable settles rather than spinning; the
    // selection can then rest on a disabled entry, and confirm below refuses it.
    for (let step = 0; step < count; step += 1) {
      selectedIndex = (selectedIndex + delta + count) % count;
      if (input.enabled[selectedIndex]) break;
    }
  }

  // A digit both selects and confirms, which is the point of a quick pick.
  if (input.digitIndex !== null && input.digitIndex >= 0 && input.digitIndex < count) {
    return { selectedIndex: input.digitIndex, stickReady, confirm: input.enabled[input.digitIndex] === true };
  }

  return {
    selectedIndex,
    stickReady,
    confirm: input.confirmPressed && input.enabled[selectedIndex] === true,
  };
}

function clampIndex(index: number, count: number): number {
  if (!Number.isFinite(index)) return 0;
  const floored = Math.floor(index);
  if (floored < 0) return 0;
  return floored >= count ? count - 1 : floored;
}
