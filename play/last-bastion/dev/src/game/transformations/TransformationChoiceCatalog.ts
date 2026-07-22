import type { TransformationPathId } from "./TransformationPathCatalog";

export type TransformationChoiceId =
  | "regenerative-glands" | "dense-tissue" | "reactive-blood"
  | "acidic-secretions" | "feeding-tendrils" | "symbiotic-carapace"
  | "targeting-suite" | "shield-lattice" | "auxiliary-drone"
  | "rift-step" | "gravity-adept" | "entropy-channeler"
  | "heavy-gunner" | "vanguard-conditioning" | "demolitions-doctrine"
  | "psionic-sniper" | "telekinetic-focus" | "battle-seer";

export type TransformationEffectMetric =
  | "health-regeneration-per-second"
  | "shield-recharge-rate"
  | "maximum-health"
  | "movement-speed"
  | "retaliation-damage"
  | "healing-received"
  | "corrode-buildup"
  | "fire-damage-received"
  | "nearby-kill-healing"
  | "armour"
  | "evasive-cooldown"
  | "projectile-speed"
  | "weapon-spread"
  | "shock-buildup-received"
  | "maximum-shield"
  | "drone-shot-damage"
  | "evasive-distance"
  | "gravity-pulse-radius"
  | "pickup-radius"
  | "ultimate-cooldown"
  | "heavy-weapon-damage"
  | "blast-radius"
  | "fire-rate"
  | "long-range-damage"
  | "close-range-damage"
  | "telekinetic-push-distance";

export type TransformationEffectUnit = "percent" | "points" | "health" | "health-per-second" | "damage" | "metres";
export type TransformationEffectOperation = "increase" | "decrease";
export type TransformationRankValues = readonly [number, number, number];

export interface TransformationEffectDefinition {
  metric: TransformationEffectMetric;
  operation: TransformationEffectOperation;
  unit: TransformationEffectUnit;
  /** Total value at ranks I, II, and III; ranks replace rather than compound. */
  values: TransformationRankValues;
  rule?: string;
}

export interface TransformationTraitDefinition {
  name: string;
  summary: string;
  effects: readonly TransformationEffectDefinition[];
}

export interface TransformationChoiceDefinition {
  id: TransformationChoiceId;
  pathId: TransformationPathId;
  branch: string;
  maxRank: 3;
  boon: TransformationTraitDefinition;
  scar: TransformationTraitDefinition;
  /** Abstract rank-I tuning score used to reject trivial scars or disguised penalties. */
  balanceBudget: Readonly<{ boon: number; scar: number }>;
}

const ranks = (first: number, second: number, third: number): TransformationRankValues => Object.freeze([first, second, third]);
const effect = (
  metric: TransformationEffectMetric,
  operation: TransformationEffectOperation,
  unit: TransformationEffectUnit,
  values: TransformationRankValues,
  rule?: string,
): TransformationEffectDefinition => Object.freeze({ metric, operation, unit, values, ...(rule ? { rule } : {}) });
const trait = (name: string, summary: string, ...effects: TransformationEffectDefinition[]): TransformationTraitDefinition =>
  Object.freeze({ name, summary, effects: Object.freeze(effects) });

export const TRANSFORMATION_CHOICE_CATALOG: readonly TransformationChoiceDefinition[] = Object.freeze([
  choice("regenerative-glands", "mutagenic-evolution", "Regenerator",
    trait("Regenerative Glands", "Regenerate health after four seconds without taking health damage.", effect("health-regeneration-per-second", "increase", "health-per-second", ranks(0.12, 0.18, 0.24), "Begins after 4 seconds without health damage.")),
    trait("Shield Rejection", "Mutated tissue interferes with shield recharge.", effect("shield-recharge-rate", "decrease", "percent", ranks(15, 22, 30))), 19, 11),
  choice("dense-tissue", "mutagenic-evolution", "Juggernaut",
    trait("Dense Tissue", "Increase maximum health.", effect("maximum-health", "increase", "percent", ranks(12, 18, 25))),
    trait("Heavy Frame", "Dense growth reduces movement speed.", effect("movement-speed", "decrease", "percent", ranks(4, 6, 8))), 18, 10),
  choice("reactive-blood", "mutagenic-evolution", "Reactive Organism",
    trait("Reactive Blood", "Health damage releases a short-range acid retaliation.", effect("retaliation-damage", "increase", "damage", ranks(3, 4, 5), "At most once every 5 seconds within 1.5 metres.")),
    trait("Medical Rejection", "Receive less conventional healing.", effect("healing-received", "decrease", "percent", ranks(8, 12, 16))), 17, 10),

  choice("acidic-secretions", "alien-symbiosis", "Toxic Brood",
    trait("Acidic Secretions", "Increase Corrode buildup dealt by attacks.", effect("corrode-buildup", "increase", "percent", ranks(20, 30, 40))),
    trait("Combustible Symbiote", "Receive increased Fire damage.", effect("fire-damage-received", "increase", "percent", ranks(10, 15, 20))), 19, 12),
  choice("feeding-tendrils", "alien-symbiosis", "Predatory Tendrils",
    trait("Feeding Tendrils", "Nearby kills restore a small amount of health.", effect("nearby-kill-healing", "increase", "health", ranks(0.15, 0.22, 0.3), "Kills within 2.5 metres; at most 1.5 health per 10 seconds.")),
    trait("Biomass Hunger", "Receive less healing from conventional sources.", effect("healing-received", "decrease", "percent", ranks(10, 15, 20))), 18, 12),
  choice("symbiotic-carapace", "alien-symbiosis", "Carapace Host",
    trait("Symbiotic Carapace", "Gain armour.", effect("armour", "increase", "points", ranks(2, 3, 4))),
    trait("Rigid Shell", "Increase evasive-move cooldown.", effect("evasive-cooldown", "increase", "percent", ranks(8, 12, 16))), 18, 11),

  choice("targeting-suite", "cybernetic-ascension", "Targeting Suite",
    trait("Targeting Suite", "Increase projectile speed and reduce weapon spread.",
      effect("projectile-speed", "increase", "percent", ranks(15, 25, 35)),
      effect("weapon-spread", "decrease", "percent", ranks(10, 15, 20))),
    trait("Conductive Implant", "Receive increased Shock buildup.", effect("shock-buildup-received", "increase", "percent", ranks(15, 25, 35))), 21, 13),
  choice("shield-lattice", "cybernetic-ascension", "Shield Lattice",
    trait("Shield Lattice", "Gain maximum rechargeable shield.", effect("maximum-shield", "increase", "points", ranks(1.5, 2.5, 3.5))),
    trait("Synthetic Circulation", "Receive less health healing.", effect("healing-received", "decrease", "percent", ranks(10, 15, 20))), 19, 12),
  choice("auxiliary-drone", "cybernetic-ascension", "Drone Controller",
    trait("Auxiliary Drone", "A support drone fires one restrained autonomous shot.", effect("drone-shot-damage", "increase", "damage", ranks(1, 1.5, 2), "One shot every 3.5 seconds at a valid target.")),
    trait("Neural Bandwidth", "Increase ultimate cooldown.", effect("ultimate-cooldown", "increase", "percent", ranks(5, 8, 12))), 18, 10),

  choice("rift-step", "void-initiation", "Rift Walker",
    trait("Rift Step", "Increase evasive-move distance.", effect("evasive-distance", "increase", "percent", ranks(12, 20, 28))),
    trait("Hollowed Vitality", "Reduce maximum health.", effect("maximum-health", "decrease", "percent", ranks(6, 9, 12))), 19, 12),
  choice("gravity-adept", "void-initiation", "Gravity Adept",
    trait("Gravity Adept", "Periodic attacks create a small non-damaging pull pulse.", effect("gravity-pulse-radius", "increase", "metres", ranks(1.2, 1.5, 1.8), "Every eighth qualifying attack; one pulse per attack.")),
    trait("Spatial Drift", "Reduce pickup attraction radius.", effect("pickup-radius", "decrease", "percent", ranks(10, 15, 20))), 18, 10),
  choice("entropy-channeler", "void-initiation", "Entropy Channeler",
    trait("Entropy Channeler", "Reduce ultimate cooldown.", effect("ultimate-cooldown", "decrease", "percent", ranks(10, 15, 20))),
    trait("Withered Recovery", "Receive less healing.", effect("healing-received", "decrease", "percent", ranks(8, 12, 16))), 18, 11),

  choice("heavy-gunner", "bastion-super-soldier", "Heavy Gunner",
    trait("Heavy Gunner", "Increase Heavy-weapon damage.", effect("heavy-weapon-damage", "increase", "percent", ranks(12, 20, 28))),
    trait("Load Bearing", "Reduce movement speed.", effect("movement-speed", "decrease", "percent", ranks(4, 6, 8))), 18, 10),
  choice("vanguard-conditioning", "bastion-super-soldier", "Vanguard",
    trait("Vanguard Conditioning", "Gain armour.", effect("armour", "increase", "points", ranks(2, 3, 4))),
    trait("Planted Footwork", "Reduce evasive-move distance.", effect("evasive-distance", "decrease", "percent", ranks(6, 9, 12))), 18, 10),
  choice("demolitions-doctrine", "bastion-super-soldier", "Demolitionist",
    trait("Demolitions Doctrine", "Increase authored explosion radius.", effect("blast-radius", "increase", "percent", ranks(15, 25, 35))),
    trait("Deliberate Cycling", "Reduce weapon fire rate.", effect("fire-rate", "decrease", "percent", ranks(5, 8, 11))), 19, 11),

  choice("psionic-sniper", "psionic-operative", "Psionic Sniper",
    trait("Psionic Sniper", "Deal increased damage beyond eight metres.", effect("long-range-damage", "increase", "percent", ranks(15, 25, 35), "Applies beyond 8 metres.")),
    trait("Tunnel Focus", "Deal reduced damage inside three metres.", effect("close-range-damage", "decrease", "percent", ranks(8, 12, 16), "Applies inside 3 metres.")), 20, 12),
  choice("telekinetic-focus", "psionic-operative", "Telekinetic",
    trait("Telekinetic Focus", "Periodic attacks push ordinary enemies without stunning them.", effect("telekinetic-push-distance", "increase", "metres", ranks(0.8, 1.2, 1.6), "Every tenth qualifying attack; elites and bosses use resistance.")),
    trait("Unarmoured Concentration", "Lose armour while maintaining telekinetic sensitivity.", effect("armour", "decrease", "points", ranks(1, 2, 3))), 18, 11),
  choice("battle-seer", "psionic-operative", "Battle Seer",
    trait("Battle Seer", "Reduce evasive-move cooldown through danger prediction.", effect("evasive-cooldown", "decrease", "percent", ranks(10, 15, 20))),
    trait("Open Mind", "Reduce maximum shield.", effect("maximum-shield", "decrease", "points", ranks(0.5, 1, 1.5))), 18, 10),
]);

export function transformationChoicesForPath(pathId: TransformationPathId): readonly TransformationChoiceDefinition[] {
  return TRANSFORMATION_CHOICE_CATALOG.filter((choice) => choice.pathId === pathId);
}

export function transformationChoiceById(id: TransformationChoiceId): TransformationChoiceDefinition {
  return TRANSFORMATION_CHOICE_CATALOG.find((choice) => choice.id === id)!;
}

export function isTransformationChoiceId(value: unknown): value is TransformationChoiceId {
  return typeof value === "string" && TRANSFORMATION_CHOICE_CATALOG.some(({ id }) => id === value);
}

export function transformationEffectValue(effectDefinition: TransformationEffectDefinition, rank: number): number {
  const safeRank = Math.max(1, Math.min(3, Math.floor(rank)));
  return effectDefinition.values[safeRank - 1]!;
}

function choice(
  id: TransformationChoiceId,
  pathId: TransformationPathId,
  branch: string,
  boon: TransformationTraitDefinition,
  scar: TransformationTraitDefinition,
  boonBudget: number,
  scarBudget: number,
): TransformationChoiceDefinition {
  return Object.freeze({
    id,
    pathId,
    branch,
    maxRank: 3,
    boon,
    scar,
    balanceBudget: Object.freeze({ boon: boonBudget, scar: scarBudget }),
  });
}
