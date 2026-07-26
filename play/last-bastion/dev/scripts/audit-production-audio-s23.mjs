import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parsePcmWav, readSigned24 } from "./validate-production-audio.mjs";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const batches = ["batch-s2", "batch-s3"];
const MAX_PEAK_DBFS = -1;
const MAX_EDGE_DBFS = -36;
const requireDerivatives = process.argv.includes("--require-derivatives");

function dbfs(value) {
  return value <= 0 ? -Infinity : 20 * Math.log10(value / 0x7fffff);
}

function inspect(bytes) {
  const wav = parsePcmWav(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let peak = 0;
  let edgePeak = 0;
  let sumSquares = 0;
  const edgeFrames = Math.max(1, Math.floor(wav.sampleRateHz * 0.003));
  for (let frame = 0; frame < wav.frameCount; frame += 1) {
    const sample = readSigned24(view, wav.dataOffset + frame * wav.blockAlign);
    const absolute = Math.abs(sample);
    peak = Math.max(peak, absolute);
    if (frame < edgeFrames || frame >= wav.frameCount - edgeFrames) edgePeak = Math.max(edgePeak, absolute);
    sumSquares += sample * sample;
  }
  const durationMs = wav.frameCount / wav.sampleRateHz * 1000;
  const rmsDbfs = dbfs(Math.sqrt(sumSquares / Math.max(1, wav.frameCount)));
  return {
    channels: wav.channels,
    sampleRateHz: wav.sampleRateHz,
    bitDepth: wav.bitDepth,
    durationMs: Number(durationMs.toFixed(1)),
    peakDbfs: Number(dbfs(peak).toFixed(2)),
    edgePeakDbfs: Number(dbfs(edgePeak).toFixed(2)),
    rmsDbfs: Number(rmsDbfs.toFixed(2)),
    crestDb: Number((dbfs(peak) - rmsDbfs).toFixed(2)),
  };
}

async function main() {
  const failures = [];
  const warnings = [];
  const report = { generatedAt: new Date().toISOString(), source: "WAV masters plus optional runtime derivatives", batches: {}, warnings: [] };
  for (const batch of batches) {
    const mastersDir = path.join(projectRoot, "audio", "production", batch, "masters");
    const files = (await readdir(mastersDir)).filter((name) => name.endsWith(".wav")).sort();
    report.batches[batch] = { masterCount: files.length, derivativeCount: 0, files: {} };
    for (const file of files) {
      const name = `${batch}/masters/${file}`;
      try {
        const result = inspect(await readFile(path.join(mastersDir, file)));
        report.batches[batch].files[file] = result;
        const errors = [];
        if (result.channels !== 1) errors.push(`expected mono, got ${result.channels} channels`);
        if (result.sampleRateHz !== 48000) errors.push(`expected 48000 Hz, got ${result.sampleRateHz}`);
        if (result.bitDepth !== 24) errors.push(`expected 24-bit, got ${result.bitDepth}`);
        if (result.peakDbfs > MAX_PEAK_DBFS) errors.push(`peak ${result.peakDbfs} dBFS exceeds ${MAX_PEAK_DBFS} dBFS`);
        if (result.edgePeakDbfs > MAX_EDGE_DBFS) {
          const warning = `${name}: 3 ms edge peak ${result.edgePeakDbfs} dBFS exceeds ${MAX_EDGE_DBFS} dBFS; final mastering review required`;
          warnings.push(warning);
          report.warnings.push(warning);
        }
        if (errors.length) failures.push(`${name}: ${errors.join("; ")}`);
        else console.log(`PASS ${name}  ${result.durationMs} ms  peak ${result.peakDbfs} dBFS  RMS ${result.rmsDbfs} dBFS`);
      } catch (error) {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const runtimeDir = path.join(projectRoot, "dev", "src", "game", "audio", "runtime", batch);
    for (const file of files) {
      const stem = file.slice(0, -4);
      for (const extension of ["ogg", "mp3"]) {
        const derivative = `${stem}.${extension}`;
        try {
          const bytes = await readFile(path.join(runtimeDir, derivative));
          const validMagic = extension === "ogg"
            ? bytes.subarray(0, 4).toString("ascii") === "OggS"
            : bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
          if (!validMagic || bytes.byteLength < 512) failures.push(`${batch}/runtime/${derivative}: malformed or empty derivative`);
          else report.batches[batch].derivativeCount += 1;
        } catch {
          if (requireDerivatives) failures.push(`${batch}/runtime/${derivative}: missing derivative`);
        }
      }
    }
  }
  const reportPath = path.join(projectRoot, "audio", "production", "s23-master-audit.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(projectRoot, reportPath)}`);
  console.log("Note: RMS is a screening value, not an LUFS measurement; final loudness/mix review remains external.");
  if (warnings.length) console.log(`WARN ${warnings.length} masters need transient/edge mastering review.`);
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    const totalMasters = Object.values(report.batches).reduce((sum, batch) => sum + batch.masterCount, 0);
    const totalDerivatives = Object.values(report.batches).reduce((sum, batch) => sum + batch.derivativeCount, 0);
    console.log(`S2/S3 audio audit complete: ${totalMasters} masters passed; ${totalDerivatives}/48 runtime derivatives present.`);
    if (!requireDerivatives && totalDerivatives < 48) console.log("Runtime derivatives are optional in this audit; use --require-derivatives after encoding.");
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
