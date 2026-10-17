import assert from "node:assert/strict";
import { it } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { checkPackageManifest, writePackageManifest, stampBuildIdentity } from "./PackageProvenance.js";

function fixture(test: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "bastion-provenance-"));
  try {
    mkdirSync(join(root, "resources/game/game-assets"), { recursive: true });
    writeFileSync(join(root, "LastBastion.exe"), "fake fixture executable; never launched");
    const code = 'const build="web-test";';
    writeFileSync(join(root, "resources/game/game-assets/game.js"), code);
    writeFileSync(join(root, "resources/game/qa-build-identity.json"), JSON.stringify({
      buildVersion: "web-test", simulationVersion: 3, sourceCommit: "a".repeat(40),
      dirtyInputs: [" M play/last-bastion/dev/src/main.ts"], stagedAt: "2026-10-17T00:00:00Z",
      stagedRuntime: [{ path: "game-assets/game.js", bytes: Buffer.byteLength(code), sha256: createHash("sha256").update(code).digest("hex") }],
    }));
    test(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

it("hashes packaged bytes, retains dirty provenance and checks without rewriting", () => fixture(root => {
  const written = writePackageManifest(root, "LastBastion.exe");
  assert.equal(written.files.length, 3);
  assert.equal(written.identity.dirtyInputs.length, 1);
  const before = readFileSync(join(root, "qa-package-manifest.json"), "utf8");
  checkPackageManifest(root, "web-test");
  assert.equal(readFileSync(join(root, "qa-package-manifest.json"), "utf8"), before);
  assert.throws(() => checkPackageManifest(root, "web-other"), /identity/);
  writeFileSync(join(root, "LastBastion.exe"), "changed");
  assert.throws(() => checkPackageManifest(root), /Changed/);
}));

it("rejects missing/extra files, mixed build identities and sensitive local files", () => {
  fixture(root => {
    writePackageManifest(root, "LastBastion.exe");
    rmSync(join(root, "LastBastion.exe"));
    assert.throws(() => checkPackageManifest(root), /Missing/);
  });
  fixture(root => {
    writePackageManifest(root, "LastBastion.exe");
    writeFileSync(join(root, "extra.dll"), "unexpected");
    assert.throws(() => checkPackageManifest(root), /unrecorded/);
  });
  fixture(root => {
    writeFileSync(join(root, "resources/game/game-assets/game.js"), 'const build="web-old";');
    assert.throws(() => writePackageManifest(root, "LastBastion.exe"), /JavaScript/);
  });
  fixture(root => {
    writeFileSync(join(root, "resources/game/game-assets/game.js"), 'const build="web-test";const mixed=true;');
    assert.throws(() => writePackageManifest(root, "LastBastion.exe"), /staged runtime/);
  });
  fixture(root => {
    writeFileSync(join(root, "steam_appid.txt"), "local-only");
    assert.throws(() => writePackageManifest(root, "LastBastion.exe"), /Private/);
    assert.throws(() => writePackageManifest(root, "../outside"), /Private|executable/);
  });
});

it("stamps actual staged hashes and relevant dirty source from a disposable checkout", () => fixture(root => {
  const source = mkdtempSync(join(tmpdir(), "bastion-source-"));
  try {
    mkdirSync(join(source, "dev/src/game/run"), { recursive: true });
    mkdirSync(join(source, "dev/src/game/combat"), { recursive: true });
    writeFileSync(join(source, "dev/src/game/run/RunSummary.ts"), 'export const LAST_BASTION_BUILD_VERSION = "web-test";');
    writeFileSync(join(source, "dev/src/game/combat/SimulationCompatibility.ts"), "export const SIMULATION_COMPATIBILITY_VERSION = 3;");
    const git = (...args: string[]) => execFileSync("git", args, { cwd: source, stdio: "pipe" });
    git("init"); git("add", "dev");
    git("-c", "user.name=QA Fixture", "-c", "user.email=qa@example.invalid", "commit", "-m", "fixture");
    writeFileSync(join(source, "dev/src/main.ts"), "// uncommitted input");
    stampBuildIdentity(source, join(root, "resources/game"));
    const manifest = writePackageManifest(root, "LastBastion.exe");
    assert.ok(manifest.identity.dirtyInputs.some(item => item.includes("dev/src/main.ts")));
    assert.equal(manifest.identity.stagedRuntime.length, 1);
    checkPackageManifest(root);
  } finally { rmSync(source, { recursive: true, force: true }); }
}));
