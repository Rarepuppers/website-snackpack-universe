import { ITEM_CATALOG, type ItemTag } from "../content/itemCatalog";
import { ARTIFACT_CATALOG, RELIC_CATALOG, type ArtifactId, type RelicId } from "../content/relicCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import type { EliteKind } from "./EliteCadence";

export interface RankRewardOption {
  id: string;
  name: string;
  description: string;
}

export interface RankRewardDecision {
  kind: "rank-reward";
  title: string;
  options: readonly RankRewardOption[];
}

const ELITE_ITEM_TAGS: Readonly<Record<EliteKind, readonly ItemTag[]>> = Object.freeze({
  "carapace-scuttler": ["defence", "sustain"],
  razorlord: ["melee", "mobility"],
  blightspitter: ["elemental", "sustain"],
  "quillback-matriarch": ["ranged", "crit"],
  "ironhide-abomination": ["defence", "melee"],
  "splitcaller-weaver": ["sustain", "ranged"],
  "voltaic-warden": ["elemental", "ranged"],
});

function drawDistinct<T>(pool: readonly T[], count: number, randomUnits: readonly number[]): readonly T[] {
  const candidates = [...pool];
  const chosen: T[] = [];
  while (chosen.length < count && candidates.length > 0) {
    const roll = randomUnits[chosen.length] ?? 0;
    const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(roll * candidates.length)));
    chosen.push(candidates.splice(index, 1)[0]!);
  }
  return chosen;
}

/** Elite caches offer items aligned to the elite's combat lesson. */
export function planEliteRewardDecision(input: {
  eliteKind: EliteKind;
  randomUnits: readonly number[];
}): RankRewardDecision {
  const tags = ELITE_ITEM_TAGS[input.eliteKind];
  const pool = ITEM_CATALOG.filter((item) => (
    item.rarity !== "cursed" && item.tags.some((tag) => tags.includes(tag))
  ));
  const options = drawDistinct(pool.length >= 3 ? pool : ITEM_CATALOG, 3, input.randomUnits)
    .map((item) => ({ id: `item:${item.id}`, name: item.name, description: item.description }));
  return {
    kind: "rank-reward",
    title: `${input.eliteKind.replaceAll("-", " ").toUpperCase()} CACHE — CHOOSE AN ITEM`,
    options,
  };
}

/** Mini-boss caches make the player choose between run identity and build depth. */
export function planMiniBossRewardDecision(input: {
  ownedRelicIds: readonly RelicId[];
  eligibleUpgradeIds: readonly UpgradeId[];
  randomUnits: readonly number[];
}): RankRewardDecision | null {
  const owned = new Set(input.ownedRelicIds);
  const relics = drawDistinct(
    RELIC_CATALOG.filter((relic) => !owned.has(relic.id)),
    2,
    input.randomUnits,
  );
  const upgrade = drawDistinct(input.eligibleUpgradeIds, 1, input.randomUnits.slice(relics.length))[0];
  const options: RankRewardOption[] = relics.map((relic) => ({
    id: `relic:${relic.id}`,
    name: relic.name,
    description: relic.description,
  }));
  if (upgrade) {
    const definition = UPGRADE_CATALOG[upgrade];
    options.push({
      id: `upgrade:${upgrade}`,
      name: definition.name,
      description: definition.levelDescriptions[0]!,
    });
  }
  return options.length > 0
    ? { kind: "rank-reward", title: "MINI-BOSS CACHE — RELIC OR UPGRADE", options }
    : null;
}

const OBJECTIVE_RELIC_IDS: readonly RelicId[] = Object.freeze([
  "rel-field-lattice",
  "rel-salvage-optics",
  "rel-overwatch-rig",
]);

/** Objective completions are the exclusive source of a small utility relic pool. */
export function planObjectiveRewardDecision(
  ownedRelicIds: readonly RelicId[],
): RankRewardDecision | null {
  const owned = new Set(ownedRelicIds);
  const options = OBJECTIVE_RELIC_IDS
    .filter((id) => !owned.has(id))
    .map((id) => RELIC_CATALOG.find((relic) => relic.id === id)!)
    .map((relic) => ({ id: `relic:${relic.id}`, name: relic.name, description: relic.description }));
  return options.length > 0
    ? { kind: "rank-reward", title: "OBJECTIVE SECURED — CHOOSE A RELIC", options }
    : null;
}

/** Boss victories replace the generic item roll with a run-defining artifact choice. */
export function planBossRewardDecision(input: {
  equippedArtifactId: ArtifactId | null;
  randomUnits: readonly number[];
}): RankRewardDecision {
  const pool = ARTIFACT_CATALOG.filter((artifact) => artifact.id !== input.equippedArtifactId);
  const options = drawDistinct(pool.length > 0 ? pool : ARTIFACT_CATALOG, 3, input.randomUnits)
    .map((artifact) => ({
      id: `artifact:${artifact.id}`,
      name: artifact.name,
      description: artifact.description,
    }));
  return { kind: "rank-reward", title: "BOSS VAULT — CHOOSE AN ARTIFACT", options };
}

export type RankRewardChoice =
  | { kind: "item"; itemId: string }
  | { kind: "relic"; relicId: RelicId }
  | { kind: "artifact"; artifactId: ArtifactId }
  | { kind: "upgrade"; upgradeId: UpgradeId };

export function parseRankRewardChoice(optionId: string): RankRewardChoice | null {
  const [kind, id] = optionId.split(":", 2);
  if (!id) return null;
  if (kind === "item" && ITEM_CATALOG.some((item) => item.id === id)) return { kind, itemId: id };
  if (kind === "relic" && RELIC_CATALOG.some((relic) => relic.id === id)) return { kind, relicId: id as RelicId };
  if (kind === "artifact" && ARTIFACT_CATALOG.some((artifact) => artifact.id === id)) return { kind, artifactId: id as ArtifactId };
  if (kind === "upgrade" && id in UPGRADE_CATALOG) return { kind, upgradeId: id as UpgradeId };
  return null;
}
