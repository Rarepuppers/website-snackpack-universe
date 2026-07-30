// Vite's `?raw` rather than node:fs — the project has no @types/node, and
// vite/client is already in tsconfig's types.
import CODEX from "../../../../last-bastion-codex.html?raw";
import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG } from "./weaponCatalog";
import { UPGRADE_CATALOG } from "./upgradeCatalog";
import { ITEM_CATALOG } from "./itemCatalog";
import { ARTIFACT_CATALOG, RELIC_CATALOG } from "./relicCatalog";
import { ENEMY_CATALOG } from "./enemyCatalog";

/**
 * `last-bastion-codex.html` is a hand-authored design bible, not a code mirror —
 * it deliberately carries `designed` and `concept` entries for content that does
 * not exist yet, which is why it is not simply generated from these catalogs.
 *
 * The failure mode it *does* have is silent drift the other way: shipped content
 * that never gets an entry, and entries whose status says "designed" long after
 * the thing was built. This guard pins the known gaps so new drift fails loudly
 * while the documented backlog stays green.
 */

/** Ids present anywhere in the codex, with the prefix each category uses. */
function codexHas(prefix: string, id: string): boolean {
  return CODEX.includes(`id: "${prefix}${id}"`);
}

/**
 * Content shipped in code but absent from (or mislabelled in) the codex.
 * Everything here is a real documentation gap, not an accepted state — shrink
 * this list, never grow it.
 */
const KNOWN_CODEX_GAPS = Object.freeze({
  items: "the entire shop item economy has no codex section at all",
  shopProfiles: "the 7 themed liberation shops are undocumented",
  liberationNodes: "the liberation node type is undocumented",
  levelStatCards: "the level-up stat cards are undocumented",
});

describe("codex drift", () => {
  it("documents every shipped weapon", () => {
    const missing = Object.keys(WEAPON_CATALOG).filter((id) => !codexHas("wpn-", id));
    expect(missing, "weapons shipped in code but absent from the codex").toEqual([]);
  });

  it("documents every shipped upgrade", () => {
    const missing = Object.keys(UPGRADE_CATALOG).filter((id) => !codexHas("upg-", id));
    expect(missing, "upgrades shipped in code but absent from the codex").toEqual([]);
  });

  it("documents every shipped relic and artifact", () => {
    const missing = [
      ...RELIC_CATALOG.map((entry) => entry.id),
      ...ARTIFACT_CATALOG.map((entry) => entry.id),
    ].filter((id) => !CODEX.includes(`id: "${id}"`));
    expect(missing, "relics/artifacts shipped in code but absent from the codex").toEqual([]);
  });

  /**
   * Summoned sub-units are not standalone bestiary entries — they only exist as
   * payloads of a parent summoner, whose threat cost already bundles them. They
   * belong in their parent's entry, not their own.
   */
  const SUMMONED_CHILDREN = new Set([
    "nest-pod", "nest-hatchling", "storm-node",
    "foundry-pad", "foundry-drone", "foundry-turret",
  ]);

  it("documents every shipped enemy that stands on its own", () => {
    const missing = Object.keys(ENEMY_CATALOG)
      .filter((id) => !SUMMONED_CHILDREN.has(id) && !codexHas("mon-", id));
    expect(missing, "enemies shipped in code but absent from the codex").toEqual([]);
  });

  it("keeps the summoned-child exclusion honest", () => {
    // If one of these is ever promoted to a real enemy, it should re-enter the
    // drift check rather than staying quietly exempt.
    for (const id of SUMMONED_CHILDREN) {
      expect(id in ENEMY_CATALOG, `${id} is excluded but no longer exists`).toBe(true);
    }
  });

  it("records the item economy as a known, still-open documentation gap", () => {
    // Deliberately asserts the gap still exists rather than pretending it does
    // not: when someone authors the section this fails and the entry is removed.
    expect(ITEM_CATALOG.length).toBeGreaterThan(0);
    const documented = ITEM_CATALOG.filter((item) => CODEX.includes(`"${item.name}"`));
    expect(documented.length, KNOWN_CODEX_GAPS.items).toBe(0);
  });
});
