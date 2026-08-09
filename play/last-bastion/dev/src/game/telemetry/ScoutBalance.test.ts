import { describe, expect, it } from "vitest";
import { runBalanceAudit, summarizeBalanceAudit } from "./BalanceAudit";

describe("Scout balance candidate", () => {
  it("records a provisional implemented-roster band across twelve deterministic seeds", () => {
    const rows = runBalanceAudit({ seeds: 12, policies: ["cautious"], maxSeconds: 45 });
    const summary = summarizeBalanceAudit(rows);
    expect(summary).toHaveLength(5);
    const scout = summary.find(({ heroId }) => heroId === "scout");
    expect(scout).toBeDefined();
    expect(scout!.bossEntryLevel[1]).toBeGreaterThanOrEqual(1);
    expect(scout!.bossEntryLevel[1]).toBeLessThanOrEqual(2);
    expect(scout!.finalScrap[1]).toBeGreaterThanOrEqual(18);
    expect(scout!.finalScrap[1]).toBeLessThanOrEqual(24);
    expect(scout!.damageTaken[1]).toBeGreaterThanOrEqual(7);
    expect(scout!.damageTaken[1]).toBeLessThanOrEqual(9);
  });
});
