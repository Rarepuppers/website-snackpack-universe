import { describe, expect, it } from "vitest";
import { formatRunClock, waveCountdownView } from "./formatStat";

describe("formatRunClock", () => {
  it("pads seconds so the clock does not jitter in width", () => {
    expect(formatRunClock(0)).toBe("0:00");
    expect(formatRunClock(9)).toBe("0:09");
    expect(formatRunClock(65)).toBe("1:05");
    expect(formatRunClock(600)).toBe("10:00");
  });

  it("floors, so the clock never shows a second the run has not reached", () => {
    expect(formatRunClock(59.9)).toBe("0:59");
    expect(formatRunClock(119.99)).toBe("1:59");
  });

  it("rolls into hours only when a run actually gets there", () => {
    expect(formatRunClock(3599)).toBe("59:59");
    expect(formatRunClock(3600)).toBe("1:00:00");
    expect(formatRunClock(3661)).toBe("1:01:01");
  });

  it("tolerates negative and non-finite input", () => {
    expect(formatRunClock(-5)).toBe("0:00");
    expect(formatRunClock(Number.NaN)).toBe("0:00");
    expect(formatRunClock(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

describe("waveCountdownView", () => {
  it("shows a draining bar through a timed wave", () => {
    const start = waveCountdownView(0, 40, true, true);
    expect(start.visible).toBe(true);
    expect(start.remainingSeconds).toBe(40);
    expect(start.remainingFraction).toBe(1);

    const half = waveCountdownView(20, 40, true, true);
    expect(half.remainingFraction).toBeCloseTo(0.5);
    expect(half.remainingSeconds).toBe(20);
  });

  it("hides on clear-all waves, which have no timed ending", () => {
    // Waves 5 and 10 carry a null duration outright.
    expect(waveCountdownView(12, null, false, true).visible).toBe(false);
    // Waves 1-2 carry a 20s duration, but it is the spawn-schedule window and
    // does NOT end the wave — so a draining bar would promise a false ending.
    expect(waveCountdownView(12, 20, false, true).visible).toBe(false);
  });

  it("hides outside combat so it does not run during intermission", () => {
    expect(waveCountdownView(5, 40, true, false).visible).toBe(false);
  });

  it("clamps at zero rather than going negative past the deadline", () => {
    const over = waveCountdownView(48, 40, true, true);
    expect(over.remainingSeconds).toBe(0);
    expect(over.remainingFraction).toBe(0);
  });

  it("ceilings the numeric so it only reads 0 when the wave is genuinely over", () => {
    expect(waveCountdownView(39.4, 40, true, true).remainingSeconds).toBe(1);
    expect(waveCountdownView(40, 40, true, true).remainingSeconds).toBe(0);
  });

  it("flags the last five seconds as urgent", () => {
    expect(waveCountdownView(34, 40, true, true).urgent).toBe(false);
    expect(waveCountdownView(35, 40, true, true).urgent).toBe(true);
    expect(waveCountdownView(40, 40, true, true).urgent).toBe(true);
  });

  it("does not divide by a zero or non-finite duration", () => {
    expect(waveCountdownView(5, 0, true, true).visible).toBe(false);
    expect(waveCountdownView(5, Number.NaN, true, true).visible).toBe(false);
  });
});
