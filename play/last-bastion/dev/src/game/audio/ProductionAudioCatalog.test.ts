import { describe, expect, it } from "vitest";
import { cueForCombatEvent } from "./AudioCueMap";
import {
  PRODUCTION_AUDIO_S1_ASSETS,
  PRODUCTION_AUDIO_S1_FAMILIES,
  canStartProductionAudioVoice,
  productionAudioFamilyForCue,
} from "./ProductionAudioCatalog";

describe("ProductionAudioCatalog", () => {
  it("covers every implemented weapon through its stable simulation cue", () => {
    for (const family of Object.values(PRODUCTION_AUDIO_S1_FAMILIES)) {
      const cue = cueForCombatEvent({
        type: "weapon-fired",
        weaponInstanceId: 1,
        weaponId: family.weaponId,
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
      });
      expect(cue?.id, family.weaponId).toBe(family.triggerCueId);
      expect(productionAudioFamilyForCue(family.triggerCueId)).toBe(family);
    }
    expect(Object.keys(PRODUCTION_AUDIO_S1_FAMILIES)).toHaveLength(8);
  });

  it("uses unique deterministic file stems and bounded playback contracts", () => {
    expect(PRODUCTION_AUDIO_S1_ASSETS).toHaveLength(24);
    expect(new Set(PRODUCTION_AUDIO_S1_ASSETS.map((asset) => asset.id)).size).toBe(24);
    expect(new Set(PRODUCTION_AUDIO_S1_ASSETS.map((asset) => asset.fileStem)).size).toBe(24);
    for (const family of Object.values(PRODUCTION_AUDIO_S1_FAMILIES)) {
      expect(family.maxVoices).toBeGreaterThan(0);
      expect(family.maxVoices).toBeLessThanOrEqual(4);
      expect(family.minimumRetriggerMs).toBeGreaterThanOrEqual(35);
      for (const asset of family.assets) {
        expect(asset.durationMs[0]).toBeGreaterThan(0);
        expect(asset.durationMs[1]).toBeGreaterThanOrEqual(asset.durationMs[0]);
      }
    }
  });

  it("locks the Bulwark Rotary start, seamless loop, and end topology", () => {
    const rotary = PRODUCTION_AUDIO_S1_FAMILIES["bulwark-rotary-cannon"];
    expect(rotary.assets.map((asset) => asset.role)).toEqual(["loop-start", "loop", "loop-end"]);
    expect(rotary.assets[1]?.seamlessLoop).toBe(true);
    expect(rotary.assets.filter((asset) => asset.seamlessLoop)).toHaveLength(1);
  });

  it("returns no production family for non-S1 cues", () => {
    expect(productionAudioFamilyForCue("player-hit")).toBeNull();
  });

  it("enforces per-family retrigger and voice limits without throttling unrelated cues", () => {
    const rifle = PRODUCTION_AUDIO_S1_FAMILIES["bastion-service-rifle"];
    expect(canStartProductionAudioVoice(rifle.triggerCueId, 1_000, undefined, 0)).toBe(true);
    expect(canStartProductionAudioVoice(rifle.triggerCueId, 1_040, 1_000, 0)).toBe(false);
    expect(canStartProductionAudioVoice(rifle.triggerCueId, 1_060, 1_000, rifle.maxVoices)).toBe(false);
    expect(canStartProductionAudioVoice(rifle.triggerCueId, 1_060, 1_000, rifle.maxVoices - 1)).toBe(true);
    expect(canStartProductionAudioVoice("player-hit", 1_001, 1_000, 99)).toBe(true);
  });
});
