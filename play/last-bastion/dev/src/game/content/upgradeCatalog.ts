export type UpgradeId =
  | "rapid-cycling"
  | "twin-shot"
  | "piercing-rounds"
  | "explosive-payload"
  | "heavy-calibre"
  | "field-magnet";

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
}

export const UPGRADE_CATALOG: Readonly<Record<UpgradeId, UpgradeDefinition>> = Object.freeze({
  "rapid-cycling": {
    id: "rapid-cycling",
    name: "Rapid Cycling",
    description: "Fire 20% faster.",
  },
  "twin-shot": {
    id: "twin-shot",
    name: "Twin Shot",
    description: "Fire one additional projectile with a small spread.",
  },
  "piercing-rounds": {
    id: "piercing-rounds",
    name: "Piercing Rounds",
    description: "Projectiles pass through one additional alien.",
  },
  "explosive-payload": {
    id: "explosive-payload",
    name: "Explosive Payload",
    description: "Impacts damage nearby aliens.",
  },
  "heavy-calibre": {
    id: "heavy-calibre",
    name: "Heavy Calibre",
    description: "+40% damage, but fire 10% slower.",
  },
  "field-magnet": {
    id: "field-magnet",
    name: "Field Magnet",
    description: "Increase XP attraction and collection range.",
  },
});

export const UPGRADE_ORDER: readonly UpgradeId[] = Object.freeze([
  "rapid-cycling",
  "twin-shot",
  "piercing-rounds",
  "explosive-payload",
  "heavy-calibre",
  "field-magnet",
]);
