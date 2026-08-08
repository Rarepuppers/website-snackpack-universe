import { DEFAULT_SAVE, type SaveData, type StorageLike } from "../save/LocalSaveStore";
import { storageForHost, type SaveStorageHost } from "../save/SaveStorage";
import { CloudSyncMetadataStore, cloudSaveContentHash, createCloudDeviceId } from "./CloudSyncMetadata";
import { synchronizeAchievementEvents, type PlatformAdapter } from "./PlatformAdapter";
import {
  achievementUnlockEvents,
  type AchievementId,
  type AchievementUnlockEvent,
} from "./PlatformProgress";

export type AchievementSyncRuntimeResult =
  | { readonly kind: "skipped" }
  | { readonly kind: "synchronized"; readonly acknowledged: readonly AchievementId[]; readonly pending: readonly AchievementId[] }
  | { readonly kind: "failed"; readonly error: string };

interface AchievementRuntimeContext {
  readonly adapter: PlatformAdapter;
  readonly storage: StorageLike;
}

let runtime: AchievementRuntimeContext | null = null;
let syncChain: Promise<AchievementSyncRuntimeResult> = Promise.resolve({ kind: "skipped" });

export async function initializeAchievementRuntime(
  host: SaveStorageHost | null,
  adapter: PlatformAdapter,
  save: SaveData,
): Promise<AchievementSyncRuntimeResult> {
  const storage = storageForHost(host);
  runtime = adapter.kind === "steam" && storage ? { adapter, storage } : null;
  if (!runtime) return { kind: "skipped" };
  try {
    ensureMetadata(runtime.storage, save);
    queueEvents(runtime.storage, achievementUnlockEvents(DEFAULT_SAVE.progress, save.progress, save.lastRunSummary));
    return requestAchievementSync();
  } catch (error) {
    runtime = null;
    return { kind: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

export function queueAchievementProgress(
  before: SaveData,
  after: SaveData,
): Promise<AchievementSyncRuntimeResult> {
  if (!runtime) return Promise.resolve({ kind: "skipped" });
  try {
    queueEvents(
      runtime.storage,
      achievementUnlockEvents(before.progress, after.progress, after.lastRunSummary),
    );
    return requestAchievementSync();
  } catch (error) {
    return Promise.resolve({
      kind: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Serializes stats commits while allowing events queued mid-commit to survive. */
export function requestAchievementSync(): Promise<AchievementSyncRuntimeResult> {
  if (!runtime) return Promise.resolve({ kind: "skipped" });
  syncChain = syncChain.then(performAchievementSync, performAchievementSync);
  return syncChain;
}

function ensureMetadata(storage: StorageLike, save: SaveData): void {
  const metadata = new CloudSyncMetadataStore(storage);
  if (metadata.load()) return;
  metadata.save({
    deviceId: createCloudDeviceId(),
    revision: 0,
    updatedAtMs: 0,
    contentHash: cloudSaveContentHash(save),
    pendingAchievementIds: [],
  });
}

function queueEvents(storage: StorageLike, events: readonly AchievementUnlockEvent[]): void {
  if (events.length === 0) return;
  const metadata = new CloudSyncMetadataStore(storage);
  const current = metadata.load();
  if (!current) throw new Error("Achievement metadata is unavailable");
  metadata.updatePendingAchievementIds([
    ...current.pendingAchievementIds,
    ...events.map(({ id }) => id),
  ]);
}

async function performAchievementSync(): Promise<AchievementSyncRuntimeResult> {
  if (!runtime) return { kind: "skipped" };
  const metadata = new CloudSyncMetadataStore(runtime.storage);
  const attempted = metadata.load()?.pendingAchievementIds ?? [];
  if (attempted.length === 0) {
    return { kind: "synchronized", acknowledged: [], pending: [] };
  }
  try {
    const result = await synchronizeAchievementEvents(
      runtime.adapter,
      attempted.map((id) => ({ type: "achievement-unlocked", id })),
    );
    const attemptedIds = new Set<AchievementId>(attempted);
    const queuedDuringSync = (metadata.load()?.pendingAchievementIds ?? [])
      .filter((id) => !attemptedIds.has(id));
    const pending = [...new Set([...result.pending, ...queuedDuringSync])];
    metadata.updatePendingAchievementIds(pending);
    return { kind: "synchronized", acknowledged: result.acknowledged, pending };
  } catch (error) {
    return { kind: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}
