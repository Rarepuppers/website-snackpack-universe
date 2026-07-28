import { isPerkId, unlockedPerkIds, type PerkId } from "../perks/perkCatalog";
import type { HeroDefinition } from "../hero/HeroDefinition";
import {
  DEFAULT_CONTROL_BINDINGS,
  normalizeControlBindings,
  type ControlBindings,
} from "../input/ControlBindings";
import {
  createRunSummary,
  totalRunDamage,
  type RunMetrics,
  type RunSummary,
} from "../run/RunSummary";
import {
  cloneTransformationAffinityState,
  normalizeTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";
import { isArtifactId, isRelicId, type ArtifactId, type RelicId } from "../content/relicCatalog";
import { ITEM_STAT_KEYS, isItemId } from "../content/itemCatalog";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";

/**
 * Versioned local persistence for settings and basic run progress.
 *
 * Browser storage can be cleared at any time, so nothing here may be treated
 * as a permanent cloud save. The schema carries a version number so future
 * releases can migrate rather than silently corrupt older data.
 */
export interface GameSettings {
  screenShakeEnabled: boolean;
  reducedFlashEnabled: boolean;
  soundEnabled: boolean;
  damageNumbersEnabled: boolean;
  cooldownTimersEnabled: boolean;
  autoFireEnabled: boolean;
  enemyHealthBars: "off" | "threats" | "all";
  reducedMotionEnabled: boolean;
  highContrastOutlinesEnabled: boolean;
  uiScale: 0.8 | 1 | 1.2;
  masterVolume: number;
  sfxVolume: number;
  uiVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  gamepadMoveDeadzone: number;
  gamepadAimDeadzone: number;
  gamepadAimSensitivity: number;
  aimAssistStrength: number;
  displaySizePercent: number;
  radarSize: 0.75 | 1 | 1.25;
}

/**
 * One Monsterdex row. `seen` reveals the alien's name and silhouette; `kills`
 * reveals its stats once the threshold is met. Keyed by bestiary key
 * (elite kind, mini-boss kind, or enemy type) so a Carapace Scuttler is a
 * distinct dex entry from an ordinary Scuttler.
 */
export interface BestiaryEntry {
  seen: number;
  kills: number;
}

export interface GameProgress {
  runsFinished: number;
  victories: number;
  bestWaveReached: number;
  nodesCleared: number;
  bestNodesCleared: number;
  totalKills: number;
  totalDamage: number;
  totalScrapEarned: number;
  bestiary: Record<string, BestiaryEntry>;
}

/**
 * Mid-run expedition autosave (schema v2, metrics in v4, inert transformation
 * state in v8, Shrine/Event reward carrier in v9, shop item carrier in v10).
 * Written when the dropship returns to the map, cleared when the run ends.
 * Shapes mirror `expedition/ExpeditionRun.ts`; kept structural here so the save
 * layer never imports game logic.
 */
export interface ExpeditionSave {
  mapSeed: number;
  currentNodeId: number;
  clearedNodeIds: number[];
  build: {
    health: number;
    shield: number;
    level: number;
    experience: number;
    scrap: number;
    weapons: { weaponId: string; tier: number }[];
    upgrades: { upgradeId: string; level: number }[];
    transformation?: TransformationAffinityState;
    relicIds?: readonly RelicId[];
    equippedArtifactId?: ArtifactId | null;
    maxHealthBonus?: number;
    weaponSlotBonus?: number;
    /** Purchased catalogue items, duplicates allowed — they stack. */
    ownedItemIds?: readonly string[];
    /** Raw stat grants that are not catalogue items (level-up cards, event rewards). */
    itemStats?: Partial<PlayerStatBlock>;
    /** Shop stock banned for the rest of the run; the ban verb is run-long, not per-visit. */
    bannedShopIds?: readonly string[];
  } | null;
  metrics: RunMetrics;
}

/**
 * Current schema version. Single source of truth — the cloud-save policy and the
 * platform adapter gate on it, so bumping it here is the only edit a migration needs.
 */
export const SAVE_SCHEMA_VERSION = 12;

export interface SaveData {
  version: typeof SAVE_SCHEMA_VERSION;
  settings: GameSettings;
  controls: ControlBindings;
  progress: GameProgress;
  expedition: ExpeditionSave | null;
  selectedPerkId: PerkId | null;
  selectedHeroId: HeroDefinition["id"];
  lastRunSummary: RunSummary | null;
}

export const SAVE_STORAGE_KEY = "last-bastion-save";

/** Kills required before a dex entry reveals its stats. Mirrored in the codex page. */
export const BESTIARY_KILLS_TO_REVEAL = 10;

export const DEFAULT_SAVE: Readonly<SaveData> = Object.freeze({
  version: SAVE_SCHEMA_VERSION,
  settings: Object.freeze({
    screenShakeEnabled: true,
    reducedFlashEnabled: false,
    soundEnabled: true,
    damageNumbersEnabled: true,
    cooldownTimersEnabled: true,
    autoFireEnabled: true,
    enemyHealthBars: "threats",
    reducedMotionEnabled: false,
    highContrastOutlinesEnabled: false,
    uiScale: 1,
    masterVolume: 1,
    sfxVolume: 1,
    uiVolume: 1,
    musicVolume: 1,
    ambienceVolume: 1,
    gamepadMoveDeadzone: 0.18,
    gamepadAimDeadzone: 0.25,
    gamepadAimSensitivity: 1,
    aimAssistStrength: 0,
    displaySizePercent: 100,
    radarSize: 1,
  }),
  controls: DEFAULT_CONTROL_BINDINGS,
  progress: Object.freeze({
    runsFinished: 0,
    victories: 0,
    bestWaveReached: 0,
    nodesCleared: 0,
    bestNodesCleared: 0,
    totalKills: 0,
    totalDamage: 0,
    totalScrapEarned: 0,
    bestiary: Object.freeze({}) as Record<string, BestiaryEntry>,
  }),
  expedition: null,
  selectedPerkId: "perk-veteran",
  selectedHeroId: "marine",
  lastRunSummary: null,
});

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export class LocalSaveStore {
  private cached: SaveData;

  constructor(
    private readonly storage: StorageLike | null,
    private readonly key: string = SAVE_STORAGE_KEY,
  ) {
    this.cached = this.readFromStorage();
  }

  load(): SaveData {
    return cloneSave(this.cached);
  }

  updateSettings(partial: Partial<GameSettings>): SaveData {
    const nextSettings = normalizeSettings({ ...this.cached.settings, ...partial });
    this.cached = {
      ...this.cached,
      settings: nextSettings,
    };
    this.writeToStorage();
    return this.load();
  }

  updateControlBindings(controls: ControlBindings): SaveData {
    this.cached = { ...this.cached, controls: normalizeControlBindings(controls) };
    this.writeToStorage();
    return this.load();
  }

  selectPerk(perkId: PerkId | null): SaveData {
    this.cached = { ...this.cached, selectedPerkId: perkId };
    this.writeToStorage();
    return this.load();
  }

  selectHero(heroId: HeroDefinition["id"]): SaveData {
    this.cached = { ...this.cached, selectedHeroId: heroId };
    this.writeToStorage();
    return this.load();
  }

  recordNodeCleared(count = 1): SaveData {
    this.cached = {
      ...this.cached,
      progress: {
        ...this.cached.progress,
        nodesCleared: this.cached.progress.nodesCleared + Math.max(0, Math.floor(count)),
      },
    };
    this.writeToStorage();
    return this.load();
  }

  /**
   * Merges a batch of dex sightings and kills. Called with accumulated counts
   * rather than per kill, so a busy wave does not write to storage 200 times.
   */
  recordBestiary(batch: Readonly<Record<string, Partial<BestiaryEntry>>>): SaveData {
    const bestiary: Record<string, BestiaryEntry> = { ...this.cached.progress.bestiary };
    let changed = false;
    for (const [key, delta] of Object.entries(batch)) {
      const seen = Math.max(0, Math.floor(delta.seen ?? 0));
      const kills = Math.max(0, Math.floor(delta.kills ?? 0));
      if (seen === 0 && kills === 0) {
        continue;
      }
      const current = bestiary[key] ?? { seen: 0, kills: 0 };
      bestiary[key] = { seen: current.seen + seen, kills: current.kills + kills };
      changed = true;
    }
    if (!changed) {
      return this.load();
    }
    this.cached = {
      ...this.cached,
      progress: { ...this.cached.progress, bestiary },
    };
    this.writeToStorage();
    return this.load();
  }

  /** Autosaves the mid-run expedition state; called when returning to the map. */
  saveExpedition(expedition: ExpeditionSave): SaveData {
    this.cached = { ...this.cached, expedition: cloneExpedition(expedition) };
    this.writeToStorage();
    return this.load();
  }

  /** Ends the mid-run autosave; the "Continue expedition" card disappears. */
  clearExpedition(): SaveData {
    this.cached = { ...this.cached, expedition: null };
    this.writeToStorage();
    return this.load();
  }

  recordRunEnd(outcome: { victory: boolean; waveReached: number; summary?: RunSummary }): SaveData {
    const summary = outcome.summary;
    // Expedition nodes are committed as they are cleared. Rewind this run's
    // contribution when comparing unlocks so the debrief still announces a
    // Quartermaster/Pathfinder milestone crossed earlier on the route.
    const runStartProgress: GameProgress = {
      ...this.cached.progress,
      nodesCleared: Math.max(0, this.cached.progress.nodesCleared - (summary?.nodesCleared ?? 0)),
    };
    const beforeUnlocks = new Set(unlockedPerkIds(runStartProgress));
    const nextProgress: GameProgress = {
      ...this.cached.progress,
      runsFinished: this.cached.progress.runsFinished + 1,
      victories: this.cached.progress.victories + (outcome.victory ? 1 : 0),
      bestWaveReached: Math.max(
        this.cached.progress.bestWaveReached,
        Math.max(0, Math.floor(outcome.waveReached)),
      ),
      bestNodesCleared: Math.max(
        this.cached.progress.bestNodesCleared,
        summary?.nodesCleared ?? 0,
      ),
      totalKills: this.cached.progress.totalKills + (summary?.kills ?? 0),
      totalDamage: this.cached.progress.totalDamage + (summary ? totalRunDamage(summary) : 0),
      totalScrapEarned: this.cached.progress.totalScrapEarned + (summary?.scrapEarned ?? 0),
    };
    const newlyUnlockedPerkIds = unlockedPerkIds(nextProgress).filter((id) => !beforeUnlocks.has(id));
    this.cached = {
      ...this.cached,
      progress: nextProgress,
      lastRunSummary: summary
        ? createRunSummary({ ...summary, newlyUnlockedPerkIds })
        : this.cached.lastRunSummary,
    };
    this.writeToStorage();
    return this.load();
  }

  private readFromStorage(): SaveData {
    if (!this.storage) {
      return cloneSave(DEFAULT_SAVE);
    }
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) {
        return cloneSave(DEFAULT_SAVE);
      }
      const parsed: unknown = JSON.parse(raw);
      return normalizeSave(parsed);
    } catch {
      return cloneSave(DEFAULT_SAVE);
    }
  }

  private writeToStorage(): void {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(this.key, JSON.stringify(this.cached));
    } catch {
      // Storage may be full or blocked; the in-memory copy keeps working.
    }
  }
}

function normalizeSave(parsed: unknown): SaveData {
  if (typeof parsed !== "object" || parsed === null) {
    return cloneSave(DEFAULT_SAVE);
  }
  const candidate = parsed as Omit<Partial<SaveData>, "version"> & { version?: number };
  const version = candidate.version ?? -1;
  // Versions 1–10 migrate into the current schema. Missing fields inherit the
  // accessible defaults; unknown future versions degrade safely to defaults.
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(version)) {
    return cloneSave(DEFAULT_SAVE);
  }
  return {
    version: SAVE_SCHEMA_VERSION,
    settings: normalizeSettings(candidate.settings),
    controls: version >= 7
      ? normalizeControlBindings(candidate.controls)
      : normalizeControlBindings(DEFAULT_CONTROL_BINDINGS),
    progress: {
      runsFinished: readCount(candidate.progress?.runsFinished),
      victories: readCount(candidate.progress?.victories),
      bestWaveReached: readCount(candidate.progress?.bestWaveReached),
      nodesCleared: readCount(candidate.progress?.nodesCleared),
      bestNodesCleared: readCount(candidate.progress?.bestNodesCleared),
      totalKills: readCount(candidate.progress?.totalKills),
      totalDamage: readFiniteNonNegative(candidate.progress?.totalDamage),
      totalScrapEarned: readFiniteNonNegative(candidate.progress?.totalScrapEarned),
      bestiary: readBestiary(candidate.progress?.bestiary),
    },
    expedition: version >= 2 ? readExpedition(candidate.expedition) : null,
    selectedPerkId: version >= 3 && isPerkId(candidate.selectedPerkId)
      ? candidate.selectedPerkId
      : "perk-veteran",
    selectedHeroId: version >= 3 && candidate.selectedHeroId === "medic" ? "medic" : "marine",
    lastRunSummary: version >= 4 ? readRunSummary(candidate.lastRunSummary) : null,
  };
}

function readBoundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(value: unknown): GameSettings {
  const candidate = typeof value === "object" && value !== null
    ? value as Partial<GameSettings>
    : {};
  const uiScale = candidate.uiScale === 0.8 || candidate.uiScale === 1.2 ? candidate.uiScale : 1;
  const radarSize = candidate.radarSize === 0.75 || candidate.radarSize === 1.25 ? candidate.radarSize : 1;
  const enemyHealthBars = candidate.enemyHealthBars === "off" || candidate.enemyHealthBars === "all"
    ? candidate.enemyHealthBars
    : "threats";
  return {
    screenShakeEnabled: readBoolean(candidate.screenShakeEnabled, DEFAULT_SAVE.settings.screenShakeEnabled),
    reducedFlashEnabled: readBoolean(candidate.reducedFlashEnabled, DEFAULT_SAVE.settings.reducedFlashEnabled),
    soundEnabled: readBoolean(candidate.soundEnabled, DEFAULT_SAVE.settings.soundEnabled),
    damageNumbersEnabled: readBoolean(candidate.damageNumbersEnabled, DEFAULT_SAVE.settings.damageNumbersEnabled),
    cooldownTimersEnabled: readBoolean(candidate.cooldownTimersEnabled, DEFAULT_SAVE.settings.cooldownTimersEnabled),
    autoFireEnabled: readBoolean(candidate.autoFireEnabled, DEFAULT_SAVE.settings.autoFireEnabled),
    enemyHealthBars,
    reducedMotionEnabled: readBoolean(candidate.reducedMotionEnabled, DEFAULT_SAVE.settings.reducedMotionEnabled),
    highContrastOutlinesEnabled: readBoolean(candidate.highContrastOutlinesEnabled, DEFAULT_SAVE.settings.highContrastOutlinesEnabled),
    uiScale,
    masterVolume: readBoundedNumber(candidate.masterVolume, 1, 0, 1),
    sfxVolume: readBoundedNumber(candidate.sfxVolume, 1, 0, 1),
    uiVolume: readBoundedNumber(candidate.uiVolume, 1, 0, 1),
    musicVolume: readBoundedNumber(candidate.musicVolume, 1, 0, 1),
    ambienceVolume: readBoundedNumber(candidate.ambienceVolume, 1, 0, 1),
    gamepadMoveDeadzone: readBoundedNumber(candidate.gamepadMoveDeadzone, 0.18, 0, 1),
    gamepadAimDeadzone: readBoundedNumber(candidate.gamepadAimDeadzone, 0.25, 0, 1),
    gamepadAimSensitivity: readBoundedNumber(candidate.gamepadAimSensitivity, 1, 0.25, 3),
    aimAssistStrength: readBoundedNumber(candidate.aimAssistStrength, 0, 0, 1),
    displaySizePercent: readBoundedNumber(candidate.displaySizePercent, 100, 50, 200),
    radarSize,
  };
}

/** A malformed mid-run save degrades to "no run in progress", never a crash. */
function readExpedition(value: unknown): ExpeditionSave | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Partial<ExpeditionSave>;
  if (
    typeof candidate.mapSeed !== "number" || !Number.isFinite(candidate.mapSeed)
    || typeof candidate.currentNodeId !== "number"
    || !Array.isArray(candidate.clearedNodeIds)
    || !candidate.clearedNodeIds.every((id) => typeof id === "number")
  ) {
    return null;
  }
  return cloneExpedition({
    mapSeed: Math.floor(candidate.mapSeed),
    currentNodeId: Math.floor(candidate.currentNodeId),
    clearedNodeIds: candidate.clearedNodeIds.map((id) => Math.floor(id)),
    build: readBuild(candidate.build),
    metrics: readRunMetrics(candidate.metrics),
  });
}

function readBuild(value: unknown): ExpeditionSave["build"] {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as NonNullable<ExpeditionSave["build"]>;
  if (
    typeof candidate.health !== "number" || !Array.isArray(candidate.weapons)
    || !Array.isArray(candidate.upgrades)
  ) {
    return null;
  }
  return {
    health: candidate.health,
    shield: typeof candidate.shield === "number" ? candidate.shield : 0,
    level: readCount(candidate.level),
    experience: readCount(candidate.experience),
    scrap: readCount(candidate.scrap),
    weapons: candidate.weapons
      .filter((weapon) => typeof weapon?.weaponId === "string")
      .map((weapon) => ({ weaponId: weapon.weaponId, tier: readCount(weapon.tier) || 1 })),
    upgrades: candidate.upgrades
      .filter((upgrade) => typeof upgrade?.upgradeId === "string")
      .map((upgrade) => ({ upgradeId: upgrade.upgradeId, level: readCount(upgrade.level) || 1 })),
    transformation: normalizeTransformationAffinityState(candidate.transformation),
    ...readBuildRewards(candidate),
    ...readBuildItems(candidate),
  };
}

/**
 * Sanitizes the schema-v10 shop carrier. Without this the whole item economy is
 * inert: every node transition is a full page load, so items bought at one shop
 * were silently dropped before reaching the next node. Unknown item ids and
 * stat keys outside the block are discarded rather than trusted.
 */
function readBuildItems(candidate: {
  ownedItemIds?: unknown;
  itemStats?: unknown;
  bannedShopIds?: unknown;
}): Pick<NonNullable<ExpeditionSave["build"]>, "ownedItemIds" | "itemStats" | "bannedShopIds"> {
  const ownedItemIds = Array.isArray(candidate.ownedItemIds)
    ? candidate.ownedItemIds.filter(isItemId)
    : [];
  const bannedShopIds = Array.isArray(candidate.bannedShopIds)
    ? candidate.bannedShopIds.filter((id): id is string => typeof id === "string")
    : [];
  const itemStats: Partial<PlayerStatBlock> = {};
  if (typeof candidate.itemStats === "object" && candidate.itemStats !== null) {
    const source = candidate.itemStats as Partial<Record<keyof PlayerStatBlock, unknown>>;
    for (const key of ITEM_STAT_KEYS) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) itemStats[key] = value;
    }
  }
  return { ownedItemIds, itemStats, bannedShopIds };
}

/**
 * Sanitizes the schema-v9 Shrine/Event reward carrier: unknown relic/artifact
 * ids are dropped, bonuses coerce to finite numbers, and absent fields are
 * simply omitted so pre-v9 saves round-trip unchanged.
 */
function readBuildRewards(candidate: {
  relicIds?: unknown;
  equippedArtifactId?: unknown;
  maxHealthBonus?: unknown;
  weaponSlotBonus?: unknown;
}): Pick<NonNullable<ExpeditionSave["build"]>, "relicIds" | "equippedArtifactId" | "maxHealthBonus" | "weaponSlotBonus"> {
  const relicIds = Array.isArray(candidate.relicIds)
    ? candidate.relicIds.filter(isRelicId)
    : [];
  const equippedArtifactId = isArtifactId(candidate.equippedArtifactId)
    ? candidate.equippedArtifactId
    : null;
  const maxHealthBonus = typeof candidate.maxHealthBonus === "number" && Number.isFinite(candidate.maxHealthBonus)
    ? candidate.maxHealthBonus
    : 0;
  const weaponSlotBonus = typeof candidate.weaponSlotBonus === "number" && Number.isFinite(candidate.weaponSlotBonus) && candidate.weaponSlotBonus > 0
    ? Math.floor(candidate.weaponSlotBonus)
    : 0;
  return { relicIds, equippedArtifactId, maxHealthBonus, weaponSlotBonus };
}

function cloneExpedition(expedition: ExpeditionSave): ExpeditionSave {
  return {
    mapSeed: expedition.mapSeed,
    currentNodeId: expedition.currentNodeId,
    clearedNodeIds: [...expedition.clearedNodeIds],
    build: expedition.build === null ? null : {
      ...expedition.build,
      weapons: expedition.build.weapons.map((weapon) => ({ ...weapon })),
      upgrades: expedition.build.upgrades.map((upgrade) => ({ ...upgrade })),
      transformation: cloneTransformationAffinityState(expedition.build.transformation),
      ...(expedition.build.relicIds ? { relicIds: [...expedition.build.relicIds] } : {}),
      ...(expedition.build.ownedItemIds ? { ownedItemIds: [...expedition.build.ownedItemIds] } : {}),
      ...(expedition.build.itemStats ? { itemStats: { ...expedition.build.itemStats } } : {}),
      ...(expedition.build.bannedShopIds ? { bannedShopIds: [...expedition.build.bannedShopIds] } : {}),
    },
    metrics: {
      kills: expedition.metrics.kills,
      scrapEarned: expedition.metrics.scrapEarned,
      damageByWeapon: { ...expedition.metrics.damageByWeapon },
    },
  };
}

/**
 * Saves written before the dex existed simply have no bestiary, so a missing
 * or malformed map degrades to an empty dex rather than discarding the save.
 */
function readBestiary(value: unknown): Record<string, BestiaryEntry> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const bestiary: Record<string, BestiaryEntry> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const candidate = entry as Partial<BestiaryEntry>;
    const seen = readCount(candidate.seen);
    const kills = readCount(candidate.kills);
    if (seen > 0 || kills > 0) {
      bestiary[key] = { seen, kills };
    }
  }
  return bestiary;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function readFiniteNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function readRunMetrics(value: unknown): RunMetrics {
  if (typeof value !== "object" || value === null) {
    return { kills: 0, scrapEarned: 0, damageByWeapon: {} };
  }
  const candidate = value as Partial<RunMetrics>;
  const damageByWeapon: Record<string, number> = {};
  if (typeof candidate.damageByWeapon === "object" && candidate.damageByWeapon !== null) {
    for (const [weaponId, damage] of Object.entries(candidate.damageByWeapon)) {
      const safe = readFiniteNonNegative(damage);
      if (safe > 0) damageByWeapon[weaponId] = safe;
    }
  }
  return {
    kills: readCount(candidate.kills),
    scrapEarned: readFiniteNonNegative(candidate.scrapEarned),
    damageByWeapon,
  };
}

function readRunSummary(value: unknown): RunSummary | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<RunSummary>;
  if (
    (candidate.mode !== "quick-drop" && candidate.mode !== "expedition")
    || (candidate.outcome !== "victory" && candidate.outcome !== "defeat")
    || typeof candidate.heroId !== "string"
    || !Array.isArray(candidate.weapons)
    || !Array.isArray(candidate.upgrades)
  ) return null;
  const metrics = readRunMetrics(candidate);
  return createRunSummary({
    mode: candidate.mode,
    outcome: candidate.outcome,
    heroId: candidate.heroId,
    perkId: isPerkId(candidate.perkId) ? candidate.perkId : null,
    waveReached: readCount(candidate.waveReached),
    nodesCleared: readCount(candidate.nodesCleared),
    kills: metrics.kills,
    scrapEarned: metrics.scrapEarned,
    scrapBanked: readFiniteNonNegative(candidate.scrapBanked),
    level: readCount(candidate.level) || 1,
    damageByWeapon: metrics.damageByWeapon,
    weapons: candidate.weapons
      .filter((weapon) => typeof weapon?.weaponId === "string")
      .map((weapon) => ({ weaponId: weapon.weaponId, tier: readCount(weapon.tier) || 1 })),
    upgrades: candidate.upgrades
      .filter((upgrade) => typeof upgrade?.upgradeId === "string")
      .map((upgrade) => ({ upgradeId: upgrade.upgradeId, level: readCount(upgrade.level) || 1 })),
    transformation: normalizeTransformationAffinityState(candidate.transformation),
    newlyUnlockedPerkIds: Array.isArray(candidate.newlyUnlockedPerkIds)
      ? candidate.newlyUnlockedPerkIds.filter(isPerkId)
      : [],
  });
}

function cloneSave(save: SaveData): SaveData {
  const bestiary: Record<string, BestiaryEntry> = {};
  for (const [key, entry] of Object.entries(save.progress.bestiary ?? {})) {
    bestiary[key] = { ...entry };
  }
  return {
    version: save.version,
    settings: { ...save.settings },
    controls: normalizeControlBindings(save.controls),
    progress: { ...save.progress, bestiary },
    expedition: save.expedition === null ? null : cloneExpedition(save.expedition),
    selectedPerkId: save.selectedPerkId,
    selectedHeroId: save.selectedHeroId,
    lastRunSummary: save.lastRunSummary ? createRunSummary(save.lastRunSummary) : null,
  };
}
