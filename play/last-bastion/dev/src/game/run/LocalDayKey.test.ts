import { describe, expect, it } from "vitest";
import { localDayKey } from "./LocalDayKey";

/**
 * These pin the defect the helper exists for: the same instant must report the
 * day the *player* experienced, which is not always the UTC day. The process
 * timezone is set per-case so the assertion does not depend on the machine
 * running the suite.
 */
interface EnvHost {
  readonly env: Record<string, string | undefined>;
}

/**
 * Reached through `globalThis` rather than the bare `process` global: this
 * workspace deliberately carries no Node type definitions, and one test helper
 * is not a reason to add them to the whole game's compile.
 */
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

describe("localDayKey", () => {
  it("reports the player's day, not the UTC day, east of Greenwich", () => {
    // 2026-09-06T21:00Z is already Monday the 7th at 09:00 in UTC+12.
    const instant = Date.UTC(2026, 8, 6, 21, 0, 0);
    expect(new Date(instant).toISOString().slice(0, 10)).toBe("2026-09-06");
    expect(withTimeZone("Pacific/Auckland", () => localDayKey(instant))).toBe("2026-09-07");
  });

  it("reports the player's day west of Greenwich", () => {
    // 2026-09-07T02:00Z is still Sunday the 6th at 19:00 in UTC-7.
    const instant = Date.UTC(2026, 8, 7, 2, 0, 0);
    expect(new Date(instant).toISOString().slice(0, 10)).toBe("2026-09-07");
    expect(withTimeZone("America/Los_Angeles", () => localDayKey(instant))).toBe("2026-09-06");
  });

  it("pads single-digit months and days", () => {
    expect(withTimeZone("UTC", () => localDayKey(Date.UTC(2026, 0, 5, 12, 0, 0)))).toBe("2026-01-05");
  });

  it("returns an empty key for an unusable timestamp", () => {
    expect(localDayKey(Number.NaN)).toBe("");
  });
});
