import type { HeroDefinition } from "../hero/HeroDefinition";

/** The compact dossier keeps complete ability copy readable beside the perk rail. */
export function heroDossierCopy(definition: HeroDefinition, unlocked: boolean): string {
  return [
    `ROLE  ${definition.role}`,
    `PASSIVE  ${definition.passive.name}: ${definition.passive.description}`,
    `ULTIMATE  ${definition.ultimate.name}: ${definition.ultimate.description}`,
    `WEAPON  ${definition.startingWeaponName}`,
    `PER LEVEL  ${definition.levelGrowthDescription}`,
    ...(!unlocked ? [`UNLOCK  ${definition.unlockText}`] : []),
  ].join("\n");
}
