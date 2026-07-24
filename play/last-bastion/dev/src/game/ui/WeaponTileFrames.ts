import type { WeaponId } from "../content/weaponCatalog";

/** Batch I master order, shared by every compact weapon presentation. */
export function canonicalWeaponTileFrame(weaponId: WeaponId): number {
  switch (weaponId) {
    case "scattergun": return 0;
    case "patrol-blade": return 1;
    case "bolt-carbine": return 2;
    case "grenade-tube": return 3;
    case "arc-carbine": return 4;
    case "bulwark-rotary-cannon": return 5;
    case "injector-carbine": return 6;
    case "bastion-service-rifle": return 7;
    // Railspike has no Batch I tile yet (art pending, Phase 4); reuses the
    // rifle's frame as a placeholder until its own atlas slot is produced.
    case "railspike": return 7;
  }
}
