import { describe, expect, it } from "vitest";
import { AudioMixer, perceptualGain } from "./AudioMixer";

describe("AudioMixer", () => {
  it("uses perceptual bus gains and keeps mute independent of decoded state", () => {
    const mixer = new AudioMixer();
    mixer.setBusVolume("music", 0.5);
    expect(perceptualGain(0.5)).toBe(0.25);
    expect(mixer.effectiveGain("music")).toBe(0.25);
    mixer.setMuted(true);
    expect(mixer.effectiveGain("music")).toBe(0);
    expect(mixer.snapshot().buses.music).toBe(0.5);
  });
  it("preserves critical warnings when voice capacity is full", () => {
    const mixer = new AudioMixer();
    mixer.admitVoice({ id: "ambience", bus: "ambience", priority: "low", startedAtMs: 1 }, 1);
    expect(mixer.admitVoice({ id: "warning", bus: "sfx", priority: "critical", startedAtMs: 2 }, 1)?.id).toBe("ambience");
    expect(mixer.snapshot().activeVoices).toBe(1);
  });
});
