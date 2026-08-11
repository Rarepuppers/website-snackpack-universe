import {
  LEVEL_STAT_ORDER,
  levelStatCardById,
  levelStatCardDescription,
} from "../content/levelStatCatalog";
import { experienceThreshold, heroGrowthAtLevel } from "../hero/LevelGrowth";
import type { HeroDefinition, WeaponClass } from "../hero/HeroDefinition";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";
import {
  UPGRADE_CATALOG,
  UPGRADE_CATEGORY_LABELS,
  UPGRADE_ORDER,
  upgradeLevelName,
  type UpgradeCategory,
  type UpgradeId,
} from "../content/upgradeCatalog";

export interface LevelUpDecisionOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface LevelUpDecisionPresentation {
  readonly kind: "upgrade" | "level-stat";
  readonly title: string;
  readonly options: readonly LevelUpDecisionOption[];
}

export type LevelUpChoicePlan =
  | { readonly kind: "upgrade"; readonly upgradeId: UpgradeId; readonly nextLevel: number }
  | { readonly kind: "stat-card"; readonly cardId: string }
  | { readonly kind: "none" };

export interface LevelStatGrantPlan {
  readonly statKey: keyof PlayerStatBlock;
  readonly amount: number;
  readonly nextStats: Readonly<Partial<PlayerStatBlock>>;
}

export interface LevelUpAdvancePlan {
  readonly nextLevel: number;
  readonly remainingExperience: number;
  readonly decision: LevelUpDecisionPresentation;
}

export interface ExperienceAwardPlan {
  readonly awardedExperience: number;
  readonly nextExperience: number;
  readonly nextCarry: number;
}

export interface HeroLevelGrowthPlan {
  readonly maxHealthBonus: number;
  readonly healthGain: number;
  readonly armourGain: number;
  readonly damageMultiplier: number;
  readonly speedMultiplier: number;
  readonly supportMultiplier: number;
  readonly weaponProficiencies: Readonly<Record<WeaponClass, number>>;
}

export function usedUpgradeSlots(
  category: UpgradeCategory,
  upgradeLevels: ReadonlyMap<UpgradeId, number>,
): number {
  let used = 0;
  for (const [id, level] of upgradeLevels) {
    if (level > 0 && UPGRADE_CATALOG[id].category === category) used += 1;
  }
  return used;
}

export function isUpgradeEligibleForRun(input: {
  readonly id: UpgradeId;
  readonly upgradeLevels: ReadonlyMap<UpgradeId, number>;
  readonly slotCapacity: Readonly<Record<UpgradeCategory, number>>;
}): boolean {
  const definition = UPGRADE_CATALOG[input.id];
  const ownedLevel = input.upgradeLevels.get(input.id) ?? 0;
  if (ownedLevel >= definition.maxLevel) return false;
  if (definition.excludes.some((excluded) => (input.upgradeLevels.get(excluded) ?? 0) > 0)) return false;
  return ownedLevel > 0
    || usedUpgradeSlots(definition.category, input.upgradeLevels) < input.slotCapacity[definition.category];
}

/** Even offsets first, then odd, covering the rotation exactly once. */
export function upgradeScanOffsets(length: number): readonly number[] {
  const evens: number[] = [];
  const odds: number[] = [];
  for (let offset = 0; offset < Math.max(0, length); offset += 1) {
    (offset % 2 === 0 ? evens : odds).push(offset);
  }
  return [...evens, ...odds];
}

export function levelStatCardForLevel(level: number, slot: number): LevelUpDecisionOption | null {
  const length = LEVEL_STAT_ORDER.length;
  const index = (level - 2 + slot * 4 + length * 2) % length;
  const entry = levelStatCardById(LEVEL_STAT_ORDER[index]!);
  return entry ? { id: entry.id, name: entry.name, description: levelStatCardDescription(entry) } : null;
}

export function planUpgradeDecision(input: {
  readonly level: number;
  readonly upgradeLevels: ReadonlyMap<UpgradeId, number>;
  readonly slotCapacity: Readonly<Record<UpgradeCategory, number>>;
  readonly maxUpgradeOptions?: number;
}): LevelUpDecisionPresentation | null {
  const maxUpgradeOptions = input.maxUpgradeOptions ?? 3;
  const start = (input.level - 2 + UPGRADE_ORDER.length * 2) % UPGRADE_ORDER.length;
  const options: LevelUpDecisionOption[] = [];
  for (const offset of upgradeScanOffsets(UPGRADE_ORDER.length)) {
    if (options.length >= maxUpgradeOptions) break;
    const id = UPGRADE_ORDER[(start + offset) % UPGRADE_ORDER.length]!;
    if (options.some((option) => option.id === id) || !isUpgradeEligibleForRun({
      id,
      upgradeLevels: input.upgradeLevels,
      slotCapacity: input.slotCapacity,
    })) continue;
    const nextLevel = (input.upgradeLevels.get(id) ?? 0) + 1;
    options.push({
      id,
      name: upgradeLevelName(id, nextLevel),
      description: `[${UPGRADE_CATEGORY_LABELS[UPGRADE_CATALOG[id].category]}] `
        + UPGRADE_CATALOG[id].levelDescriptions[nextLevel - 1]!,
    });
  }
  if (options.length === 0) return null;
  const statCard = levelStatCardForLevel(input.level, 0);
  if (statCard) options.push(statCard);
  return { kind: "upgrade", title: "LEVEL UP — CHOOSE ONE", options };
}

export function planLevelUpChoice(
  optionId: string,
  upgradeLevels: ReadonlyMap<UpgradeId, number>,
): LevelUpChoicePlan {
  if (levelStatCardById(optionId)) return { kind: "stat-card", cardId: optionId };
  if (!Object.prototype.hasOwnProperty.call(UPGRADE_CATALOG, optionId)) return { kind: "none" };
  const upgradeId = optionId as UpgradeId;
  return {
    kind: "upgrade",
    upgradeId,
    nextLevel: (upgradeLevels.get(upgradeId) ?? 0) + 1,
  };
}

export function planLevelStatGrant(input: {
  readonly cardId: string;
  readonly currentStats: Readonly<Partial<PlayerStatBlock>>;
}): LevelStatGrantPlan | null {
  const entry = levelStatCardById(input.cardId);
  if (!entry) return null;
  return {
    statKey: entry.statKey,
    amount: entry.amount,
    nextStats: {
      ...input.currentStats,
      [entry.statKey]: (input.currentStats[entry.statKey] ?? 0) + entry.amount,
    },
  };
}

export function planLevelUpAdvance(input: {
  readonly level: number;
  readonly experience: number;
  readonly hasPendingDecision: boolean;
  readonly upgradeLevels: ReadonlyMap<UpgradeId, number>;
  readonly slotCapacity: Readonly<Record<UpgradeCategory, number>>;
}): LevelUpAdvancePlan | null {
  if (input.hasPendingDecision) return null;
  const threshold = experienceThreshold(input.level);
  if (input.experience < threshold) return null;
  const nextLevel = input.level + 1;
  return {
    nextLevel,
    remainingExperience: input.experience - threshold,
    decision: planUpgradeDecision({
      level: nextLevel,
      upgradeLevels: input.upgradeLevels,
      slotCapacity: input.slotCapacity,
    }) ?? planLevelStatDecision({ level: nextLevel }),
  };
}

export function planExperienceAward(input: {
  readonly amount: number;
  readonly currentExperience: number;
  readonly carry: number;
  readonly multiplier: number;
}): ExperienceAwardPlan {
  const scaled = Math.max(0, input.amount) * input.multiplier + input.carry;
  const awardedExperience = Math.floor(scaled);
  return {
    awardedExperience,
    nextExperience: input.currentExperience + awardedExperience,
    nextCarry: scaled - awardedExperience,
  };
}

export function planHeroLevelGrowth(input: {
  readonly hero: HeroDefinition;
  readonly level: number;
}): HeroLevelGrowthPlan {
  const current = heroGrowthAtLevel(input.hero, input.level);
  const previous = heroGrowthAtLevel(input.hero, input.level - 1);
  const weaponProficiencies = {} as Record<WeaponClass, number>;
  for (const weaponClass of Object.keys(current.proficiencyMultiplier) as WeaponClass[]) {
    weaponProficiencies[weaponClass] =
      Math.round(((current.proficiencyMultiplier[weaponClass] - 1) / 0.04) * 1_000) / 1_000;
  }
  return {
    maxHealthBonus: current.maxHealthBonus,
    healthGain: current.maxHealthBonus - previous.maxHealthBonus,
    armourGain: current.armourBonus - previous.armourBonus,
    damageMultiplier: current.damageMultiplier,
    speedMultiplier: current.speedMultiplier,
    supportMultiplier: current.supportMultiplier,
    weaponProficiencies,
  };
}

export function planLevelStatDecision(input: {
  readonly level: number;
  readonly maxOptions?: number;
}): LevelUpDecisionPresentation {
  const options: LevelUpDecisionOption[] = [];
  const maxOptions = input.maxOptions ?? 4;
  for (let slot = 0; slot < LEVEL_STAT_ORDER.length && options.length < maxOptions; slot += 1) {
    const option = levelStatCardForLevel(input.level, slot);
    if (!option || options.some((existing) => existing.id === option.id)) continue;
    options.push(option);
  }
  return { kind: "level-stat", title: "LEVEL UP — CHOOSE A STAT", options };
}
