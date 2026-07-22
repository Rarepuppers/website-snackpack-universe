import type { AudioCue } from "./AudioCueMap";
import { canStartProductionAudioVoice } from "./ProductionAudioCatalog";

/**
 * Minimal WebAudio placeholder synthesizer. Browsers block audio until a user
 * gesture, so the context is created lazily and resumed on demand; if audio is
 * unavailable the synth silently does nothing.
 */
export class WebAudioSynth {
  private context: AudioContext | null = null;
  private contextFailed = false;
  private readonly playedThisFrame = new Set<string>();
  private readonly lastStartedMs = new Map<string, number>();
  private readonly activeVoices = new Map<string, number>();

  constructor(public enabled: boolean) {}

  /** Call once per render frame so identical simultaneous cues play only once. */
  beginFrame(): void {
    this.playedThisFrame.clear();
  }

  play(cue: AudioCue): void {
    if (!this.enabled || this.playedThisFrame.has(cue.id)) {
      return;
    }
    const context = this.resolveContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      void context.resume();
    }
    this.playedThisFrame.add(cue.id);

    const now = context.currentTime;
    const nowMs = now * 1_000;
    const activeVoices = this.activeVoices.get(cue.id) ?? 0;
    if (!canStartProductionAudioVoice(cue.id, nowMs, this.lastStartedMs.get(cue.id), activeVoices)) {
      return;
    }
    this.lastStartedMs.set(cue.id, nowMs);
    this.activeVoices.set(cue.id, activeVoices + 1);
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = cue.oscillator;
    oscillator.frequency.setValueAtTime(cue.frequencyHz, now);
    if (cue.endFrequencyHz !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(cue.endFrequencyHz, 1),
        now + cue.durationSeconds,
      );
    }
    gain.gain.setValueAtTime(cue.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cue.durationSeconds);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + cue.durationSeconds + 0.02);
    oscillator.addEventListener("ended", () => {
      const remainingVoices = Math.max(0, (this.activeVoices.get(cue.id) ?? 1) - 1);
      if (remainingVoices === 0) this.activeVoices.delete(cue.id);
      else this.activeVoices.set(cue.id, remainingVoices);
      oscillator.disconnect();
      gain.disconnect();
    });
  }

  private resolveContext(): AudioContext | null {
    if (this.context || this.contextFailed) {
      return this.context;
    }
    try {
      this.context = new AudioContext();
    } catch {
      this.contextFailed = true;
    }
    return this.context;
  }
}
