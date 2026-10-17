import { describe, expect, it } from "vitest";
import { QaSession } from "./QaSession";

describe("local QA session collector", () => {
  it("reports full-session percentiles and explicit pause/hidden boundary exclusions", () => {
    const session = new QaSession();
    session.start(0);
    session.tick(10, false); session.tick(30, false);
    session.tick(130, true); session.tick(1130, true); session.tick(1140, false);
    session.tick(1190, false); session.stop(1200);
    expect(session.snapshot(9000)).toMatchObject({
      state: "stopped", activeSamples: 3, activeMilliseconds: 80,
      excludedMilliseconds: 1110, unobservedMilliseconds: 10, wallMilliseconds: 1200,
      p95FrameMilliseconds: 50, p99FrameMilliseconds: 50, hitchCount: 1,
    });
  });

  it("reports overflow without silently presenting prefix percentiles as the entire session", () => {
    const session = new QaSession(2); session.start(0);
    session.tick(10, false); session.tick(30, false); session.tick(230, false); session.stop(230);
    expect(session.snapshot(230)).toMatchObject({
      retainedSamples: 2, droppedSamples: 1, activeSamples: 3, activeMilliseconds: 230,
      p99FrameMilliseconds: 20, maximumFrameMilliseconds: 200, severeHitchCount: 1,
      percentileScope: "retained prefix only; session overflowed",
    });
  });

  it("does not collect before start or after stop, and resets without stale evidence", () => {
    const session = new QaSession(); session.tick(5, false);
    expect(session.snapshot(5).p99FrameMilliseconds).toBeNull();
    session.start(10, true); session.tick(40, false); session.tick(50, false); session.stop(55);
    session.tick(1000, false);
    expect(session.snapshot(1000).activeSamples).toBe(1);
    session.reset();
    expect(session.snapshot(1000)).toMatchObject({ state: "idle", activeSamples: 0, excludedMilliseconds: 0 });
    session.start(1000); session.tick(Number.NaN, false); session.tick(1016, false);
    expect(session.snapshot(1016)).toMatchObject({ activeSamples: 1, invalidSamples: 1 });
  });
});
