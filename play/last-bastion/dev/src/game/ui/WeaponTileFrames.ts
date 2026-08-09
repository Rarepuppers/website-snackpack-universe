import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";

export interface WeaponTilePresentation {
  texture: "batch-i-weapon-tiles-v1" | "marauder-ar-tile-v1";
  frame?: number;
}

/** Standalone tiles override the shared Batch I atlas without changing its stable eight-frame contract. */
export function weaponTilePresentation(weaponId: WeaponId): WeaponTilePresentation {
  if (weaponId === "marauder-ar") return { texture: "marauder-ar-tile-v1" };
  return { texture: "batch-i-weapon-tiles-v1", frame: canonicalWeaponTileFrame(weaponId) };
}

/**
 * Batch I master order, shared by every compact weapon presentation.
 *
 * Eight weapons own a slot. The thirteen released on 26 July 2026 have no Batch
 * I art yet, so rather than parking all of them on the rifle's frame they are
 * grouped by **attack pattern** onto the closest existing motif: a Flamethrower
 * reads as a blade-ish sweep sooner than it reads as a rifle, and two melee
 * tools sitting on the same tile is far less confusing than a Sawblade and a
 * Railspike sharing one. Same placeholder budget, better grouping. Replace each
 * `case` with its own slot as the tiles land.
 */
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
    default: return placeholderFrameByPattern(weaponId);
  }
}

/** Which owned tile a not-yet-authored weapon borrows, chosen by how it plays. */
function placeholderFrameByPattern(weaponId: WeaponId): number {
  const stats = WEAPON_CATALOG[weaponId];
  switch (stats.attackPattern) {
    // Contact weapons and the orbiting blade borrow the Patrol Blade.
    case "melee-sweep":
    case "orbit-blade":
      return 1;
    // Sustained cones and any other spread borrow the Scattergun — the
    // spread-shaped tile. `scatter` previously fell through to the rifle, which
    // put a shotgun-shaped weapon on the least shotgun-shaped tile.
    case "beam":
    case "scatter":
      return 0;
    // The orbiting coil borrows the Arc Carbine, its own damage family.
    case "orbit":
      return 4;
    case "chain-projectile":
      return 4;
    // A planted stake reads as ordnance you put down, so it borrows the
    // Grenade Tube alongside the shells.
    case "deployable":
      return 3;
    // Everything else is a projectile. Explosive/gravitic shells borrow the
    // Grenade Tube; the rest borrow the rifle.
    default:
      return stats.explosionRadiusMetres > 0 ? 3 : 7;
  }
}
