import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const batchRoot = fileURLToPath(new URL("../../audio/production/batch-s1/", import.meta.url));

export function parsePcmWav(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset, length) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (bytes.byteLength < 44 || text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE") {
    throw new Error("not a RIFF/WAVE file");
  }
  let format = null;
  let dataOffset = -1;
  let dataSize = 0;
  for (let offset = 12; offset + 8 <= bytes.byteLength;) {
    const chunkId = text(offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const payload = offset + 8;
    if (payload + chunkSize > bytes.byteLength) throw new Error(`truncated ${chunkId} chunk`);
    if (chunkId === "fmt ") {
      if (chunkSize < 16) throw new Error("invalid fmt chunk");
      format = {
        audioFormat: view.getUint16(payload, true),
        channels: view.getUint16(payload + 2, true),
        sampleRateHz: view.getUint32(payload + 4, true),
        blockAlign: view.getUint16(payload + 12, true),
        bitDepth: view.getUint16(payload + 14, true),
      };
    } else if (chunkId === "data") {
      dataOffset = payload;
      dataSize = chunkSize;
    }
    offset = payload + chunkSize + (chunkSize % 2);
  }
  if (!format || dataOffset < 0) throw new Error("missing fmt or data chunk");
  if (format.blockAlign <= 0 || dataSize % format.blockAlign !== 0) throw new Error("misaligned PCM data");
  return { ...format, dataOffset, dataSize, frameCount: dataSize / format.blockAlign };
}

export function readSigned24(view, offset) {
  const value = view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
  return value & 0x800000 ? value - 0x1000000 : value;
}

export function validateMaster(bytes, asset, sourceFormat) {
  const wav = parsePcmWav(bytes);
  const errors = [];
  if (wav.audioFormat !== 1) errors.push(`PCM format 1 required; got ${wav.audioFormat}`);
  if (wav.channels !== sourceFormat.channels) errors.push(`${sourceFormat.channels} channel required; got ${wav.channels}`);
  if (wav.sampleRateHz !== sourceFormat.sampleRateHz) errors.push(`${sourceFormat.sampleRateHz} Hz required; got ${wav.sampleRateHz}`);
  if (wav.bitDepth !== sourceFormat.bitDepth) errors.push(`${sourceFormat.bitDepth}-bit required; got ${wav.bitDepth}`);
  const durationMs = wav.frameCount / wav.sampleRateHz * 1_000;
  if (durationMs < asset.durationMs[0] || durationMs > asset.durationMs[1]) {
    errors.push(`duration ${durationMs.toFixed(1)} ms outside ${asset.durationMs[0]}–${asset.durationMs[1]} ms`);
  }
  let peak = 0;
  let seam = 0;
  if (wav.audioFormat === 1 && wav.bitDepth === 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let first = 0;
    let second = 0;
    let previous = 0;
    let last = 0;
    const sampleCount = wav.frameCount * wav.channels;
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const sample = readSigned24(view, wav.dataOffset + sampleIndex * 3);
      if (wav.channels === 1) {
        if (sampleIndex === 0) first = sample;
        if (sampleIndex === 1) second = sample;
        previous = last;
        last = sample;
      }
      peak = Math.max(peak, Math.abs(sample));
    }
    if (asset.seamlessLoop && wav.channels === 1 && wav.frameCount >= 3) {
      const valueJump = Math.abs(last - first);
      const slopeJump = Math.abs((first - last) - (last - previous) + (second - first));
      seam = Math.max(valueJump, slopeJump);
      const seamDbfs = amplitudeDbfs(seam);
      if (seamDbfs > -42) errors.push(`loop seam discontinuity ${seamDbfs.toFixed(1)} dBFS exceeds -42 dBFS`);
    }
  }
  const peakDbfs = amplitudeDbfs(peak);
  if (peakDbfs > sourceFormat.maximumPeakDbfs) {
    errors.push(`sample peak ${peakDbfs.toFixed(2)} dBFS exceeds ${sourceFormat.maximumPeakDbfs} dBFS`);
  }
  return { errors, durationMs, peakDbfs, seamDbfs: asset.seamlessLoop ? amplitudeDbfs(seam) : null };
}

function amplitudeDbfs(amplitude) {
  return amplitude <= 0 ? -Infinity : 20 * Math.log10(amplitude / 0x7fffff);
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(batchRoot, "manifest.json"), "utf8"));
  const dirIndex = process.argv.indexOf("--dir");
  const mastersDir = dirIndex >= 0 ? path.resolve(process.argv[dirIndex + 1]) : path.join(batchRoot, "masters");
  const allowMissing = process.argv.includes("--allow-missing");
  const expected = manifest.families.flatMap((family) => family.assets);
  const existing = new Set(await readdir(mastersDir).catch(() => []));
  const failures = [];
  const missing = [];
  for (const asset of expected) {
    const filename = `${asset.fileStem}.wav`;
    if (!existing.has(filename)) {
      missing.push(filename);
      continue;
    }
    try {
      const bytes = await readFile(path.join(mastersDir, filename));
      const result = validateMaster(bytes, asset, manifest.sourceFormat);
      if (result.errors.length) failures.push(`${filename}: ${result.errors.join("; ")}`);
      else console.log(`PASS ${filename}  ${result.durationMs.toFixed(1)} ms  ${result.peakDbfs.toFixed(2)} dBFS`);
    } catch (error) {
      failures.push(`${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const unexpectedWavs = [...existing].filter((name) => name.toLowerCase().endsWith(".wav") && !expected.some((asset) => `${asset.fileStem}.wav` === name));
  if (unexpectedWavs.length) failures.push(`unexpected WAV files: ${unexpectedWavs.join(", ")}`);
  if (missing.length) console.log(`MISSING ${missing.length}/${expected.length}: ${missing.join(", ")}`);
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else if (missing.length && !allowMissing) {
    process.exitCode = 1;
  } else {
    console.log(`Batch S1 validation complete: ${expected.length - missing.length}/${expected.length} masters present.`);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
