import { describe, expect, it } from "vitest";
import { parsePcmWav, validateMaster } from "./validate-production-audio.mjs";

const sourceFormat = { sampleRateHz: 48_000, bitDepth: 24, channels: 1, maximumPeakDbfs: -1 };
const asset = { durationMs: [90, 110], seamlessLoop: false };

function wav24({ durationMs = 100, amplitude = 1_000_000, channels = 1, sampleRateHz = 48_000, bitDepth = 24 } = {}) {
  const frames = Math.round(sampleRateHz * durationMs / 1_000);
  const bytesPerSample = bitDepth / 8;
  const dataSize = frames * channels * bytesPerSample;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const writeText = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  writeText(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); writeText(8, "WAVE");
  writeText(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, sampleRateHz, true);
  view.setUint32(28, sampleRateHz * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true); view.setUint16(34, bitDepth, true);
  writeText(36, "data"); view.setUint32(40, dataSize, true);
  if (bitDepth === 24) for (let frame = 0; frame < frames; frame += 1) {
    const sample = Math.round(Math.sin(frame / 12) * amplitude);
    const encoded = sample < 0 ? sample + 0x1000000 : sample;
    for (let channel = 0; channel < channels; channel += 1) {
      const offset = 44 + (frame * channels + channel) * 3;
      view.setUint8(offset, encoded & 0xff); view.setUint8(offset + 1, encoded >> 8 & 0xff); view.setUint8(offset + 2, encoded >> 16 & 0xff);
    }
  }
  return bytes;
}

describe("production audio WAV validator", () => {
  it("parses and accepts a compliant mono 48 kHz / 24-bit master", () => {
    const bytes = wav24();
    expect(parsePcmWav(bytes)).toMatchObject({ channels: 1, sampleRateHz: 48_000, bitDepth: 24, frameCount: 4_800 });
    expect(validateMaster(bytes, asset, sourceFormat).errors).toEqual([]);
  });

  it("rejects wrong channels, duration, and unsafe peak", () => {
    const result = validateMaster(wav24({ durationMs: 140, amplitude: 8_000_000, channels: 2 }), asset, sourceFormat);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("1 channel required"),
      expect.stringContaining("duration"),
      expect.stringContaining("sample peak"),
    ]));
  });

  it("rejects malformed input and discontinuous loop seams", () => {
    expect(() => parsePcmWav(new Uint8Array(12))).toThrow("not a RIFF/WAVE file");
    const result = validateMaster(wav24(), { durationMs: [90, 110], seamlessLoop: true }, sourceFormat);
    expect(result.errors.some((error) => error.includes("loop seam"))).toBe(true);
  });
});
