import type { AudioCue } from "./AudioCueMap";

/**
 * Minimal WebAudio placeholder synthesizer. Browsers block audio until a user
 * gesture, so the context is created lazily and resumed on demand; if audio is
 * unavailable the synth silently does nothing.
 */
export class WebAudioSynth {
  private context: AudioContext | null = null;
  private contextFailed = false;
  private readonly playedThisFrame = new Set<string>();

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

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

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
