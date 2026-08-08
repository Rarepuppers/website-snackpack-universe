import { describe, expect, it } from "vitest";
import { FramePacingTelemetry } from "./FramePacingTelemetry";

describe("frame pacing telemetry", () => {
  it("reports rolling average, p95, p99, and one-percent-low FPS", () => {
    const telemetry = new FramePacingTelemetry(100, 60);
    for (let frame = 1; frame <= 100; frame += 1) telemetry.sample(frame);

    expect(telemetry.snapshot()).toEqual({
      ready: true,
      sampleCount: 100,
      sampledMilliseconds: 5_050,
      averageFrameMilliseconds: 50.5,
      p95FrameMilliseconds: 95,
      p99FrameMilliseconds: 99,
      onePercentLowFps: 1_000 / 99,
    });
  });

  it("keeps only the configured rolling window", () => {
    const telemetry = new FramePacingTelemetry(3, 2);
    [10, 20, 30, 40].forEach((sample) => telemetry.sample(sample));
    expect(telemetry.snapshot()).toMatchObject({
      sampleCount: 3,
      sampledMilliseconds: 90,
      averageFrameMilliseconds: 30,
      p95FrameMilliseconds: 40,
    });
  });

  it("excludes suspended and invalid samples", () => {
    const telemetry = new FramePacingTelemetry(4, 2);
    telemetry.sample(16);
    telemetry.sample(500, true);
    telemetry.sample(Number.NaN);
    telemetry.sample(0);
    expect(telemetry.snapshot()).toMatchObject({ ready: false, sampleCount: 1, sampledMilliseconds: 16 });
  });

  it("rejects impossible window configuration", () => {
    expect(() => new FramePacingTelemetry(0, 1)).toThrow(/capacity/);
    expect(() => new FramePacingTelemetry(10, 11)).toThrow(/readySamples/);
  });
});
