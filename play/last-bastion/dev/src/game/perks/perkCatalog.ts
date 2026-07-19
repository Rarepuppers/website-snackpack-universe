import type { GameProgress } from "../save/LocalSaveStore";

export type PerkId =
  | "perk-veteran"
  | "perk-scrapper"
  | "perk-quartermaster"
  | "perk-fast-learner"
  | "perk-gunsmith"
  | "perk-survivor"
  | "perk-pathfinder";

export interface PerkDefinition {
  id: PerkId;
  name: string;
  description: string;
  unlockText: string;
  isUnlocked(progress: GameProgress): boolean;
}

export interface PerkRunModifiers {
  startingLevel: number;
  weaponSaleFraction: number;
  inventoryBonusSlots: number;
  earlyExperienceMultiplier: number;
  mergeDamageMultiplier: number;
  lowHealthDamageMultiplier: number;
  mapRevealBonusColumns: number;
}

export const NO_PERK_MODIFIERS: Readonly<PerkRunModifiers> = Object.freeze({
  startingLevel: 1,
  weaponSaleFraction: 0.5,
  inventoryBonusSlots: 0,
  earlyExperienceMultiplier: 1,
  mergeDamageMultiplier: 1,
  lowHealthDamageMultiplier: 1,
  mapRevealBonusColumns: 0,
});

export const PERK_CATALOG: readonly PerkDefinition[] = Object.freeze([
  { id: "perk-veteran", name: "Veteran", description: "Start each run at level 2.", unlockText: "Available from the first drop.", isUnlocked: () => true },
  { id: "perk-scrapper", name: "Scrapper", description: "Weapons sell for 75% instead of 50%.", unlockText: "Finish 1 run.", isUnlocked: (p) => p.runsFinished >= 1 },
  { id: "perk-quartermaster", name: "Quartermaster", description: "+2 stash slots.", unlockText: "Clear 5 expedition nodes.", isUnlocked: (p) => p.nodesCleared >= 5 },
  { id: "perk-fast-learner", name: "Fast Learner", description: "+15% XP during the first 3 waves/columns.", unlockText: "Reach wave 3.", isUnlocked: (p) => p.bestWaveReached >= 3 },
  { id: "perk-gunsmith", name: "Gunsmith", description: "Merged weapons gain +10% bonus damage.", unlockText: "Win 1 run.", isUnlocked: (p) => p.victories >= 1 },
  { id: "perk-survivor", name: "Survivor", description: "Take 25% less health damage below 30% health.", unlockText: "Finish 3 runs.", isUnlocked: (p) => p.runsFinished >= 3 },
  { id: "perk-pathfinder", name: "Pathfinder", description: "Reveal one extra expedition-map column.", unlockText: "Clear 15 expedition nodes.", isUnlocked: (p) => p.nodesCleared >= 15 },
]);

export function isPerkId(value: unknown): value is PerkId {
  return typeof value === "string" && PERK_CATALOG.some((perk) => perk.id === value);
}

export function unlockedPerkIds(progress: GameProgress): readonly PerkId[] {
  return PERK_CATALOG.filter((perk) => perk.isUnlocked(progress)).map((perk) => perk.id);
}

export function resolvePerkModifiers(perkId: PerkId | null | undefined): PerkRunModifiers {
  const modifiers = { ...NO_PERK_MODIFIERS };
  switch (perkId) {
    case "perk-veteran": modifiers.startingLevel = 2; break;
    case "perk-scrapper": modifiers.weaponSaleFraction = 0.75; break;
    case "perk-quartermaster": modifiers.inventoryBonusSlots = 2; break;
    case "perk-fast-learner": modifiers.earlyExperienceMultiplier = 1.15; break;
    case "perk-gunsmith": modifiers.mergeDamageMultiplier = 1.1; break;
    case "perk-survivor": modifiers.lowHealthDamageMultiplier = 0.75; break;
    case "perk-pathfinder": modifiers.mapRevealBonusColumns = 1; break;
  }
  return modifiers;
}
