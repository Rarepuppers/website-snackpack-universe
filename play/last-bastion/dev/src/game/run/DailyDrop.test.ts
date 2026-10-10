import { describe, expect, it } from "vitest";
import {
  DAILY_HISTORY_LIMIT,
  dailyLabel,
  dailySeed,
  dailyShareText,
  dailyStreak,
  isDailyKey,
  mergeDailyRecords,
  previousDailyKey,
  readDailyRecords,
  recordDailyAttempt,
  type DailyRecord,
} from "./DailyDrop";

interface EnvHost {
  readonly env: Record<string, string | undefined>;
}

/** Same seam as LocalDayKey.test.ts: no Node types in this workspace. */
const host = (globalThis as { process?: EnvHost }).process;

function withTimeZone<T>(zone: string, run: () => T): T {
  if (!host) throw new Error("Timezone cases need a Node-like host.");
  const previous = host.env.TZ;
  host.env.TZ = zone;
  try {
    return run();
  } finally {
    host.env.TZ = previous;
  }
}

const played = (bestWave = 3): DailyRecord => ({ bestWave, bestKills: 10, cleared: false, attempts: 1 });

describe("Daily Drop", () => {
  it("gives every player the same seed for a day, and a different one the next day", () => {
    expect(dailySeed("2026-10-11")).toBe(dailySeed("2026-10-11"));
    expect(dailySeed("2026-10-11")).not.toBe(dailySeed("2026-10-12"));
    expect(Number.isSafeInteger(dailySeed("2026-10-11"))).toBe(true);
    expect(dailySeed("2026-10-11")).toBeGreaterThan(0);
  });

  it("pins the seed so a build change cannot silently reshuffle a live day", () => {
    // If this moves, every Daily already shared becomes a different fight.
    expect([dailySeed("2026-01-01"), dailySeed("2026-12-31")]).toMatchInlineSnapshot(`
      [
        1139352752,
        291815023,
      ]
    `);
  });

  it("accepts only real calendar days", () => {
    expect(isDailyKey("2026-10-11")).toBe(true);
    expect(isDailyKey("2028-02-29")).toBe(true);
    expect(isDailyKey("2026-02-29")).toBe(false);
    expect(isDailyKey("2026-13-01")).toBe(false);
    expect(isDailyKey("2026-10-1")).toBe(false);
    expect(isDailyKey(20261011)).toBe(false);
  });

  it("steps back across month, year and daylight-saving boundaries", () => {
    expect(previousDailyKey("2026-03-01")).toBe("2026-02-28");
    expect(previousDailyKey("2026-01-01")).toBe("2025-12-31");
    // Sydney leaves DST on 5 April 2026 and enters it on 4 October 2026;
    // a 23- or 25-hour day must still be exactly one day.
    withTimeZone("Australia/Sydney", () => {
      expect(previousDailyKey("2026-04-06")).toBe("2026-04-05");
      expect(previousDailyKey("2026-10-05")).toBe("2026-10-04");
    });
    withTimeZone("America/New_York", () => {
      expect(previousDailyKey("2026-03-09")).toBe("2026-03-08");
      expect(previousDailyKey("2026-11-02")).toBe("2026-11-01");
    });
  });

  it("counts a streak through today, and keeps yesterday's streak alive until today is played", () => {
    const records = { "2026-10-09": played(), "2026-10-10": played() };
    expect(dailyStreak(records, "2026-10-11")).toBe(2);
    expect(dailyStreak({ ...records, "2026-10-11": played() }, "2026-10-11")).toBe(3);
    expect(dailyStreak(records, "2026-10-12")).toBe(0);
    expect(dailyStreak({}, "2026-10-11")).toBe(0);
    expect(dailyStreak({ "2026-09-30": played(), "2026-10-01": played() }, "2026-10-01")).toBe(2);
  });

  it("keeps the best attempt of the day and counts every attempt", () => {
    let records = recordDailyAttempt({}, "2026-10-11", { waveReached: 4, kills: 50, victory: false });
    records = recordDailyAttempt(records, "2026-10-11", { waveReached: 3, kills: 90, victory: false });
    expect(records["2026-10-11"]).toEqual({ bestWave: 4, bestKills: 50, cleared: false, attempts: 2 });
    records = recordDailyAttempt(records, "2026-10-11", { waveReached: 4, kills: 60, victory: false });
    expect(records["2026-10-11"]).toMatchObject({ bestWave: 4, bestKills: 60, attempts: 3 });
    records = recordDailyAttempt(records, "2026-10-11", { waveReached: 10, kills: 300, victory: true });
    expect(records["2026-10-11"]).toEqual({ bestWave: 10, bestKills: 300, cleared: true, attempts: 4 });
  });

  it("ignores an invalid day rather than writing it", () => {
    expect(recordDailyAttempt({}, "tomorrow", { waveReached: 4, kills: 1, victory: false })).toEqual({});
  });

  it("prunes to the most recent days", () => {
    let records: Record<string, DailyRecord> = {};
    let key = "2026-12-31";
    for (let index = 0; index < DAILY_HISTORY_LIMIT + 10; index += 1) {
      records[key] = played();
      key = previousDailyKey(key);
    }
    records = recordDailyAttempt(records, "2027-01-01", { waveReached: 1, kills: 0, victory: false });
    const keys = Object.keys(records).sort();
    expect(keys).toHaveLength(DAILY_HISTORY_LIMIT);
    expect(keys.at(-1)).toBe("2027-01-01");
  });

  it("reads old or damaged saves as an empty or cleaned history", () => {
    expect(readDailyRecords(undefined)).toEqual({});
    expect(readDailyRecords("nope")).toEqual({});
    expect(readDailyRecords({
      "2026-10-11": { bestWave: 5.7, bestKills: -3, cleared: "yes", attempts: 2 },
      "not-a-day": { bestWave: 5, bestKills: 1, cleared: true, attempts: 1 },
      "2026-10-10": { bestWave: 5, bestKills: 1, cleared: true, attempts: 0 },
    })).toEqual({ "2026-10-11": { bestWave: 5, bestKills: 0, cleared: false, attempts: 2 } });
  });

  it("writes a plain share line with the public link and no tracking parameters", () => {
    expect(dailyLabel("2026-10-11")).toBe("11 OCT");
    const line = dailyShareText({
      dayKey: "2026-10-11", waveReached: 7, totalWaves: 10, kills: 214, heroName: "Marine", cleared: false, streak: 3,
    });
    expect(line).toBe("Last Bastion Daily Drop, 11 OCT: reached wave 7/10 with 214 kills as the Marine. Streak: 3 days. https://www.snackpackuniverse.com/play/last-bastion/");
    expect(dailyShareText({
      dayKey: "2026-10-11", waveReached: 10, totalWaves: 10, kills: 1, heroName: "Medic", cleared: true, streak: 1,
    })).toContain("cleared all 10 waves with 1 kill as the Medic. https://");
  });

  it("merges two devices' histories by keeping the better result per day", () => {
    const merged = mergeDailyRecords(
      { "2026-10-10": played(3), "2026-10-11": { bestWave: 6, bestKills: 40, cleared: false, attempts: 2 } },
      { "2026-10-11": { bestWave: 6, bestKills: 70, cleared: false, attempts: 1 }, "2026-10-12": played(9) },
    );
    expect(Object.keys(merged).sort()).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
    expect(merged["2026-10-11"]).toEqual({ bestWave: 6, bestKills: 70, cleared: false, attempts: 2 });
  });
});
