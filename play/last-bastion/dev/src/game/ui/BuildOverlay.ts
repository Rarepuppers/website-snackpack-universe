import type { BuildViewModel } from "../build/BuildViewModel";

/** Read-only presentation contract; scene wiring can mount this in combat, map, or pause. */
export interface BuildOverlayModel {
  title: string;
  heroLine: string;
  weaponLines: readonly string[];
  statLines: readonly string[];
  synergyLines: readonly string[];
  relicLines: readonly string[];
}

export function buildOverlayModel(view: BuildViewModel): BuildOverlayModel {
  return {
    title: "CURRENT BUILD",
    heroLine: `${view.hero.name}${view.perkId ? ` / ${view.perkId}` : ""}`,
    weaponLines: [...view.rack, ...view.stash].filter(Boolean)
      .map((weapon) => `${weapon!.name} T${weapon!.tier} / DPS ${weapon!.estimatedDps.toFixed(1)}`),
    statLines: [
      `Damage ${view.effectiveStats.damagePercent}%`,
      `Crit ${view.effectiveStats.critChancePercent}% x${view.effectiveStats.critMultiplier}`,
      `Range ${view.effectiveStats.rangePercent}%`,
      `Armour bonus ${view.effectiveStats.armourFlat}`,
      `Speed ${view.effectiveStats.moveSpeedPercent}%`,
    ],
    synergyLines: [...view.synergyTags],
    relicLines: [
      ...view.relicIds.map((id) => `Relic: ${id}`),
      ...(view.artifactId ? [`Artifact: ${view.artifactId}`] : []),
    ],
  };
}
