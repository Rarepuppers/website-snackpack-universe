import type { WeaponId } from "../content/weaponCatalog";

export const FRIENDLY_PROJECTILE_SOFT_BUDGET = 256;
export const FRIENDLY_PROJECTILE_HARD_CAP = 512;

export class FriendlyProjectileBudget {
  private readonly suppressedByWeapon: Partial<Record<WeaponId, number>> = {};

  admit(activeCount: number, weaponId: WeaponId): boolean {
    if (activeCount < FRIENDLY_PROJECTILE_HARD_CAP) return true;
    this.suppressedByWeapon[weaponId] = (this.suppressedByWeapon[weaponId] ?? 0) + 1;
    return false;
  }

  snapshot(): Readonly<Partial<Record<WeaponId, number>>> {
    return { ...this.suppressedByWeapon };
  }
}
