import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/LocalSaveStore";
import { resolveCloudSaveConflict, type CloudSaveEnvelope } from "./CloudSavePolicy";

function save(overrides: Partial<SaveData> = {}): SaveData {
  return JSON.parse(JSON.stringify({ ...DEFAULT_SAVE, ...overrides })) as SaveData;
}

describe("cloud-save conflict policy", () => {
  it("takes preferences from the newer revision while merging monotonic progress by maxima", () => {
    const local: CloudSaveEnvelope = {
      deviceId: "desktop-a", revision: 4, updatedAtMs: 100,
      save: save({ progress: { ...DEFAULT_SAVE.progress, totalKills: 500, victories: 1 }, selectedHeroId: "marine" }),
    };
    const remote: CloudSaveEnvelope = {
      deviceId: "desktop-b", revision: 5, updatedAtMs: 90,
      save: save({ progress: { ...DEFAULT_SAVE.progress, totalKills: 300, victories: 3 }, selectedHeroId: "medic" }),
    };
    const result = resolveCloudSaveConflict(local, remote);
    expect(result.preference).toBe("remote");
    expect(result.save.selectedHeroId).toBe("medic");
    expect(result.save.progress.totalKills).toBe(500);
    expect(result.save.progress.victories).toBe(3);
  });

  it("is deterministic on ties and flags divergent active runs", () => {
    const expedition = { mapSeed: 1, currentNodeId: 2, clearedNodeIds: [], build: null, metrics: { kills: 0, scrapEarned: 0, damageByWeapon: {} } };
    const local: CloudSaveEnvelope = { deviceId: "a", revision: 1, updatedAtMs: 10, save: save({ expedition }) };
    const remote: CloudSaveEnvelope = { deviceId: "b", revision: 1, updatedAtMs: 10, save: save({ expedition: { ...expedition, mapSeed: 2 } }) };
    const result = resolveCloudSaveConflict(local, remote);
    expect(result.preference).toBe("remote");
    expect(result.divergentActiveRuns).toBe(true);
    expect(result.save.expedition?.mapSeed).toBe(2);
  });

  it("rejects unknown schemas rather than corrupting them", () => {
    const envelope: CloudSaveEnvelope = { deviceId: "a", revision: 1, updatedAtMs: 1, save: save() };
    expect(() => resolveCloudSaveConflict(envelope, { ...envelope, save: { ...save(), version: 99 as 7 } }))
      .toThrow("unsupported");
  });
});
