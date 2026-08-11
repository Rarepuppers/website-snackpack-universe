export interface SupplyDepotDecisionOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface SupplyDepotDecisionPresentation {
  readonly kind: "supply-depot";
  readonly title: string;
  readonly options: readonly SupplyDepotDecisionOption[];
}

export function presentSupplyDepotDecision(input: {
  readonly healAmount: number;
  readonly shieldAmount: number;
}): SupplyDepotDecisionPresentation {
  return {
    kind: "supply-depot",
    title: "SUPPLY DEPOT — CHOOSE ONE",
    options: [
      { id: "patch-up", name: "Patch Up", description: `Restore ${input.healAmount} health.` },
      { id: "field-armoury", name: "Field Armoury", description: "Choose one upgrade immediately." },
      {
        id: "aegis-lattice",
        name: "Aegis Lattice",
        description: `Gain a ${input.shieldAmount}-point shield that absorbs damage before health.`,
      },
    ],
  };
}

export type SupplyDepotChoicePlan =
  | { readonly kind: "heal"; readonly amount: number }
  | { readonly kind: "open-armoury" }
  | { readonly kind: "shield"; readonly amount: number }
  | { readonly kind: "none" };

export function planSupplyDepotChoice(input: {
  readonly optionId: string;
  readonly armouryAvailable: boolean;
  readonly effectiveHealAmount: number;
  readonly effectiveShieldAmount: number;
}): SupplyDepotChoicePlan {
  if (input.optionId === "patch-up") return { kind: "heal", amount: input.effectiveHealAmount };
  if (input.optionId === "field-armoury") {
    return input.armouryAvailable
      ? { kind: "open-armoury" }
      : { kind: "heal", amount: input.effectiveHealAmount };
  }
  if (input.optionId === "aegis-lattice") return { kind: "shield", amount: input.effectiveShieldAmount };
  return { kind: "none" };
}
