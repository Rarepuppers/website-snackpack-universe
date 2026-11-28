import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "../vendor/three.module.min.js";
import { parseGlb } from "../assets.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, "../assets");
const { TIERS, CRATE } = createRequire(import.meta.url)("../engine.js");
const selection = process.argv.slice(2);
if (selection.length !== 2 || selection[0] !== "--batch" || !/^d[1-6]$/.test(selection[1])) {
  console.error("Usage: node dev/check-assets.mjs --batch d1|d2|d3|d4|d5|d6");
  process.exit(2);
}

const issues = [];
const expect = (condition, message) => { if (!condition) issues.push(message); };
const close = (actual, target, tolerance) => Math.abs(actual - target) <= tolerance + 1e-6;
const v = (...xyz) => new THREE.Vector3(...xyz);
const specs = new Map();
const modelFiles = [];
const add = (batch, file, bytes, details) => specs.set(file, { batch, bytes, ...details });
const glb = (batch, folder, name, bytes, tris) => add(batch, `models/${folder}/${name}.glb`, bytes, { tris });
const icon = (batch, name, pixels, bytes) => add(batch, `ui/${name}.webp`, bytes, { width: pixels, height: pixels, alpha: true });
const art = (batch, name, width, height, bytes) => add(batch, `art/${name}.webp`, bytes, { width, height, alpha: true });
const audio = (batch, name, seconds = 1.5, bytes = 60000, folder = "sfx") =>
  add(batch, `audio/${folder}/${name}.ogg`, bytes, { seconds, music: folder === "music" });

for (const tier of TIERS) {
  const batch = ["cookie", "cheese", "donut", "pizza", "cake"].includes(tier.id) ? 1 : 2;
  glb(batch, "snacks", `snack_${tier.id}`, tier.tier <= 4 ? 60000 : 120000, tier.tier <= 4 ? 600 : 1500);
  icon(batch, `snack_${tier.id}`, 96, 12000);
}
for (const [id, batch] of [["pantry", 1], ["toybox", 2], ["icecooler", 2], ["market", 2], ["hopper", 6]]) {
  glb(batch, "containers", `container_${id}`, 200000, 3000);
  glb(batch, "backdrops", `backdrop_${id}`, 400000, 6000);
  icon(Math.max(batch, 2), `container_${id}`, 160, 20000);
}
for (const name of ["pause", "sound_on", "sound_off"]) icon(1, name, 128, 16000);
for (const name of ["swap", "spatula", "levelup", "rumble", "bump", "earthquake"]) icon(3, `tool_${name}`, 128, 16000);
glb(3, "tools", "tool_spatula", Infinity, 800);
glb(3, "specials", "special_sprinkle_ball", Infinity, 1500);
for (const name of ["sparkle", "puff", "dust", "glaze_shine", "levelup_burst", "fever_flame"]) {
  const sizes = name === "dust" ? [256] : [128, 256];
  add(3, `art/fx/${name}.webp`, 24000, { sizes, alpha: true });
}
const cameos = {
  "cameo_corgi-on-the-cob": ["body", "head", "leg_fl", "leg_fr", "leg_bl", "leg_br", "tail", "ear_l", "ear_r", "eyelids"],
  "cameo_belgian-waffle": ["body", "head", "wing_l", "wing_r"],
  "cameo_pork-ulele": ["body", "head", "leg_l", "leg_r", "prop"],
  "cameo_professor-hooten": ["body", "head", "eyes_glow"],
  "cameo_ted-e-bear": ["body", "head", "arm_r", "button"],
  booklava_driver: [], truck_van: [], wheel_van: [],
};
for (const name of Object.keys(cameos)) {
  // D4 calls for the existing Snack Haul van as an exact copy.
  const reusedVan = name === "truck_van";
  glb(name.includes("corgi") ? 1 : 4, "cameos", name, reusedVan ? 339412 : 250000, reusedVan ? 4750 : 3000);
}
for (const name of ["drop_soft", "drop_clack", "merge_small", "merge_big"]) audio(1, name, name.startsWith("merge") ? .4 : 1.5);
for (const name of ["chain_tick", "game_over", "new_best", "phew", "danger_creak", "ui_tap",
  "tool_swap", "tool_spatula", "tool_levelup", "fever_start", "fever_end", "special_sprinkle",
  "special_glaze", "cameo_pop", "cameo_flap", "cameo_hoot", "cameo_button", "truck_honk"]) audio(5, name);
for (const [name, time] of [["hamper_fanfare", 2], ["cameo_ukulele", 2], ["shake_rumble", .5], ["shake_bump", .6], ["shake_quake", 1.2]]) audio(5, name, time);
for (const name of ["menu", "play", "fever", "danger"]) audio(5, `music_${name}`, 90, 1000000, "music");
for (const name of ["play", "daily", "orders", "album", "settings", "share", "home", "star_on", "star_off",
  "lock", "chef_hat", "fever", "mode_classic", "mode_arcade", "mode_pro"]) icon(6, name, 128, 16000);
art(6, "card_frame", 1080, 1350, 150000);

function meshData(root) {
  const data = [];
  root.updateMatrixWorld(true);
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const { geometry, matrixWorld } = mesh;
    const positions = geometry.getAttribute("position");
    const vertices = Array.from({ length: positions.count }, (_, i) => v().fromBufferAttribute(positions, i).applyMatrix4(matrixWorld));
    const indices = geometry.index?.array || vertices.map((_, i) => i);
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      triangles.push([vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]]]);
    }
    data.push({ mesh, vertices, triangles });
  });
  return data;
}

function sample(data, from, direction) {
  const ray = new THREE.Ray(from, direction);
  const hit = v();
  let nearest = Infinity;
  for (const entry of data) {
    for (const triangle of entry.triangles) {
      if (ray.intersectTriangle(...triangle, false, hit)) nearest = Math.min(nearest, from.distanceTo(hit));
    }
  }
  return nearest === Infinity ? null : ray.at(nearest, v());
}

function empty(root, name, file) {
  const node = root.getObjectByName(name);
  expect(node && !node.isMesh && node.children.length === 0, `${file} requires a ${name} empty`);
  return node;
}

function snack(file, root, data, bounds) {
  const tier = TIERS.find(({ id }) => file.endsWith(`snack_${id}.glb`));
  const { min, max } = bounds;
  const width = tier.r ? 2 * tier.r : tier.w;
  const height = tier.r ? 2 * tier.r : tier.h;
  expect(close(max.x - min.x, width, width * .03) && close(max.y - min.y, height, height * .03),
    `${file} has front bounds ${(max.x - min.x).toFixed(4)} × ${(max.y - min.y).toFixed(4)}, expected ${width} × ${height}`);
  const xShare = tier.shape === "wedge" ? 1 / 3 : 1 / 2;
  const centroid = v(min.x + (max.x - min.x) * xShare, min.y + (max.y - min.y) * xShare, 0);
  const origin = root.getObjectByName(`snack_${tier.id}`);
  expect(origin && origin.getWorldPosition(v()).length() < .02 && centroid.length() < .02,
    `${file} has an origin or silhouette centre offset of 0.02 m or more`);
  expect(min.z >= -.900001 && max.z <= .900001, `${file} depth is outside ±0.9 m (${min.z.toFixed(3)} to ${max.z.toFixed(3)})`);
  const marker = empty(root, "face", file);
  if (marker) {
    const at = marker.getWorldPosition(v());
    const front = sample(data, v(at.x, at.y, 3), v(0, 0, -1));
    expect(front && close(at.z, front.z, .05), `${file} face misses the local front surface`);
    expect(marker.scale.x >= .1 && marker.scale.x <= .900001, `${file} face X scale is outside 0.1–0.9 m`);
  }
  if (tier.id === "hamper") {
    for (const node of ["body", "lid", "bow"]) expect(root.getObjectByName(node), `${file} lacks ${node}`);
  }
}

function container(file, root, data) {
  const id = path.basename(file, ".glb").slice("container_".length);
  const wallAt = (y) => id === "hopper" ? 2.10 + y * (3.30 - 2.10) / CRATE.height
    : id === "toybox" && y < .6 ? 2.70 + Math.sqrt(.6 ** 2 - (y - .6) ** 2) : CRATE.half;
  for (const name of ["back", "floor", "side_l", "side_r", "post_l", "post_r"]) {
    expect(root.getObjectByName(name), `${file} lacks ${name}`);
  }
  for (const [side, sign] of [["l", -1], ["r", 1]]) {
    const anchor = empty(root, `anchor_rim_${side}`, file);
    if (anchor) {
      const at = anchor.getWorldPosition(v());
      expect(at.x * sign >= CRATE.half && at.y >= CRATE.height && at.y <= 10.85001, `${file} misplaced rim anchor ${side}`);
    }
    const levels = id === "toybox" ? [.04, .15, .30, .45, .5, .59, 5, 10] : [.5, 5, 10];
    for (const y of levels) {
      const half = wallAt(y);
      for (const z of [-.8, 0, .8]) {
        const wall = sample(data, v(0, y, z), v(sign, 0, 0));
        expect(wall && close(wall.x, sign * half, .02), `${file} ${side} wall at y=${y}, z=${z} is ${wall?.x.toFixed(3) || "missing"}, expected ${(sign * half).toFixed(3)}`);
      }
    }
  }
  const floor = sample(data, v(0, .25, 0), v(0, -1, 0));
  const floorUnder = sample(data, v(0, -1, 0), v(0, 1, 0));
  expect(floor && close(floor.y, 0, .02) && floorUnder && close(floorUnder.y, -.3, .02), `${file} floor is not 0.30 m thick with top at zero`);
  const back = sample(data, v(0, 5, 0), v(0, 0, -1));
  expect(back && close(back.z, -1, .02), `${file} back is not at z = −1.0`);
  const projected = ({ triangles }) => triangles.reduce((area, [a, b, c]) =>
    area + Math.max(0, ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2), 0);
  const trim = data.filter(({ mesh }) => mesh.material.name === "trim");
  const trimArea = trim.reduce((area, mesh) => area + projected(mesh), 0);
  const frontArea = data.reduce((area, mesh) => area + projected(mesh), 0);
  expect(trimArea >= frontArea * .04, `${file} trim accounts for less than 4% of the projected front`);
  for (const [x, y] of [[0, 1], [0, 5], [0, 10], [-wallAt(5) + .3, 5], [wallAt(5) - .3, 5]]) {
    const surface = sample(data, v(x, y, 2), v(0, 0, -1));
    expect(!surface || surface.z <= 1.05001, `${file} obstructs its open front near ${x}, ${y}`);
  }
  for (const { vertices } of data) {
    expect(!vertices.some(({ x, y, z }) => y > 0 && y <= CRATE.height &&
      Math.abs(x) < wallAt(y) - .001 && z > 1.05001),
      `${file} has geometry inside the open front`);
  }
  if (id === "icecooler") {
    const lid = root.getObjectByName("lid");
    expect(lid && new THREE.Box3().setFromObject(lid).max.z < -1.15999, `${file} lid must stay entirely behind the back panel`);
  }
}

function backdrop(file, root, data, bounds) {
  for (const [name, reference] of Object.entries({
    window: null, shelf_l: null, shelf_r: null, floor_l: [-4.6, -.6, .6], floor_r: [4.6, -.6, .6],
    run_l: [-9, -.6, .6], run_r: [9, -.6, .6],
  })) {
    const node = empty(root, `anchor_${name}`, file);
    if (node && reference) expect(node.getWorldPosition(v()).distanceTo(v(...reference)) < .02,
      `${file} misplaced anchor_${name}`);
  }
  expect(bounds.min.x <= -29.98 && bounds.max.x >= 29.98 && bounds.min.y <= -1.98 && bounds.max.y >= 29.98,
    `${file} backing does not span the required 60 m by 32 m`);
  for (const [x, z] of [[0, 0], [-19.9, 2], [19.9, 2], [0, 3.9]]) {
    const counter = sample(data, v(x, 0, z), v(0, -1, 0));
    expect(counter && close(counter.y, -.6, .02), `${file} ground is missing or off level at ${x}, ${z}`);
  }
  for (const { vertices } of data) {
    // The required counter can project forward below the floor clearance plane.
    expect(!vertices.some(({ x, y, z }) => Math.abs(x) < 3.699 && y > -.578 && z > -1.299),
      `${file} scenery enters the play volume`);
  }
}

function cameo(file, root) {
  const name = path.basename(file, ".glb");
  for (const joint of cameos[name]) {
    const node = root.getObjectByName(joint);
    if (!node) {
      expect(false, `${file} lacks puppet joint ${joint}`);
      continue;
    }
    const bounds = new THREE.Box3();
    // Measure the part itself. Children that are joints have their own pivots.
    for (const child of node.children.filter((part) => part.isMesh || !part.name)) bounds.expandByObject(child, true);
    // For compound multi-material parts the loader gives a named mesh group.
    if (bounds.isEmpty()) bounds.setFromObject(node, true);
    expect(!bounds.isEmpty() && bounds.expandByScalar(.02).containsPoint(node.getWorldPosition(v())),
      `${file} pivot ${joint} is outside the part's bounds`);
  }
}

function checkModel(file, bytes, spec) {
  expect(bytes.length >= 28 && bytes.readUInt32LE(0) === 0x46546c67 &&
    bytes.readUInt32LE(4) === 2 && bytes.readUInt32LE(8) === bytes.length, `${file} is not a complete GLB 2.0 file`);
  const json = JSON.parse(bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)));
  expect(!json.animations?.length && !json.cameras?.length && !json.skins?.length &&
    !json.nodes?.some((node) => node.skin != null || node.camera != null) &&
    !json.extensionsUsed?.some((extension) => /draco|meshopt|basisu|ktx|lights/i.test(extension)) &&
    !json.images?.some((image) => /ktx/i.test(`${image.mimeType || ""} ${image.uri || ""}`)), `${file} contains unsupported GLB features`);
  let tris = 0;
  for (const { primitives } of json.meshes || []) {
    for (const primitive of primitives) {
      expect((primitive.mode === undefined || primitive.mode === 4) &&
        primitive.attributes.COLOR_0 != null && !primitive.targets?.length, `${file} needs vertex-coloured triangles without morph targets`);
      tris += json.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
    }
  }
  expect(tris > 0 && tris <= spec.tris, `${file} has ${tris} triangles; limit is ${spec.tris}`);
  const root = parseGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  const data = meshData(root);
  const bounds = new THREE.Box3().setFromObject(root, true);
  if (file.includes("/snacks/")) snack(file, root, data, bounds);
  else if (file.includes("/containers/")) container(file, root, data);
  else if (file.includes("/backdrops/")) backdrop(file, root, data, bounds);
  else if (file.includes("/cameos/")) cameo(file, root);
}

function webp(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") throw new Error("not a WebP");
  const kind = bytes.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3), !!(bytes[20] & 16)];
  if (kind === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff), !!(bits & (1 << 28))];
  }
  return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff, false];
}

function oggFrameCount(bytes) {
  let at = 0;
  let frames = null;
  while (at < bytes.length) {
    if (bytes.toString("ascii", at, at + 4) !== "OggS" || at + 27 > bytes.length) {
      throw new Error("invalid Ogg page header");
    }
    const segments = bytes[at + 26];
    const start = at + 27 + segments;
    if (start > bytes.length) throw new Error("truncated Ogg lacing table");
    const payload = bytes.subarray(at + 27, start).reduce((sum, length) => sum + length, 0);
    if (bytes[at + 5] & 4) frames = bytes.readBigInt64LE(at + 6);
    at = start + payload;
    if (at > bytes.length) throw new Error("truncated Ogg payload");
  }
  if (frames == null || frames <= 0n || frames > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("invalid Ogg final granule");
  }
  return Number(frames);
}

function checkAudio(file, full, spec) {
  // EBU R128 needs a 400 ms analysis window, longer than several effects.
  const filter = spec.music ? "ebur128=peak=true" : "apad=whole_len=17640,ebur128=peak=true";
  const measure = spawnSync(process.env.FFMPEG || "ffmpeg", ["-hide_banner", "-nostdin", "-i", full,
    "-af", filter, "-f", "null", "-"], { encoding: "utf8" });
  if (measure.status !== 0) throw new Error(measure.error?.message || measure.stderr || "ffmpeg analysis failed");
  const result = measure.stderr;
  const duration = result.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const seconds = duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : Infinity;
  const loudness = Number(result.match(/Integrated loudness:\s*I:\s*([-\d.]+) LUFS/)?.[1]);
  const peak = Number(result.match(/True peak:\s*Peak:\s*([-\d.]+) dBFS/)?.[1]);
  expect(result.includes("Audio: vorbis") && (spec.music ? /44100 Hz, stereo/.test(result) : /44100 Hz, mono/.test(result)),
    `${file} does not use the required Vorbis channel and sample format`);
  expect(seconds <= spec.seconds + .01 && (!spec.music || seconds >= 60), `${file} duration is ${seconds}s`);
  expect(close(loudness, spec.music ? -20 : -14, 3) && peak <= 0, `${file} measured ${loudness} LUFS, peak ${peak} dBFS`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(assets, "manifest.json"), "utf8"));
const listed = new Set(manifest.files);
expect(listed.size === manifest.files.length, "Manifest repeats one or more files");
const registered = new Set();
const audioLengths = new Map();
const totals = Array(7).fill(0);
const batch = Number(selection[1][1]);
const batchLimits = [0, 1600000, 3000000, 1000000, 2500000, 4000000, 1500000];

for (const relative of fs.readdirSync(assets, { recursive: true })) {
  const file = relative.replaceAll(path.sep, "/");
  if (!/\.(glb|ogg|webp)$/i.test(file)) continue;
  let spec = specs.get(file);
  if (!spec && /^art\/backdrop_(pantry|toybox|icecooler|market|hopper)_wall\.webp$/.test(file)) {
    const id = file.slice("art/backdrop_".length, -"_wall.webp".length);
    spec = { batch: { pantry: 1, toybox: 2, icecooler: 2, market: 2, hopper: 6 }[id], bytes: 120000, width: 1024 };
  }
  registered.add(file);
  expect(spec, `Unexpected asset path ${file}`);
  expect(listed.has(file), `Missing manifest entry for ${file}`);
  if (!spec || spec.batch > batch) continue;
  const full = path.join(assets, file);
  const bytes = fs.readFileSync(full);
  totals[spec.batch] += bytes.length;
  expect(bytes.length <= spec.bytes, `${file} has ${bytes.length} bytes; limit is ${spec.bytes}`);
  try {
    if (file.endsWith(".glb")) {
      checkModel(file, bytes, spec);
      modelFiles.push(full);
    } else if (file.endsWith(".webp")) {
      const [width, height, alpha] = webp(bytes);
      expect(spec.sizes ? spec.sizes.includes(width) && height === width
        : width === spec.width && (spec.height === undefined || height === spec.height), `${file} has incorrect dimensions ${width} × ${height}`);
      expect(!spec.alpha || alpha, `${file} lacks transparency`);
    } else {
      checkAudio(file, full, spec);
      if (spec.music) audioLengths.set(file, oggFrameCount(bytes));
    }
  } catch (error) {
    issues.push(`${file}: ${error.message}`);
  }
}

for (const file of listed) expect(registered.has(file), `Manifest entry ${file} does not exist on disk`);
for (const [file, spec] of specs) {
  if (spec.batch <= batch) expect(registered.has(file), `D${spec.batch} is missing ${file}`);
}
const stems = ["play", "fever", "danger"].map((id) => audioLengths.get(`audio/music/music_${id}.ogg`));
if (stems.every(Number.isFinite)) {
  expect(stems.every((length) => length === stems[0]), "Play, Fever and Danger have different sample-frame counts");
}
if (modelFiles.length) {
  const info = spawnSync(process.execPath, [path.join(here, "../../snack-haul/dev/glb-info.mjs"), ...modelFiles], { encoding: "utf8" });
  expect(info.status === 0, info.error?.message || info.stderr || "Snack Haul GLB report failed");
  if (info.stdout) console.log(info.stdout.trim());
}
for (let i = 1; i <= batch; i++) {
  expect(totals[i] <= batchLimits[i], `D${i} exceeds its size budget`);
  console.log(`D${i}: ${totals[i].toLocaleString()} of ${batchLimits[i].toLocaleString()} bytes`);
}
if (issues.length) {
  for (const message of issues) console.error(message);
  process.exitCode = 1;
} else console.log(`Asset checks passed through D${batch}.`);
