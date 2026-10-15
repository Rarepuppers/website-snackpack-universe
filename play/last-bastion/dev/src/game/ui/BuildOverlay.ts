import { RELIC_CATALOG, ARTIFACT_CATALOG } from "../content/relicCatalog";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { createTransformationCodexSnapshot } from "../transformations/TransformationSnapshot";
import { TRANSFORMATION_COMMIT_AFFINITY, TRANSFORMATION_ASCEND_AFFINITY, TRANSFORMATION_APEX_AFFINITY } from "../transformations/TransformationAffinity";
import type { BuildViewModel } from "../build/BuildViewModel";

/** Read-only presentation contract; scene wiring can mount this in combat, map, or pause. */
export interface BuildOverlayModel {
  title: string;
  heroLine: string;
  weaponLines: readonly string[];
  stashLines: readonly string[];
  affinityLines: readonly string[];
  statLines: readonly string[];
  synergyLines: readonly string[];
  relicLines: readonly string[];
}

export function buildOverlayModel(view: BuildViewModel): BuildOverlayModel {
  return {
    title: "CURRENT BUILD",
    heroLine: `${view.hero.name}${view.perkId ? ` / ${PERK_CATALOG.find(perk => perk.id === view.perkId)?.name ?? "Unknown perk"}` : ""}`,
    weaponLines: view.rack.filter(Boolean)
      .map((weapon) => `${weapon!.name} T${weapon!.tier} / Est. DPS ${weapon!.estimatedDps.toFixed(1)}`),
    stashLines: view.stashLabels ?? view.stash.filter(Boolean).map(weapon => `${weapon!.name} T${weapon!.tier}`),
    affinityLines: [
      `Commit ${TRANSFORMATION_COMMIT_AFFINITY} / Ascend ${TRANSFORMATION_ASCEND_AFFINITY} / Apex ${TRANSFORMATION_APEX_AFFINITY} affinity`,
      "Committing locks other paths. Their exposure is retained.",
      ...createTransformationCodexSnapshot(view.transformation).paths.map(path =>
        `${path.name}: ${path.affinity} (${path.stage})${path.committed ? " - committed" : view.transformation.committedPathId ? " - inactive" : ""}`),
    ],
    statLines: [
      `Damage ${view.effectiveStats.damagePercent}%`,
      `Crit ${view.effectiveStats.critChancePercent}% x${view.effectiveStats.critMultiplier}`,
      `Range ${view.effectiveStats.rangePercent}%`,
      `Armour bonus ${view.effectiveStats.armourFlat}`,
      `Speed ${view.effectiveStats.moveSpeedPercent}%`,
    ],
    synergyLines: [...view.synergyTags],
    relicLines: [
      ...view.relicIds.map((id) => `Relic: ${RELIC_CATALOG.find(relic => relic.id === id)?.name ?? "Unknown relic"}`),
      ...(view.artifactId ? [`Artifact: ${ARTIFACT_CATALOG.find(artifact => artifact.id === view.artifactId)?.name ?? "Unknown artifact"}`] : []),
    ],
  };
}

export interface BuildPage { title: string; lines: readonly string[]; }
/** Bounded rows, with no silent inventory truncation. */
export function buildPages(build: BuildOverlayModel): BuildPage[] {
  const sections = [
    ["EQUIPPED WEAPONS", build.weaponLines], ["STASH", build.stashLines],
    ["COMBAT STATS", build.statLines], ["RELICS / ARTIFACT", build.relicLines],
    ["SYNERGIES", build.synergyLines], ["TRANSFORMATION AFFINITY", build.affinityLines],
  ] as const;
  return sections.flatMap(([title, lines]) => {
    const pages: BuildPage[] = [];
    for (let i = 0; i < Math.max(1, lines.length); i += 6) {
      pages.push({ title: title === "TRANSFORMATION AFFINITY" ? title : `${title} (${lines.length})`, lines: lines.length ? lines.slice(i, i + 6) : ["None yet"] });
    }
    return pages;
  });
}
