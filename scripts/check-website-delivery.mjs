// Enforce intentional canonical-asset exclusions from the published website.
// Canonical/app masters live in the companion monorepo; this check makes sure
// app-only files do not silently return to the GitHub Pages payload.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const gameUiRoot = path.join(root, "play", "shared-assets", "game-ui");
const manifestPath = path.join(gameUiRoot, "website-delivery.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const failures = [];

if (manifest.schemaVersion !== 1) {
  failures.push(`unsupported schemaVersion: ${manifest.schemaVersion}`);
}

const skipDirs = new Set([".git", "node_modules", "dev", "desktop", "release", "stage", "steampipe", "shared-assets"]);
function walkSources(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSources(full, out);
    else if (entry.isFile() && /\.(?:js|css|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sourceFiles = walkSources(path.join(root, "play"));
const sourceText = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");

for (const [pack, rule] of Object.entries(manifest.packs || {})) {
  if (!rule.reason || !String(rule.reason).trim()) {
    failures.push(`${pack}: exclusion requires a reason`);
  }
  for (const prefix of rule.exclude || []) {
    const normalizedPrefix = String(prefix).replaceAll("\\", "/").replace(/^\/+/, "");
    const deliveryPath = path.join(gameUiRoot, pack, normalizedPrefix);
    if (fs.existsSync(deliveryPath)) {
      failures.push(`${pack}/${normalizedPrefix}: excluded path exists in website payload`);
    }
    const publicPath = `${pack}/${normalizedPrefix}`;
    if (sourceText.includes(publicPath)) {
      failures.push(`${publicPath}: excluded path is still referenced by website runtime code`);
    }
  }
}

if (failures.length) {
  console.error("Website delivery check failed:");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`Website delivery check passed (${Object.keys(manifest.packs || {}).length} governed pack).`);
