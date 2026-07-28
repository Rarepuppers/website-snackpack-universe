import type { BuildViewModel } from "../build/BuildViewModel";

/** Read-only presentation contract; scene wiring can mount this in combat, map, or pause. */
export interface BuildOverlayModel { title: string; heroLine: string; weaponLines: readonly string[]; statLines: readonly string[]; synergyLines: readonly string[]; }
export function buildOverlayModel(view: BuildViewModel): BuildOverlayModel {
  return { title: "BUILD", heroLine: `${view.hero.name}${view.perkId ? ` · ${view.perkId}` : ""}`, weaponLines: [...view.rack, ...view.stash].filter(Boolean).map((weapon) => `${weapon!.name} · ${weapon!.dpsLabel} DPS ${weapon!.estimatedDps.toFixed(1)}`), statLines: [`Damage ${view.effectiveStats.damagePercent}%`, `Crit ${view.effectiveStats.critChancePercent}%`, `Range ${view.effectiveStats.rangePercent}%`], synergyLines: [...view.synergyTags] };
}
