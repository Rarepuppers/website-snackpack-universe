import { describe, expect, it } from "vitest";
import { cueForCombatEvent, cueForEvent, EVASIVE_MOVE_CUE, UI_CONFIRM_CUE } from "./AudioCueMap";

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

  it("gives each implemented weapon and Corrupted Human threat a stable production-audio id", () => {
    const weaponIds = [
      "bastion-service-rifle", "scattergun", "arc-carbine", "patrol-blade",
      "bolt-carbine", "bulwark-rotary-cannon", "grenade-tube", "injector-carbine",
    ] as const;
    const cueIds = weaponIds.map((weaponId) => cueForCombatEvent({
      type: "weapon-fired", weaponInstanceId: 1, weaponId,
      position: { x: 0, y: 0 }, direction: { x: 1, y: 0 },
    })!.id);
    expect(new Set(cueIds).size).toBe(weaponIds.length);
    for (const eventType of [
      "corrupted-marine-warning", "corrupted-marine-knife-fired", "corrupted-marine-knife-impact",
      "abomination-slam-warning", "abomination-slam-impact",
    ] as const) expect(cueForEvent(eventType), eventType).not.toBeNull();
  });
});
