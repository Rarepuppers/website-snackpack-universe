import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE } from "../save/LocalSaveStore";
import {
  CLOUD_SAVE_SLOT,
  createSteamPlatformAdapter,
  parseCloudEnvelope,
  synchronizeAchievementEvents,
  type SteamworksBridge,
} from "./PlatformAdapter";

function bridge(overrides: Partial<SteamworksBridge> = {}): SteamworksBridge {
  return {
    getAchievement: () => false,
    setAchievement: () => undefined,
    storeStats: () => undefined,
    readCloudFile: () => null,
    writeCloudFile: () => undefined,
    ...overrides,
  };
}

describe("platform adapter", () => {
  it("deduplicates unlocks, skips accepted IDs, and commits once", async () => {
    const calls: string[] = [];
    const adapter = createSteamPlatformAdapter(bridge({
      getAchievement: (id) => id === "first-drop",
      setAchievement: (id) => { calls.push(id); },
      storeStats: () => { calls.push("commit"); },
    }));
    const result = await synchronizeAchievementEvents(adapter, [
      { type: "achievement-unlocked", id: "first-drop" },
      { type: "achievement-unlocked", id: "hundred-kills" },
      { type: "achievement-unlocked", id: "hundred-kills" },
    ]);
    expect(calls).toEqual(["hundred-kills", "commit"]);
    expect(result).toEqual({ acknowledged: ["hundred-kills"], pending: [] });
  });

  it("keeps the whole batch pending when the platform commit fails", async () => {
    const adapter = createSteamPlatformAdapter(bridge({ storeStats: () => { throw new Error("offline"); } }));
    const result = await synchronizeAchievementEvents(adapter, [
      { type: "achievement-unlocked", id: "first-victory" },
      { type: "achievement-unlocked", id: "wave-ten" },
    ]);
    expect(result.acknowledged).toEqual([]);
    expect(result.pending).toEqual(["first-victory", "wave-ten"]);
  });

  it("round-trips the versioned cloud slot and rejects malformed payloads", async () => {
    let storedPath = "";
    let storedContents = "";
    const adapter = createSteamPlatformAdapter(bridge({
      readCloudFile: () => storedContents || null,
      writeCloudFile: (path, contents) => { storedPath = path; storedContents = contents; },
    }));
    const envelope = { deviceId: "steam-1", revision: 3, updatedAtMs: 99, save: DEFAULT_SAVE };
    await adapter.writeCloudSave(envelope);
    expect(storedPath).toBe(CLOUD_SAVE_SLOT);
    expect(await adapter.readCloudSave()).toEqual(envelope);
    expect(() => parseCloudEnvelope("not-json")).toThrow("valid JSON");
    expect(() => parseCloudEnvelope(JSON.stringify({ ...envelope, revision: -1 }))).toThrow("invalid");
  });
});
