import { describe, expect, it } from "vitest";
import { normalizeBalanceAuditOptions, runBalanceAudit, summarizeBalanceAudit } from "./BalanceAudit";

describe("BalanceAudit", () => {
  it("rejects invalid budgets and policies", () => {
    for (const seeds of [0, -1, 1.5, NaN, Infinity, 1001]) expect(() => normalizeBalanceAuditOptions({ seeds })).toThrow();
    for (const maxSeconds of [0, -1, NaN, Infinity, 3601]) expect(() => normalizeBalanceAuditOptions({ maxSeconds })).toThrow();
    expect(() => normalizeBalanceAuditOptions({ policies: [] })).toThrow();
    expect(() => normalizeBalanceAuditOptions({ policies: ["cautious", "cautious"] })).toThrow();
  });
  it("reproduces unfinished production rows without treating them as losses", () => {
    const options = { seeds: 1, policies: ["cautious"] as const, maxSeconds: 0.1 };
    const rows = runBalanceAudit(options);
    expect(runBalanceAudit(options)).toEqual(rows);
    expect(rows.every(row => row.outcome === "censored" && row.budgetSeconds === 0.1)).toBe(true);
    for (const summary of summarizeBalanceAudit(rows)) {
      expect(summary).toMatchObject({ runs: 1, completed: 0, censored: 1, completedWinRate: null, purchases: null });
      expect(summary).not.toHaveProperty("bossEntryLevel");
    }
    const row = rows[0]!;
    expect(summarizeBalanceAudit([row, { ...row, outcome: "victory" }, { ...row, outcome: "defeat" }])[0])
      .toMatchObject({ completed: 2, censored: 1, wins: 1, losses: 1, completedWinRate: 0.5 });
  });
  it("includes every implemented hero mechanics contract", () => {
    const rows = runBalanceAudit({ seeds: 1, policies: ["cautious"], maxSeconds: 0.1 });
    expect(rows.map(({ heroId }) => heroId)).toEqual(["marine", "medic", "assault", "tactician", "scout"]);
    expect(summarizeBalanceAudit(rows).map(({ heroId }) => heroId))
      .toEqual(["marine", "medic", "assault", "tactician", "scout"]);
  });
});
