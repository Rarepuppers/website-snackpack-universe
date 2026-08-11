import { describe, expect, it } from "vitest";
import { planSupplyDepotChoice, presentSupplyDepotDecision } from "./SupplyDepot";

describe("presentSupplyDepotDecision", () => {
  it("presents the three authored rewards in stable order", () => {
    const decision = presentSupplyDepotDecision({ healAmount: 4.5, shieldAmount: 2.5 });
    expect(decision).toEqual({
      kind: "supply-depot",
      title: "SUPPLY DEPOT — CHOOSE ONE",
      options: [
        { id: "patch-up", name: "Patch Up", description: "Restore 4.5 health." },
        { id: "field-armoury", name: "Field Armoury", description: "Choose one upgrade immediately." },
        {
          id: "aegis-lattice",
          name: "Aegis Lattice",
          description: "Gain a 2.5-point shield that absorbs damage before health.",
        },
      ],
    });
  });
});

describe("planSupplyDepotChoice", () => {
  it("plans scaled healing and shielding", () => {
    const common = { armouryAvailable: false, effectiveHealAmount: 6.75, effectiveShieldAmount: 3.75 };
    expect(planSupplyDepotChoice({ ...common, optionId: "patch-up" })).toEqual({ kind: "heal", amount: 6.75 });
    expect(planSupplyDepotChoice({ ...common, optionId: "aegis-lattice" })).toEqual({ kind: "shield", amount: 3.75 });
  });

  it("opens an available armoury and falls back to healing when exhausted", () => {
    const common = { optionId: "field-armoury", effectiveHealAmount: 6, effectiveShieldAmount: 3 };
    expect(planSupplyDepotChoice({ ...common, armouryAvailable: true })).toEqual({ kind: "open-armoury" });
    expect(planSupplyDepotChoice({ ...common, armouryAvailable: false })).toEqual({ kind: "heal", amount: 6 });
  });

  it("ignores unknown choices", () => {
    expect(planSupplyDepotChoice({
      optionId: "missing",
      armouryAvailable: true,
      effectiveHealAmount: 6,
      effectiveShieldAmount: 3,
    })).toEqual({ kind: "none" });
  });
});
