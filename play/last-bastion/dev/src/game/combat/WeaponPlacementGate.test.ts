import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";

describe("weapon placement behavior gate", () => {
  it("uses the portable placement contract through the combat decision surface", () => {
    const simulation = new CombatSimulation({ scenario: "weapon-gate", startingWeaponIds: ["bastion-service-rifle"] });
    const initial = simulation.snapshot();
    expect(initial.pendingDecision?.kind).toBe("weapon-placement");
    expect(initial.weaponInventory.rack.find((slot) => slot.weaponClass === "medium")?.tile?.weaponId)
      .toBe("bastion-service-rifle");
    const equip = initial.pendingDecision!.options.find((option) => option.id === "place:rack:rack-3");
    expect(equip).toBeDefined();
    expect(simulation.chooseOption(equip!.id)).toBe(true);
    expect(simulation.snapshot().pendingDecision).toBeNull();
    expect(simulation.snapshot().equippedWeapons.map((weapon) => weapon.weaponId))
      .toEqual(["bastion-service-rifle", "scattergun"]);
  });
});
