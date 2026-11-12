// Checks Codex's Snack Haul assets against the brief:
// docs/audit-briefs/2026-11-07-snack-haul-codex-asset-brief.md
// Run from website-snackpack-universe: node play/labs/snack-haul/dev/check-assets.mjs
// Sizes come from engine.js, so a physics change cannot silently drift from the art.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(here, "..");
const repo = path.resolve(game, "../../../..");
const SH = createRequire(import.meta.url)("../engine.js");
const A = path.join(game, "assets");
const APP = path.join(repo, "apps", "snackpack-snack-haul");
const problems = [], notes = [];
let found = 0, missing = 0;

const fail = (file, msg) => problems.push(`${path.relative(repo, file).replace(/\\/g, "/")}: ${msg}`);
function exists(file, maxKB) {
  if (!fs.existsSync(file)) { missing += 1; fail(file, "missing"); return false; }
  found += 1;
  const kb = fs.statSync(file).size / 1024;
  if (maxKB && kb > maxKB) fail(file, `${kb.toFixed(0)} KB, limit ${maxKB} KB`);
  return true;
}

// ── GLB ───────────────────────────────────────────────────────────
function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error("not a binary glTF file");
  return JSON.parse(b.toString("utf8", 20, 20 + b.readUInt32LE(12)));
}
function measure(json) {
  let tris = 0;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const names = (json.nodes || []).map((n) => n.name);
  const bad = [];
  const visit = (index, offset) => {
    const n = json.nodes[index];
    if (n.rotation && n.rotation.some((v, i) => Math.abs(v - (i === 3 ? 1 : 0)) > 1e-4)) bad.push(n.name);
    if (n.scale && n.scale.some((v) => Math.abs(v - 1) > 1e-4)) bad.push(n.name);
    const t = n.translation || [0, 0, 0], at = offset.map((v, i) => v + t[i]);
    if (n.mesh != null) {
      for (const p of json.meshes[n.mesh].primitives) {
        const pos = json.accessors[p.attributes.POSITION];
        tris += (p.indices != null ? json.accessors[p.indices].count : pos.count) / 3;
        for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], pos.min[i] + at[i]); max[i] = Math.max(max[i], pos.max[i] + at[i]); }
      }
    }
    (n.children || []).forEach((c) => visit(c, at));
  };
  (json.scenes[json.scene || 0].nodes || []).forEach((n) => visit(n, [0, 0, 0]));
  return { tris: Math.round(tris), min, max, names, bad };
}
function glb(file, { maxTris, maxKB, nodes = [], check }) {
  if (!exists(file, maxKB)) return;
  try {
    const json = readGlb(file), m = measure(json);
    if (m.tris > maxTris) fail(file, `${m.tris} triangles, limit ${maxTris}`);
    if (m.tris === 0) fail(file, "has no geometry");
    if (m.bad.length) fail(file, `unapplied rotation or scale on: ${[...new Set(m.bad)].join(", ")}`);
    nodes.forEach((n) => { if (!m.names.includes(n)) fail(file, `node "${n}" is missing`); });
    if ((json.extensionsUsed || []).some((e) => /draco|meshopt|ktx/i.test(e))) fail(file, "uses a compression extension the game does not load");
    if (check) check(m, (msg) => fail(file, msg));
  } catch (e) { fail(file, "unreadable: " + e.message); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ── Images ────────────────────────────────────────────────────────
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 1, 4) === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString("ascii", 0, 4) === "RIFF") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  }
  return null;
}
function image(file, w, h, maxKB) {
  if (!exists(file, maxKB)) return;
  const s = imageSize(file);
  if (!s) fail(file, "not a PNG or WebP");
  else if (s[0] !== w || s[1] !== h) fail(file, `${s[0]}x${s[1]}, expected ${w}x${h}`);
}

// ── Trucks: limits come straight from the physics ─────────────────
const WIDTH = { pickup: 1.8, van: 1.8, buggy: 1.8, hauler: 1.95 };
for (const t of SH.TRUCKS) {
  const D = SH.dimsFor(t), id = t.id;
  glb(path.join(A, "models/trucks", `truck_${id}.glb`), {
    maxTris: 8000, maxKB: 500,
    nodes: ["body", "lights_front", "lights_brake", "seat", "exhaust", ...(id === "buggy" ? [] : ["glass"])],
    check(m, bad) {
      if (m.min[0] < -D.bedHalf - 0.3) bad(`rear reaches x ${m.min[0].toFixed(2)}, limit ${(-D.bedHalf - 0.3).toFixed(2)}`);
      if (m.max[0] > D.bedHalf + 0.65) bad(`front reaches x ${m.max[0].toFixed(2)}, limit ${(D.bedHalf + 0.65).toFixed(2)}`);
      if (m.max[2] - m.min[2] > WIDTH[id] + 0.3) bad(`width ${(m.max[2] - m.min[2]).toFixed(2)}, limit ${(WIDTH[id] + 0.3).toFixed(2)}`);
      if (!near(m.min[2] + m.max[2], 0, 0.05)) bad("not centred on z");
    }
  });
  glb(path.join(A, "models/wheels", `wheel_${id}.glb`), {
    maxTris: 700, maxKB: 90,
    check(m, bad) {
      const r = (m.max[0] - m.min[0]) / 2;
      if (!near(r, D.wheelR, 0.03)) bad(`radius ${r.toFixed(3)}, expected ${D.wheelR}`);
      if (!near(m.min[0] + m.max[0], 0, 0.02) || !near(m.min[1] + m.max[1], 0, 0.02)) bad("hub is not at the origin");
    }
  });
}

glb(path.join(A, "models/driver/corgi_driver.glb"), { maxTris: 1800, maxKB: 200, nodes: ["corgi"] });

const CRATE = SH.DIM.crate;
for (const c of ["crate", "eggs", "eggs_broken", "milk", "jelly"]) {
  glb(path.join(A, "models/cargo", `cargo_${c}.glb`), {
    maxTris: 320, maxKB: 90,
    check(m, bad) {
      const w = m.max[0] - m.min[0], d = m.max[2] - m.min[2];
      if (w > CRATE || d > CRATE) bad(`footprint ${w.toFixed(2)} x ${d.toFixed(2)}, limit ${CRATE}`);
      if (!near(m.min[1] + m.max[1], 0, c === "eggs_broken" ? 0.3 : 0.06)) bad("not centred on its origin");
    }
  });
}

for (const [name, tris, kb] of [["log", 200, 40], ["coin", 160, 30], ["fuel_can", 320, 50], ["depot", 4000, 300], ["start_shop", 3000, 250], ["zone_gate", 800, 80]]) {
  glb(path.join(A, "models/road", `${name}.glb`), { maxTris: tris, maxKB: kb });
}

const groundProp = (name, tris, kb) => glb(path.join(A, "models/props", `${name}.glb`), {
  maxTris: tris, maxKB: kb,
  check(m, bad) { if (!near(m.min[1], 0, 0.12)) bad(`base sits at y ${m.min[1].toFixed(2)}, expected 0`); }
});
for (const [name, tris] of [["oak", 700], ["bush", 300], ["fence", 200], ["pine", 500], ["cactus", 400], ["hay", 250], ["crag", 400], ["chilli_plant", 400], ["rock_bakery", 150], ["rock_dunes", 150], ["rock_frost", 150], ["rock_chilli", 150]]) groundProp(name, tris, 80);
for (const name of ["cottage", "windmill", "barn", "silo", "cabin", "ski_lodge", "chilli_stall", "chilli_shrine"]) groundProp(name, 3000, 250);

// ── Art and interface ─────────────────────────────────────────────
for (const r of SH.REGIONS) {
  image(path.join(A, "art", `sky_${r.id}.webp`), 2048, 1024, 350);
  image(path.join(A, "art", `ridge_${r.id}.webp`), 2048, 512, 300);
  image(path.join(A, "art", `region_${r.id}.webp`), 1280, 720, 220);
}
image(path.join(A, "art", "logo.webp"), 1600, 800, 260);
for (const t of SH.TRUCKS) image(path.join(A, "art", `portrait_${t.id}.webp`), 640, 360, 90);

const ICONS = ["coin", "fuel", "star_on", "star_off", "load", "clock", "pause", "back", "settings", "lock", "sound_on", "sound_off", "gas", "brake", "daily", "routes", "garage", "goals",
  "up_engine", "up_suspension", "up_tyres", "up_straps", "up_tank", "cargo_crate", "cargo_eggs", "cargo_milk", "cargo_jelly"];
const GOALS = ["first", "intact", "express", "air", "eggs", "crates", "bakery", "dunes", "chilli", "fleet", "maxed", "streak", "done"];
for (const n of ICONS) image(path.join(A, "ui", `${n}.webp`), 128, 128, 16);
for (const n of GOALS) image(path.join(A, "ui", `goal_${n}.webp`), 128, 128, 16);

// ── Audio ─────────────────────────────────────────────────────────
for (const t of SH.TRUCKS) for (const s of ["idle", "drive"]) exists(path.join(A, "audio/engine", `${t.id}_${s}.ogg`), 260);
for (const n of ["road_gravel", "road_sand", "road_snow", "wind"]) exists(path.join(A, "audio/road", `${n}.ogg`), 260);
for (const n of ["crate_thud", "crate_lost", "egg_crack", "jelly_boing", "milk_clink", "land_soft", "land_hard", "log_bump", "brake_skid", "coin", "fuel", "low_fuel", "stop_tick", "delivered", "failed", "button", "buy", "goal", "star"]) exists(path.join(A, "audio/sfx", `${n}.ogg`), 60);
for (const n of ["menu", ...SH.REGIONS.map((r) => r.id)]) exists(path.join(A, "audio/music", `music_${n}.ogg`), 1400);

// ── App and store art (these folders are gitignored or app-only) ──
image(path.join(APP, "assets/icon.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon-background.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon-monochrome.png"), 1024, 1024, 500);
image(path.join(APP, "assets/splash.png"), 1024, 1024, 800);
image(path.join(APP, "store/play-icon-512.png"), 512, 512, 1024);
image(path.join(APP, "store/feature-graphic.png"), 1024, 500, 1024);

exists(path.join(A, "CREDITS.md"));

// ── Totals ────────────────────────────────────────────────────────
function folderKB(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? folderKB(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size / 1024), 0);
}
for (const [dir, limitMB] of [["models", 9], ["art", 4], ["ui", 1], ["audio", 14]]) {
  const mb = folderKB(path.join(A, dir)) / 1024;
  notes.push(`${dir}: ${mb.toFixed(1)} MB of ${limitMB} MB`);
  if (mb > limitMB) problems.push(`assets/${dir}: ${mb.toFixed(1)} MB, limit ${limitMB} MB`);
}

console.log(`Found ${found} files, ${missing} missing.`);
notes.forEach((n) => console.log("  " + n));
if (problems.length) {
  const shown = process.argv.includes("--all") ? problems : problems.slice(0, 40);
  console.log(`\n${problems.length} problem(s):`);
  shown.forEach((p) => console.log("  " + p));
  if (shown.length < problems.length) console.log("  ... run with --all for the rest");
  process.exit(1);
}
console.log("All assets pass.");
