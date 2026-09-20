import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playRoot = join(root, "play");
const utilityPages = new Set(["daily", "stats"]);
const entries = await readdir(playRoot, { withFileTypes: true });
const failures = [];
let playable = 0;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const path = join(playRoot, entry.name, "index.html");
  let html;
  try {
    html = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  const matches = html.match(/<script\s+src=["']\.\.\/game-ui-assets\.js["'][^>]*><\/script>/g) ?? [];
  if (utilityPages.has(entry.name)) {
    if (matches.length !== 0) failures.push(`${entry.name}: utility page should not load the game bootstrap`);
    continue;
  }

  playable += 1;
  if (matches.length !== 1) failures.push(`${entry.name}: expected one game-ui-assets.js load, found ${matches.length}`);
}

if (failures.length) {
  console.error("Game UI bootstrap coverage failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Game UI bootstrap coverage passed (${playable} playable pages; Daily and Stats excluded).`);
}
