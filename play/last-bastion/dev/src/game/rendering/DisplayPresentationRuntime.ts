import type { DisplayPresentationPlan } from "./DisplayPresentation";

type PresentationApplier = (plan: DisplayPresentationPlan) => void;

let currentPlan: DisplayPresentationPlan | null = null;
let applier: PresentationApplier | null = null;

/** Publishes window-derived presentation changes without coupling main.ts to a Scene. */
export function publishDisplayPresentation(plan: DisplayPresentationPlan): void {
  currentPlan = plan;
  applier?.(plan);
}

/**
 * Combat registers after Scene.create(), preserving the 960x540 coordinate
 * contract during construction. Registration immediately receives the latest
 * plan so the backing store can then move to its physical render dimensions.
 */
export function registerDisplayPresentationApplier(next: PresentationApplier | null): void {
  applier = next;
  if (next && currentPlan) next(currentPlan);
}

