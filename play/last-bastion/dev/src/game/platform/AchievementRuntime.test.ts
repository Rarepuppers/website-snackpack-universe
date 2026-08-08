import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/LocalSaveStore";
import { CloudSyncMetadataStore, cloudSaveContentHash } from "./CloudSyncMetadata";
import {
  initializeAchievementRuntime,
  queueAchievementProgress,
  requestAchievementSync,
} from "./AchievementRuntime";
import type { PlatformAdapter } from "./PlatformAdapter";
import type { AchievementId } from "./PlatformProgress";

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

function adapter(options: { unlocked?: AchievementId[]; failCommit?: boolean } = {}) {
  const unlocked = new Set(options.unlocked ?? []);
  const setAchievement = vi.fn(async (id: AchievementId) => { unlocked.add(id); });
  const target: PlatformAdapter = {
    kind: "steam",
    async unlockedAchievementIds() { return [...unlocked]; },
    unlockAchievement: async (id: AchievementId) => { await setAchievement(id); },
    async commitAchievements() { if (options.failCommit) throw new Error("Steam offline"); },
    async readCloudSave() { return null; },
    async writeCloudSave() { return; },
  };
  return { target, setAchievement };
}

function seedMetadata(storage: ReturnType<typeof memoryStorage>, pendingAchievementIds: AchievementId[] = []) {
  new CloudSyncMetadataStore(storage).save({
    deviceId: "device-a", revision: 1, updatedAtMs: 10,
    contentHash: cloudSaveContentHash(save()), pendingAchievementIds,
  });
}

describe("achievement runtime", () => {
  beforeEach(async () => {
    await initializeAchievementRuntime(null, { ...adapter().target, kind: "browser" }, save());
  });

  it("skips browser hosts", async () => {
    const result = await initializeAchievementRuntime(
      { localStorage: memoryStorage() },
      { ...adapter().target, kind: "browser" },
      save({ progress: { ...DEFAULT_SAVE.progress, runsFinished: 1 } }),
    );
    expect(result).toEqual({ kind: "skipped" });
  });

  it("reports metadata-storage failure without rejecting boot", async () => {
    const brokenStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("disk read-only"); },
    };
    await expect(initializeAchievementRuntime(
      { desktopSave: brokenStorage }, adapter().target, save(),
    )).resolves.toEqual({ kind: "failed", error: "disk read-only" });
  });

  it("derives earned milestones at boot, commits them once, and clears the queue", async () => {
    const storage = memoryStorage();
    seedMetadata(storage);
    const steam = adapter();
    const progress = { ...DEFAULT_SAVE.progress, runsFinished: 1, victories: 1, totalKills: 100 };
    const result = await initializeAchievementRuntime(
      { desktopSave: storage }, steam.target, save({ progress }),
    );
    expect(result).toMatchObject({
      kind: "synchronized",
      pending: [],
      acknowledged: ["first-drop", "first-victory", "hundred-kills"],
    });
    expect(new CloudSyncMetadataStore(storage).load()?.pendingAchievementIds).toEqual([]);
  });

  it("persists a failed batch and retries it on demand", async () => {
    const storage = memoryStorage();
    seedMetadata(storage, ["wave-ten"]);
    const offline = adapter({ failCommit: true });
    expect(await initializeAchievementRuntime({ desktopSave: storage }, offline.target, save()))
      .toMatchObject({ kind: "synchronized", pending: ["wave-ten"] });
    expect(new CloudSyncMetadataStore(storage).load()?.pendingAchievementIds).toEqual(["wave-ten"]);

    const online = adapter();
    await initializeAchievementRuntime({ desktopSave: storage }, online.target, save());
    expect(await requestAchievementSync()).toMatchObject({ kind: "synchronized", pending: [] });
  });

  it("queues milestones crossed by a run and synchronizes them", async () => {
    const storage = memoryStorage();
    seedMetadata(storage);
    const steam = adapter();
    await initializeAchievementRuntime({ desktopSave: storage }, steam.target, save());
    const before = save();
    const after = save({ progress: { ...DEFAULT_SAVE.progress, runsFinished: 1, bestWaveReached: 10 } });
    const result = await queueAchievementProgress(before, after);
    expect(result).toMatchObject({
      kind: "synchronized",
      acknowledged: ["first-drop", "wave-ten"],
      pending: [],
    });
  });

  it("removes queued IDs that Steam already reports as unlocked", async () => {
    const storage = memoryStorage();
    seedMetadata(storage, ["first-drop"]);
    const steam = adapter({ unlocked: ["first-drop"] });
    await initializeAchievementRuntime({ desktopSave: storage }, steam.target, save());
    expect(steam.setAchievement).not.toHaveBeenCalled();
    expect(new CloudSyncMetadataStore(storage).load()?.pendingAchievementIds).toEqual([]);
  });
});
