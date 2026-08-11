import { depthScaledShopItemPrice, profileScaledShopPrice } from "./ScrapShopPricing";
import { UPGRADE_CATALOG, upgradeLevelName, type UpgradeId } from "../content/upgradeCatalog";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { rotatingWindow } from "./ScrapShopStock";

export interface ScrapShopCandidate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly affordable?: boolean;
}

export interface ScrapShopBasePrices {
  readonly uraniumKit: number;
  readonly fieldRepair: number;
  readonly upgrade: number;
  readonly armourRetrofit: number;
  readonly weapon: number;
}

export function buildFixedScrapShopCandidates(input: {
  readonly stocksRepair: boolean;
  readonly stocksUtility: boolean;
  readonly playerHealth: number;
  readonly playerMaxHealth: number;
  readonly uraniumKitAvailable: boolean;
  readonly repairAmount: number;
  readonly armourAmount: number;
  readonly prices: ScrapShopBasePrices;
  readonly profilePriceMultiplier: number;
}): ScrapShopCandidate[] {
  const candidates: ScrapShopCandidate[] = [];
  const price = (base: number): number => profileScaledShopPrice(base, input.profilePriceMultiplier);
  if (input.stocksRepair && input.playerHealth < input.playerMaxHealth) {
    candidates.push({
      id: "shop-repair",
      name: "Field Repair",
      description: `Restore ${input.repairAmount} health.`,
      cost: price(input.prices.fieldRepair),
    });
  }
  if (input.stocksUtility && !input.uraniumKitAvailable) {
    candidates.push({
      id: "shop-uranium-kit",
      name: "Uranium-Core Kit",
      description: "Carry one activatable 12-second +25% damage kit.",
      cost: price(input.prices.uraniumKit),
    });
  }
  if (input.stocksUtility) {
    candidates.push({
      id: "shop-armour-retrofit",
      name: "Armour Retrofit",
      description: `Gain ${input.armourAmount} armour for this run.`,
      cost: price(input.prices.armourRetrofit),
    });
  }
  return candidates;
}

export interface ScrapShopUpgradeCandidateInput {
  readonly upgradeId: string;
  readonly name: string;
  readonly levelDescription: string;
}

export function prepareScrapShopUpgradeInputs(input: {
  readonly eligibleUpgradeIds: readonly UpgradeId[];
  readonly upgradeLevels: ReadonlyMap<UpgradeId, number>;
}): ScrapShopUpgradeCandidateInput[] {
  return input.eligibleUpgradeIds.map((upgradeId) => {
    const nextLevel = (input.upgradeLevels.get(upgradeId) ?? 0) + 1;
    return {
      upgradeId,
      name: upgradeLevelName(upgradeId, nextLevel),
      levelDescription: UPGRADE_CATALOG[upgradeId].levelDescriptions[nextLevel - 1]!,
    };
  });
}

export interface ScrapShopWeaponCandidateInput {
  readonly weaponId: string;
  readonly displayName: string;
  readonly description: string;
  readonly isUnique: boolean;
}

export function prepareScrapShopWeaponInputs(input: {
  readonly stocksWeapons: boolean;
  readonly equippedWeaponIds: readonly WeaponId[];
  readonly maxEquippedWeapons: number;
  readonly offerableWeaponIds: readonly WeaponId[];
  readonly candidateCount: number;
  readonly rotationOffset: number;
}): ScrapShopWeaponCandidateInput[] {
  if (!input.stocksWeapons || input.equippedWeaponIds.length >= input.maxEquippedWeapons) return [];
  const owned = new Set(input.equippedWeaponIds);
  const available = input.offerableWeaponIds.filter((weaponId) => !owned.has(weaponId));
  return rotatingWindow(available, input.candidateCount, input.rotationOffset).map((weaponId) => ({
    weaponId,
    displayName: WEAPON_CATALOG[weaponId].displayName,
    description: WEAPON_CATALOG[weaponId].description,
    isUnique: WEAPON_CATALOG[weaponId].weaponClass === "unique",
  }));
}

export function buildUpgradeWeaponScrapShopCandidates(input: {
  readonly upgrades: readonly ScrapShopUpgradeCandidateInput[];
  readonly weapons: readonly ScrapShopWeaponCandidateInput[];
  readonly prices: Pick<ScrapShopBasePrices, "upgrade" | "weapon">;
  readonly profilePriceMultiplier: number;
  readonly uniqueWeaponPriceMultiplier: number;
}): ScrapShopCandidate[] {
  const price = (base: number): number => profileScaledShopPrice(base, input.profilePriceMultiplier);
  return [
    ...input.upgrades.map((upgrade) => ({
      id: `shop-upgrade:${upgrade.upgradeId}`,
      name: upgrade.name,
      description: `Install immediately. ${upgrade.levelDescription}`,
      cost: price(input.prices.upgrade),
    })),
    ...input.weapons.map((weapon) => ({
      id: `shop-weapon:${weapon.weaponId}`,
      name: weapon.displayName,
      description: weapon.isUnique
        ? `Unique. ${weapon.description}`
        : `Add this Tier I weapon to the active rack. ${weapon.description}`,
      cost: price(input.prices.weapon * (weapon.isUnique ? input.uniqueWeaponPriceMultiplier : 1)),
    })),
  ];
}

export interface ScrapShopItemCandidateInput {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: string;
  readonly basePrice: number;
}

export function buildItemScrapShopCandidates(input: {
  readonly items: readonly ScrapShopItemCandidateInput[];
  readonly waveIndex: number;
  readonly profilePriceMultiplier: number;
}): ScrapShopCandidate[] {
  return input.items.map((item) => ({
    id: `shop-item:${item.id}`,
    name: item.name,
    description: `${item.description} (${item.rarity})`,
    cost: profileScaledShopPrice(
      depthScaledShopItemPrice(item.basePrice, input.waveIndex),
      input.profilePriceMultiplier,
    ),
  }));
}

/** Applies run-long bans and current affordability after all stock groups are assembled. */
export function finalizeScrapShopCandidates(input: {
  readonly candidates: readonly ScrapShopCandidate[];
  readonly bannedIds: ReadonlySet<string>;
  readonly securedScrap: number;
}): ScrapShopCandidate[] {
  return input.candidates
    .filter((candidate) => !input.bannedIds.has(candidate.id))
    .map((candidate) => ({ ...candidate, affordable: candidate.cost <= input.securedScrap }));
}
