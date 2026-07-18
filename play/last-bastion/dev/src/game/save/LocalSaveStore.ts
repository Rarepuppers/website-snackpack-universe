/**
 * Versioned local persistence for settings and basic run progress.
 *
 * Browser storage can be cleared at any time, so nothing here may be treated
 * as a permanent cloud save. The schema carries a version number so future
 * releases can migrate rather than silently corrupt older data.
 */
export interface GameSettings {
  screenShakeEnabled: boolean;
  soundEnabled: boolean;
  damageNumbersEnabled: boolean;
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
  bestiary: Record<string, BestiaryEntry>;
}

export interface SaveData {
  version: 1;
  settings: GameSettings;
  progress: GameProgress;
}

export const SAVE_STORAGE_KEY = "last-bastion-save";

/** Kills required before a dex entry reveals its stats. Mirrored in the codex page. */
export const BESTIARY_KILLS_TO_REVEAL = 10;

export const DEFAULT_SAVE: Readonly<SaveData> = Object.freeze({
  version: 1,
  settings: Object.freeze({
    screenShakeEnabled: true,
    soundEnabled: true,
    damageNumbersEnabled: true,
  }),
  progress: Object.freeze({
    runsFinished: 0,
    victories: 0,
    bestWaveReached: 0,
    bestiary: Object.freeze({}) as Record<string, BestiaryEntry>,
  }),
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
    this.cached = {
      ...this.cached,
      settings: { ...this.cached.settings, ...partial },
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

  recordRunEnd(outcome: { victory: boolean; waveReached: number }): SaveData {
    this.cached = {
      ...this.cached,
      progress: {
        ...this.cached.progress,
        runsFinished: this.cached.progress.runsFinished + 1,
        victories: this.cached.progress.victories + (outcome.victory ? 1 : 0),
        bestWaveReached: Math.max(
          this.cached.progress.bestWaveReached,
          Math.max(0, Math.floor(outcome.waveReached)),
        ),
      },
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
  const candidate = parsed as Partial<SaveData>;
  if (candidate.version !== 1) {
    return cloneSave(DEFAULT_SAVE);
  }
  return {
    version: 1,
    settings: {
      screenShakeEnabled: readBoolean(candidate.settings?.screenShakeEnabled, DEFAULT_SAVE.settings.screenShakeEnabled),
      soundEnabled: readBoolean(candidate.settings?.soundEnabled, DEFAULT_SAVE.settings.soundEnabled),
      damageNumbersEnabled: readBoolean(candidate.settings?.damageNumbersEnabled, DEFAULT_SAVE.settings.damageNumbersEnabled),
    },
    progress: {
      runsFinished: readCount(candidate.progress?.runsFinished),
      victories: readCount(candidate.progress?.victories),
      bestWaveReached: readCount(candidate.progress?.bestWaveReached),
      bestiary: readBestiary(candidate.progress?.bestiary),
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

function cloneSave(save: SaveData): SaveData {
  const bestiary: Record<string, BestiaryEntry> = {};
  for (const [key, entry] of Object.entries(save.progress.bestiary ?? {})) {
    bestiary[key] = { ...entry };
  }
  return {
    version: save.version,
    settings: { ...save.settings },
    progress: { ...save.progress, bestiary },
  };
}
