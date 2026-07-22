import { describe, expect, it } from "vitest";
import { normalizeTransformationAffinityState, transformationProgress } from "./TransformationAffinity";
import {
  COMMITMENT_DECISION_HOLD_MS,
  PURGE_DECISION_HOLD_MS,
  advanceTransformationDecision,
  beginTransformationChoice,
  beginTransformationPurge,
  cancelTransformationDecision,
  createTransformationDecisionState,
} from "./TransformationDecision";

const exposedCyber = () => createTransformationDecisionState(normalizeTransformationAffinityState({
  paths: [{ pathId: "cybernetic-ascension", choiceIds: ["targeting-suite", "shield-lattice"] }],
}));

describe("transformation decision safety gate", () => {
  it("requires the long warning hold for the third aligned choice", () => {
    const begun = beginTransformationChoice(exposedCyber(), "cybernetic-ascension", "auxiliary-drone");
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    expect(begun.state.pending?.warning).toBe("commitment");
    expect(begun.state.pending?.holdRequiredMs).toBe(COMMITMENT_DECISION_HOLD_MS);

    const early = advanceTransformationDecision(begun.state, true, COMMITMENT_DECISION_HOLD_MS - 1);
    expect(early.affinity.committedPathId).toBeNull();
    const committed = advanceTransformationDecision(early, true, 1);
    expect(committed.affinity.committedPathId).toBe("cybernetic-ascension");
    expect(committed.notice).toBe("PATH COMMITTED FOR THIS RUN");
  });

  it("resets hold progress when confirmation is released", () => {
    const begun = beginTransformationChoice(exposedCyber(), "cybernetic-ascension", "auxiliary-drone");
    if (!begun.ok) throw new Error("expected a valid choice");
    const partial = advanceTransformationDecision(begun.state, true, 600);
    expect(partial.pending?.holdElapsedMs).toBe(600);
    expect(advanceTransformationDecision(partial, false, 16).pending?.holdElapsedMs).toBe(0);
  });

  it("cancellation never mutates Affinity", () => {
    const initial = exposedCyber();
    const begun = beginTransformationChoice(initial, "cybernetic-ascension", "auxiliary-drone");
    if (!begun.ok) throw new Error("expected a valid choice");
    const cancelled = cancelTransformationDecision(begun.state);
    expect(cancelled.affinity).toBe(initial.affinity);
    expect(cancelled.pending).toBeNull();
  });

  it("purges reversible exposure only after its own hold", () => {
    const begun = beginTransformationPurge(exposedCyber(), "cybernetic-ascension");
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    expect(begun.state.pending?.holdRequiredMs).toBe(PURGE_DECISION_HOLD_MS);
    const purged = advanceTransformationDecision(begun.state, true, PURGE_DECISION_HOLD_MS);
    expect(transformationProgress(purged.affinity, "cybernetic-ascension")).toBeNull();
  });

  it("refuses purge after commitment", () => {
    const committed = createTransformationDecisionState(normalizeTransformationAffinityState({
      committedPathId: "cybernetic-ascension",
      paths: [{ pathId: "cybernetic-ascension", choiceIds: ["targeting-suite", "shield-lattice", "auxiliary-drone"] }],
    }));
    const result = beginTransformationPurge(committed, "cybernetic-ascension");
    expect(result.ok).toBe(false);
    expect(result.state.notice).toBe("COMMITTED PATH CANNOT BE PURGED");
  });
});
