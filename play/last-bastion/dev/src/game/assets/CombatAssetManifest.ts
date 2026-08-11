import type { WorldObjectArtAssetId } from "../arena/WorldObjectCatalog";
import type { HeroDefinition } from "../hero/HeroDefinition";
import type { ArenaTheme } from "../rendering/arenaThemes";
import {
  GAME_ASSET_MANIFEST,
  type GameAssetDefinition,
  type GameAssetId,
} from "./GameAssetManifest";

export interface CombatAssetSelection {
  arenaTheme: ArenaTheme;
  heroId: HeroDefinition["id"];
  productionArt: boolean;
  helmet: boolean;
  worldObjectAssetIds: readonly WorldObjectArtAssetId[];
  /** When present, restricts enemy body sheets to this known encounter roster. */
  enemyTypes?: readonly string[];
  eliteKinds?: readonly string[];
  miniBossKinds?: readonly string[];
}

const HERO_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "marine-base-v1",
  "marine-helmet-v1",
  "medic-base-v1",
  "medic-helmet-v1",
  "assault-base-v1",
  "assault-breach-overlay-v1",
  "tactician-base-v1",
  "scout-base-v1",
]);

const WORLD_OBJECT_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "world-objects-military-v1",
  "world-objects-natural-v1",
  "world-objects-organic-v1",
]);

const GALLERY_ONLY_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "siege-crusher-portrait-v1",
  "brood-warden-portrait-v1",
  "bastion-eater-portrait-v1",
  "the-choir-portrait-v1",
  "foundry-sovereign-portrait-v1",
  "rift-stalker-portrait-v1",
  "synapse-herald-portrait-v1",
  "assembly-prime-portrait-v1",
  "storm-regent-portrait-v1",
  "abomination-prime-portrait-v1",
  "medic-portrait-v1",
  "action-tiles-v1",
  "weapon-tiles-v1",
  "event-horizon-tile-v1",
  "aurum-tiles-v1",
  "batch-i-perk-tiles-v1",
  "batch-i-shop-counter-v1",
  "batch-i-shop-glyphs-v1",
]);

const ROUTE_ONLY_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "canonical-perk-tiles-v2",
  "marine-select-portrait-v1",
  "medic-select-portrait-v1",
  "assault-select-portrait-v1",
  "assault-roster-tile-v1",
  "tactician-select-portrait-v1",
  "tactician-roster-tile-v1",
  "scout-select-portrait-v1",
  "scout-roster-tile-v1",
  "bastion-logistics-map-backdrop-v1",
  "alien-hive-map-backdrop-v1",
  "machine-foundry-map-backdrop-v1",
  "science-wing-map-backdrop-v1",
  "void-approach-map-backdrop-v1",
  "arctic-relay-map-backdrop-v1",
]);

const ARENA_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "arena-floor-v1",
  "arena-boundary-v1",
  "arena-obstacle-v1",
  "emberfall-floor-v1",
  "emberfall-boundary-v1",
  "emberfall-obstacles-v1",
  "emberfall-decals-v1",
  "toxic-bloom-floor-v1",
  "toxic-bloom-boundary-v1",
  "toxic-bloom-obstacles-v1",
  "toxic-bloom-decals-v1",
  "void-approach-floor-v1",
  "void-approach-boundary-v1",
  "void-approach-obstacles-v1",
  "void-approach-decals-v1",
  "arctic-relay-floor-v1",
  "arctic-relay-boundary-v1",
  "arctic-relay-obstacles-v1",
  "arctic-relay-decals-v1",
  "science-wing-floor-v1",
  "science-wing-boundary-v1",
  "science-wing-fixtures-v1",
  "science-wing-decals-v1",
  "bastion-logistics-floor-v1",
  "bastion-logistics-boundary-v1",
  "bastion-logistics-fixtures-v1",
  "bastion-logistics-decals-v1",
  "machine-foundry-floor-v1",
  "machine-foundry-boundary-v1",
  "machine-foundry-fixtures-v1",
  "machine-foundry-decals-v1",
  "alien-hive-floor-v1",
  "alien-hive-boundary-v1",
  "alien-hive-fixtures-v1",
  "alien-hive-decals-v1",
  "surface-frontier-floor-v1",
  "surface-frontier-boundary-v1",
  "surface-frontier-fixtures-v1",
  "surface-frontier-decals-v1",
  "starship-transit-floor-v1",
  "starship-transit-boundary-v1",
  "starship-transit-fixtures-v1",
  "starship-transit-decals-v1",
  "containment-underworld-floor-v1",
  "containment-underworld-boundary-v1",
  "containment-underworld-fixtures-v1",
  "containment-underworld-decals-v1",
]);

const ENEMY_BODY_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  "scuttler-v1", "egg-cluster-v1", "brain-blob-v1", "slime-spitter-v1", "carapace-scuttler-v1",
  "siege-crusher-v1", "blast-mite-v1", "warp-flanker-v1", "brood-warden-v1", "rift-stalker-v1",
  "synapse-herald-v1", "assembly-prime-v1", "storm-regent-v1", "abomination-prime-v1",
  "ripper-v1", "razor-scuttler-v1", "quillback-v1", "spinewheel-v1", "spinewheel-shell-v1",
  "tether-bloom-v1", "bastion-eater-v1", "bastion-eater-nodes-v1", "the-choir-v1", "foundry-sovereign-v1", "aurum-hoarder-v1",
  "corrupted-survivor-v1", "corrupted-marine-v1", "abomination-v1", "nest-weaver-v1", "nest-pod-v1",
  "swarm-scuttler-v1", "storm-savant-v1", "storm-node-v1", "machine-scrap-skitterer-v1",
  "machine-arc-warden-v1", "machine-cyborg-reclaimer-v1", "machine-foundry-fabricator-v1",
  "machine-foundry-pad-v1", "machine-foundry-drone-v1", "machine-foundry-turret-v1",
  "razorlord-v1", "blightspitter-v1", "quillback-matriarch-v1",
  "ironhide-abomination-v1", "splitcaller-weaver-v1", "voltaic-warden-v1",
]);

const ENCOUNTER_SPECIFIC_ASSET_IDS: ReadonlySet<GameAssetId> = new Set([
  ...ENEMY_BODY_ASSET_IDS,
  "brood-warden-effects-v1", "rift-stalker-effects-v1", "synapse-herald-effects-v1",
  "assembly-prime-pad-v1", "assembly-prime-effects-v1",
  "storm-conductive-node-v1", "storm-regent-effects-v1",
  "abomination-prime-biomass-v1", "abomination-prime-effects-v1",
  "ripper-effects-v1", "razor-scuttler-effects-v1", "quillback-effects-v1",
  "spinewheel-effects-v1", "tether-bloom-effects-v1",
  "bastion-eater-nodes-v1", "bastion-eater-effects-v1", "bastion-eater-environment-v1",
  "the-choir-effects-v1", "foundry-sovereign-effects-v1",
  "aurum-hoarder-effects-v1", "corrupted-marine-effects-v1",
  "nest-effects-v1", "storm-node-v1", "storm-effects-v1",
  "machine-scrap-skitterer-effects-v1", "machine-arc-warden-effects-v1",
  "machine-cyborg-reclaimer-effects-v1", "machine-foundry-pad-v1",
  "machine-foundry-drone-v1", "machine-foundry-turret-v1", "machine-foundry-effects-v1",
  "elite-dash-puddle-effects-v1",
]);

const ENCOUNTER_ASSETS_BY_TYPE: Readonly<Record<string, readonly GameAssetId[]>> = Object.freeze({
  scuttler: ["batch-b-effects-v1"], "egg-cluster": ["batch-c-effects-v1"], "brain-blob": ["batch-c-effects-v1"],
  "slime-spitter": ["batch-b-effects-v1"], "carapace-scuttler": ["batch-b-effects-v1"],
  "siege-crusher": ["batch-b-effects-v1"], "blast-mite": ["batch-c-effects-v1"], "warp-flanker": ["batch-c-effects-v1"],
  "brood-warden": ["brood-warden-effects-v1"], "rift-stalker": ["rift-stalker-effects-v1"],
  "synapse-herald": ["synapse-herald-effects-v1"], "assembly-prime": ["assembly-prime-pad-v1", "assembly-prime-effects-v1"],
  "storm-regent": ["storm-conductive-node-v1", "storm-regent-effects-v1"],
  "abomination-prime": ["abomination-prime-biomass-v1", "abomination-prime-effects-v1"],
  ripper: ["ripper-effects-v1"], "razor-scuttler": ["razor-scuttler-effects-v1"], quillback: ["quillback-effects-v1"],
  spinewheel: ["spinewheel-effects-v1"], "tether-bloom": ["tether-bloom-effects-v1"],
  "bastion-eater": ["bastion-eater-nodes-v1", "bastion-eater-effects-v1", "bastion-eater-environment-v1"],
  "the-choir": ["the-choir-effects-v1"],
  "foundry-sovereign": ["machine-foundry-drone-v1", "machine-foundry-turret-v1", "machine-foundry-effects-v1", "foundry-sovereign-effects-v1"],
  "aurum-hoarder": ["aurum-hoarder-effects-v1"], "infected-survivor": ["batch-c-effects-v1"],
  "corrupted-marine": ["corrupted-marine-effects-v1"], abomination: ["batch-c-effects-v1"],
  "nest-weaver": ["nest-effects-v1"], "nest-pod": ["nest-effects-v1"], "nest-hatchling": ["nest-effects-v1"],
  "swarm-scuttler": ["nest-effects-v1"], "storm-savant": ["storm-node-v1", "storm-effects-v1"],
  "storm-node": ["storm-effects-v1"], "scrap-skitterer": ["machine-scrap-skitterer-effects-v1"],
  "arc-warden": ["machine-arc-warden-effects-v1"], "cyborg-reclaimer": ["machine-cyborg-reclaimer-effects-v1"],
  "foundry-fabricator": ["machine-foundry-pad-v1", "machine-foundry-drone-v1", "machine-foundry-turret-v1", "machine-foundry-effects-v1"],
  "foundry-pad": ["machine-foundry-effects-v1"], "foundry-drone": ["machine-foundry-effects-v1"],
  "foundry-turret": ["machine-foundry-effects-v1"],
});

const ENEMY_BODY_BY_TYPE: Readonly<Record<string, readonly GameAssetId[]>> = Object.freeze({
  scuttler: ["scuttler-v1"],
  "egg-cluster": ["egg-cluster-v1"],
  "brain-blob": ["brain-blob-v1"],
  "slime-spitter": ["slime-spitter-v1"],
  "carapace-scuttler": ["carapace-scuttler-v1"],
  "siege-crusher": ["siege-crusher-v1"],
  "blast-mite": ["blast-mite-v1"],
  "warp-flanker": ["warp-flanker-v1"],
  "brood-warden": ["brood-warden-v1"],
  "rift-stalker": ["rift-stalker-v1"],
  "synapse-herald": ["synapse-herald-v1"],
  "assembly-prime": ["assembly-prime-v1"],
  "storm-regent": ["storm-regent-v1"],
  "abomination-prime": ["abomination-prime-v1"],
  ripper: ["ripper-v1"],
  "razor-scuttler": ["razor-scuttler-v1"],
  quillback: ["quillback-v1"],
  spinewheel: ["spinewheel-v1", "spinewheel-shell-v1"],
  "tether-bloom": ["tether-bloom-v1"],
  "bastion-eater": ["bastion-eater-v1", "bastion-eater-nodes-v1"],
  "the-choir": ["the-choir-v1"],
  "foundry-sovereign": ["foundry-sovereign-v1"],
  "aurum-hoarder": ["aurum-hoarder-v1"],
  "infected-survivor": ["corrupted-survivor-v1"],
  "corrupted-marine": ["corrupted-marine-v1"],
  abomination: ["abomination-v1"],
  "nest-weaver": ["nest-weaver-v1"],
  "nest-pod": ["nest-pod-v1"],
  "nest-hatchling": ["swarm-scuttler-v1"],
  "swarm-scuttler": ["swarm-scuttler-v1"],
  "storm-savant": ["storm-savant-v1"],
  "storm-node": ["storm-node-v1"],
  "scrap-skitterer": ["machine-scrap-skitterer-v1"],
  "arc-warden": ["machine-arc-warden-v1"],
  "cyborg-reclaimer": ["machine-cyborg-reclaimer-v1"],
  "foundry-fabricator": ["machine-foundry-fabricator-v1"],
  "foundry-pad": ["machine-foundry-pad-v1"],
  "foundry-drone": ["machine-foundry-drone-v1"],
  "foundry-turret": ["machine-foundry-turret-v1"],
});

const ELITE_BODY_BY_KIND: Readonly<Record<string, GameAssetId>> = Object.freeze({
  "carapace-scuttler": "carapace-scuttler-v1",
  razorlord: "razorlord-v1",
  blightspitter: "blightspitter-v1",
  "quillback-matriarch": "quillback-matriarch-v1",
  "ironhide-abomination": "ironhide-abomination-v1",
  "splitcaller-weaver": "splitcaller-weaver-v1",
  "voltaic-warden": "voltaic-warden-v1",
});

const MINI_BOSS_BODY_BY_KIND: Readonly<Record<string, GameAssetId>> = Object.freeze({
  "siege-crusher": "siege-crusher-v1",
  "brood-warden": "brood-warden-v1",
  "rift-stalker": "rift-stalker-v1",
  "synapse-herald": "synapse-herald-v1",
  "assembly-prime": "assembly-prime-v1",
  "storm-regent": "storm-regent-v1",
  "abomination-prime": "abomination-prime-v1",
});

/**
 * Returns the complete art set a combat session may need, while excluding
 * assets owned by other routes and inactive arena/hero variants. Enemy,
 * weapon, HUD, effect, reward, and shop assets remain eager so a wave, level-up
 * or shop decision can never reveal a missing texture.
 */
export function combatAssetsForSession(
  selection: CombatAssetSelection,
): readonly GameAssetDefinition[] {
  const selectedIds = new Set<GameAssetId>();
  const restrictEnemyBodies = Boolean(selection.enemyTypes?.length);
  const requiredEnemyBodyIds = requiredEnemyBodyIdsForSelection(selection);

  for (const asset of GAME_ASSET_MANIFEST) {
    if (ROUTE_ONLY_ASSET_IDS.has(asset.id) || GALLERY_ONLY_ASSET_IDS.has(asset.id)) continue;
    if (HERO_ASSET_IDS.has(asset.id) || ARENA_ASSET_IDS.has(asset.id) || WORLD_OBJECT_ASSET_IDS.has(asset.id)) continue;
    if (restrictEnemyBodies && ENCOUNTER_SPECIFIC_ASSET_IDS.has(asset.id) && !requiredEnemyBodyIds.has(asset.id)) continue;
    selectedIds.add(asset.id);
  }

  if (selection.productionArt) {
    if (selection.heroId === "medic") {
      selectedIds.add("medic-base-v1");
      if (selection.helmet) selectedIds.add("medic-helmet-v1");
    } else if (selection.heroId === "marine") {
      selectedIds.add("marine-base-v1");
      if (selection.helmet) selectedIds.add("marine-helmet-v1");
    } else if (selection.heroId === "assault") {
      selectedIds.add("assault-base-v1");
      if (selection.helmet) selectedIds.add("assault-breach-overlay-v1");
    } else if (selection.heroId === "tactician") {
      selectedIds.add("tactician-base-v1");
    } else if (selection.heroId === "scout") {
      selectedIds.add("scout-base-v1");
    }
    addArenaTexture(selectedIds, selection.arenaTheme.floorTexture);
    addArenaTexture(selectedIds, selection.arenaTheme.boundaryTexture);
    addArenaTexture(selectedIds, selection.arenaTheme.obstacleTexture);
    if (selection.arenaTheme.decalTexture) {
      addArenaTexture(selectedIds, selection.arenaTheme.decalTexture);
    }
    for (const assetId of selection.worldObjectAssetIds) selectedIds.add(assetId);
  }
  for (const assetId of requiredEnemyBodyIds) selectedIds.add(assetId);

  return GAME_ASSET_MANIFEST.filter((asset) => selectedIds.has(asset.id));
}

function requiredEnemyBodyIdsForSelection(selection: CombatAssetSelection): ReadonlySet<GameAssetId> {
  const required = new Set<GameAssetId>();
  if (!selection.enemyTypes?.length) return required;

  for (const enemyType of selection.enemyTypes) {
    for (const assetId of ENEMY_BODY_BY_TYPE[enemyType] ?? []) required.add(assetId);
    for (const assetId of ENCOUNTER_ASSETS_BY_TYPE[enemyType] ?? []) required.add(assetId);
    if (enemyType === "nest-weaver") {
      required.add("nest-pod-v1");
      required.add("swarm-scuttler-v1");
    }
    // Brood Warden and Bastion Eater both summon `egg-cluster` mid-fight
    // through the shared `layBroodEggs`, and an egg left alive hatches into a
    // `scuttler` — neither appears in the wave's *initial* enemy snapshot,
    // which is all `preload()` can see. Unlike Nest Weaver's own special
    // case, egg-cluster's and scuttler's effect batches are not shared with
    // either boss's own effects, so both bodies AND both effect batches need
    // adding explicitly, or a solo boss node ships a broken texture the
    // instant the boss lays its first egg.
    if (enemyType === "brood-warden" || enemyType === "bastion-eater") {
      required.add("egg-cluster-v1");
      required.add("batch-c-effects-v1");
      required.add("scuttler-v1");
      required.add("batch-b-effects-v1");
    }
    if (enemyType === "storm-regent") required.add("storm-node-v1");
    if (enemyType === "foundry-fabricator" || enemyType === "cyborg-reclaimer") {
      required.add("machine-foundry-pad-v1");
      required.add("machine-foundry-drone-v1");
      required.add("machine-foundry-turret-v1");
    }
  }
  for (const eliteKind of selection.eliteKinds ?? []) {
    const assetId = ELITE_BODY_BY_KIND[eliteKind];
    if (assetId) required.add(assetId);
    if (eliteKind === "razorlord" || eliteKind === "blightspitter") {
      required.add("elite-dash-puddle-effects-v1");
    }
  }
  for (const miniBossKind of selection.miniBossKinds ?? []) {
    const assetId = MINI_BOSS_BODY_BY_KIND[miniBossKind];
    if (assetId) required.add(assetId);
  }
  return required;
}

function addArenaTexture(selectedIds: Set<GameAssetId>, assetId: string): void {
  if (!ARENA_ASSET_IDS.has(assetId as GameAssetId)) {
    throw new Error(`Arena theme references an unregistered combat texture: ${assetId}`);
  }
  selectedIds.add(assetId as GameAssetId);
}
