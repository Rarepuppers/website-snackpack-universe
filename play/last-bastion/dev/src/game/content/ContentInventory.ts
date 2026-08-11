import { WORLD_OBJECT_CATALOG } from "../arena/WorldObjectCatalog";
import { ENCOUNTER_OBJECTIVE_MODES } from "../arena/EncounterObjectiveLayout";
import { BOSS_KINDS, MINI_BOSS_KINDS } from "../combat/CombatSimulation";
import { ELITE_KINDS } from "../combat/EliteCadence";
import { HERO_CATALOG } from "../hero/HeroCatalog";
import { ENEMY_CATALOG, type EnemyType } from "./enemyCatalog";
import { ITEM_CATALOG } from "./itemCatalog";
import { LEVEL_STAT_CARDS } from "./levelStatCatalog";
import { ARTIFACT_CATALOG, RELIC_CATALOG } from "./relicCatalog";
import { UPGRADE_CATALOG } from "./upgradeCatalog";
import {
  HERO_STARTING_WEAPONS,
  TRANSFORMATION_WEAPONS,
  UNIQUE_SLOT_WEAPONS,
  WEAPON_CATALOG,
  WEAPON_CHEST_POOL,
} from "./weaponCatalog";

/**
 * Catalogue entries that support another enemy rather than serve as an
 * independently authored encounter.
 */
export const SUPPORT_ENEMY_TYPES: readonly EnemyType[] = Object.freeze([
  "nest-pod",
  "nest-hatchling",
  "storm-node",
  "foundry-pad",
  "foundry-drone",
  "foundry-turret",
  "egg-cluster",
  "brain-blob",
]);

export interface ContentInventory {
  heroes: number;
  weaponsTotal: number;
  weaponsDraftable: number;
  weaponsUnique: number;
  weaponsHeroBound: number;
  weaponsTransformationOnly: number;
  enemyTypesTotal: number;
  regularEnemyTypes: number;
  supportEnemyTypes: number;
  elites: number;
  miniBosses: number;
  bosses: number;
  items: number;
  relics: number;
  artifacts: number;
  upgrades: number;
  levelStatCards: number;
  worldObjects: number;
  objectiveModes: number;
}

/** Generated directly from live catalogues; use this instead of prose counts. */
export function buildContentInventory(): Readonly<ContentInventory> {
  const enemyTypesTotal = Object.keys(ENEMY_CATALOG).length;
  return Object.freeze({
    heroes: Object.keys(HERO_CATALOG).length,
    weaponsTotal: Object.keys(WEAPON_CATALOG).length,
    weaponsDraftable: WEAPON_CHEST_POOL.length,
    weaponsUnique: UNIQUE_SLOT_WEAPONS.length,
    weaponsHeroBound: HERO_STARTING_WEAPONS.length,
    weaponsTransformationOnly: TRANSFORMATION_WEAPONS.length,
    enemyTypesTotal,
    regularEnemyTypes: enemyTypesTotal - SUPPORT_ENEMY_TYPES.length - MINI_BOSS_KINDS.length - BOSS_KINDS.length,
    supportEnemyTypes: SUPPORT_ENEMY_TYPES.length,
    elites: ELITE_KINDS.length,
    miniBosses: MINI_BOSS_KINDS.length,
    bosses: BOSS_KINDS.length,
    items: ITEM_CATALOG.length,
    relics: RELIC_CATALOG.length,
    artifacts: ARTIFACT_CATALOG.length,
    upgrades: Object.keys(UPGRADE_CATALOG).length,
    levelStatCards: LEVEL_STAT_CARDS.length,
    worldObjects: WORLD_OBJECT_CATALOG.length,
    objectiveModes: ENCOUNTER_OBJECTIVE_MODES.length,
  });
}

export const CONTENT_INVENTORY = buildContentInventory();

export function formatContentInventory(inventory: ContentInventory = CONTENT_INVENTORY): string {
  return [
    `${inventory.heroes} heroes`,
    `${inventory.weaponsTotal} weapons (${inventory.weaponsDraftable} draftable, ${inventory.weaponsUnique} earned unique, ${inventory.weaponsHeroBound} hero-bound, ${inventory.weaponsTransformationOnly} transformation-only)`,
    `${inventory.enemyTypesTotal} enemy catalogue types (${inventory.regularEnemyTypes} regular/treasure, ${inventory.supportEnemyTypes} summons/props, ${inventory.miniBosses} mini-bosses, ${inventory.bosses} ${inventory.bosses === 1 ? "boss" : "bosses"})`,
    `${inventory.elites} elite identities`,
    `${inventory.items} items, ${inventory.relics} relics, ${inventory.artifacts} artifacts`,
    `${inventory.upgrades} upgrades, ${inventory.levelStatCards} level-stat cards, ${inventory.worldObjects} world objects, ${inventory.objectiveModes} objective modes`,
  ].join("; ");
}
