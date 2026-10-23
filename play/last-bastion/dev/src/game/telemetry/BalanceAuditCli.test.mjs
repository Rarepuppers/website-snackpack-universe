import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
const script = fileURLToPath(new URL("../../../scripts/run-balance-audit.mjs", import.meta.url));
describe("balance audit command", () => {
  it("executes production simulations and emits deterministic versioned rows", () => {
    const args = [script, "--seeds", "1", "--policies", "cautious,sustain-first", "--seconds", "0.1"];
    const run = () => JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8" }));
    const report = run();
    expect(run()).toEqual(report);
    expect(report.schemaVersion).toBe(2);
    expect(report.rows).toHaveLength(10);
    expect(report.summary).toHaveLength(10);
    expect(report.rows.every((row) => row.outcome === "censored" && row.simulatedSeconds > 0)).toBe(true);
  }, 30_000);
  it("rejects unknown options and invalid values", () => {
    for (const args of [["--unknown", "1"], ["--policies", "typo"], ["--seconds", "NaN"]]) {
      const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/Usage:|policies must|maxSeconds must/);
    }
  }, 30_000);
});
