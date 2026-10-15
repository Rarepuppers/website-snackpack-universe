import { describe, expect, it } from "vitest";
import { dailyParticipation, dailyStreak, recordDailyAttempt, type DailyRecord } from "./DailyDrop";
import { createRunSummary } from "./RunSummary";
import { DEFAULT_SAVE, LocalSaveStore } from "../save/LocalSaveStore";
import { resolveCloudSaveConflict } from "../platform/CloudSavePolicy";

describe("Daily participation", () => {
  it("preserves a year-long streak independently of the 60 detailed results", () => {
    let records: Record<string, DailyRecord> = {};
    let participation = dailyParticipation([]);
    let day = "";
    for (let i = 0; i < 365; i++) {
      const date = new Date(2026, 0, 1 + i, 12);
      day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      participation = dailyParticipation([...participation, { start: day, end: day }], records);
      records = recordDailyAttempt(records, day, { waveReached: 10, kills: 20, victory: true });
    }
    expect(Object.keys(records)).toHaveLength(60);
    expect(participation).toEqual([{ start: "2026-01-01", end: "2026-12-31" }]);
    expect(dailyStreak(records, day, participation)).toBe(365);
    expect(dailyStreak(records, "2027-01-01", participation)).toBe(365);
    expect(dailyStreak(records, "2027-01-02", participation)).toBe(0);
  });
  it("merges overlapping devices, preserves gaps and ignores invalid intervals", () => {
    const merged = dailyParticipation([
      { start: "2026-10-01", end: "2026-10-04" },
      { start: "2026-10-03", end: "2026-10-05" },
      { start: "2026-10-07", end: "2026-10-07" },
      { start: "bad", end: "2026-10-10" },
    ]);
    expect(dailyStreak({}, "2026-10-05", merged)).toBe(5);
    expect(dailyStreak({}, "2026-10-07", merged)).toBe(1);
  });
  it("records participation through the real save-store run-end path", () => {
    const store = new LocalSaveStore(null);
    store.replaceWith({ ...DEFAULT_SAVE, progress: { ...DEFAULT_SAVE.progress,
      dailyParticipation: [{ start: "2026-01-01", end: "2026-03-05" }] } });
    const summary = createRunSummary({
      mode: "quick-drop", outcome: "victory", heroId: "marine", perkId: null,
      waveReached: 10, nodesCleared: 0, kills: 20, scrapEarned: 10, scrapBanked: 0,
      level: 2, damageByWeapon: {}, weapons: [], upgrades: [], dailyKey: "2026-03-06",
    });
    const save = store.recordRunEnd({ victory: true, waveReached: 10, summary });
    expect(dailyStreak(save.progress.daily, "2026-03-06", save.progress.dailyParticipation)).toBe(65);
    expect(save.progress.daily["2026-03-06"]?.attempts).toBe(1);
  });
  it("normalizes, exports, imports and cloud-merges participation", () => {
    const save = new LocalSaveStore(null);
    save.replaceWith({ ...DEFAULT_SAVE, progress: { ...DEFAULT_SAVE.progress,
      dailyParticipation: [{ start: "2026-01-01", end: "2026-04-01" }] } });
    const imported = new LocalSaveStore(null);
    imported.replaceWith(JSON.parse(save.exportSerialized()));
    const local = { deviceId: "local", revision: 1, updatedAtMs: 1, save: imported.load() };
    const remote = { deviceId: "remote", revision: 2, updatedAtMs: 2, save: {
      ...DEFAULT_SAVE, progress: { ...DEFAULT_SAVE.progress,
        dailyParticipation: [{ start: "2026-04-02", end: "2026-04-03" }] },
    } };
    const merged = resolveCloudSaveConflict(local, remote).save;
    expect(dailyStreak(merged.progress.daily, "2026-04-03", merged.progress.dailyParticipation)).toBe(93);
  });
});
