export type UpgradeId =
  | "rapid-cycling"
  | "twin-shot"
  | "piercing-rounds"
  | "explosive-payload"
  | "heavy-calibre"
  | "field-magnet"
  | "incendiary-rounds"
  | "cryo-coating"
  | "chain-lightning"
  | "adrenal-servos"
  | "composite-plating"
  | "shield-capacitor";

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
  "incendiary-rounds": {
    id: "incendiary-rounds",
    name: "Incendiary Rounds",
    description: "All weapons deal Fire damage; buildup ignites aliens (Blaze).",
  },
  "cryo-coating": {
    id: "cryo-coating",
    name: "Cryo Coating",
    description: "All weapons deal Cryo damage; buildup freezes aliens.",
  },
  "chain-lightning": {
    id: "chain-lightning",
    name: "Chain Lightning",
    description: "Attacks arc to one additional nearby alien.",
  },
  "adrenal-servos": {
    id: "adrenal-servos",
    name: "Adrenal Servos",
    description: "Move 12% faster.",
  },
  "composite-plating": {
    id: "composite-plating",
    name: "Composite Plating",
    description: "Gain 3 armour (percentage reduction with diminishing returns).",
  },
  "shield-capacitor": {
    id: "shield-capacitor",
    name: "Shield Capacitor",
    description: "Gain a 15-point shield that recharges out of combat.",
  },
});

export const UPGRADE_ORDER: readonly UpgradeId[] = Object.freeze([
  "rapid-cycling",
  "incendiary-rounds",
  "twin-shot",
  "cryo-coating",
  "piercing-rounds",
  "chain-lightning",
  "explosive-payload",
  "adrenal-servos",
  "heavy-calibre",
  "composite-plating",
  "field-magnet",
  "shield-capacitor",
]);
