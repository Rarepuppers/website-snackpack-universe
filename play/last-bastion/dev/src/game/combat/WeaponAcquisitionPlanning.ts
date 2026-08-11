import { WEAPON_CATALOG, type WeaponId, type WeaponRuntimeStats } from "../content/weaponCatalog";
import type { WeaponClass } from "../hero/HeroDefinition";
import type { WeaponTile } from "../equipment/WeaponInventory";
import { initialProjectileCarry } from "./FractionalProjectiles";

export function canAdmitWeapon(input: {
  readonly equippedWeaponCount: number;
  readonly maximumEquippedWeapons: number;
}): boolean {
  return input.equippedWeaponCount < input.maximumEquippedWeapons;
}

export type WeaponAcquisitionDestination =
  | { readonly kind: "rack"; readonly slotIndex: number }
  | { readonly kind: "stash"; readonly slotIndex: number }
  | { readonly kind: "none" };

export function planWeaponAcquisitionDestination(input: {
  readonly weaponClass: WeaponClass;
  readonly rack: readonly { readonly weaponClass: WeaponClass | "all"; readonly tile: WeaponTile | null }[];
  readonly stash: readonly (WeaponTile | null)[];
}): WeaponAcquisitionDestination {
  const rackIndex = input.rack.findIndex((slot) => (
    slot.tile === null && (slot.weaponClass === "all" || slot.weaponClass === input.weaponClass)
  ));
  if (rackIndex >= 0) return { kind: "rack", slotIndex: rackIndex };
  const stashIndex = input.stash.findIndex((candidate) => candidate === null);
  return stashIndex >= 0 ? { kind: "stash", slotIndex: stashIndex } : { kind: "none" };
}

export interface NewWeaponRuntimePlan {
  readonly instanceId: number;
  readonly weaponId: WeaponId;
  readonly stats: WeaponRuntimeStats;
  readonly cooldownSeconds: 0;
  readonly cooldownDurationSeconds: 0;
  readonly projectileCarry: number;
  readonly orbitAngleRadians: 0;
}

export interface WeaponInitializationPlan {
  readonly tile: WeaponTile;
  readonly runtimeWeapon: NewWeaponRuntimePlan;
}

export function planWeaponInitialization(input: {
  readonly instanceId: number;
  readonly weaponId: WeaponId;
}): WeaponInitializationPlan {
  const definition = WEAPON_CATALOG[input.weaponId];
  return {
    tile: {
      instanceId: input.instanceId,
      weaponId: input.weaponId,
      weaponClass: definition.weaponClass,
      tier: 1,
    },
    runtimeWeapon: {
      instanceId: input.instanceId,
      weaponId: input.weaponId,
      stats: { ...definition },
      cooldownSeconds: 0,
      cooldownDurationSeconds: 0,
      projectileCarry: initialProjectileCarry(input.instanceId),
      orbitAngleRadians: 0,
    },
  };
}
