import { describe, expect, it } from "vitest";
import { applyTransformationChoice, createTransformationAffinityState } from "./TransformationAffinity";
import { createTransformationCodexSnapshot } from "./TransformationSnapshot";

describe("Transformation Codex snapshot", () => {
  it("resolves path names, stages, commitment, and repeated-choice ranks", () => {
    let state = createTransformationAffinityState();
    for (const choice of ["targeting-suite", "targeting-suite", "shield-lattice"] as const) {
      const result = applyTransformationChoice(state, "cybernetic-ascension", choice);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    const snapshot = createTransformationCodexSnapshot(state);
    expect(snapshot.committedPathId).toBe("cybernetic-ascension");
    expect(snapshot.paths[0]).toMatchObject({
      name: "Cybernetic Ascension",
      affinity: 3,
      stage: "transformed",
      committed: true,
    });
    expect(snapshot.paths[0]?.choices).toEqual([
      { id: "targeting-suite", name: "Targeting Suite", rank: 2 },
      { id: "shield-lattice", name: "Shield Lattice", rank: 1 },
    ]);
  });

  it("returns an empty stable snapshot for an untransformed build", () => {
    expect(createTransformationCodexSnapshot(null)).toEqual({ committedPathId: null, paths: [] });
  });
});

