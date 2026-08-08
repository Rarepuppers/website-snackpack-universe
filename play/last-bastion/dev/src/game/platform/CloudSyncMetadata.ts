import { DEFAULT_SAVE, type SaveData, type StorageLike } from "../save/LocalSaveStore";
import { ACHIEVEMENT_IDS, type AchievementId } from "./PlatformProgress";

export const CLOUD_SYNC_METADATA_KEY = "last-bastion-cloud-sync";

export interface CloudSyncMetadata {
  readonly deviceId: string;
  readonly revision: number;
  readonly updatedAtMs: number;
  readonly contentHash: string;
  readonly pendingAchievementIds: readonly AchievementId[];
}

export class CloudSyncMetadataStore {
  constructor(private readonly storage: StorageLike | null) {}

  isAvailable(): boolean {
    return this.storage !== null;
  }

  load(): CloudSyncMetadata | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(CLOUD_SYNC_METADATA_KEY);
      return raw ? normalizeMetadata(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  save(metadata: CloudSyncMetadata): void {
    if (!this.storage) throw new Error("Cloud-sync metadata storage is unavailable");
    const normalized = normalizeMetadata(metadata);
    if (!normalized) throw new Error("Cloud-sync metadata is invalid");
    this.storage.setItem(CLOUD_SYNC_METADATA_KEY, JSON.stringify(normalized));
  }

  updateCloudState(
    state: Omit<CloudSyncMetadata, "pendingAchievementIds">,
  ): CloudSyncMetadata {
    const next = { ...state, pendingAchievementIds: this.load()?.pendingAchievementIds ?? [] };
    this.save(next);
    return next;
  }

  updatePendingAchievementIds(pendingAchievementIds: readonly AchievementId[]): CloudSyncMetadata {
    const current = this.load();
    if (!current) throw new Error("Cloud-sync metadata is unavailable");
    const next = { ...current, pendingAchievementIds: normalizeAchievementIds(pendingAchievementIds) };
    this.save(next);
    return next;
  }
}

/** Monitor, fullscreen, frame pacing, and calibration remain local to each machine. */
export function portableCloudSave(save: SaveData): SaveData {
  return {
    ...save,
    settings: {
      ...save.settings,
      displaySizePercent: DEFAULT_SAVE.settings.displaySizePercent,
      presentationMode: DEFAULT_SAVE.settings.presentationMode,
      fullscreenMode: DEFAULT_SAVE.settings.fullscreenMode,
      selectedDisplayId: DEFAULT_SAVE.settings.selectedDisplayId,
      frameCap: DEFAULT_SAVE.settings.frameCap,
      brightness: DEFAULT_SAVE.settings.brightness,
      gamma: DEFAULT_SAVE.settings.gamma,
    },
  };
}

export function cloudSaveContentHash(save: SaveData): string {
  const serialized = stableStringify(portableCloudSave(save));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function createCloudDeviceId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const random = new Uint32Array(4);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(random);
  } else {
    for (let index = 0; index < random.length; index += 1) {
      random[index] = Math.floor(Math.random() * 0x1_0000_0000);
    }
  }
  return `device-${Array.from(random, (value) => value.toString(16).padStart(8, "0")).join("")}`;
}

function normalizeMetadata(value: unknown): CloudSyncMetadata | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CloudSyncMetadata>;
  if (typeof candidate.deviceId !== "string" || candidate.deviceId.length === 0 || candidate.deviceId.length > 128
    || !Number.isSafeInteger(candidate.revision) || (candidate.revision ?? -1) < 0
    || !Number.isFinite(candidate.updatedAtMs) || (candidate.updatedAtMs ?? -1) < 0
    || typeof candidate.contentHash !== "string" || !/^[0-9a-f]{8}$/.test(candidate.contentHash)) {
    return null;
  }
  return {
    deviceId: candidate.deviceId,
    revision: candidate.revision,
    updatedAtMs: candidate.updatedAtMs,
    contentHash: candidate.contentHash,
    pendingAchievementIds: normalizeAchievementIds(candidate.pendingAchievementIds),
  } as CloudSyncMetadata;
}

function normalizeAchievementIds(value: unknown): AchievementId[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(ACHIEVEMENT_IDS);
  return [...new Set(value.filter((id): id is AchievementId => typeof id === "string" && allowed.has(id)))];
}
