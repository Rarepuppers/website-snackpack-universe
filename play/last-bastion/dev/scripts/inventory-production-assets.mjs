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
    classification: id.startsWith("bastion-floor-pilot") || id === "bastion-scuff-pilot" || id === "bastion-floor-kit" || id === "bastion-decal-kit" ? "review-only pilot" : "existing runtime definition; reuse pending consumer review" });
}
// Shell objects use literal definitions; chrome uses its own image helper signature.
for (const name of ["ShellAssetManifest.ts", "BastionBackdropAsset.ts", "TitleBackdropAsset.ts", "UiChromeAssets.ts"]) {
  const file = path.join(sourceRoot, "assets", name), text = fs.readFileSync(file, "utf8");
  const imported = new Map([...text.matchAll(/import (\w+) from "([^"]+\.(?:png|webp))";/g)].map(m => [m[1], path.resolve(path.dirname(file), m[2])]));
  const definitions = name === "UiChromeAssets.ts"
    ? [...text.matchAll(/image\("([^"]+)",\s*(\w+),\s*(\w+),\s*(\d+),\s*(\d+)\)/g)].map(m => ({ id: m[1], kind: "image", expression: `${m[2]} ${m[3]}`, width: +m[4], height: +m[5], count: 1, x: .5, y: .5 }))
    : [...text.matchAll(/kind: "(image|spritesheet)",\s*id: "([^"]+)",\s*url: ([^\n]+),\s*logicalWidth: (\d+),\s*logicalHeight: (\d+),\s*pivot: Object.freeze\(\{ x: ([\d.]+), y: ([\d.]+) \}\),([\s\S]*?)\}\)/g)].map(m => ({ kind: m[1], id: m[2], expression: m[3], width: +m[4], height: +m[5], x: +m[6], y: +m[7], count: +(m[8].match(/frameCount: (\d+)/)?.[1] ?? 1) }));
  if (!definitions.length) throw new Error(`No definitions parsed in ${name}`);
  for (const d of definitions) {
    const sources = [...imported].filter(([key]) => new RegExp(`\\b${key}\\b`).test(d.expression)).map(([, source]) => {
      const data = fs.readFileSync(source);
      return { path: relative(source), bytes: data.length, sha256: crypto.createHash("sha256").update(data).digest("hex"), ...(source.endsWith(".png") ? { pixelWidth: data.readUInt32BE(16), pixelHeight: data.readUInt32BE(20) } : {}) };
    });
    if (!sources.length) throw new Error(`No sources for ${d.id}`);
    const existing = assets.find(a => a.id === d.id);
    if (existing) {
      if (existing.logicalWidth !== d.width || existing.logicalHeight !== d.height || existing.frameCount !== d.count
        || existing.pivot.x !== d.x || existing.pivot.y !== d.y
        || JSON.stringify(existing.sources.map(s => s.path).sort()) !== JSON.stringify(sources.map(s => s.path).sort())) {
        throw new Error(`Conflicting game/shell asset definition: ${d.id}`);
      }
      existing.shellDefinition = relative(file); existing.classification = "reuse: shared game/shell asset"; continue;
    }
    assets.push({ id: d.id, kind: d.kind, logicalWidth: d.width, logicalHeight: d.height, sourceFrameWidth: d.width, sourceFrameHeight: d.height, frameCount: d.count, pivot: { x: d.x, y: d.y }, sources,
      staticReferences: consumers.filter(row => row.text.includes(`"${d.id}"`)).map(row => relative(row.file)), classification: "reuse: shell/portrait/chrome", definition: relative(file) });
  }
}
if (!assets.length || new Set(assets.map(a => a.id)).size !== assets.length) throw new Error("Empty or duplicate inventory");
function artFiles(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? artFiles(path.join(dir, e.name)) : /\.(png|webp|jpg|jpeg)$/i.test(e.name) ? [path.join(dir, e.name)] : []); }
const mapped = new Set(assets.flatMap(a => a.sources.map(s => s.path)));
const candidates = artFiles(path.join(gameRoot, "art")).filter(file => !mapped.has(relative(file))).map(file => ({ path: relative(file), bytes: fs.statSync(file).size, disposition: "unmapped source/derivative; retained, not authorized for deletion or replacement" }));
const out = path.join(gameRoot, "asset-inventory.json");
fs.writeFileSync(out, JSON.stringify({ schemaVersion: 2, scope: "GameAssetManifest plus shell, portraits, backdrops and UI chrome; unmapped art files listed separately", warning: "Static references are navigation aids, not proof of reachable rendering. Imported PNG/WebP files are runtime inputs; do not assume they are original generation masters.", assetCount: assets.length, assets, unmappedCandidateCount: candidates.length, candidates }, null, 2) + "\n");
console.log(`Wrote ${assets.length} asset records and ${candidates.length} unmapped candidates to ${relative(out)}`);
