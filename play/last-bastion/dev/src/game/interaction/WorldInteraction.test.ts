import { describe, expect, it } from "vitest";
import { chooseWorldInteractionCandidate, stepWorldInteraction, type WorldInteractionDefinition, type WorldInteractionState } from "./WorldInteraction";

const definition: WorldInteractionDefinition = { id: "console", requiredSeconds: 1, repeatable: false, cooldownSeconds: 0, promptVerb: "Activate" };
const state = (overrides: Partial<WorldInteractionState> = {}): WorldInteractionState => ({ objectId: "a", definitionId: "console", phase: "available", progressSeconds: 0, requiredSeconds: 1, cooldownRemainingSeconds: 0, completionCount: 0, ...overrides });
const step = (overrides: Partial<Parameters<typeof stepWorldInteraction>[0]> = {}) => stepWorldInteraction({ state: state(), definition, distanceMetres: 1, footprintMetres: 1, interactHeld: true, interactPressed: true, deltaSeconds: 0.5, ...overrides });

describe("WorldInteraction", () => {
  it("starts, holds, completes once, and is idempotent", () => {
    expect(step().state.phase).toBe("holding");
    const result = step({ deltaSeconds: 1 });
    expect(result.completion?.type).toBe("complete");
    expect(stepWorldInteraction({ state: result.state, definition, distanceMetres: 1, footprintMetres: 1, interactHeld: true, interactPressed: true, deltaSeconds: 1 }).completion).toBeNull();
  });
  it("cancels on release, movement, and health damage, but not shield damage by default", () => {
    expect(step({ interactHeld: false, interactPressed: false }).state.progressSeconds).toBe(0);
    expect(step({ distanceMetres: 4 }).state.progressSeconds).toBe(0);
    expect(step({ interruptedByDamage: true }).state.progressSeconds).toBe(0);
    expect(step({ interruptedByShieldDamage: true }).state.phase).toBe("holding");
  });
  it("pauses, handles zero duration, destruction, cooldown, and stable candidate ties", () => {
    expect(step({ paused: true }).state.progressSeconds).toBe(0);
    expect(step({ definition: { ...definition, requiredSeconds: 0 }, deltaSeconds: 0 }).completion).toEqual({ type: "complete", objectId: "a", definitionId: "console" });
    expect(step({ destroyed: true }).state.phase).toBe("disabled");
    const repeat = step({ definition: { ...definition, repeatable: true, cooldownSeconds: 2 }, deltaSeconds: 1 });
    expect(repeat.state.phase).toBe("cooldown");
    expect(chooseWorldInteractionCandidate([{ objectId: "b", definitionId: "x", distanceMetres: 1, valid: true }, { objectId: "a", definitionId: "x", distanceMetres: 1, valid: true }])?.objectId).toBe("a");
  });
});
