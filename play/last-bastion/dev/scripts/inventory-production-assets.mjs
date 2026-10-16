import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoot = path.join(gameRoot, "dev/src/game");
const manifest = path.join(sourceRoot, "assets/GameAssetManifest.ts");
const source = fs.readFileSync(manifest, "utf8");
const imports = new Map([...source.matchAll(/import (\w+) from "([^"]+)";/g)].map(match => [match[1], path.resolve(path.dirname(manifest), match[2])]));
const relative = file => path.relative(gameRoot, file).replaceAll("\\", "/");
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [path.join(dir, entry.name)] : []); }
const consumers = files(sourceRoot).filter(file => file !== manifest).map(file => ({ file, text: fs.readFileSync(file, "utf8") }));
const assets = [];
// Definitions deliberately use one literal call per line. Refuse unfamiliar calls rather than omit them.
for (const line of source.split("\n").filter(line => /^\s+(sheet|image)\("/.test(line))) {
  const match = line.match(/^\s+(sheet|image)\("([^"]+)",\s*(runtimeImageUrl\([^)]*\)|\w+),\s*([\d.,\s]+)\)/);
  if (!match) throw new Error(`Unsupported asset definition: ${line}`);
  const [, kind, id, expression, numbers] = match;
  const a = numbers.split(",").map(value => Number(value.trim()));
  const sources = [...expression.matchAll(/\b\w+\b/g)].map(match => match[0]).filter(name => imports.has(name)).map(name => {
    const file = imports.get(name), data = fs.readFileSync(file);
    const png = data.subarray(1, 4).toString() === "PNG";
    return { path: relative(file), bytes: data.length, sha256: crypto.createHash("sha256").update(data).digest("hex"), ...(png ? { pixelWidth: data.readUInt32BE(16), pixelHeight: data.readUInt32BE(20) } : {}) };
  });
  if (!sources.length) throw new Error(`Missing source import: ${id}`);
  const references = consumers.filter(row => row.text.includes(`"${id}"`)).map(row => relative(row.file));
  const [width, height] = a;
  assets.push({ id, kind, logicalWidth: width, logicalHeight: height, frameCount: kind === "sheet" ? a[2] : 1,
    sourceFrameWidth: kind === "sheet" ? a[5] ?? width : width,
    sourceFrameHeight: kind === "sheet" ? a[6] ?? height : height,
    pivot: { x: a[kind === "sheet" ? 3 : 2], y: a[kind === "sheet" ? 4 : 3] },
    sources, staticReferences: references,
    classification: id.startsWith("bastion-floor-pilot") || id === "bastion-scuff-pilot" ? "review-only pilot" : "existing runtime definition; reuse pending consumer review" });
}
if (!assets.length) throw new Error("No assets inventoried");
const out = path.join(gameRoot, "asset-inventory.json");
fs.writeFileSync(out, JSON.stringify({ schemaVersion: 1, scope: "GameAssetManifest definitions only; separate shell manifests and unreferenced source candidates are not included", warning: "Static references are navigation aids, not proof of reachable rendering. Imported PNG/WebP files are runtime inputs; do not assume they are original generation masters.", assetCount: assets.length, assets }, null, 2) + "\n");
console.log(`Wrote ${assets.length} asset records to ${relative(out)}`);
