export type AudioBus = "sfx" | "ui" | "music" | "ambience";
export type AudioVoicePriority = "critical" | "high" | "standard" | "low";
const PRIORITY: Record<AudioVoicePriority, number> = { critical: 4, high: 3, standard: 2, low: 1 };

export interface AudioVoice { id: string; bus: AudioBus; priority: AudioVoicePriority; startedAtMs: number; loop?: boolean; }
export interface AudioMixerSnapshot { master: number; buses: Readonly<Record<AudioBus, number>>; muted: boolean; activeVoices: number; }

export function perceptualGain(value: number): number { const normalized = Math.min(1, Math.max(0, value)); return normalized * normalized; }

/** Presentation-only mixer state and voice admission; simulation never reads it. */
export class AudioMixer {
  private readonly buses: Record<AudioBus, number> = { sfx: 1, ui: 1, music: 1, ambience: 1 };
  private master = 1;
  private muted = false;
  private voices: AudioVoice[] = [];

  setBusVolume(bus: AudioBus, value: number): void { this.buses[bus] = Math.min(1, Math.max(0, value)); }
  setMasterVolume(value: number): void { this.master = Math.min(1, Math.max(0, value)); }
  setMuted(muted: boolean): void { this.muted = muted; }
  effectiveGain(bus: AudioBus): number { return this.muted ? 0 : perceptualGain(this.master) * perceptualGain(this.buses[bus]); }
  admitVoice(voice: AudioVoice, maximumVoices: number): AudioVoice | null {
    if (this.voices.length < Math.max(1, maximumVoices)) { this.voices.push(voice); return null; }
    const victimIndex = this.voices.reduce((oldest, candidate, index, all) => {
      const current = all[oldest]!;
      return PRIORITY[candidate.priority] < PRIORITY[current.priority] || (PRIORITY[candidate.priority] === PRIORITY[current.priority] && candidate.startedAtMs < current.startedAtMs) ? index : oldest;
    }, 0);
    const victim = this.voices[victimIndex]!;
    if (PRIORITY[voice.priority] < PRIORITY[victim.priority]) return voice;
    this.voices[victimIndex] = voice;
    return victim;
  }
  releaseVoice(id: string): void { this.voices = this.voices.filter((voice) => voice.id !== id); }
  snapshot(): AudioMixerSnapshot { return { master: this.master, buses: { ...this.buses }, muted: this.muted, activeVoices: this.voices.length }; }
}
