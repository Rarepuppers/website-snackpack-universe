// Checks Codex's Snack Haul assets against the plan:
// docs/audit-briefs/2026-11-12-snack-haul-codex-asset-plan.md
// Run from website-snackpack-universe:
//   node play/labs/snack-haul/dev/check-assets.mjs [--upto N] [--all]
//   node play/labs/snack-haul/dev/check-assets.mjs --winter [--upto N] [--all]
// --upto N checks milestones 1 to N only (default 6, everything).
// --winter checks only the Winter Haul batch instead (milestones W1 to W3, so --upto 1 to 3):
// docs/audit-briefs/2026-11-21-snack-haul-codex-winter-assets.md
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
const WINTER = process.argv.includes("--winter");
const upto = Number((process.argv[process.argv.indexOf("--upto") + 1]) || 6) || 6;
const problems = [], notes = [];
let found = 0, missing = 0, later = 0, stage = 1;

const rel = (file) => path.relative(repo, file).replace(/\\/g, "/");
const fail = (file, msg) => problems.push(`[${WINTER ? "W" : "M"}${stage}] ${rel(file)}: ${msg}`);
function exists(file, maxKB) {
  if (stage > upto) { later += 1; return false; }
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
  return { tris: Math.round(tris), min, max, names, bad, materials: (json.materials || []).map((x) => x.name) };
}
function glb(file, { maxTris, maxKB, nodes = [], materials = [], maxMaterials, check }) {
  if (!exists(file, maxKB)) return;
  try {
    const json = readGlb(file), m = measure(json);
    if (m.tris > maxTris) fail(file, `${m.tris} triangles, limit ${maxTris}`);
    if (m.tris === 0) fail(file, "has no geometry");
    if (m.bad.length) fail(file, `unapplied rotation or scale on: ${[...new Set(m.bad)].join(", ")}`);
    nodes.forEach((n) => { if (!m.names.includes(n)) fail(file, `node "${n}" is missing`); });
    materials.forEach((n) => { if (!m.materials.includes(n)) fail(file, `material "${n}" is missing`); });
    if (maxMaterials && m.materials.length > maxMaterials) fail(file, `${m.materials.length} materials, limit ${maxMaterials}`);
    if ((json.animations || []).length) fail(file, "contains animations");
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
const art = (name, w, h, kb) => image(path.join(A, "art", `${name}.webp`), w, h, kb);
const icon = (name) => image(path.join(A, "ui", `${name}.webp`), 128, 128, 16);
const audio = (folder, name, kb) => exists(path.join(A, "audio", folder, `${name}.ogg`), kb);

if (!WINTER) {
// ── Trucks and wheels: limits come straight from the physics ──────
const WIDTH = { pickup: 1.8, tuktuk: 1.6, van: 1.8, buggy: 1.8, hauler: 1.95, monster: 2.0 };
const TYRE = { tuktuk: 0.26, buggy: 0.44, monster: 0.6 };
const OPEN_CAB = ["buggy"];
for (const t of SH.TRUCKS) {
  const D = SH.dimsFor(t), id = t.id;
  stage = id === "pickup" ? 1 : 2;
  glb(path.join(A, "models/trucks", `truck_${id}.glb`), {
    maxTris: 8000, maxKB: 500, maxMaterials: 6, materials: ["paint", "trim"],
    nodes: ["body", "lights_front", "lights_brake", "seat", "exhaust", "topper", "headlight", ...(OPEN_CAB.includes(id) ? [] : ["glass"])],
    check(m, bad) {
      if (m.min[0] < -D.bedHalf - 0.3) bad(`rear reaches x ${m.min[0].toFixed(2)}, limit ${(-D.bedHalf - 0.3).toFixed(2)}`);
      if (m.max[0] > D.bedHalf + 0.65) bad(`front reaches x ${m.max[0].toFixed(2)}, limit ${(D.bedHalf + 0.65).toFixed(2)}`);
      if (m.max[2] - m.min[2] > WIDTH[id] + 0.3) bad(`width ${(m.max[2] - m.min[2]).toFixed(2)}, limit ${(WIDTH[id] + 0.3).toFixed(2)}`);
      if (!near(m.min[2] + m.max[2], 0, 0.05)) bad("not centred on z");
      if (m.max[1] < 1.2) bad(`cab roof at y ${m.max[1].toFixed(2)}, expected 1.2 or more`);
    }
  });
  glb(path.join(A, "models/wheels", `wheel_${id}.glb`), {
    maxTris: id === "monster" ? 1000 : 700, maxKB: 90,
    check(m, bad) {
      const r = (m.max[0] - m.min[0]) / 2, w = m.max[2] - m.min[2];
      if (!near(r, D.wheelR, 0.03)) bad(`radius ${r.toFixed(3)}, expected ${D.wheelR}`);
      if (!near(m.min[0] + m.max[0], 0, 0.02) || !near(m.min[1] + m.max[1], 0, 0.02)) bad("hub is not at the origin");
      if (!near(w, TYRE[id] || 0.32, 0.06)) bad(`tyre width ${w.toFixed(2)}, expected ${TYRE[id] || 0.32}`);
    }
  });
}

// ── Drivers ───────────────────────────────────────────────────────
stage = 1;
glb(path.join(A, "models/driver/corgi_driver.glb"), { maxTris: 1800, maxKB: 200, nodes: ["corgi"] });

// ── Cargo: each file is one unit, sized by engine.js cargoSize() ──
const CARGO_FILES = { crate: [""], eggs: ["", "_broken"], milk: [""], jelly: [""], melon: [""], cake: ["", "_ruined"], popcorn: [""], icecream: ["", "_melted"] };
for (const type of SH.CARGO_TYPES || Object.keys(CARGO_FILES)) {
  const size = SH.cargoSize(type);
  for (const suffix of CARGO_FILES[type] || [""]) {
    stage = type === "crate" || type === "eggs" ? 1 : 2;
    glb(path.join(A, "models/cargo", `cargo_${type}${suffix}.glb`), {
      maxTris: 320, maxKB: 90,
      check(m, bad) {
        const w = m.max[0] - m.min[0], d = m.max[2] - m.min[2], h = m.max[1] - m.min[1];
        if (w > size.w + 0.005 || d > size.w + 0.005) bad(`footprint ${w.toFixed(2)} x ${d.toFixed(2)}, limit ${size.w}`);
        if (!suffix && !near(h, size.h, 0.06)) bad(`height ${h.toFixed(2)}, expected ${size.h}`);
        if (suffix && h > size.h + 0.02) bad(`height ${h.toFixed(2)}, limit ${size.h}`);
        if (!suffix && !near(m.min[1] + m.max[1], 0, 0.06)) bad("not centred on its origin");
        if (suffix && !near(m.min[1], -size.h / 2, 0.04)) bad(`base at y ${m.min[1].toFixed(2)}, expected ${(-size.h / 2).toFixed(2)}`);
      }
    });
  }
}

// ── Road items and features ───────────────────────────────────────
const road = (name, tris, kb, check) => glb(path.join(A, "models/road", `${name}.glb`), { maxTris: tris, maxKB: kb, check });
const grounded = (m, bad) => { if (!near(m.min[1], 0, 0.12)) bad(`base sits at y ${m.min[1].toFixed(2)}, expected 0`); };
stage = 1;
road("coin", 160, 30, (m, bad) => { if (!near((m.max[0] - m.min[0]) / 2, 0.34, 0.03)) bad("radius is not 0.34"); });
stage = 2;
road("log", 200, 40);
road("fuel_can", 320, 50);
road("depot", 4000, 300, grounded);
road("start_shop", 3000, 250, grounded);
road("zone_gate", 800, 80, grounded);
road("bridge_plank", 120, 20, (m, bad) => { if (!near(m.max[0] - m.min[0], 1.5, 0.05)) bad("length along x is not 1.5"); });
road("bridge_post", 300, 30, grounded);
road("ramp", 300, 40, (m, bad) => { grounded(m, bad); if (!near(m.max[1], 1, 0.06)) bad(`lip at y ${m.max[1].toFixed(2)}, expected 1`); if (!near(m.min[0], 0, 0.06)) bad("low end is not at x 0"); });
road("speed_bump", 80, 15, grounded);
road("pickup_stand", 2500, 220, grounded);
road("wind_sock", 200, 25, grounded);
road("ice_marker", 150, 20, grounded);
road("checkpoint_flag", 200, 25, grounded);

// ── Scenery ───────────────────────────────────────────────────────
const prop = (name, tris, kb) => glb(path.join(A, "models/props", `${name}.glb`), { maxTris: tris, maxKB: kb, check: grounded });
stage = 1;
prop("oak", 700, 80); prop("bush", 300, 80);
stage = 3;
for (const [name, tris] of [["fence", 200], ["pine", 500], ["cactus", 400], ["hay", 250], ["crag", 400], ["chilli_plant", 400], ["palm", 600], ["beach_hut", 800], ["lantern_post", 300], ["market_stall", 900], ["crate_stack", 250], ["planter", 250],
  ["rock_bakery", 150], ["rock_dunes", 150], ["rock_harbour", 150], ["rock_frost", 150], ["rock_chilli", 150]]) prop(name, tris, 80);
for (const name of ["cottage", "windmill", "barn", "silo", "lighthouse", "honey_shop", "cabin", "ski_lodge", "chilli_stall", "chilli_shrine", "townhouse", "clock_tower"]) prop(name, 3000, 250);
glb(path.join(A, "models/props/boat.glb"), { maxTris: 900, maxKB: 80 });

// ── Art ───────────────────────────────────────────────────────────
stage = 3;
for (const r of SH.REGIONS) { art(`sky_${r.id}`, 2048, 1024, 350); art(`ridge_${r.id}`, 2048, 512, 300); art(`region_${r.id}`, 1280, 720, 220); }
stage = 4;
art("logo", 1600, 800, 260);
for (const t of SH.TRUCKS) art(`portrait_${t.id}`, 640, 360, 90);
art("unlock_hero", 1280, 720, 240); art("map", 2048, 1024, 380); art("longhaul", 1280, 720, 220);

// ── Interface icons and goal badges ───────────────────────────────
const GOLDEN_ICONS = ["coin", "fuel", "load", "star_on", "star_off", "pause"];
const ICONS = ["clock", "back", "settings", "lock", "sound_on", "sound_off", "music_on", "music_off", "haptics", "restore", "pro", "gas", "brake",
  "daily", "routes", "garage", "goals", "map", "long_haul", "contracts", "ghost", "paint", "topper", "driver",
  "up_engine", "up_suspension", "up_tyres", "up_straps", "up_tank", "medal_bronze", "medal_silver", "medal_gold",
  "feature_bridge", "feature_ramp", "feature_ice", "feature_wind", "feature_pickup",
  ...(SH.CARGO_TYPES || Object.keys(CARGO_FILES)).map((c) => `cargo_${c}`), ...SH.REGIONS.map((r) => `region_${r.id}`)];
const GOALS = ["first", "intact", "express", "air", "eggs", "crates", "bakery", "dunes", "chilli", "fleet", "maxed", "streak", "done",
  "harbour", "frost", "market", "melon", "cake", "popcorn", "icecream", "bridge", "ramp", "gold", "longhaul", "longhaul5", "contracts", "tuktuk", "monster", "paint", "stars"];
stage = 1; GOLDEN_ICONS.forEach(icon);
stage = 4; ICONS.forEach(icon); GOALS.forEach((n) => icon(`goal_${n}`));

// ── App and store art (these folders are gitignored or app-only) ──
image(path.join(APP, "assets/icon.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon-background.png"), 1024, 1024, 1500);
image(path.join(APP, "assets/adaptive-icon-monochrome.png"), 1024, 1024, 500);
image(path.join(APP, "assets/splash.png"), 1024, 1024, 800);
image(path.join(APP, "store/play-icon-512.png"), 512, 512, 1024);
image(path.join(APP, "store/feature-graphic.png"), 1024, 500, 1024);
image(path.join(APP, "store/unlock-product-icon-512.png"), 512, 512, 1024);

// ── Audio ─────────────────────────────────────────────────────────
const GOLDEN_SFX = ["crate_thud", "coin", "delivered"];
const SFX = ["crate_lost", "egg_crack", "jelly_boing", "milk_clink", "melon_roll", "melon_splat", "cake_squash", "popcorn_pop", "icecream_melt",
  "land_soft", "land_hard", "log_bump", "brake_skid", "bridge_creak", "splash", "ramp_whoosh", "speed_bump", "pickup_load", "wind_gust",
  "fuel", "low_fuel", "stop_tick", "failed", "saved", "medal", "contract_done", "button", "buy", "unlock", "goal", "star",
  "horn_pickup", "horn_tuktuk", "horn_monster"];
for (const t of SH.TRUCKS) { stage = t.id === "pickup" ? 1 : 5; for (const s of ["idle", "drive"]) audio("engine", `${t.id}_${s}`, 260); }
stage = 1; GOLDEN_SFX.forEach((n) => audio("sfx", n, 60));
stage = 5; SFX.forEach((n) => audio("sfx", n, 60));
for (const n of ["road_gravel", "road_sand", "road_snow", "road_planks", "road_cobble", "road_ice", "wind", "waves", "night"]) audio("road", n, 260);
for (const n of ["menu", ...SH.REGIONS.map((r) => r.id)]) audio("music", `music_${n}`, 1400);

// ── Extras ────────────────────────────────────────────────────────
stage = 6;
for (const n of ["barkbq", "waffle", "booklava"]) glb(path.join(A, "models/driver", `${n}_driver.glb`), { maxTris: 1800, maxKB: 200 });
for (const n of ["croissant", "corn", "chilli", "cone", "pretzel", "donut", "honey", "crown"]) {
  glb(path.join(A, "models/toppers", `topper_${n}.glb`), {
    maxTris: 300, maxKB: 40,
    check(m, bad) {
      if (m.max[0] - m.min[0] > 0.7 || m.max[2] - m.min[2] > 0.7) bad("wider than 0.7");
      if (m.max[1] > 0.6) bad("taller than 0.6");
      if (!near(m.min[1], 0, 0.03)) bad("base is not at y 0");
    }
  });
}

stage = 1;
exists(path.join(A, "CREDITS.md"));
}

// ── Winter Haul batch (--winter) ──────────────────────────────────
if (WINTER) {
  const W = (sub, name) => path.join(A, "models", sub, `${name}.glb`);
  const groundedW = (m, bad) => { if (!near(m.min[1], 0, 0.12)) bad(`base sits at y ${m.min[1].toFixed(2)}, expected 0`); };
  const centredX = (m, bad) => { if (!near(m.min[0] + m.max[0], 0, 0.2)) bad("not centred on x"); };
  const facesCamera = (m, bad) => { if (!near(m.min[2] + m.max[2], 0, 0.6)) bad("not centred on z"); };

  // Jingle Sleigh: sizes from engine.js EVENT_TRUCKS, like the trucks
  const s = SH.truckSpec("sleigh"), D = SH.dimsFor(s), runnerY = D.axleY - D.wheelR;
  stage = 1;
  glb(W("trucks", "truck_sleigh"), {
    maxTris: 7000, maxKB: 450, maxMaterials: 6, materials: ["paint", "trim"],
    nodes: ["body", "lights_front", "lights_brake", "seat", "exhaust", "topper", "headlight"],
    check(m, bad) {
      if (m.min[0] < -D.bedHalf - 0.3) bad(`rear reaches x ${m.min[0].toFixed(2)}, limit ${(-D.bedHalf - 0.3).toFixed(2)}`);
      if (m.max[0] > s.hitchX + 0.05) bad(`front reaches x ${m.max[0].toFixed(2)}, limit ${s.hitchX} (the reindeer hitch)`);
      if (m.max[2] - m.min[2] > 1.8 + 0.3) bad(`width ${(m.max[2] - m.min[2]).toFixed(2)}, limit 2.10`);
      if (!near(m.min[2] + m.max[2], 0, 0.05)) bad("not centred on z");
      if (!near(m.min[1], runnerY, 0.05)) bad(`runner bottom at y ${m.min[1].toFixed(3)}, expected ${runnerY.toFixed(3)}`);
      if (m.max[1] < 1.2) bad(`seat back or front scroll tops out at y ${m.max[1].toFixed(2)}, expected 1.2 or more`);
    }
  });
  glb(W("trucks", "reindeer_team"), {
    maxTris: 3500, maxKB: 300, nodes: ["deer_a", "deer_b"],
    check(m, bad) {
      if (m.min[0] < -0.15) bad(`reaches back to x ${m.min[0].toFixed(2)}: the team starts at the hitch (x 0)`);
      if (m.max[0] > 1.45) bad(`reaches forward to x ${m.max[0].toFixed(2)}, limit 1.4`);
      const hoof = runnerY - s.hitchY;
      if (!near(m.min[1], hoof, 0.08)) bad(`hooves at y ${m.min[1].toFixed(2)}, expected ${hoof.toFixed(2)} (ground, relative to the hitch)`);
      if (!near(m.min[2] + m.max[2], 0, 0.05)) bad("not centred on z");
    }
  });

  // Cargo
  const cargoW = (name, type, damaged) => {
    const size = SH.cargoSize(type);
    glb(W("cargo", name), {
      maxTris: 320, maxKB: 90,
      check(m, bad) {
        const w = m.max[0] - m.min[0], d = m.max[2] - m.min[2], h = m.max[1] - m.min[1];
        if (w > size.w + 0.005 || d > size.w + 0.005) bad(`footprint ${w.toFixed(2)} x ${d.toFixed(2)}, limit ${size.w}`);
        if (!damaged && !near(h, size.h, 0.06)) bad(`height ${h.toFixed(2)}, expected ${size.h}`);
        if (damaged && h > size.h + 0.02) bad(`height ${h.toFixed(2)}, limit ${size.h}`);
        if (!damaged && !near(m.min[1] + m.max[1], 0, 0.06)) bad("not centred on its origin");
        if (damaged && !near(m.min[1], -size.h / 2, 0.04)) bad(`base at y ${m.min[1].toFixed(2)}, expected ${(-size.h / 2).toFixed(2)}`);
      }
    });
  };
  stage = 1;
  for (const c of ["red", "green", "blue"]) cargoW(`cargo_present_${c}`, "present");
  stage = 2;
  cargoW("cargo_present_crushed", "present", true);
  cargoW("cargo_sack", "sack"); cargoW("cargo_pudding", "pudding"); cargoW("cargo_pudding_ruined", "pudding", true);

  // Scenery, landmarks and depot decorations
  const winterProp = (name, tris, kb, ...checks) => glb(W("winter", name), { maxTris: tris, maxKB: kb, check: (m, bad) => checks.forEach((c) => c(m, bad)) });
  stage = 1;
  winterProp("house_a", 2500, 250, groundedW, centredX, facesCamera);
  winterProp("workshop", 8000, 250, groundedW, centredX);
  stage = 2;
  winterProp("house_b", 2500, 250, groundedW, centredX, facesCamera);
  winterProp("house_c", 2500, 250, groundedW, centredX, facesCamera);
  winterProp("big_tree", 6000, 250, groundedW);
  winterProp("cane_arch", 1200, 80, groundedW, (m, bad) => { if (m.max[1] < 4.5) bad(`only ${m.max[1].toFixed(2)} m tall; the opening needs 4.5 m`); });
  for (const [name, tris] of [["pine_snow", 600], ["snowman", 400], ["igloo", 700], ["lamp_garland", 500], ["present_pile", 600], ["ice_rock", 200], ["fence_candy", 250]]) winterProp(name, tris, 80, groundedW);
  winterProp("drift", 300, 80, groundedW, (m, bad) => {
    if (!near(m.max[0] - m.min[0], 8, 0.3)) bad(`length along x ${(m.max[0] - m.min[0]).toFixed(2)}, expected 8`);
    if (!near(m.max[1], 0.6, 0.1)) bad(`height ${m.max[1].toFixed(2)}, expected 0.6`);
  });
  for (const name of ["depot_tree", "depot_lights", "depot_wreath", "depot_snowman"]) winterProp(name, 1500, 120);
  for (const n of ["santa_hat", "antlers", "star"]) {
    glb(W("toppers", `topper_${n}`), {
      maxTris: 300, maxKB: 40,
      check(m, bad) {
        if (m.max[0] - m.min[0] > 0.7 || m.max[2] - m.min[2] > 0.7) bad("wider than 0.7");
        if (m.max[1] > 0.6) bad("taller than 0.6");
        if (!near(m.min[1], 0, 0.03)) bad("base is not at y 0");
      }
    });
  }

  // Art, interface, effects
  stage = 1; art("sky_northpole", 2048, 1024, 350);
  stage = 3;
  art("ridge_northpole", 2048, 512, 300); art("region_northpole", 1280, 720, 220);
  art("event_winter", 1280, 400, 150); art("advent_bg", 1280, 720, 200); art("portrait_sleigh", 640, 360, 90);
  for (const n of ["santa", "tinsel"]) art(`customer_${n}`, 512, 512, 60);
  for (const n of ["event_winter", "advent", "feature_dropoff", "feature_drift", "cargo_present", "cargo_sack", "cargo_pudding", "truck_sleigh"]) icon(n);
  for (const n of ["sleigh", "presents", "advent", "christmas_eve", "workshop"]) icon(`goal_${n}`);
  for (const [n, size] of [["snowflake", 64], ["sparkle", 64], ["snow_puff", 128]]) image(path.join(A, "art", "fx", `${n}.webp`), size, size, 30);

  // Audio
  for (const n of ["sleigh_idle", "sleigh_drive"]) audio("engine", n, 260);
  for (const n of ["music_northpole", "music_carol_jingle_bells", "music_winter_menu"]) audio("music", n, 1024);
  for (const n of ["present_drop", "door_open", "jingle_sting", "horn_sleigh", "snow_drift", "pudding_wobble"]) audio("sfx", n, 60);

  // Store
  image(path.join(APP, "store/winter/feature-graphic-winter.png"), 1024, 500, 1024);
  image(path.join(APP, "store/winter/promo-event-card.png"), 1920, 1080, 2048);
}

// ── Totals ────────────────────────────────────────────────────────
function folderKB(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? folderKB(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size / 1024), 0);
}
for (const [dir, limitMB] of [["models", 13], ["art", 5], ["ui", 1], ["audio", 19]]) {
  const mb = folderKB(path.join(A, dir)) / 1024;
  notes.push(`${dir}: ${mb.toFixed(1)} MB of ${limitMB} MB`);
  if (mb > limitMB) problems.push(`assets/${dir}: ${mb.toFixed(1)} MB, limit ${limitMB} MB`);
}

if (WINTER) {
  // The whole batch is held to 7 MB (brief section 2). Files are spread over shared folders, so add up what the batch names.
  const winterKB = [path.join(A, "models/winter"), path.join(A, "art/fx")].reduce((n, d) => n + folderKB(d), 0)
    + ["models/trucks/truck_sleigh.glb", "models/trucks/reindeer_team.glb", "models/cargo/cargo_present_red.glb", "models/cargo/cargo_present_green.glb",
      "models/cargo/cargo_present_blue.glb", "models/cargo/cargo_present_crushed.glb", "models/cargo/cargo_sack.glb", "models/cargo/cargo_pudding.glb",
      "models/cargo/cargo_pudding_ruined.glb", "models/toppers/topper_santa_hat.glb", "models/toppers/topper_antlers.glb", "models/toppers/topper_star.glb",
      "art/sky_northpole.webp", "art/ridge_northpole.webp", "art/region_northpole.webp", "art/event_winter.webp", "art/advent_bg.webp", "art/portrait_sleigh.webp",
      "art/customer_santa.webp", "art/customer_tinsel.webp", "audio/engine/sleigh_idle.ogg", "audio/engine/sleigh_drive.ogg", "audio/music/music_northpole.ogg", "audio/music/music_carol_jingle_bells.ogg",
      "audio/music/music_winter_menu.ogg", ...["present_drop", "door_open", "jingle_sting", "horn_sleigh", "snow_drift", "pudding_wobble"].map((n) => `audio/sfx/${n}.ogg`),
      ...["event_winter", "advent", "feature_dropoff", "feature_drift", "cargo_present", "cargo_sack", "cargo_pudding", "truck_sleigh",
        "goal_sleigh", "goal_presents", "goal_advent", "goal_christmas_eve", "goal_workshop"].map((n) => `ui/${n}.webp`)]
      .reduce((n, f) => n + (fs.existsSync(path.join(A, f)) ? fs.statSync(path.join(A, f)).size / 1024 : 0), 0);
  notes.push(`winter batch: ${(winterKB / 1024).toFixed(1)} MB of 7 MB`);
  if (winterKB / 1024 > 7) problems.push(`winter batch: ${(winterKB / 1024).toFixed(1)} MB, limit 7 MB`);
}
console.log(`${WINTER ? "Winter W" : "Milestones "}1 to ${upto}: found ${found} files, ${missing} missing${later ? `, ${later} belong to later milestones` : ""}.`);
notes.forEach((n) => console.log("  " + n));
if (problems.length) {
  const shown = process.argv.includes("--all") ? problems : problems.slice(0, 40);
  console.log(`\n${problems.length} problem(s):`);
  shown.forEach((p) => console.log("  " + p));
  if (shown.length < problems.length) console.log("  ... run with --all for the rest");
  process.exit(1);
}
console.log("All assets pass.");
