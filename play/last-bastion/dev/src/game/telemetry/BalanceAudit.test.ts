import { describe, expect, it } from "vitest";
import { runBalanceAudit, summarizeBalanceAudit } from "./BalanceAudit";

describe("BalanceAudit", () => {
  it("includes every implemented hero mechanics contract", () => {
    const rows = runBalanceAudit({ seeds: 1, policies: ["cautious"], maxSeconds: 0.1 });
    expect(rows.map(({ heroId }) => heroId)).toEqual(["marine", "medic", "assault", "tactician", "scout"]);
    expect(summarizeBalanceAudit(rows).map(({ heroId }) => heroId))
      .toEqual(["marine", "medic", "assault", "tactician", "scout"]);
  });
});
