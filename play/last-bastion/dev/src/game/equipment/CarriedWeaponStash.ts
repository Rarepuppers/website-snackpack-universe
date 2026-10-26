import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import type { WeaponInventoryState, WeaponTier } from "./WeaponInventory";

/** Schema 17: slot order (including holes) survives travel. Instance ids are encounter-local. */
export type CarriedWeaponStash = readonly ({ weaponId: string; tier: number } | null)[];

// Four base slots plus the largest shipped capacity perk (Logistician: +3).
export const MAX_CARRIED_STASH_SLOTS = 7;

export function normalizeCarriedWeaponStash(value: unknown): CarriedWeaponStash {
  if (!Array.isArray(value)) return [];
  return Array.from(value.slice(0, MAX_CARRIED_STASH_SLOTS), (tile) => {
    if (!tile || typeof tile.weaponId !== "string"
      || !Object.prototype.hasOwnProperty.call(WEAPON_CATALOG, tile.weaponId)
      || !Number.isInteger(tile.tier) || tile.tier < 1 || tile.tier > 3) return null;
    return { weaponId: tile.weaponId, tier: tile.tier };
  });
}

export function restoreCarriedWeaponStash(inventory: WeaponInventoryState, value: unknown): void {
  const slots = normalizeCarriedWeaponStash(value);
  // Retain occupied earned slots if a run resumes with a smaller capacity perk.
  // Empty bonus slots do not grant permanent capacity after that change.
  const lastOccupied = slots.reduce((last, tile, index) => tile ? index : last, -1);
  while (inventory.stash.length <= lastOccupied) inventory.stash.push(null);
  slots.forEach((tile, index) => {
    if (!tile) return;
    const weaponId = tile.weaponId as WeaponId;
    inventory.stash[index] = {
      instanceId: inventory.nextInstanceId++,
      weaponId,
      weaponClass: WEAPON_CATALOG[weaponId].weaponClass,
      tier: tile.tier as WeaponTier,
    };
  });
}
