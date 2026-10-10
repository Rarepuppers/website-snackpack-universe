import type { HeroDefinition } from "../hero/HeroDefinition";

/**
 * The dossier keeps complete ability copy readable beside the perk rail.
 * `spaced` puts a blank line between fields so ROLE, PASSIVE and ULTIMATE read
 * as separate entries; the scene falls back to the compact form when the
 * spaced one cannot fit.
 */
export function heroDossierCopy(definition: HeroDefinition, unlocked: boolean, spaced = false): string {
  return [
    `ROLE  ${definition.role}`,
    `PASSIVE  ${definition.passive.name}: ${definition.passive.description}`,
    `ULTIMATE  ${definition.ultimate.name}: ${definition.ultimate.description}`,
    `WEAPON  ${definition.startingWeaponName}`,
    `PER LEVEL  ${definition.levelGrowthDescription}`,
    ...(!unlocked ? [`UNLOCK  ${definition.unlockText}`] : []),
  ].join(spaced ? "\n\n" : "\n");
}
