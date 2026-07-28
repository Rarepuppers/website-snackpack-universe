import type { WeaponId } from "../content/weaponCatalog";

export interface WeaponIdentityPresentation { weaponId: WeaponId; silhouetteId: string; tileFrame: number; colour: number; effectStyle: "projectile" | "beam" | "orbit" | "melee" | "explosive"; dedicatedAssetId: string | null; }

/** Exhaustive identity registry. Null assets intentionally select the code-native silhouette until approved art lands. */
export const WEAPON_IDENTITY_PRESENTATIONS: Readonly<Record<WeaponId, WeaponIdentityPresentation>> = Object.freeze({
  "bastion-service-rifle": { weaponId: "bastion-service-rifle", silhouetteId: "rifle", tileFrame: 7, colour: 0xffd36b, effectStyle: "projectile", dedicatedAssetId: null },
  scattergun: { weaponId: "scattergun", silhouetteId: "wide-muzzle", tileFrame: 0, colour: 0xf0b46b, effectStyle: "projectile", dedicatedAssetId: null },
  "arc-carbine": { weaponId: "arc-carbine", silhouetteId: "forked-arc", tileFrame: 4, colour: 0x68e4e8, effectStyle: "projectile", dedicatedAssetId: null },
  "patrol-blade": { weaponId: "patrol-blade", silhouetteId: "patrol-blade", tileFrame: 1, colour: 0xc7e4ec, effectStyle: "melee", dedicatedAssetId: null },
  "bolt-carbine": { weaponId: "bolt-carbine", silhouetteId: "long-bolt", tileFrame: 2, colour: 0xd9edf2, effectStyle: "projectile", dedicatedAssetId: null },
  "bulwark-rotary-cannon": { weaponId: "bulwark-rotary-cannon", silhouetteId: "rotary", tileFrame: 5, colour: 0xc48bff, effectStyle: "projectile", dedicatedAssetId: null },
  "grenade-tube": { weaponId: "grenade-tube", silhouetteId: "grenade-shell", tileFrame: 3, colour: 0xff9a62, effectStyle: "explosive", dedicatedAssetId: null },
  "injector-carbine": { weaponId: "injector-carbine", silhouetteId: "injector", tileFrame: 6, colour: 0x8ff0a4, effectStyle: "projectile", dedicatedAssetId: null },
  railspike: { weaponId: "railspike", silhouetteId: "rail-spike", tileFrame: 7, colour: 0xb7d7ff, effectStyle: "projectile", dedicatedAssetId: null },
  "seeker-swarm": { weaponId: "seeker-swarm", silhouetteId: "seeker-cluster", tileFrame: 7, colour: 0xffe680, effectStyle: "projectile", dedicatedAssetId: null },
  "cryo-lance": { weaponId: "cryo-lance", silhouetteId: "cryo-lance", tileFrame: 0, colour: 0x9ee8ff, effectStyle: "beam", dedicatedAssetId: null },
  "tesla-coil": { weaponId: "tesla-coil", silhouetteId: "tesla-coil", tileFrame: 4, colour: 0x9b8cff, effectStyle: "orbit", dedicatedAssetId: null },
  flamethrower: { weaponId: "flamethrower", silhouetteId: "flame-jet", tileFrame: 0, colour: 0xff734d, effectStyle: "beam", dedicatedAssetId: null },
  sawblade: { weaponId: "sawblade", silhouetteId: "sawblade", tileFrame: 1, colour: 0xe0e7ef, effectStyle: "orbit", dedicatedAssetId: null },
  "event-horizon": { weaponId: "event-horizon", silhouetteId: "gravity-well", tileFrame: 3, colour: 0xa684ff, effectStyle: "explosive", dedicatedAssetId: "event-horizon-v1" },
  "combat-knife": { weaponId: "combat-knife", silhouetteId: "knife", tileFrame: 1, colour: 0xc8d4dd, effectStyle: "melee", dedicatedAssetId: null },
  machete: { weaponId: "machete", silhouetteId: "machete", tileFrame: 1, colour: 0xe2d0aa, effectStyle: "melee", dedicatedAssetId: null },
  "fire-axe": { weaponId: "fire-axe", silhouetteId: "fire-axe", tileFrame: 1, colour: 0xff744d, effectStyle: "melee", dedicatedAssetId: null },
  "shock-baton": { weaponId: "shock-baton", silhouetteId: "shock-baton", tileFrame: 1, colour: 0x68e4e8, effectStyle: "melee", dedicatedAssetId: null },
  "breaching-maul": { weaponId: "breaching-maul", silhouetteId: "breaching-maul", tileFrame: 1, colour: 0xd19a69, effectStyle: "melee", dedicatedAssetId: null },
  "plasma-saber": { weaponId: "plasma-saber", silhouetteId: "plasma-saber", tileFrame: 1, colour: 0xff8cf0, effectStyle: "melee", dedicatedAssetId: null },
});

export function weaponIdentityPresentation(weaponId: WeaponId): WeaponIdentityPresentation { return WEAPON_IDENTITY_PRESENTATIONS[weaponId]; }
