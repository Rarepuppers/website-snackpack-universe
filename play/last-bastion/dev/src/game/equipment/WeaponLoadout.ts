import {
  BASTION_SERVICE_RIFLE,
  WEAPON_CATALOG,
  type WeaponId,
  type WeaponRuntimeStats,
} from "../content/weaponCatalog";

export const MAX_EQUIPPED_WEAPONS = 12;

export interface EquippedWeapon {
  instanceId: number;
  weaponId: WeaponId;
  stats: WeaponRuntimeStats;
}

export function createServiceRifleLoadout(count: number): EquippedWeapon[] {
  if (!Number.isInteger(count) || count < 0 || count > MAX_EQUIPPED_WEAPONS) {
    throw new RangeError(`Weapon count must be an integer from 0 to ${MAX_EQUIPPED_WEAPONS}.`);
  }

  return Array.from({ length: count }, (_, index) => ({
    instanceId: index + 1,
    weaponId: BASTION_SERVICE_RIFLE.id,
    stats: { ...BASTION_SERVICE_RIFLE },
  }));
}

export function createWeaponLoadout(weaponIds: readonly WeaponId[]): EquippedWeapon[] {
  if (weaponIds.length > MAX_EQUIPPED_WEAPONS) {
    throw new RangeError(`A loadout supports at most ${MAX_EQUIPPED_WEAPONS} weapons.`);
  }
  return weaponIds.map((weaponId, index) => ({
    instanceId: index + 1,
    weaponId,
    stats: { ...WEAPON_CATALOG[weaponId] },
  }));
}

export function clampWeaponCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(Math.max(Math.floor(count), 0), MAX_EQUIPPED_WEAPONS);
}
