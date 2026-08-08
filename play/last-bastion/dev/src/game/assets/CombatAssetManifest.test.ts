import { describe, expect, it } from "vitest";
import type { WorldObjectArtAssetId } from "../arena/WorldObjectCatalog";
import { ARENA_THEMES, arenaThemeById } from "../rendering/arenaThemes";
import { combatAssetsForSession } from "./CombatAssetManifest";
import { GAME_ASSET_MANIFEST, type GameAssetId } from "./GameAssetManifest";

describe("combatAssetsForSession", () => {
  it("loads only the active arena, selected hero and present object families", () => {
    const assets = combatAssetsForSession({
      arenaTheme: arenaThemeById("machine-foundry")!,
      heroId: "medic",
      productionArt: true,
      helmet: true,
      worldObjectAssetIds: ["world-objects-military-v1"],
    });
    const ids = new Set(assets.map((asset) => asset.id));

    expect(ids.has("machine-foundry-floor-v1")).toBe(true);
    expect(ids.has("machine-foundry-boundary-v1")).toBe(true);
    expect(ids.has("machine-foundry-fixtures-v1")).toBe(true);
    expect(ids.has("machine-foundry-decals-v1")).toBe(true);
    expect(ids.has("bastion-logistics-floor-v1")).toBe(false);
    expect(ids.has("alien-hive-floor-v1")).toBe(false);
    expect(ids.has("medic-base-v1")).toBe(true);
    expect(ids.has("medic-helmet-v1")).toBe(true);
    expect(ids.has("marine-base-v1")).toBe(false);
    expect(ids.has("world-objects-military-v1")).toBe(true);
    expect(ids.has("world-objects-natural-v1")).toBe(false);
    expect(ids.has("world-objects-organic-v1")).toBe(false);
  });

  it("excludes route and gallery art while retaining transition-safe combat UI", () => {
    const assets = combatAssetsForSession({
      arenaTheme: arenaThemeById("bastion-standard")!,
      heroId: "marine",
      productionArt: true,
      helmet: false,
      worldObjectAssetIds: [],
    });
    const ids = new Set(assets.map((asset) => asset.id));

    expect(ids.has("marine-select-portrait-v1")).toBe(false);
    expect(ids.has("bastion-logistics-map-backdrop-v1")).toBe(false);
    expect(ids.has("siege-crusher-portrait-v1")).toBe(false);
    expect(ids.has("action-tiles-v1")).toBe(false);
    expect(ids.has("scrap-shop-panel-v1")).toBe(true);
    expect(ids.has("batch-i-weapon-tiles-v1")).toBe(true);
    expect(ids.has("batch-i-hotkey-tiles-v1")).toBe(true);
    expect(ids.has("batch-b-effects-v1")).toBe(true);
    expect(ids.has("batch-c-effects-v1")).toBe(true);
    expect(ids.has("quartermaster-v1")).toBe(true);
  });

  it("uses no authored hero, arena or object art in placeholder mode", () => {
    const objectIds: WorldObjectArtAssetId[] = [
      "world-objects-military-v1",
      "world-objects-natural-v1",
      "world-objects-organic-v1",
    ];
    const assets = combatAssetsForSession({
      arenaTheme: arenaThemeById("toxic-bloom")!,
      heroId: "marine",
      productionArt: false,
      helmet: true,
      worldObjectAssetIds: objectIds,
    });
    const ids = new Set(assets.map((asset) => asset.id));

    expect(ids.has("marine-base-v1")).toBe(false);
    expect(ids.has("marine-helmet-v1")).toBe(false);
    expect(ids.has("toxic-bloom-floor-v1")).toBe(false);
    expect(objectIds.some((id) => ids.has(id))).toBe(false);
  });

  it("is stable, unique and smaller than the full catalog", () => {
    const selection = {
      arenaTheme: arenaThemeById("surface-frontier")!,
      heroId: "marine" as const,
      productionArt: true,
      helmet: true,
      worldObjectAssetIds: ["world-objects-natural-v1"] as const,
    };
    const first = combatAssetsForSession(selection);
    const second = combatAssetsForSession(selection);

    expect(first).toEqual(second);
    expect(new Set(first.map((asset) => asset.id)).size).toBe(first.length);
    expect(first.length).toBeLessThan(GAME_ASSET_MANIFEST.length);
  });

  it("registers every authored texture used by every arena theme", () => {
    for (const arenaTheme of ARENA_THEMES) {
      const ids = new Set(combatAssetsForSession({
        arenaTheme,
        heroId: "marine",
        productionArt: true,
        helmet: true,
        worldObjectAssetIds: [],
      }).map((asset) => asset.id));

      expect(ids.has(arenaTheme.floorTexture as GameAssetId), `${arenaTheme.id} floor`).toBe(true);
      expect(ids.has(arenaTheme.boundaryTexture as GameAssetId), `${arenaTheme.id} boundary`).toBe(true);
      expect(ids.has(arenaTheme.obstacleTexture as GameAssetId), `${arenaTheme.id} obstacle`).toBe(true);
      if (arenaTheme.decalTexture) {
        expect(ids.has(arenaTheme.decalTexture as GameAssetId), `${arenaTheme.id} decals`).toBe(true);
      }
    }
  });

  it("loads only the current encounter's body, auxiliary and effect art", () => {
    const ids = new Set(combatAssetsForSession({
      arenaTheme: arenaThemeById("machine-foundry")!,
      heroId: "marine",
      productionArt: true,
      helmet: false,
      worldObjectAssetIds: [],
      enemyTypes: ["foundry-fabricator", "foundry-drone"],
      miniBossKinds: [],
      eliteKinds: [],
    }).map((asset) => asset.id));

    expect(ids.has("machine-foundry-fabricator-v1")).toBe(true);
    expect(ids.has("machine-foundry-drone-v1")).toBe(true);
    expect(ids.has("machine-foundry-pad-v1")).toBe(true);
    expect(ids.has("machine-foundry-turret-v1")).toBe(true);
    expect(ids.has("machine-foundry-effects-v1")).toBe(true);
    expect(ids.has("storm-regent-v1")).toBe(false);
    expect(ids.has("storm-regent-effects-v1")).toBe(false);
    expect(ids.has("rift-stalker-effects-v1")).toBe(false);
  });

  it("keeps nested encounter support art with its parent roster", () => {
    const ids = new Set(combatAssetsForSession({
      arenaTheme: arenaThemeById("toxic-bloom")!,
      heroId: "marine",
      productionArt: true,
      helmet: false,
      worldObjectAssetIds: [],
      enemyTypes: ["nest-weaver"],
    }).map((asset) => asset.id));

    expect(ids.has("nest-weaver-v1")).toBe(true);
    expect(ids.has("nest-pod-v1")).toBe(true);
    expect(ids.has("swarm-scuttler-v1")).toBe(true);
    expect(ids.has("nest-effects-v1")).toBe(true);
    expect(ids.has("machine-foundry-effects-v1")).toBe(false);
  });

  /**
   * Both mini-bosses summon `egg-cluster` mid-fight via the shared
   * `layBroodEggs`, and an unhatched-but-uncleared egg later hatches into a
   * `scuttler` — neither appears in the wave's *initial* enemy snapshot, which
   * is the only thing `preload()` sees. Without the same special-casing
   * `nest-weaver` already gets for its own runtime summons, a solo boss node
   * (nothing else in the initial roster to accidentally pull the asset in)
   * ships a broken texture the instant the boss lays its first egg.
   */
  it.each(["brood-warden", "bastion-eater"] as const)(
    "keeps the summoned egg-cluster and its scuttler hatch with a solo %s node",
    (bossType) => {
      const ids = new Set(combatAssetsForSession({
        arenaTheme: arenaThemeById("bastion-logistics")!,
        heroId: "marine",
        productionArt: true,
        helmet: false,
        worldObjectAssetIds: [],
        enemyTypes: [bossType],
      }).map((asset) => asset.id));

      expect(ids.has("egg-cluster-v1")).toBe(true);
      expect(ids.has("batch-c-effects-v1")).toBe(true);
      expect(ids.has("scuttler-v1")).toBe(true);
      expect(ids.has("batch-b-effects-v1")).toBe(true);
      expect(ids.has("machine-foundry-effects-v1")).toBe(false);
    },
  );
});
