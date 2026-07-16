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
}

export interface GameProgress {
  runsFinished: number;
  victories: number;
  bestWaveReached: number;
}

export interface SaveData {
  version: 1;
  settings: GameSettings;
  progress: GameProgress;
}

export const SAVE_STORAGE_KEY = "last-bastion-save";

export const DEFAULT_SAVE: Readonly<SaveData> = Object.freeze({
  version: 1,
  settings: Object.freeze({
    screenShakeEnabled: true,
    soundEnabled: true,
  }),
  progress: Object.freeze({
    runsFinished: 0,
    victories: 0,
    bestWaveReached: 0,
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

  recordRunEnd(outcome: { victory: boolean; waveReached: number }): SaveData {
    this.cached = {
      ...this.cached,
      progress: {
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
    },
    progress: {
      runsFinished: readCount(candidate.progress?.runsFinished),
      victories: readCount(candidate.progress?.victories),
      bestWaveReached: readCount(candidate.progress?.bestWaveReached),
    },
  };
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
  return {
    version: save.version,
    settings: { ...save.settings },
    progress: { ...save.progress },
  };
}
