import type { UpgradeCategory } from "../content/upgradeCatalog";

export interface SlotRequisitionDecision {
  readonly kind: "slot-requisition";
  readonly title: string;
  readonly options: readonly {
    readonly id: string;
    readonly name: string;
    readonly description: string;
  }[];
}

export function slotRequisitionRollCount(categoryCount: number, maxOptions = 3): number {
  return Math.max(0, categoryCount - maxOptions);
}

/** Builds the requisition decision from adapter-consumed unit rolls. */
export function planSlotRequisitionDecision(input: {
  readonly capacities: Readonly<Record<UpgradeCategory, number>>;
  readonly used: Readonly<Record<UpgradeCategory, number>>;
  readonly labels: Readonly<Record<UpgradeCategory, string>>;
  readonly hardCap: number;
  readonly randomUnits: readonly number[];
  readonly maxOptions?: number;
}): SlotRequisitionDecision | null {
  const totalCapacity = Object.values(input.capacities).reduce((sum, capacity) => sum + capacity, 0);
  if (totalCapacity >= input.hardCap) return null;
  const categories = Object.keys(input.capacities) as UpgradeCategory[];
  const options = categories.map((category) => ({
    id: `slot-${category}`,
    name: `${input.labels[category]} Slot`,
    description: `Unlock one more ${input.labels[category]} upgrade slot `
      + `(now ${input.used[category]}/${input.capacities[category]}).`,
  }));
  const maxOptions = input.maxOptions ?? 3;
  let rollIndex = 0;
  while (options.length > maxOptions && rollIndex < input.randomUnits.length) {
    const dropIndex = Math.min(Math.floor(input.randomUnits[rollIndex]! * options.length), options.length - 1);
    options.splice(dropIndex, 1);
    rollIndex += 1;
  }
  return { kind: "slot-requisition", title: "REQUISITION — UNLOCK AN UPGRADE SLOT", options };
}

export type SlotRequisitionChoicePlan =
  | { readonly ok: false }
  | { readonly ok: true; readonly category: UpgradeCategory; readonly nextCapacity: number };

export function planSlotRequisitionChoice(input: {
  readonly optionId: string;
  readonly capacities: Readonly<Record<UpgradeCategory, number>>;
  readonly hardCap: number;
}): SlotRequisitionChoicePlan {
  const category = input.optionId.replace("slot-", "") as UpgradeCategory;
  const totalCapacity = Object.values(input.capacities).reduce((sum, capacity) => sum + capacity, 0);
  if (!(category in input.capacities) || totalCapacity >= input.hardCap) return { ok: false };
  return { ok: true, category, nextCapacity: input.capacities[category] + 1 };
}
