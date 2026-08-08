import { describe, expect, it } from "vitest";
import {
  CRITICAL_HIT_STOP_FRAMES,
  DEFEAT_HIT_STOP_FRAMES,
  HIT_STOP_FRAME_MILLISECONDS,
  consumeHitStopFrame,
  mergeHitStopRequest,
  requestedHitStopMilliseconds,
} from "./HitStop";

const enabled = { enabled: true, reducedMotion: false, intensityMultiplier: 1 };

describe("presentation hit-stop", () => {
  it("requests two frames for a crit and four for a defeat", () => {
    expect(requestedHitStopMilliseconds({ criticalHits: 1, enemyDefeats: 0 }, enabled))
      .toBeCloseTo(CRITICAL_HIT_STOP_FRAMES * HIT_STOP_FRAME_MILLISECONDS);
    expect(requestedHitStopMilliseconds({ criticalHits: 0, enemyDefeats: 1 }, enabled))
      .toBeCloseTo(DEFEAT_HIT_STOP_FRAMES * HIT_STOP_FRAME_MILLISECONDS);
  });

  it("takes the strongest beat instead of stacking a busy frame", () => {
    expect(requestedHitStopMilliseconds({ criticalHits: 8, enemyDefeats: 3 }, enabled))
      .toBeCloseTo(DEFEAT_HIT_STOP_FRAMES * HIT_STOP_FRAME_MILLISECONDS);
  });

  it("respects reduced motion, the legacy toggle, and bounded intensity", () => {
    const trigger = { criticalHits: 0, enemyDefeats: 1 };
    expect(requestedHitStopMilliseconds(trigger, { ...enabled, enabled: false })).toBe(0);
    expect(requestedHitStopMilliseconds(trigger, { ...enabled, reducedMotion: true })).toBe(0);
    expect(requestedHitStopMilliseconds(trigger, { ...enabled, intensityMultiplier: 0.5 }))
      .toBeCloseTo(2 * HIT_STOP_FRAME_MILLISECONDS);
    expect(requestedHitStopMilliseconds(trigger, { ...enabled, intensityMultiplier: 5 }))
      .toBeCloseTo(4 * HIT_STOP_FRAME_MILLISECONDS);
  });

  it("consumes raw host-frame time while freezing every requested frame", () => {
    let remaining = 4 * HIT_STOP_FRAME_MILLISECONDS;
    const frozen: boolean[] = [];
    for (let frame = 0; frame < 5; frame += 1) {
      const plan = consumeHitStopFrame(remaining, HIT_STOP_FRAME_MILLISECONDS);
      frozen.push(plan.freezeFrame);
      remaining = plan.nextRemainingMilliseconds;
    }
    expect(frozen).toEqual([true, true, true, true, false]);
  });

  it("extends only to the stronger outstanding request and sanitizes bad input", () => {
    expect(mergeHitStopRequest(60, 30)).toBe(60);
    expect(mergeHitStopRequest(20, 40)).toBe(40);
    expect(mergeHitStopRequest(Number.NaN, -5)).toBe(0);
    expect(consumeHitStopFrame(Number.NaN, 16)).toEqual({
      freezeFrame: false,
      nextRemainingMilliseconds: 0,
    });
  });
});
