import { describe, expect, it } from "vitest";
import { selectAlliedTurretTarget, stepElectricTrap, stepGateInteraction } from "./EncounterObjectiveSystems";

describe("encounter objective systems", () => {
  it("opens a gate only after a held 0.75s interaction and never closes", () => {
    let state = { open: false, progressSeconds: 0 };
    state = stepGateInteraction(state, true, true, 0.5);
    expect(state.open).toBe(false);
    state = stepGateInteraction(state, true, true, 0.25);
    expect(state.open).toBe(true);
    expect(stepGateInteraction(state, false, false, 1)).toEqual(state);
  });
  it("selects the nearest visible turret target with id tie-break", () => {
    expect(selectAlliedTurretTarget([{ id: 4, distanceMetres: 5, visible: true }, { id: 2, distanceMetres: 5, visible: true }, { id: 1, distanceMetres: 2, visible: false }])?.id).toBe(2);
  });
  it("telegraphs before activating a single-use electric trap", () => {
    let state = stepElectricTrap({ phase: "ready", remainingSeconds: 0, tickRemainingSeconds: 0 }, true, 0);
    expect(state.phase).toBe("telegraph");
    state = stepElectricTrap(state, false, 0.75);
    expect(state.phase).toBe("active");
    state = stepElectricTrap(state, true, 6);
    expect(state.phase).toBe("spent");
  });
});
