export type TransformationPathId =
  | "mutagenic-evolution"
  | "alien-symbiosis"
  | "cybernetic-ascension"
  | "void-initiation"
  | "bastion-super-soldier"
  | "psionic-operative"
  | "cultist-doctrine";

export interface TransformationPathDefinition {
  id: TransformationPathId;
  name: string;
  identity: string;
  siteFamily: string;
  branches: readonly string[];
  scarTheme: string;
}

/**
 * Planning/data boundary only. These definitions do not add offers, stats,
 * rooms, save fields, rendering, or gameplay effects by themselves.
 */
export const TRANSFORMATION_PATH_CATALOG: readonly TransformationPathDefinition[] = Object.freeze([
  path("mutagenic-evolution", "Mutagenic Evolution", "Unstable flesh, regeneration, and reactive adaptation.", "Mutation pool / surgery lab", ["Regenerator", "Juggernaut", "Reactive Organism"], "Reduced shielding or unreliable conventional healing."),
  path("alien-symbiosis", "Alien Symbiosis", "A controlled organism that feeds, protects, and attacks with its host.", "Symbiote tank / chimera nursery", ["Toxic Brood", "Predatory Tendrils", "Carapace Host"], "Fire vulnerability or biomass hunger."),
  path("cybernetic-ascension", "Cybernetic Ascension", "Machine integration, targeting, shielding, and automation.", "Cybernetics chamber / assembly cradle", ["Targeting Suite", "Drone Controller", "Shield Lattice"], "Shock vulnerability or reduced organic healing."),
  path("void-initiation", "Void Initiation", "Unstable spatial power, gravity, warping, and entropy.", "Anomaly lens / forbidden circle", ["Rift Walker", "Gravity Adept", "Entropy Channeler"], "Reduced maximum health or accumulating instability."),
  path("bastion-super-soldier", "Bastion Super-Soldier", "Conventional military discipline pushed beyond safe human limits.", "Training centre / enhancement chair", ["Heavy Gunner", "Vanguard", "Demolitionist"], "Reduced exotic support or heavier movement."),
  path("psionic-operative", "Psionic Operative", "Disciplined neural power without void corruption.", "Psionic amplifier / focus chamber", ["Psionic Sniper", "Telekinetic", "Battle Seer"], "Mental strain, interrupted concentration, or reduced armour."),
  path("cultist-doctrine", "Church of the Designed Arrival", "Zealous faith in a signal from beyond, trading clarity for devotion.", "Doctrine chapel / signal shrine", ["Zealot", "Martyr", "Oracle"], "Self-neglect in the name of the Signal — thinned defences or welcomed suffering."),
]);

export function transformationPathById(id: TransformationPathId): TransformationPathDefinition {
  return TRANSFORMATION_PATH_CATALOG.find((definition) => definition.id === id)!;
}

export function isTransformationPathId(value: unknown): value is TransformationPathId {
  return typeof value === "string" && TRANSFORMATION_PATH_CATALOG.some(({ id }) => id === value);
}

function path(
  id: TransformationPathId,
  name: string,
  identity: string,
  siteFamily: string,
  branches: readonly string[],
  scarTheme: string,
): TransformationPathDefinition {
  return Object.freeze({
    id,
    name,
    identity,
    siteFamily,
    branches: Object.freeze([...branches]),
    scarTheme,
  });
}
