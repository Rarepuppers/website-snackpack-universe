import { describe, expect, it } from "vitest";
import { cueForEvent, EVASIVE_MOVE_CUE, UI_CONFIRM_CUE } from "./AudioCueMap";

describe("AudioCueMap", () => {
  it("provides cues for the representative vertical-slice moments", () => {
    for (const eventType of [
      "weapon-fired", "enemy-hit", "enemy-defeated", "explosion",
      "player-hit", "xp-collected", "level-up", "powerup-collected",
      "status-applied", "warp-arrival",
    ] as const) {
      const cue = cueForEvent(eventType);
      expect(cue, eventType).not.toBeNull();
      expect(cue!.durationSeconds).toBeGreaterThan(0);
      expect(cue!.frequencyHz).toBeGreaterThan(0);
    }
    expect(EVASIVE_MOVE_CUE.durationSeconds).toBeGreaterThan(0);
    expect(UI_CONFIRM_CUE.durationSeconds).toBeGreaterThan(0);
  });

  it("returns null for events without audio", () => {
    expect(cueForEvent("enemy-spawned")).toBeNull();
  });

  it("keeps placeholder volumes conservative to avoid clipping", () => {
    for (const eventType of [
      "weapon-fired", "explosion", "player-hit", "level-up",
    ] as const) {
      expect(cueForEvent(eventType)!.volume).toBeLessThanOrEqual(0.15);
    }
  });
});
