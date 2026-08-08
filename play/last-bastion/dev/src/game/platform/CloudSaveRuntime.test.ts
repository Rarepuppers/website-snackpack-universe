import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SAVE, LocalSaveStore, type SaveData } from "../save/LocalSaveStore";
import { CloudSyncMetadataStore } from "./CloudSyncMetadata";
import type { CloudSaveEnvelope } from "./CloudSavePolicy";
import { synchronizeCloudSave } from "./CloudSaveRuntime";
import type { PlatformAdapter } from "./PlatformAdapter";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

function save(overrides: Partial<SaveData> = {}): SaveData {
  return JSON.parse(JSON.stringify({ ...DEFAULT_SAVE, ...overrides })) as SaveData;
}

function steamAdapter(remote: CloudSaveEnvelope | null) {
  let cloud = remote;
  const writeCloudSave = vi.fn(async (envelope: CloudSaveEnvelope) => { cloud = envelope; });
  const adapter: PlatformAdapter = {
    kind: "steam",
    async unlockedAchievementIds() { return []; },
    async unlockAchievement() { return; },
    async commitAchievements() { return; },
    async readCloudSave() { return cloud; },
    writeCloudSave,
  };
  return { adapter, writeCloudSave, cloud: () => cloud };
}

const options = { now: () => 1_000, createDeviceId: () => "device-local" };

describe("cloud-save runtime", () => {
  it("skips browser hosts without touching cloud or metadata", async () => {
    const target = steamAdapter(null);
    const result = await synchronizeCloudSave(
      { ...target.adapter, kind: "browser" },
      new LocalSaveStore(memoryStorage()),
      new CloudSyncMetadataStore(null),
      options,
    );
    expect(result).toEqual({ kind: "skipped" });
    expect(target.writeCloudSave).not.toHaveBeenCalled();
  });

  it("uploads the first portable save and persists stable revision metadata", async () => {
    const storage = memoryStorage();
    const store = new LocalSaveStore(storage);
    store.updateSettings({ fullscreenMode: "borderless", selectedDisplayId: "monitor-2" });
    store.recordRunEnd({ victory: true, waveReached: 3 });
    const target = steamAdapter(null);

    expect(await synchronizeCloudSave(
      target.adapter, store, new CloudSyncMetadataStore(storage), options,
    )).toEqual({ kind: "uploaded", revision: 1 });
    expect(target.cloud()?.save.progress.victories).toBe(1);
    expect(target.cloud()?.save.settings).toMatchObject({
      fullscreenMode: "windowed",
      selectedDisplayId: null,
    });
    expect(new CloudSyncMetadataStore(storage).load()).toMatchObject({
      deviceId: "device-local",
      revision: 1,
    });
  });

  it("does not upload identical portable content or churn on device display changes", async () => {
    const storage = memoryStorage();
    const store = new LocalSaveStore(storage);
    const initial = steamAdapter(null);
    await synchronizeCloudSave(initial.adapter, store, new CloudSyncMetadataStore(storage), options);
    const remote = initial.cloud();
    if (!remote) throw new Error("Expected uploaded cloud save");
    store.updateSettings({ brightness: 0.7, presentationMode: "fill" });
    const target = steamAdapter(remote);

    expect(await synchronizeCloudSave(
      target.adapter, store, new CloudSyncMetadataStore(storage), options,
    )).toEqual({ kind: "unchanged", revision: 1 });
    expect(target.writeCloudSave).not.toHaveBeenCalled();
  });

  it("merges remote progress, keeps local display choices, and uploads the reconciled save", async () => {
    const storage = memoryStorage();
    const store = new LocalSaveStore(storage);
    store.updateSettings({
      displaySizePercent: 80,
      selectedDisplayId: "deck-panel",
      brightness: 0.8,
    });
    store.replaceWith(save({
      ...store.load(),
      settings: store.load().settings,
      progress: { ...DEFAULT_SAVE.progress, totalKills: 500, victories: 1 },
    }));
    const remote: CloudSaveEnvelope = {
      deviceId: "device-remote",
      revision: 5,
      updatedAtMs: 900,
      save: save({
        progress: { ...DEFAULT_SAVE.progress, totalKills: 300, victories: 3 },
        selectedHeroId: "medic",
      }),
    };
    const target = steamAdapter(remote);

    const result = await synchronizeCloudSave(
      target.adapter, store, new CloudSyncMetadataStore(storage), options,
    );
    expect(result).toEqual({ kind: "merged", revision: 6, divergentActiveRuns: false });
    expect(store.load().progress).toMatchObject({ totalKills: 500, victories: 3 });
    expect(store.load()).toMatchObject({
      selectedHeroId: "medic",
      settings: { displaySizePercent: 80, selectedDisplayId: "deck-panel", brightness: 0.8 },
    });
    expect(target.cloud()?.save.settings).toMatchObject({
      displaySizePercent: 100,
      selectedDisplayId: null,
      brightness: 1,
    });
  });

  it("surfaces divergent active runs in the reconciliation result", async () => {
    const storage = memoryStorage();
    const localExpedition = {
      mapSeed: 1, currentNodeId: 2, clearedNodeIds: [1], build: null,
      metrics: { kills: 0, scrapEarned: 0, damageByWeapon: {} },
    };
    const remoteExpedition = { ...localExpedition, mapSeed: 2 };
    const store = new LocalSaveStore(storage);
    store.replaceWith(save({ expedition: localExpedition }));
    const target = steamAdapter({
      deviceId: "remote", revision: 2, updatedAtMs: 500,
      save: save({ expedition: remoteExpedition }),
    });

    await expect(synchronizeCloudSave(
      target.adapter, store, new CloudSyncMetadataStore(storage), options,
    )).resolves.toMatchObject({ kind: "merged", divergentActiveRuns: true });
  });

  it("fails closed when cloud reads or writes fail and never advances metadata", async () => {
    const storage = memoryStorage();
    const readFailure = steamAdapter(null);
    readFailure.adapter.readCloudSave = async () => { throw new Error("Steam offline"); };
    await expect(synchronizeCloudSave(
      readFailure.adapter,
      new LocalSaveStore(storage),
      new CloudSyncMetadataStore(storage),
      options,
    )).resolves.toEqual({ kind: "failed", error: "Steam offline" });
    expect(new CloudSyncMetadataStore(storage).load()).toMatchObject({
      deviceId: "device-local", revision: 0, pendingAchievementIds: [],
    });

    const writeFailure = steamAdapter(null);
    writeFailure.adapter.writeCloudSave = async () => { throw new Error("quota exceeded"); };
    await expect(synchronizeCloudSave(
      writeFailure.adapter,
      new LocalSaveStore(storage),
      new CloudSyncMetadataStore(storage),
      options,
    )).resolves.toEqual({ kind: "failed", error: "quota exceeded" });
    expect(new CloudSyncMetadataStore(storage).load()).toMatchObject({
      deviceId: "device-local", revision: 0, pendingAchievementIds: [],
    });
  });
});
