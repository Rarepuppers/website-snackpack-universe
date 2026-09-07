import type { CombatSnapshot } from "../combat/CombatSimulation";
import { cloneTransformationAffinityState } from "../transformations/TransformationAffinity";
import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";

/** Captures the run-long state that crosses an expedition node boundary. */
export function expeditionBuildFromCombatSnapshot(snapshot: CombatSnapshot): ExpeditionBuildSnapshot {
  return {
    health: snapshot.playerHealth,
    shield: snapshot.playerShield,
    level: snapshot.level,
    experience: snapshot.experience,
    scrap: snapshot.securedScrap,
    weapons: snapshot.weaponInventory.rack.flatMap((slot) => slot.tile
      ? [{ weaponId: slot.tile.weaponId, tier: slot.tile.tier }]
      : []),
    upgrades: snapshot.upgradeLevels.map((upgrade) => ({
      upgradeId: upgrade.id,
      level: upgrade.level,
    })),
    transformation: cloneTransformationAffinityState(snapshot.transformation),
    relicIds: [...snapshot.relicIds],
    ownedItemIds: [...snapshot.ownedItemIds],
    itemStats: { ...snapshot.itemStats },
    bannedShopIds: [...snapshot.bannedShopIds],
    equippedArtifactId: snapshot.equippedArtifactId,
    maxHealthBonus: snapshot.rewardMaxHealthBonus,
    weaponSlotBonus: snapshot.rewardWeaponSlotBonus,
  };
}
