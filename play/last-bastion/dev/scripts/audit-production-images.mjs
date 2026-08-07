import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifestPath = path.join(gameRoot, "art", "production-tests", "runtime-webp-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.schemaVersion !== 2 || manifest.format !== "webp") {
  throw new Error("Unsupported runtime WebP manifest.");
}
// Counts are manifest-driven rather than hard-coded: the previous fixed "8"
// meant adding a derivative failed the audit instead of being covered by it.
// The floors below still catch a manifest that has silently emptied out.
const lossyAssets = manifest.assets ?? [];
const losslessAssets = manifest.losslessAssets ?? [];
if (!Array.isArray(lossyAssets) || lossyAssets.length < 8) {
  throw new Error(`Expected at least 8 lossy runtime WebP assets; found ${lossyAssets.length}.`);
}
if (!Array.isArray(losslessAssets) || losslessAssets.length < 40) {
  throw new Error(`Expected at least 40 lossless runtime WebP assets; found ${losslessAssets.length}.`);
}

let sourceTotal = 0;
let runtimeTotal = 0;
for (const [asset, budget] of [
  ...lossyAssets.map((asset) => [asset, manifest.maxRuntimeRatio]),
  ...losslessAssets.map((asset) => [asset, manifest.maxLosslessRuntimeRatio]),
]) {
  const source = path.resolve(gameRoot, asset.source);
  const runtime = path.resolve(gameRoot, asset.runtime);
  const [sourceStat, runtimeStat] = await Promise.all([stat(source), stat(runtime)]);
  const [sourceHash, runtimeHash] = await Promise.all([sha256(source), sha256(runtime)]);
  if (sourceHash !== asset.sourceSha256) throw new Error(`Stale source record: ${asset.source}`);
  if (runtimeHash !== asset.runtimeSha256) throw new Error(`Stale runtime derivative: ${asset.runtime}`);
  if (sourceStat.size !== asset.sourceBytes || runtimeStat.size !== asset.runtimeBytes) {
    throw new Error(`Recorded size mismatch: ${asset.runtime}`);
  }
  if (runtimeStat.size / sourceStat.size > budget) {
    throw new Error(`Runtime derivative exceeds size budget: ${asset.runtime}`);
  }
  sourceTotal += sourceStat.size;
  runtimeTotal += runtimeStat.size;
}
console.log(`PASS ${lossyAssets.length} lossy + ${losslessAssets.length} lossless derivatives`);
for (const asset of manifest.supportingAssets ?? []) {
  const source = path.resolve(gameRoot, asset.source);
  const sourceStat = await stat(source);
  if (sourceStat.size !== asset.bytes || await sha256(source) !== asset.sha256) {
    throw new Error(`Stale supporting asset record: ${asset.source}`);
  }
}

console.log(
  `Runtime WebP audit complete: ${lossyAssets.length + losslessAssets.length} assets; `
  + `${(sourceTotal / 1024 / 1024).toFixed(2)} MiB -> ${(runtimeTotal / 1024 / 1024).toFixed(2)} MiB `
  + `(${(runtimeTotal / sourceTotal * 100).toFixed(1)}%).`,
);

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}
