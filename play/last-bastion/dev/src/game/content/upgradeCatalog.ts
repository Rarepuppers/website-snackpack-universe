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

/**
 * Slot categories. Each hero has a limited number of slots per category, so
 * builds are constrained by breadth: a NEW upgrade consumes a slot in its
 * category, while leveling an owned upgrade never does. Logistics and further
 * categories join when the catalogue grows enough to populate them.
 */
export type UpgradeCategory = "offensive" | "defensive" | "support" | "scavenger";

/** Absolute ceiling on a hero's total slots across all categories. */
export const UPGRADE_SLOT_HARD_CAP = 12;

export const UPGRADE_CATEGORY_LABELS: Readonly<Record<UpgradeCategory, string>> = Object.freeze({
  offensive: "Offensive",
  defensive: "Defensive",
  support: "Support",
  scavenger: "Scavenger",
});

/**
 * Upgrades are leveled: choosing one again advances it to the next level with
 * its own effect, so repeated offers always mean something. Conversion paths
 * (Fire vs Cryo) are mutually exclusive via `excludes` — committing to one
 * elemental identity is a deliberate build decision.
 */
export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  category: UpgradeCategory;
  maxLevel: number;
  /** One entry per level; entry N describes what buying level N+1 does. */
  levelDescriptions: readonly string[];
  excludes: readonly UpgradeId[];
}

export const UPGRADE_CATALOG: Readonly<Record<UpgradeId, UpgradeDefinition>> = Object.freeze({
  "rapid-cycling": upgrade("rapid-cycling", "Rapid Cycling", "offensive", [
    "Fire 15% faster.",
    "Fire a further 15% faster.",
    "Fire a further 15% faster.",
  ]),
  "twin-shot": upgrade("twin-shot", "Twin Shot", "offensive", [
    "Fire one additional projectile with a small spread.",
    "Fire a second additional projectile.",
  ]),
  "piercing-rounds": upgrade("piercing-rounds", "Piercing Rounds", "offensive", [
    "Projectiles pass through one additional alien.",
    "Projectiles pass through a second additional alien.",
    "Projectiles pass through a third additional alien.",
  ]),
  "explosive-payload": upgrade("explosive-payload", "Explosive Payload", "offensive", [
    "Impacts explode, dealing half damage nearby.",
    "Larger explosions that deal 60% damage nearby.",
    "Even larger explosions that deal 70% damage nearby.",
  ]),
  "heavy-calibre": upgrade("heavy-calibre", "Heavy Calibre", "offensive", [
    "+35% damage, but fire 10% slower.",
    "A further +35% damage, but fire 10% slower.",
    "A further +35% damage, but fire 10% slower.",
  ]),
  "field-magnet": upgrade("field-magnet", "Field Magnet", "scavenger", [
    "Increase XP attraction and collection range.",
    "Further increase XP attraction range.",
    "Further increase XP attraction range.",
  ]),
  "incendiary-rounds": upgrade("incendiary-rounds", "Incendiary Rounds", "offensive", [
    "All weapons deal Fire damage; buildup ignites aliens (Blaze).",
    "Ignite 20% more often and Blaze burns hotter.",
    "Blazing aliens detonate in fire when they die.",
  ], ["cryo-coating"]),
  "cryo-coating": upgrade("cryo-coating", "Cryo Coating", "offensive", [
    "All weapons deal Cryo damage; buildup freezes aliens.",
    "Freeze 20% more often and Freeze slows harder.",
    "Freeze lasts longer and nearly halts aliens.",
  ], ["incendiary-rounds"]),
  "chain-lightning": upgrade("chain-lightning", "Chain Lightning", "offensive", [
    "Attacks arc to one nearby alien at reduced damage.",
    "One more arc, and shock builds 10% faster.",
    "One more arc, and shock builds a further 10% faster.",
  ]),
  "adrenal-servos": upgrade("adrenal-servos", "Adrenal Servos", "support", [
    "Move 12% faster.",
    "Move a further 12% faster.",
    "Move a further 12% faster.",
  ]),
  "composite-plating": upgrade("composite-plating", "Composite Plating", "defensive", [
    "Gain 3 armour (diminishing percentage reduction).",
    "Gain 3 more armour.",
    "Gain 3 more armour.",
    "Gain 3 more armour.",
  ]),
  "shield-capacitor": upgrade("shield-capacitor", "Shield Capacitor", "defensive", [
    "Gain a 1.5-point shield that recharges out of combat.",
    "Gain 1.5 more maximum shield.",
    "Gain 1.5 more maximum shield.",
  ]),
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

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"] as const;

/** Display name for buying the given 1-based level, e.g. "Chain Lightning II". */
export function upgradeLevelName(id: UpgradeId, level: number): string {
  const definition = UPGRADE_CATALOG[id];
  if (definition.maxLevel <= 1) {
    return definition.name;
  }
  return `${definition.name} ${ROMAN_NUMERALS[Math.min(level, ROMAN_NUMERALS.length) - 1]}`;
}

function upgrade(
  id: UpgradeId,
  name: string,
  category: UpgradeCategory,
  levelDescriptions: readonly string[],
  excludes: readonly UpgradeId[] = [],
): UpgradeDefinition {
  return Object.freeze({
    id,
    name,
    category,
    maxLevel: levelDescriptions.length,
    levelDescriptions: Object.freeze([...levelDescriptions]),
    excludes: Object.freeze([...excludes]),
  });
}
