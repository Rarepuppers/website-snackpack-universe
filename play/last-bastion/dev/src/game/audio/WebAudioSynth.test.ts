import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebAudioSynth } from "./WebAudioSynth";
import { PRODUCTION_AUDIO_S1_FAMILIES } from "./ProductionAudioCatalog";

function node() {
  const callbacks: (() => void)[] = [];
  return { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    addEventListener: (_: string, cb: () => void) => callbacks.push(cb),
    end: () => callbacks.forEach(cb => cb()),
  };
}
function context() {
  const gains: ReturnType<typeof gain>[] = [], sources: ReturnType<typeof node>[] = [];
  function gain() { return { connect: vi.fn(), disconnect: vi.fn(), gain: {
    value: 1, cancelAndHoldAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(),
  } }; }
  return { state: "running", currentTime: 10, destination: {}, gains, sources,
    createGain: () => { const n = gain(); gains.push(n); return n; },
    createBufferSource: () => { const n = node(); sources.push(n); return n; },
    createOscillator: () => { const n = node(); sources.push(n); return n; },
    resume: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.2 }),
  };
}
const cue = (id = "player-hit") => ({ id, volume: 0.14, frequencyHz: 180, durationSeconds: 0.22, oscillator: "square" as const });

describe("production audio live output and ownership", () => {
  let ctx: ReturnType<typeof context>;
  beforeEach(() => {
    vi.useFakeTimers(); ctx = context();
    vi.stubGlobal("AudioContext", function () { return ctx; });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  async function warm(synth: WebAudioSynth) {
    synth.play(cue());
    await vi.waitFor(() => expect(ctx.decodeAudioData).toHaveBeenCalled());
    await Promise.resolve(); await Promise.resolve();
    ctx.sources.forEach(s => s.end()); synth.beginFrame();
  }

  it("routes active production samples through the live output and stops them at zero", async () => {
    const synth = new WebAudioSynth(true); await warm(synth);
    synth.play(cue());
    expect(ctx.gains.at(-1)!.gain.value).toBe(0.72);
    expect(ctx.gains.at(-1)!.connect).toHaveBeenCalledWith(ctx.gains[0]);
    synth.setVolume(0.4);
    expect(ctx.gains[0]!.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.4, 10.01);
    synth.setVolume(0);
    expect(ctx.gains[0]!.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 10.01);
    expect(ctx.sources.at(-1)!.stop).toHaveBeenCalledWith(10.01);
    const count = ctx.sources.length;
    synth.beginFrame(); synth.play(cue()); expect(ctx.sources).toHaveLength(count);
    synth.dispose();
  });

  it("mutes fallback voices, restores configured gain and does not replay them", () => {
    const synth = new WebAudioSynth(true); synth.setVolume(0.3); synth.play(cue("unmapped"));
    expect(ctx.gains[0]!.gain.value).toBe(0.3);
    expect(ctx.gains[1]!.connect).toHaveBeenCalledWith(ctx.gains[0]);
    synth.enabled = false;
    expect(ctx.gains[0]!.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 10.01);
    expect(ctx.sources[0]!.stop).toHaveBeenLastCalledWith(10.01);
    synth.enabled = true;
    expect(ctx.gains[0]!.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.3, 10.01);
    expect(ctx.sources).toHaveLength(1);
    synth.dispose();
  });

  it("cancels rotary loop and delayed end cue on mute", async () => {
    const synth = new WebAudioSynth(true); await warm(synth);
    synth.play(cue(PRODUCTION_AUDIO_S1_FAMILIES["bulwark-rotary-cannon"].triggerCueId));
    const count = ctx.sources.length;
    expect(count).toBe(3); // warm fallback, rotary start and loop
    synth.enabled = false;
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.sources).toHaveLength(count);
    expect(ctx.sources.at(-1)!.stop).toHaveBeenCalledWith(10.01);
    synth.dispose();
  });

  it("retains the normal rotary end cue when not muted", async () => {
    const synth = new WebAudioSynth(true); await warm(synth);
    synth.play(cue(PRODUCTION_AUDIO_S1_FAMILIES["bulwark-rotary-cannon"].triggerCueId));
    await vi.advanceTimersByTimeAsync(121);
    expect(ctx.sources).toHaveLength(4);
    expect(ctx.gains.at(-1)!.gain.value).toBe(0.66);
    expect(ctx.gains.at(-1)!.connect).toHaveBeenCalledWith(ctx.gains[0]);
    synth.dispose();
  });

  it("disposes once, disconnects active nodes, aborts loads and rejects later play", async () => {
    const synth = new WebAudioSynth(true); await warm(synth);
    synth.play(cue(PRODUCTION_AUDIO_S1_FAMILIES["bulwark-rotary-cannon"].triggerCueId));
    const count = ctx.sources.length;
    synth.dispose(); synth.dispose();
    expect(ctx.close).toHaveBeenCalledOnce();
    expect(ctx.gains[0]!.disconnect).toHaveBeenCalled();
    expect(ctx.sources.at(-1)!.stop).toHaveBeenCalledWith(10);
    expect(ctx.sources.at(-1)!.disconnect).toHaveBeenCalled();
    const options = vi.mocked(fetch).mock.calls[0]![1]!;
    expect(options.signal!.aborted).toBe(true);
    synth.beginFrame(); synth.play(cue()); await vi.advanceTimersByTimeAsync(500);
    expect(ctx.sources).toHaveLength(count);
  });

  it("does not allocate an audio context before enabled nonzero playback", () => {
    const synth = new WebAudioSynth(false); synth.play(cue());
    synth.enabled = true; synth.setVolume(0); synth.play(cue());
    expect(ctx.gains).toHaveLength(0);
    synth.dispose(); expect(ctx.close).not.toHaveBeenCalled();
  });

  it("retries in place without stale rotary tails or old ended callbacks clearing new voices", async () => {
    const synth = new WebAudioSynth(true); await warm(synth);
    synth.play(cue()); const old = ctx.sources.at(-1)!;
    synth.stop(); synth.play(cue()); old.end();
    expect((synth as unknown as { activeVoices: Map<string, number> }).activeVoices.get("player-hit")).toBe(1);
    expect(ctx.close).not.toHaveBeenCalled();
    synth.dispose();
  });
});
