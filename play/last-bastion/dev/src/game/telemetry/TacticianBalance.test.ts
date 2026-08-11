import { describe, expect, it } from "vitest";
import { runBalanceAudit, summarizeBalanceAudit } from "./BalanceAudit";

describe("Tactician balance candidate", () => {
  it("stays within the implemented-roster band across twelve deterministic seeds", () => {
    const rows = runBalanceAudit({ seeds: 12, policies: ["cautious"], maxSeconds: 45 });
    const summary = summarizeBalanceAudit(rows);
    expect(summary).toHaveLength(5);
    const tactician = summary.find(({ heroId }) => heroId === "tactician");
    expect(tactician).toBeDefined();
    expect(tactician!.bossEntryLevel[1]).toBeGreaterThanOrEqual(1);
    expect(tactician!.bossEntryLevel[1]).toBeLessThanOrEqual(2);
    expect(tactician!.finalScrap[1]).toBeGreaterThanOrEqual(1);
    expect(tactician!.finalScrap[1]).toBeLessThanOrEqual(5);
    expect(tactician!.damageTaken[1]).toBeGreaterThanOrEqual(7);
    expect(tactician!.damageTaken[1]).toBeLessThanOrEqual(11);
  }, 10_000);
});
