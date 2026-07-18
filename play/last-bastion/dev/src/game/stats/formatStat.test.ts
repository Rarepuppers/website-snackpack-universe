import { describe, expect, it } from "vitest";
import { DEBUG_DECIMALS, DISPLAY_DECIMALS, formatStat } from "./formatStat";

describe("formatStat", () => {
  it("trims trailing zeros so whole numbers read cleanly", () => {
    expect(formatStat(2)).toBe("2");
    expect(formatStat(4.0)).toBe("4");
    expect(formatStat(2.1)).toBe("2.1");
    expect(formatStat(12.5)).toBe("12.5");
  });

  it("rounds half up at one decimal, defeating binary-float ties", () => {
    // 2.05 * 10 is 20.499999999999996 in IEEE-754; the nudge keeps it a tie-up.
    expect(formatStat(2.05)).toBe("2.1");
    expect(formatStat(0.25)).toBe("0.3");
    expect(formatStat(2.04)).toBe("2");
  });

  it("keeps small mitigated hits visible instead of collapsing to zero", () => {
    // The 0.1 mitigation floor must still read as a real number.
    expect(formatStat(0.1)).toBe("0.1");
    expect(formatStat(0.04)).toBe("0");
  });

  it("supports debug precision for drift diagnosis", () => {
    expect(formatStat(2.104, DEBUG_DECIMALS)).toBe("2.104");
    expect(formatStat(2.1055, DEBUG_DECIMALS)).toBe("2.106");
    expect(formatStat(2, DEBUG_DECIMALS)).toBe("2");
  });

  it("never displays negative zero and tolerates non-finite input", () => {
    expect(formatStat(-0)).toBe("0");
    expect(formatStat(Number.NaN)).toBe("0");
    expect(formatStat(Number.POSITIVE_INFINITY)).toBe("0");
  });

  it("exposes the shared decimal constants", () => {
    expect(DISPLAY_DECIMALS).toBe(1);
    expect(DEBUG_DECIMALS).toBe(3);
  });
});
