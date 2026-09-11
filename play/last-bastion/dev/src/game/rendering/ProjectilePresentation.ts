import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";

export type ProjectileEffectTexture =
  | "combat-effects-v1"
  | "batch-b-effects-v1"
  | "marauder-ar-effects-v1"
  | "bolt-carbine-effects-v1"
  | "injector-carbine-effects-v1"
  | "bulwark-rotary-effects-v1"
  | "grenade-tube-effects-v1"
  | "event-horizon-effects-v1";

export interface ProjectileImpactPresentation {
  texture: ProjectileEffectTexture;
  frame: number;
  durationMilliseconds: number;
  startScale: number;
  endScale: number;
}

export interface ProjectilePresentation {
  texture: ProjectileEffectTexture;
  frame: number;
  scale: number;
  haloRadius: number;
  trailLength: number;
  tintWithWeaponColor: boolean;
  impact: Readonly<ProjectileImpactPresentation>;
}

const genericImpact = Object.freeze({
  texture: "combat-effects-v1" as const,
  frame: 7,
  durationMilliseconds: 130,
  startScale: 0.5,
  endScale: 0.92,
});

function generic(scale: number, haloRadius = 6, trailLength = 18): Readonly<ProjectilePresentation> {
  return Object.freeze({
    texture: "combat-effects-v1",
    frame: 6,
    scale,
    haloRadius,
    trailLength,
    tintWithWeaponColor: true,
    impact: genericImpact,
  });
}

function authored(
  texture: ProjectileEffectTexture,
  frame: number,
  scale: number,
  haloRadius: number,
  trailLength: number,
  impact: ProjectileImpactPresentation = genericImpact,
): Readonly<ProjectilePresentation> {
  return Object.freeze({
    texture,
    frame,
    scale,
    haloRadius,
    trailLength,
    tintWithWeaponColor: false,
    impact: Object.freeze(impact),
  });
}

/**
 * Every weapon makes an explicit projectile-presentation decision. `null`
 * means its attack never creates a friendly projectile. Keeping this a total
 * record turns a newly added invisible weapon into a type error.
 */
export const PROJECTILE_PRESENTATIONS: Readonly<Record<WeaponId, Readonly<ProjectilePresentation> | null>> = Object.freeze({
  "bastion-service-rifle": generic(0.48, 6.5, 20),
  "marauder-ar": authored("marauder-ar-effects-v1", 1, 0.42, 6, 18, {
    texture: "marauder-ar-effects-v1", frame: 2, durationMilliseconds: 115, startScale: 0.4, endScale: 0.82,
  }),
  scattergun: authored("batch-b-effects-v1", 1, 0.32, 5.5, 13),
  "arc-carbine": authored("batch-b-effects-v1", 6, 0.38, 6, 18),
  "patrol-blade": null,
  "bolt-carbine": authored("bolt-carbine-effects-v1", 1, 0.58, 7, 21),
  "bulwark-rotary-cannon": authored("bulwark-rotary-effects-v1", 1, 0.38, 5.5, 14, {
    texture: "bulwark-rotary-effects-v1", frame: 4, durationMilliseconds: 120, startScale: 0.48, endScale: 0.9,
  }),
  "grenade-tube": authored("grenade-tube-effects-v1", 0, 0.48, 9, 14),
  "injector-carbine": authored("injector-carbine-effects-v1", 0, 0.5, 6.5, 18, {
    texture: "injector-carbine-effects-v1", frame: 2, durationMilliseconds: 150, startScale: 0.52, endScale: 1.05,
  }),
  railspike: generic(0.52, 7, 24),
  "seeker-swarm": generic(0.44, 6, 16),
  "cryo-lance": null,
  "tesla-coil": null,
  flamethrower: null,
  sawblade: null,
  "event-horizon": authored("event-horizon-effects-v1", 0, 0.58, 9, 14),
  "combat-knife": null,
  machete: null,
  "fire-axe": null,
  "shock-baton": null,
  "breaching-maul": null,
  "plasma-saber": null,
  "corrosive-lobber": generic(0.5, 7, 16),
  "scourge-repeater": generic(0.46, 6, 18),
  "bile-lance": null,
  "rime-cleaver": null,
  "hoarfrost-scatter": generic(0.36, 5.5, 13),
  "glacier-ward": null,
  "tether-harpoon": generic(0.52, 7, 24),
  "sentry-stake": generic(0.46, 6, 18),
  "auxiliary-drone": generic(0.44, 6, 16),
  emberlance: generic(0.5, 7, 21),
  "storm-coil-beam": null,
  "blight-scythe": null,
});

export function projectilePresentation(weaponId: WeaponId): Readonly<ProjectilePresentation> {
  const presentation = PROJECTILE_PRESENTATIONS[weaponId];
  if (!presentation) {
    throw new Error(`${WEAPON_CATALOG[weaponId].displayName} emitted an unexpected projectile`);
  }
  return presentation;
}

export function projectileTrailLength(weaponId: WeaponId, reducedMotionEnabled: boolean): number {
  return reducedMotionEnabled ? 0 : projectilePresentation(weaponId).trailLength;
}
