import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { HeroDefinition, WeaponClass } from "../hero/HeroDefinition";
import { heroGrowthAtLevel } from "../hero/LevelGrowth";

export interface ExpeditionProgressionRestorePlan {
  readonly level: number;
  readonly experience: number;
  readonly maxHealthGrowthBonus: number;
  readonly armourBonus: number;
  readonly damageMultiplier: number;
  readonly speedMultiplier: number;
  readonly supportMultiplier: number;
  readonly weaponProficiencies: Readonly<Record<WeaponClass, number>>;
}

export function planExpeditionProgressionRestore(input: {
  readonly hero: HeroDefinition;
  readonly level: number;
  readonly experience: number;
}): ExpeditionProgressionRestorePlan {
  const level = Math.max(1, Math.floor(input.level));
  const growth = heroGrowthAtLevel(input.hero, level);
  const weaponProficiencies = {} as Record<WeaponClass, number>;
  for (const weaponClass of Object.keys(growth.proficiencyMultiplier) as WeaponClass[]) {
    weaponProficiencies[weaponClass] =
      Math.round(((growth.proficiencyMultiplier[weaponClass] - 1) / 0.04) * 1_000) / 1_000;
  }
  return {
    level,
    experience: Math.max(0, Math.floor(input.experience)),
    maxHealthGrowthBonus: growth.maxHealthBonus,
    armourBonus: growth.armourBonus,
    damageMultiplier: growth.damageMultiplier,
    speedMultiplier: growth.speedMultiplier,
    supportMultiplier: growth.supportMultiplier,
    weaponProficiencies,
  };
}

export interface CarriedUpgradeRestorePlan {
  readonly upgradeId: UpgradeId;
  readonly targetLevel: number;
  readonly levelsToApply: readonly number[];
}

export function planCarriedUpgradeRestores(
  upgrades: ExpeditionBuildSnapshot["upgrades"],
): readonly CarriedUpgradeRestorePlan[] {
  const plans: CarriedUpgradeRestorePlan[] = [];
  for (const carried of upgrades) {
    if (!Object.prototype.hasOwnProperty.call(UPGRADE_CATALOG, carried.upgradeId)) continue;
    const upgradeId = carried.upgradeId as UpgradeId;
    const targetLevel = Math.min(
      UPGRADE_CATALOG[upgradeId].maxLevel,
      Math.max(0, Math.floor(carried.level)),
    );
    if (!(targetLevel > 0)) continue;
    plans.push({
      upgradeId,
      targetLevel,
      levelsToApply: Array.from({ length: targetLevel }, (_, index) => index + 1),
    });
  }
  return plans;
}

export interface WeaponAndSurvivalRestorePlan {
  readonly rackTiers: readonly (1 | 2 | 3)[];
  readonly weaponDamageMultipliers: readonly number[];
  readonly health: number;
  readonly bonusHealth: 0;
  readonly shield: number;
}

export function planWeaponAndSurvivalRestore(input: {
  readonly weapons: ExpeditionBuildSnapshot["weapons"];
  readonly rackTileCount: number;
  readonly equippedWeaponCount: number;
  readonly maxHealth: number;
  readonly health: number;
  readonly shield: number;
}): WeaponAndSurvivalRestorePlan {
  const carriedTiers = input.weapons.map((weapon) => (
    Math.max(1, Math.min(3, Math.floor(weapon.tier))) as 1 | 2 | 3
  ));
  const tiersFor = (count: number): (1 | 2 | 3)[] => Array.from(
    { length: Math.max(0, count) },
    (_, index) => carriedTiers[index] ?? 1,
  );
  const rackTiers = tiersFor(input.rackTileCount);
  const equippedTiers = tiersFor(input.equippedWeaponCount);
  return {
    rackTiers,
    weaponDamageMultipliers: equippedTiers.map((tier) => tier === 1 ? 1 : tier === 2 ? 1.6 : 2.56),
    health: Math.max(0.1, Math.min(input.maxHealth, input.health)),
    bonusHealth: 0,
    shield: Math.max(0, input.shield),
  };
}
