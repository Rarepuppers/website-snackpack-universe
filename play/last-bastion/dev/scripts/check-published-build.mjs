#!/usr/bin/env node
/**
 * Fails when the committed browser bundle no longer matches `dev/src`.
 *
 * Vite writes stable-named chunks straight into the published
 * `play/last-bastion/game-assets/` directory, and those files are committed.
 * Every automated check that loads the game in a browser — the Playwright
 * acceptance lane included, in CI as well as locally — therefore exercises the
 * *committed* bundle, not the source it was supposedly built from. Commit a
 * source change without rebuilding and every one of those lanes stays green
 * against yesterday's game. That is precisely the false pass the verification
 * work set out to make impossible.
 *
 * This rebuilds into a scratch directory and compares. It deliberately does not
 * rebuild in place: a check that repairs the thing it is checking cannot fail.
 *
 * Only build outputs are compared. `game-assets/` also holds ~150 MB of art that
 * the build never emits, so art is neither compared nor treated as orphaned.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const devRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publishedRoot = resolve(devRoot, "..");
const BUILD_EXTENSIONS = [".js", ".css"];

function isBuildOutput(name) {
  return BUILD_EXTENSIONS.some((extension) => name.endsWith(extension));
}

/** Relative path -> contents, for every build output under `root`. */
function collectOutputs(root) {
  const outputs = new Map();
  const assetsDir = join(root, "game-assets");
  if (safeStat(assetsDir)?.isDirectory()) {
    for (const name of readdirSync(assetsDir)) {
      if (!isBuildOutput(name)) continue;
      outputs.set(`game-assets/${name}`, readFileSync(join(assetsDir, name)));
    }
  }
  const indexPath = join(root, "index.html");
  if (safeStat(indexPath)?.isFile()) {
    outputs.set("index.html", readFileSync(indexPath));
  }
  return outputs;
}

/**
 * Line endings are not drift. This repository is checked out with
 * core.autocrlf=true, so git hands Windows a CRLF copy of every committed text
 * file while Vite always writes LF. Comparing raw bytes would therefore report
 * every build output as stale on a Windows clone and none on Linux CI — a check
 * that fails for a reason nobody can act on is worse than no check.
 *
 * Only the newline is normalised; every other byte still has to match.
 */
function sameText(left, right) {
  if (left.equals(right)) return true;
  // Every carriage return is stripped, not just CRLF pairs. A generator once
  // wrote CRLF into a file git had already converted, leaving a doubled CR that
  // a pair-wise replace cannot undo. Newlines are not drift; every other byte
  // still has to match exactly.
  const CR = String.fromCharCode(13);
  const normalise = (buffer) => buffer.toString("utf8").split(CR).join("");
  return normalise(left) === normalise(right);
}

function safeStat(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

const scratch = mkdtempSync(join(tmpdir(), "last-bastion-build-check-"));
let fresh;
try {
  // The Vite entry script is invoked through this same Node binary rather than
  // through `npx`: `execFileSync` cannot spawn a `.cmd` shim on Windows. The
  // path is joined rather than resolved because Vite does not export its bin.
  const viteBin = join(devRoot, "node_modules", "vite", "bin", "vite.js");
  if (!safeStat(viteBin)?.isFile()) {
    throw new Error(`Vite is not installed in dev/: ${viteBin}. Run \`npm ci\` first.`);
  }
  execFileSync(
    process.execPath,
    [viteBin, "build", "--outDir", scratch, "--emptyOutDir", "--logLevel", "warn"],
    { cwd: devRoot, stdio: "inherit" },
  );
  fresh = collectOutputs(scratch);
} finally {
  // Collected into memory first so the scratch tree never outlives the compare.
  rmSync(scratch, { recursive: true, force: true });
}

if (fresh.size === 0) {
  console.error("FAIL  The build produced no output to compare. Check the Vite configuration.");
  process.exit(1);
}

const published = collectOutputs(publishedRoot);
const problems = [];

for (const [path, contents] of fresh) {
  const committed = published.get(path);
  if (!committed) {
    problems.push(`missing from the published tree: ${path}`);
  } else if (!sameText(committed, contents)) {
    problems.push(
      `stale: ${path} (published ${committed.length} bytes, rebuilt ${contents.length} bytes)`,
    );
  }
}

/**
 * Chunks the service worker installs by name are NOT orphans, even when the
 * current build no longer emits them.
 *
 * This check originally reported ten such files and I deleted them on its word.
 * Every one was listed in `sw.js`'s Last Bastion precache block, which installs
 * the executable chunks as a single transaction — `cache.addAll` rejects if any
 * entry is missing, so removing them would have broken offline boot for every
 * warmed player rather than tidying dead weight. A tool that confidently
 * recommends deleting load-bearing files is worse than no tool.
 */
function serviceWorkerPrecachedPaths() {
  try {
    const worker = readFileSync(resolve(publishedRoot, "..", "..", "sw.js"), "utf8");
    const pattern = /\/play\/last-bastion\/(game-assets\/[A-Za-z0-9._-]+)/g;
    return new Set([...worker.matchAll(pattern)].map((match) => match[1]));
  } catch {
    // No worker, or unreadable: fall back to reporting every unmatched file,
    // which is the stricter behaviour rather than the quieter one.
    return new Set();
  }
}

const precached = serviceWorkerPrecachedPaths();
for (const path of published.keys()) {
  if (fresh.has(path) || precached.has(path)) continue;
  problems.push(`orphaned: ${path} is published but no longer produced by the build`);
}

const publishedLabel = relative(process.cwd(), publishedRoot) || publishedRoot;
if (problems.length > 0) {
  console.error(`FAIL  The published bundle in ${publishedLabel} does not match dev/src.\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nRun `npm run build` in dev/ and commit the result."
      + "\nAn orphaned file is a chunk whose source module was deleted; remove it by hand.",
  );
  process.exit(1);
}

console.log(`PASS  ${fresh.size} published build outputs match dev/src.`);
