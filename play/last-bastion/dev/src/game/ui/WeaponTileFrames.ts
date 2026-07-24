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
    // Railspike/Seeker Swarm have no Batch I tile yet (art pending, Phase 4);
    // reuse the rifle's frame as a placeholder until their own slots exist.
    case "railspike": return 7;
    case "seeker-swarm": return 7;
    case "cryo-lance": return 7;
    case "tesla-coil": return 7;
    case "flamethrower": return 7;
    case "sawblade": return 7;
    // Event Horizon has its own dedicated art (event-horizon-tile-v1, Batch L
    // preflight) rather than a Batch I atlas slot — this shared-atlas mapping
    // doesn't really apply to it. Returns a placeholder only so the switch
    // stays exhaustive; real rendering should reach for its own asset id.
    case "event-horizon": return 7;
  }
}
