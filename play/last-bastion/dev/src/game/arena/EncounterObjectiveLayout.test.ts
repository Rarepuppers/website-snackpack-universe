import { describe, expect, it } from "vitest";
import { createEncounterObjectiveLayout, objectiveLayoutHasReachableGateSides } from "./EncounterObjectiveLayout";

describe("EncounterObjectiveLayout", () => {
  it("is seeded, reserves the spawn and keeps gate traversal reachable", () => {
    const first = createEncounterObjectiveLayout(45, 25, 77);
    expect(first).toEqual(createEncounterObjectiveLayout(45, 25, 77));
    expect(first.objectives.map((objective) => objective.kind)).toEqual(["gate-button", "gate", "turret-console", "trap-console"]);
    expect(Math.hypot(first.objectives[0]!.position.x - first.playerSpawn.x, first.objectives[0]!.position.y - first.playerSpawn.y)).toBeGreaterThan(first.reservedClearanceMetres);
    expect(objectiveLayoutHasReachableGateSides(first, 45, 25)).toBe(true);
  });
});
