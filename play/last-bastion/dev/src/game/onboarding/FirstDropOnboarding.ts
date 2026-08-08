export type FirstDropGoal = "move" | "evade" | "damage" | "wave";

export interface FirstDropOnboardingState {
  completed: Readonly<Record<FirstDropGoal, boolean>>;
}

export interface FirstDropSignals {
  moved: boolean;
  evaded: boolean;
  dealtDamage: boolean;
  clearedWave: boolean;
}

export const FIRST_DROP_GOALS: readonly FirstDropGoal[] = Object.freeze([
  "move", "evade", "damage", "wave",
]);

export function createFirstDropOnboarding(): FirstDropOnboardingState {
  return { completed: { move: false, evade: false, damage: false, wave: false } };
}

/** Goals accumulate out of order so guidance never asks a player to repeat mastery. */
export function advanceFirstDropOnboarding(
  state: FirstDropOnboardingState,
  signals: FirstDropSignals,
): FirstDropOnboardingState {
  return {
    completed: {
      move: state.completed.move || signals.moved,
      evade: state.completed.evade || signals.evaded,
      damage: state.completed.damage || signals.dealtDamage,
      wave: state.completed.wave || signals.clearedWave,
    },
  };
}

export function firstIncompleteDropGoal(state: FirstDropOnboardingState): FirstDropGoal | null {
  return FIRST_DROP_GOALS.find((goal) => !state.completed[goal]) ?? null;
}

export function completedFirstDropGoalCount(state: FirstDropOnboardingState): number {
  return FIRST_DROP_GOALS.filter((goal) => state.completed[goal]).length;
}

export function shouldShowFirstDropOnboarding(
  runsFinished: number,
  reviewOverride: boolean,
  isReviewRoute: boolean,
): boolean {
  return !isReviewRoute && (runsFinished === 0 || reviewOverride);
}
