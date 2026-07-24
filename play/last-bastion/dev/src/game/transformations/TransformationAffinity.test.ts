import { describe, expect, it } from "vitest";
import {
  applyTransformationChoice,
  createTransformationAffinityState,
  purgeTransformationPath,
  normalizeTransformationAffinityState,
  transformationProgress,
  transformationStage,
} from "./TransformationAffinity";
import { TRANSFORMATION_PATH_CATALOG, transformationPathById } from "./TransformationPathCatalog";

describe("Transformation Affinity", () => {
  it("keeps the active catalog to the seven approved paths (24 July 2026: Church of the Designed Arrival joined the six)", () => {
    expect(TRANSFORMATION_PATH_CATALOG.map(({ id }) => id)).toEqual([
      "mutagenic-evolution",
      "alien-symbiosis",
      "cybernetic-ascension",
      "void-initiation",
      "bastion-super-soldier",
      "psionic-operative",
      "cultist-doctrine",
    ]);
    expect(transformationPathById("psionic-operative").branches).toContain("Telekinetic");
    expect(transformationPathById("cultist-doctrine").branches).toContain("Zealot");
  });

  it("moves through exposure and adaptation without committing", () => {
    const initial = createTransformationAffinityState();
    const exposed = applyTransformationChoice(initial, "cybernetic-ascension", "targeting-suite");
    expect(exposed).toMatchObject({ ok: true, stage: "exposed", committedNow: false });
    if (!exposed.ok) throw new Error("expected first exposure");
    const adapted = applyTransformationChoice(exposed.state, "cybernetic-ascension", "shield-lattice");
    expect(adapted).toMatchObject({ ok: true, previousStage: "exposed", stage: "adapted", committedNow: false });
    if (!adapted.ok) throw new Error("expected adaptation");
    expect(adapted.state.committedPathId).toBeNull();
  });

  it("commits whichever family reaches three Affinity first and retains minor scars", () => {
    let state = createTransformationAffinityState();
    for (const [pathId, choice] of [
      ["mutagenic-evolution", "dense-tissue"],
      ["mutagenic-evolution", "reactive-blood"],
      ["psionic-operative", "psionic-sniper"],
      ["psionic-operative", "telekinetic-focus"],
    ] as const) {
      const result = applyTransformationChoice(state, pathId, choice);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    const committed = applyTransformationChoice(state, "psionic-operative", "battle-seer");
    expect(committed).toMatchObject({ ok: true, committedNow: true, stage: "transformed" });
    if (!committed.ok) throw new Error("expected commitment");
    expect(committed.state.committedPathId).toBe("psionic-operative");
    expect(transformationProgress(committed.state, "mutagenic-evolution")?.affinity).toBe(2);
    expect(applyTransformationChoice(committed.state, "mutagenic-evolution", "regenerative-glands"))
      .toMatchObject({ ok: false, reason: "path-locked" });
  });

  it("allows repeated aligned perk levels to build Affinity", () => {
    let state = createTransformationAffinityState();
    for (let level = 0; level < 3; level += 1) {
      const result = applyTransformationChoice(state, "bastion-super-soldier", "heavy-gunner");
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    expect(state.committedPathId).toBe("bastion-super-soldier");
    expect(transformationProgress(state, "bastion-super-soldier")?.choiceIds)
      .toEqual(["heavy-gunner", "heavy-gunner", "heavy-gunner"]);
  });

  it("reaches Ascended at five and Apex at seven, then refuses overflow", () => {
    let state = createTransformationAffinityState();
    const choices = ["acidic-secretions", "acidic-secretions", "acidic-secretions", "feeding-tendrils", "feeding-tendrils", "symbiotic-carapace", "symbiotic-carapace"] as const;
    for (let affinity = 1; affinity <= 7; affinity += 1) {
      const result = applyTransformationChoice(state, "alien-symbiosis", choices[affinity - 1]!);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
      expect(result.stage).toBe(transformationStage(affinity));
    }
    expect(transformationStage(5)).toBe("ascended");
    expect(transformationStage(7)).toBe("apex");
    expect(applyTransformationChoice(state, "alien-symbiosis", "symbiotic-carapace"))
      .toMatchObject({ ok: false, reason: "apex-reached" });
  });

  it("purges uncommitted exposure but never a committed path", () => {
    const exposed = applyTransformationChoice(createTransformationAffinityState(), "void-initiation", "rift-step");
    if (!exposed.ok) throw new Error("expected exposure");
    const purged = purgeTransformationPath(exposed.state, "void-initiation");
    expect(purged).toMatchObject({ ok: true, removedAffinity: 1 });
    if (!purged.ok) throw new Error("expected purge");
    expect(transformationProgress(purged.state, "void-initiation")).toBeNull();

    let committedState = createTransformationAffinityState();
    for (let index = 0; index < 3; index += 1) {
      const result = applyTransformationChoice(committedState, "void-initiation", "rift-step");
      if (!result.ok) throw new Error(result.reason);
      committedState = result.state;
    }
    expect(purgeTransformationPath(committedState, "void-initiation"))
      .toMatchObject({ ok: false, reason: "committed-path" });
  });

  it("rejects empty choice identifiers without mutating state", () => {
    const state = createTransformationAffinityState();
    const result = applyTransformationChoice(state, "mutagenic-evolution", "   ");
    expect(result).toMatchObject({ ok: false, reason: "invalid-choice", state });
  });

  it("sanitizes malformed storage and derives Affinity from valid choices", () => {
    const normalized = normalizeTransformationAffinityState({
      committedPathId: "cybernetic-ascension",
      paths: [
        { pathId: "cybernetic-ascension", affinity: 99, choiceIds: ["targeting-suite", "targeting-suite", "targeting-suite", "targeting-suite", "dense-tissue", "shield-lattice"] },
        { pathId: "void-initiation", affinity: 99, choiceIds: ["rift-step", "rift-step", "rift-step"] },
        { pathId: "church", choiceIds: ["zealot"] },
      ],
    });
    expect(normalized.committedPathId).toBe("cybernetic-ascension");
    expect(transformationProgress(normalized, "cybernetic-ascension")).toMatchObject({ affinity: 4 });
    expect(transformationProgress(normalized, "void-initiation")).toMatchObject({ affinity: 2 });
    expect(normalized.paths).toHaveLength(2);
  });
});
