import { LocalSaveStore, type StorageLike } from "../save/LocalSaveStore";
import { storageForHost, type SaveStorageHost } from "../save/SaveStorage";
import { resolveCloudSaveConflict, type CloudSaveEnvelope } from "./CloudSavePolicy";
import {
  CloudSyncMetadataStore,
  cloudSaveContentHash,
  createCloudDeviceId,
  portableCloudSave,
} from "./CloudSyncMetadata";
import type { PlatformAdapter } from "./PlatformAdapter";

export type CloudSaveSyncResult =
  | { readonly kind: "skipped" | "unchanged" | "uploaded"; readonly revision?: number }
  | { readonly kind: "merged"; readonly revision: number; readonly divergentActiveRuns: boolean }
  | { readonly kind: "failed"; readonly error: string };

export interface CloudSaveSyncOptions {
  readonly now?: () => number;
  readonly createDeviceId?: () => string;
}

export async function synchronizeCloudSave(
  adapter: PlatformAdapter,
  saveStore: LocalSaveStore,
  metadataStore: CloudSyncMetadataStore,
  options: CloudSaveSyncOptions = {},
): Promise<CloudSaveSyncResult> {
  if (adapter.kind !== "steam") return { kind: "skipped" };
  if (!metadataStore.isAvailable()) {
    return { kind: "failed", error: "Cloud-sync metadata storage is unavailable" };
  }
  const now = options.now ?? Date.now;
  const createDeviceId = options.createDeviceId ?? createCloudDeviceId;
  try {
    const localSave = saveStore.load();
    const localHash = cloudSaveContentHash(localSave);
    let existingMetadata = metadataStore.load();
    const metadataWasMissing = !existingMetadata;
    if (!existingMetadata) {
      metadataStore.save({
        deviceId: createDeviceId(),
        revision: 0,
        updatedAtMs: 0,
        contentHash: localHash,
        pendingAchievementIds: [],
      });
      existingMetadata = metadataStore.load();
    }
    if (!existingMetadata) throw new Error("Cloud-sync metadata could not be initialized");
    const localChanged = metadataWasMissing || existingMetadata.contentHash !== localHash;
    const localEnvelope: CloudSaveEnvelope = {
      deviceId: existingMetadata.deviceId,
      revision: existingMetadata.revision,
      updatedAtMs: localChanged ? now() : existingMetadata.updatedAtMs,
      save: localSave,
    };
    const remote = await adapter.readCloudSave();

    if (!remote) {
      const revision = Math.max(1, localEnvelope.revision + (localChanged ? 1 : 0));
      const uploaded = { ...localEnvelope, revision, save: portableCloudSave(localSave) };
      await adapter.writeCloudSave(uploaded);
      metadataStore.updateCloudState({
        deviceId: localEnvelope.deviceId,
        revision,
        updatedAtMs: uploaded.updatedAtMs,
        contentHash: localHash,
      });
      return { kind: "uploaded", revision };
    }

    const remoteHash = cloudSaveContentHash(remote.save);
    if (remoteHash === localHash) {
      const revision = Math.max(localEnvelope.revision, remote.revision);
      metadataStore.updateCloudState({
        deviceId: localEnvelope.deviceId,
        revision,
        updatedAtMs: Math.max(localEnvelope.updatedAtMs, remote.updatedAtMs),
        contentHash: localHash,
      });
      return { kind: "unchanged", revision };
    }

    const resolution = resolveCloudSaveConflict(localEnvelope, remote);
    const reconciled = saveStore.replaceWith(resolution.save);
    const reconciledHash = cloudSaveContentHash(reconciled);
    const revision = Math.max(localEnvelope.revision, remote.revision) + 1;
    const updatedAtMs = now();
    await adapter.writeCloudSave({
      deviceId: localEnvelope.deviceId,
      revision,
      updatedAtMs,
      save: portableCloudSave(reconciled),
    });
    metadataStore.updateCloudState({
      deviceId: localEnvelope.deviceId,
      revision,
      updatedAtMs,
      contentHash: reconciledHash,
    });
    return { kind: "merged", revision, divergentActiveRuns: resolution.divergentActiveRuns };
  } catch (error) {
    return { kind: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

interface CloudRuntimeContext {
  readonly adapter: PlatformAdapter;
  readonly storage: StorageLike;
}

let runtime: CloudRuntimeContext | null = null;
let pendingSync: Promise<CloudSaveSyncResult> | null = null;

export async function initializeCloudSaveRuntime(
  host: SaveStorageHost | null,
  adapter: PlatformAdapter,
): Promise<CloudSaveSyncResult> {
  const storage = storageForHost(host);
  runtime = storage ? { adapter, storage } : null;
  return requestCloudSaveSync();
}

/** Coalesces run-end requests so overlapping writes cannot race revisions. */
export function requestCloudSaveSync(): Promise<CloudSaveSyncResult> {
  if (!runtime) return Promise.resolve({ kind: "skipped" });
  if (pendingSync) return pendingSync;
  const { adapter, storage } = runtime;
  pendingSync = synchronizeCloudSave(
    adapter,
    new LocalSaveStore(storage),
    new CloudSyncMetadataStore(storage),
  ).finally(() => { pendingSync = null; });
  return pendingSync;
}
