import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";
import { applyEventResolutionToBuild, type EventResolution } from "./EncounterEventCatalog";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import { relicById, artifactById } from "../content/relicCatalog";
import { powerupDisplayName } from "../content/powerupCatalog";
import { transformationChoiceById } from "../transformations/TransformationChoiceCatalog";
import { transformationPathById } from "../transformations/TransformationPathCatalog";

/** Describes the actual applied build, not the outcome flags or narrative promises. */
export function eventOutcomeSummary(before: ExpeditionBuildSnapshot, resolution: EventResolution): string[] {
  if (resolution.rejectedReason) return [resolution.rejectedReason, "Nothing was spent or granted."];
  const after = applyEventResolutionToBuild(resolution);
  const lines: string[] = [];
  const number = (value: number) => String(Number(value.toFixed(2)));
  const delta = (label: string, old: number, current: number) => {
    if (old !== current) lines.push(`${label}: ${number(old)} → ${number(current)}`);
  };
  delta("Health", before.health, after.health);
  delta("Shield", before.shield, after.shield);
  delta("Scrap", before.scrap, after.scrap);
  delta("Experience", before.experience, after.experience);
  delta("Maximum-health bonus", before.maxHealthBonus ?? 0, after.maxHealthBonus ?? 0);
  delta("Extra weapon slots", before.weaponSlotBonus ?? 0, after.weaponSlotBonus ?? 0);
  delta("Healing per kill", before.bonusLifestealPerKill ?? 0, after.bonusLifestealPerKill ?? 0);

  const counts = <T>(values: readonly T[], key: (value: T) => string) => {
    const result = new Map<string, number>();
    for (const value of values) result.set(key(value), (result.get(key(value)) ?? 0) + 1);
    return result;
  };
  const weapons = (rows: ExpeditionBuildSnapshot["weapons"]) => counts(rows, row =>
    `${WEAPON_CATALOG[row.weaponId as WeaponId]?.displayName ?? "Unknown weapon"} (tier ${row.tier})`);
  const oldWeapons = weapons(before.weapons), newWeapons = weapons(after.weapons);
  for (const name of new Set([...oldWeapons.keys(), ...newWeapons.keys()])) {
    delta(name, oldWeapons.get(name) ?? 0, newWeapons.get(name) ?? 0);
  }
  const oldUpgrades = new Map(before.upgrades.map(row => [row.upgradeId, row.level]));
  const newUpgrades = new Map(after.upgrades.map(row => [row.upgradeId, row.level]));
  for (const id of new Set([...oldUpgrades.keys(), ...newUpgrades.keys()])) {
    delta(`${UPGRADE_CATALOG[id as UpgradeId]?.name ?? "Unknown upgrade"} rank`, oldUpgrades.get(id) ?? 0, newUpgrades.get(id) ?? 0);
  }
  for (const id of new Set([...(before.relicIds ?? []), ...(after.relicIds ?? [])])) {
    const old = before.relicIds?.filter(row => row === id).length ?? 0;
    const current = after.relicIds?.filter(row => row === id).length ?? 0;
    delta(`${relicById(id).name} copies`, old, current);
    if (old !== current && Math.max(old, current) > 1) {
      lines.push("Relic effects do not stack; spare copies can be sacrificed separately.");
    }
  }
  if ((before.equippedArtifactId ?? null) !== (after.equippedArtifactId ?? null)) {
    const name = (id: typeof before.equippedArtifactId) => id ? artifactById(id).name : "None";
    lines.push(`Artifact: ${name(before.equippedArtifactId)} → ${name(after.equippedArtifactId)}`);
  }
  for (const type of new Set([...(before.carriedConsumables ?? []), ...(after.carriedConsumables ?? [])])) {
    delta(`${powerupDisplayName(type)} kits`, before.carriedConsumables?.filter(row => row === type).length ?? 0,
      after.carriedConsumables?.filter(row => row === type).length ?? 0);
  }
  const oldPaths = before.transformation?.paths ?? [], newPaths = after.transformation?.paths ?? [];
  for (const id of new Set([...oldPaths.map(row => row.pathId), ...newPaths.map(row => row.pathId)])) {
    const old = oldPaths.find(row => row.pathId === id), current = newPaths.find(row => row.pathId === id);
    delta(`${transformationPathById(id).name} affinity`, old?.affinity ?? 0, current?.affinity ?? 0);
    for (const choice of new Set([...(old?.choiceIds ?? []), ...(current?.choiceIds ?? [])])) {
      delta(`${transformationChoiceById(choice).boon.name} rank`, old?.choiceIds.filter(row => row === choice).length ?? 0,
        current?.choiceIds.filter(row => row === choice).length ?? 0);
    }
  }
  const committed = after.transformation?.committedPathId;
  if (committed && committed !== before.transformation?.committedPathId) lines.push(`Committed to ${transformationPathById(committed).name}.`);
  if (resolution.effects.ambush) lines.push("Ambush — continue into combat.");
  return lines.length ? lines : ["No build changes."];
}
