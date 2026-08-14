// Syntax-check the website-owned JavaScript that is edited directly.
// Large built/vendor trees (notably Last Bastion) have their own build checks.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(".");
const candidates = [
  path.join(root, "sw.js"),
  ...fs.readdirSync(path.join(root, "play"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(root, "play", entry.name)),
  ...fs.readdirSync(path.join(root, "scripts"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:js|mjs)$/.test(entry.name))
    .map((entry) => path.join(root, "scripts", entry.name)),
].sort();

const failures = [];
for (const file of candidates) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failures.push(`${path.relative(root, file)}\n${result.stderr || result.stdout}`);
  }
}

if (failures.length) {
  console.error(`JavaScript syntax check failed (${failures.length}):\n`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`JavaScript syntax check passed (${candidates.length} files).`);
