import type { AudioCue } from "./AudioCueMap";
import {
  canStartProductionAudioVoice,
  productionAudioFamilyForCue,
  PRODUCTION_AUDIO_S1_ASSETS,
} from "./ProductionAudioCatalog";
import { PRODUCTION_AUDIO_S1_URLS } from "./ProductionAudioAssets";

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
  private readonly productionBuffers = new Map<string, AudioBuffer>();
  private readonly nextVariant = new Map<string, number>();
  private productionLoadStarted = false;
  private rotaryLoop: AudioBufferSourceNode | null = null;
  private rotaryLoopGain: GainNode | null = null;
  private rotaryStopTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.loadProductionBuffers(context);
    this.playedThisFrame.add(cue.id);

    const now = context.currentTime;
    const nowMs = now * 1_000;
    const activeVoices = this.activeVoices.get(cue.id) ?? 0;
    if (!canStartProductionAudioVoice(cue.id, nowMs, this.lastStartedMs.get(cue.id), activeVoices)) {
      return;
    }
    this.lastStartedMs.set(cue.id, nowMs);
    if (this.playProductionCue(context, cue)) {
      return;
    }
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

  private loadProductionBuffers(context: AudioContext): void {
    if (this.productionLoadStarted) return;
    this.productionLoadStarted = true;
    for (const asset of PRODUCTION_AUDIO_S1_ASSETS) {
      const urls = PRODUCTION_AUDIO_S1_URLS[asset.id];
      if (!urls) continue;
      void this.fetchAndDecode(context, urls.ogg)
        .catch(() => this.fetchAndDecode(context, urls.mp3))
        .then((buffer) => this.productionBuffers.set(asset.id, buffer))
        .catch(() => { /* Keep the oscillator fallback when both decoders fail. */ });
    }
  }

  private async fetchAndDecode(context: AudioContext, url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`audio fetch failed: ${response.status}`);
    return context.decodeAudioData(await response.arrayBuffer());
  }

  private playProductionCue(context: AudioContext, cue: AudioCue): boolean {
    const family = productionAudioFamilyForCue(cue.id);
    if (!family) return false;
    if (family.weaponId === "bulwark-rotary-cannon") {
      return this.playRotaryFamily(context, cue.id, family.assets.map((asset) => asset.id));
    }
    const candidates = family.assets.filter((asset) => asset.role === "one-shot" && this.productionBuffers.has(asset.id));
    if (candidates.length !== family.assets.length) return false;
    const variant = this.nextVariant.get(cue.id) ?? 0;
    this.nextVariant.set(cue.id, (variant + 1) % candidates.length);
    const buffer = this.productionBuffers.get(candidates[variant]?.id ?? "");
    if (!buffer) return false;
    this.startBuffer(context, cue.id, buffer, 0.72);
    return true;
  }

  private playRotaryFamily(context: AudioContext, cueId: string, assetIds: readonly string[]): boolean {
    const [startId, loopId, endId] = assetIds;
    const start = startId ? this.productionBuffers.get(startId) : undefined;
    const loop = loopId ? this.productionBuffers.get(loopId) : undefined;
    const end = endId ? this.productionBuffers.get(endId) : undefined;
    if (!start || !loop || !end) return false;

    if (!this.rotaryLoop) {
      this.activeVoices.set(cueId, 1);
      this.startBuffer(context, cueId, start, 0.68, false);
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = loop;
      source.loop = true;
      gain.gain.value = 0.64;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(context.currentTime + Math.max(0.02, start.duration - 0.025));
      this.rotaryLoop = source;
      this.rotaryLoopGain = gain;
    }

    if (this.rotaryStopTimer) clearTimeout(this.rotaryStopTimer);
    this.rotaryStopTimer = setTimeout(() => {
      const stopAt = context.currentTime + 0.025;
      this.rotaryLoopGain?.gain.setValueAtTime(this.rotaryLoopGain.gain.value, context.currentTime);
      this.rotaryLoopGain?.gain.linearRampToValueAtTime(0.001, stopAt);
      this.rotaryLoop?.stop(stopAt);
      this.rotaryLoop?.disconnect();
      this.rotaryLoopGain?.disconnect();
      this.rotaryLoop = null;
      this.rotaryLoopGain = null;
      this.rotaryStopTimer = null;
      this.activeVoices.delete(cueId);
      this.startBuffer(context, cueId, end, 0.66, false);
    }, 120);
    return true;
  }

  private startBuffer(context: AudioContext, cueId: string, buffer: AudioBuffer, volume: number, countVoice = true): void {
    if (countVoice) this.activeVoices.set(cueId, (this.activeVoices.get(cueId) ?? 0) + 1);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.addEventListener("ended", () => {
      if (countVoice) {
        const remaining = Math.max(0, (this.activeVoices.get(cueId) ?? 1) - 1);
        if (remaining === 0) this.activeVoices.delete(cueId);
        else this.activeVoices.set(cueId, remaining);
      }
      source.disconnect();
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
