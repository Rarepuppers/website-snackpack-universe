import type { WeaponId } from "../content/weaponCatalog";

/**
 * Four-wide pages match the real Scrap Shop and debrief capacity. Keeping the
 * route data in one place means HUD, shop, and summary always review the same
 * identities rather than maintaining three drifting fixture lists.
 */
export const WEAPON_REVIEW_PAGES = Object.freeze({
  "core-1": ["scattergun", "patrol-blade", "bolt-carbine", "grenade-tube"],
  "core-2": ["arc-carbine", "bulwark-rotary-cannon", "injector-carbine", "bastion-service-rifle"],
  "special-1": ["marauder-ar", "event-horizon"],
  "68a-1": ["railspike", "seeker-swarm", "cryo-lance", "tesla-coil"],
  "68a-2": ["flamethrower", "sawblade", "combat-knife", "machete"],
  "68b-1": ["fire-axe", "shock-baton", "breaching-maul", "plasma-saber"],
  "68b-2": ["corrosive-lobber", "scourge-repeater", "bile-lance", "rime-cleaver"],
  "68c-1": ["hoarfrost-scatter", "glacier-ward", "tether-harpoon", "sentry-stake"],
  "68c-2": ["emberlance", "storm-coil-beam", "blight-scythe"],
} as const satisfies Readonly<Record<string, readonly WeaponId[]>>);

export type WeaponReviewPageId = keyof typeof WEAPON_REVIEW_PAGES;

export function weaponReviewPage(search: string | URLSearchParams): readonly WeaponId[] | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const requested = params.get("weaponreview")?.trim().toLowerCase();
  return requested && requested in WEAPON_REVIEW_PAGES
    ? WEAPON_REVIEW_PAGES[requested as WeaponReviewPageId]
    : null;
}
