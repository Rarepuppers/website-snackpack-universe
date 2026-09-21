#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const devRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publishedRoot = resolve(devRoot, "..");
const fixture = mkdtempSync(join(tmpdir(), "last-bastion-stale-fixture-"));

try {
  for (const name of ["index.html", "game-assets"]) {
    cpSync(join(publishedRoot, name), join(fixture, name), {
      recursive: true,
      filter: (source) => {
        if (!source.includes("game-assets")) return true;
        return source.endsWith("game-assets") || /\.(?:js|css)$/.test(source);
      },
    });
  }
  const stalePath = join(fixture, "index.html");
  const stale = `${readFileSync(stalePath, "utf8")}\n<!-- deliberate stale fixture -->\n`;
  writeFileSync(stalePath, stale);

  const result = spawnSync(process.execPath, [join(devRoot, "scripts", "check-published-build.mjs")], {
    cwd: devRoot,
    env: { ...process.env, LAST_BASTION_PUBLISHED_ROOT: fixture },
    encoding: "utf8",
  });
  if (result.status === 0 || !`${result.stdout}\n${result.stderr}`.includes("stale: index.html")) {
    throw new Error(`Stale fixture did not fail correctly.\n${result.stdout}\n${result.stderr}`);
  }
  if (readFileSync(stalePath, "utf8") !== stale) {
    throw new Error("The drift check mutated its stale fixture.");
  }
  console.log("PASS  stale published output fails without mutation.");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
