import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MANIFEST = "qa-package-manifest.json";
const STAMP = "qa-build-identity.json";
interface BuildIdentity {
  buildVersion: string;
  simulationVersion: number;
  sourceCommit: string;
  dirtyInputs: string[];
  stagedAt: string;
  stagedRuntime: Entry[];
}
interface Entry { path: string; bytes: number; sha256: string }
interface PackageManifest {
  schemaVersion: 1;
  packagedAt: string;
  identity: BuildIdentity;
  executable: string;
  gameDirectory: string;
  files: Entry[];
}

function confined(root: string, name: string): string {
  if (!name || isAbsolute(name) || name.includes("\\")) throw new Error(`Invalid package-relative path: ${name}`);
  const result = resolve(root, name);
  const rel = relative(root, result);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("Path escapes package");
  return result;
}

function inventory(root: string, folder = "", excluded = [MANIFEST]): Entry[] {
  const entries: Entry[] = [];
  for (const item of readdirSync(resolve(root, folder), { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const name = folder ? `${folder}/${item.name}` : item.name;
    if (excluded.includes(name)) continue; // Metadata excludes itself, never runtime bytes.
    if (/^(?:steam_appid\.txt|\.env(?:\..*)?|\.git|\.ssh|id_rsa|id_ed25519|.*\.(?:pem|key)|saves)$/i.test(item.name)) {
      throw new Error(`Private/local file in package: ${name}`);
    }
    const file = confined(root, name);
    if (lstatSync(file).isSymbolicLink()) throw new Error(`Package symlink is unsupported: ${name}`);
    if (item.isDirectory()) entries.push(...inventory(root, name, excluded));
    else if (item.isFile()) {
      const data = readFileSync(file);
      entries.push({ path: name, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") });
    } else throw new Error(`Unsupported package entry: ${name}`);
  }
  return entries;
}

function readIdentity(root: string, gameDirectory: string): BuildIdentity {
  const game = confined(root, gameDirectory);
  const identity = JSON.parse(readFileSync(resolve(game, STAMP), "utf8")) as BuildIdentity;
  if (!/^web-[\w.-]+$/.test(identity.buildVersion) || !Number.isInteger(identity.simulationVersion)
      || !/^[a-f0-9]{40}$/.test(identity.sourceCommit) || !Array.isArray(identity.dirtyInputs)
      || !identity.dirtyInputs.every(item => typeof item === "string") || !Number.isFinite(Date.parse(identity.stagedAt))
      || !Array.isArray(identity.stagedRuntime) || !identity.stagedRuntime.length) {
    throw new Error("Invalid staged build identity");
  }
  // Check the identity in the actual bundled JS, not merely the source stamp.
  const assets = resolve(game, "game-assets");
  const matches = readdirSync(assets).filter(name => name.endsWith(".js"))
    .some(name => readFileSync(resolve(assets, name), "utf8").includes(`"${identity.buildVersion}"`));
  if (!matches) throw new Error("Staged build identity does not match packaged JavaScript");
  if (JSON.stringify(inventory(game, "", [STAMP])) !== JSON.stringify(identity.stagedRuntime)) {
    throw new Error("Packaged runtime does not match staged runtime hashes");
  }
  return identity;
}

/** Called by the build owner after staging and before electron-builder, never by the checker. */
export function stampBuildIdentity(gameRoot: string, stageGame: string): void {
  const version = readFileSync(resolve(gameRoot, "dev/src/game/run/RunSummary.ts"), "utf8")
    .match(/LAST_BASTION_BUILD_VERSION\s*=\s*"([^"]+)"/)?.[1];
  const simulation = readFileSync(resolve(gameRoot, "dev/src/game/combat/SimulationCompatibility.ts"), "utf8")
    .match(/SIMULATION_COMPATIBILITY_VERSION\s*=\s*(\d+)/)?.[1];
  if (!version || !simulation) throw new Error("Cannot read source build identity");
  const git = (...args: string[]) => execFileSync("git", args, { cwd: gameRoot, encoding: "utf8" }).trim();
  const inputPaths = ["dev/src", "dev/index.html", "dev/vite.config.ts", "dev/package.json", "dev/package-lock.json",
    "desktop/src", "desktop/scripts", "desktop/package.json", "desktop/package-lock.json", "desktop/packaging-assets",
    "steam-input", "index.html", "last-bastion-codex.html", "game-assets"];
  const dirty = git("status", "--porcelain", "--untracked-files=all", "--", ...inputPaths);
  const identity: BuildIdentity = { buildVersion: version, simulationVersion: Number(simulation),
    sourceCommit: git("rev-parse", "HEAD"), dirtyInputs: dirty ? dirty.split(/\r?\n/) : [], stagedAt: new Date().toISOString(),
    stagedRuntime: inventory(stageGame, "", [STAMP]) };
  writeFileSync(resolve(stageGame, STAMP), JSON.stringify(identity, null, 2) + "\n");
}

export function writePackageManifest(root: string, executable: string, gameDirectory = "resources/game"): PackageManifest {
  const identity = readIdentity(root, gameDirectory);
  const files = inventory(root);
  if (!files.some(entry => entry.path === executable)) throw new Error("Package executable is missing");
  confined(root, executable);
  const manifest: PackageManifest = { schemaVersion: 1, packagedAt: new Date().toISOString(), identity, executable, gameDirectory, files };
  writeFileSync(resolve(root, MANIFEST), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

/** Reads only. Does not launch, rebuild, repair, delete or upload. */
export function checkPackageManifest(root: string, expectedBuild?: string): PackageManifest {
  const manifest = JSON.parse(readFileSync(resolve(root, MANIFEST), "utf8")) as PackageManifest;
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error("Invalid package manifest");
  const identity = readIdentity(root, manifest.gameDirectory);
  if (expectedBuild && identity.buildVersion !== expectedBuild) throw new Error("Unexpected package build identity");
  if (JSON.stringify(identity) !== JSON.stringify(manifest.identity)) throw new Error("Package identity changed");
  const actual = inventory(root);
  const expected = new Map<string, Entry>();
  for (const entry of manifest.files) {
    confined(root, entry.path);
    if (expected.has(entry.path)) throw new Error("Duplicate manifest path");
    expected.set(entry.path, entry);
  }
  if (!expected.has(manifest.executable)) throw new Error("Unrecorded executable");
  for (const entry of actual) {
    const recorded = expected.get(entry.path);
    if (!recorded || recorded.bytes !== entry.bytes || recorded.sha256 !== entry.sha256) throw new Error(`Changed/unrecorded package file: ${entry.path}`);
    expected.delete(entry.path);
  }
  if (expected.size) throw new Error(`Missing package file: ${expected.keys().next().value}`);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, directory, extra, gameDirectory] = process.argv.slice(2);
    if (!directory) throw new Error("Usage: PackageProvenance.js stamp <stage-game> | write <package> <executable> [game-dir] | check <package> [expected-build]");
    if (command === "stamp") stampBuildIdentity(resolve(import.meta.dirname, "../.."), resolve(directory));
    else if (command === "write" && extra) {
      const result = writePackageManifest(resolve(directory), extra, gameDirectory);
      console.log(`PASS package manifest: ${result.identity.buildVersion}; ${result.files.length} files; executable ${basename(result.executable)}`);
    } else if (command === "check") {
      const result = checkPackageManifest(resolve(directory), extra);
      console.log(`PASS package consistency: ${result.identity.buildVersion}; ${result.files.length} files; renderer smoke is separate`);
    } else throw new Error("Unknown/incomplete provenance command");
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
