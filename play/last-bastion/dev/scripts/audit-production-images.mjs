import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifestPath = path.join(gameRoot, "art", "production-tests", "runtime-webp-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.schemaVersion !== 1 || manifest.format !== "webp") {
  throw new Error("Unsupported runtime WebP manifest.");
}
if (!Array.isArray(manifest.assets) || manifest.assets.length !== 8) {
  throw new Error(`Expected 8 runtime WebP assets; found ${manifest.assets?.length ?? 0}.`);
}

let sourceTotal = 0;
let runtimeTotal = 0;
for (const asset of manifest.assets) {
  const source = path.resolve(gameRoot, asset.source);
  const runtime = path.resolve(gameRoot, asset.runtime);
  const [sourceStat, runtimeStat] = await Promise.all([stat(source), stat(runtime)]);
  const [sourceHash, runtimeHash] = await Promise.all([sha256(source), sha256(runtime)]);
  if (sourceHash !== asset.sourceSha256) throw new Error(`Stale source record: ${asset.source}`);
  if (runtimeHash !== asset.runtimeSha256) throw new Error(`Stale runtime derivative: ${asset.runtime}`);
  if (sourceStat.size !== asset.sourceBytes || runtimeStat.size !== asset.runtimeBytes) {
    throw new Error(`Recorded size mismatch: ${asset.runtime}`);
  }
  if (runtimeStat.size / sourceStat.size > manifest.maxRuntimeRatio) {
    throw new Error(`Runtime derivative exceeds size budget: ${asset.runtime}`);
  }
  sourceTotal += sourceStat.size;
  runtimeTotal += runtimeStat.size;
  console.log(`PASS ${asset.runtime}  ${(runtimeStat.size / sourceStat.size * 100).toFixed(1)}% of PNG`);
}
for (const asset of manifest.supportingAssets ?? []) {
  const source = path.resolve(gameRoot, asset.source);
  const sourceStat = await stat(source);
  if (sourceStat.size !== asset.bytes || await sha256(source) !== asset.sha256) {
    throw new Error(`Stale supporting asset record: ${asset.source}`);
  }
}

console.log(
  `Runtime WebP audit complete: ${manifest.assets.length} assets; `
  + `${(sourceTotal / 1024 / 1024).toFixed(2)} MiB -> ${(runtimeTotal / 1024 / 1024).toFixed(2)} MiB.`,
);

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}
