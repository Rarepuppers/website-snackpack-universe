import { describe, expect, it } from "vitest";
import {
  buildFixedScrapShopCandidates,
  buildItemScrapShopCandidates,
  buildUpgradeWeaponScrapShopCandidates,
  finalizeScrapShopCandidates,
  prepareScrapShopUpgradeInputs,
  prepareScrapShopWeaponInputs,
} from "./ScrapShopCandidateConstruction";

const prices = { uraniumKit: 35, fieldRepair: 40, upgrade: 45, armourRetrofit: 50, weapon: 60 };

describe("fixed scrap-shop candidates", () => {
  it("constructs damaged-player repair and available utility in authored order", () => {
    expect(buildFixedScrapShopCandidates({
      stocksRepair: true,
      stocksUtility: true,
      playerHealth: 4,
      playerMaxHealth: 10,
      uraniumKitAvailable: false,
      repairAmount: 3.5,
      armourAmount: 1,
      prices,
      profilePriceMultiplier: 1.25,
    })).toEqual([
      { id: "shop-repair", name: "Field Repair", description: "Restore 3.5 health.", cost: 50 },
      {
        id: "shop-uranium-kit",
        name: "Uranium-Core Kit",
        description: "Carry one activatable 12-second +25% damage kit.",
        cost: 44,
      },
      { id: "shop-armour-retrofit", name: "Armour Retrofit", description: "Gain 1 armour for this run.", cost: 63 },
    ]);
  });

  it("suppresses repair at full health and an already-carried uranium kit", () => {
    expect(buildFixedScrapShopCandidates({
      stocksRepair: true,
      stocksUtility: true,
      playerHealth: 10,
      playerMaxHealth: 10,
      uraniumKitAvailable: true,
      repairAmount: 3.5,
      armourAmount: 1,
      prices,
      profilePriceMultiplier: 1,
    }).map((candidate) => candidate.id)).toEqual(["shop-armour-retrofit"]);
  });
});

describe("upgrade and weapon scrap-shop candidates", () => {
  it("prepares the next authored level for each eligible upgrade", () => {
    const [prepared] = prepareScrapShopUpgradeInputs({
      eligibleUpgradeIds: ["rapid-cycling"],
      upgradeLevels: new Map([["rapid-cycling", 1]]),
    });
    expect(prepared).toMatchObject({
      upgradeId: "rapid-cycling",
      name: expect.any(String),
      levelDescription: expect.any(String),
    });
  });

  it("filters owned weapons and prepares the deterministic rotating catalogue window", () => {
    expect(prepareScrapShopWeaponInputs({
      stocksWeapons: true,
      equippedWeaponIds: ["bastion-service-rifle"],
      maxEquippedWeapons: 4,
      offerableWeaponIds: ["bastion-service-rifle", "arc-carbine", "event-horizon", "scattergun"],
      candidateCount: 2,
      rotationOffset: 1,
    })).toEqual([
      expect.objectContaining({ weaponId: "event-horizon", isUnique: true }),
      expect.objectContaining({ weaponId: "scattergun", isUnique: false }),
    ]);
  });

  it("suppresses weapon inputs when the profile or rack capacity blocks stock", () => {
    const common = {
      equippedWeaponIds: ["bastion-service-rifle"] as const,
      maxEquippedWeapons: 1,
      offerableWeaponIds: ["arc-carbine"] as const,
      candidateCount: 3,
      rotationOffset: 0,
    };
    expect(prepareScrapShopWeaponInputs({ ...common, stocksWeapons: true })).toEqual([]);
    expect(prepareScrapShopWeaponInputs({ ...common, maxEquippedWeapons: 4, stocksWeapons: false })).toEqual([]);
  });

  it("constructs upgrade, ordinary weapon, and unique weapon offers with scaled prices", () => {
    expect(buildUpgradeWeaponScrapShopCandidates({
      upgrades: [{ upgradeId: "damage", name: "Damage II", levelDescription: "+10% damage." }],
      weapons: [
        { weaponId: "arc-carbine", displayName: "Arc Carbine", description: "Chains.", isUnique: false },
        { weaponId: "event-horizon", displayName: "Event Horizon", description: "Implodes.", isUnique: true },
      ],
      prices,
      profilePriceMultiplier: 0.8,
      uniqueWeaponPriceMultiplier: 3,
    })).toEqual([
      { id: "shop-upgrade:damage", name: "Damage II", description: "Install immediately. +10% damage.", cost: 36 },
      {
        id: "shop-weapon:arc-carbine",
        name: "Arc Carbine",
        description: "Add this Tier I weapon to the active rack. Chains.",
        cost: 48,
      },
      { id: "shop-weapon:event-horizon", name: "Event Horizon", description: "Unique. Implodes.", cost: 144 },
    ]);
  });
});

describe("item scrap-shop candidates", () => {
  it("preserves depth rounding before profile rounding", () => {
    expect(buildItemScrapShopCandidates({
      items: [{ id: "field-kit", name: "Field Kit", description: "Patch wounds.", rarity: "uncommon", basePrice: 13 }],
      waveIndex: 3,
      profilePriceMultiplier: 1.1,
    })).toEqual([{
      id: "shop-item:field-kit",
      name: "Field Kit",
      description: "Patch wounds. (uncommon)",
      cost: 18,
    }]);
  });
});

describe("finalizeScrapShopCandidates", () => {
  it("filters bans and adds stable current affordability", () => {
    const candidates = [
      { id: "a", name: "A", description: "A", cost: 10 },
      { id: "b", name: "B", description: "B", cost: 20 },
      { id: "c", name: "C", description: "C", cost: 15 },
    ];
    expect(finalizeScrapShopCandidates({
      candidates,
      bannedIds: new Set(["b"]),
      securedScrap: 15,
    })).toEqual([
      { ...candidates[0], affordable: true },
      { ...candidates[2], affordable: true },
    ]);
  });
});
