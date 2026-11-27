// Run with Node and ffmpeg/ffprobe on PATH. Each batch includes earlier batches.
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { TIERS, CRATE } = createRequire(import.meta.url)("../engine.js");
const root = fileURLToPath(new URL("../assets/", import.meta.url));
const batch = process.argv[2] === "--batch" ? Number(/^d([1-6])$/.exec(process.argv[3])?.[1]) : NaN;
if (!batch) throw new Error("Usage: node check-assets.mjs --batch d1 (through d6)");

const batches = Array.from({ length: 6 }, () => new Map());
const add = (n, folder, names, ext, options = {}) => {
  for (const name of names.split(" ")) batches[n - 1].set(`${folder}/${name}.${ext}`, options);
};
for (const t of TIERS) {
  const n = ["cookie", "cheese", "donut", "pizza", "cake"].includes(t.id) ? 1 : 2;
  add(n, "models/snacks", "snack_" + t.id, "glb", { t, tris: t.tier < 5 ? 600 : 1500, bytes: t.tier < 5 ? 60000 : 120000 });
  add(n, "ui", "snack_" + t.id, "webp", { px: 96, bytes: 12000 });
}
add(1, "models/crates", "crate_wood", "glb", { tris: 3000, bytes: 200000 });
add(2, "models/crates", "crate_picnic crate_lunchbox", "glb", { tris: 3000, bytes: 200000 });
add(6, "models/crates", "crate_bento crate_toychest crate_icebox crate_gold", "glb", { tris: 3000, bytes: 200000 });
add(1, "models/kitchens", "kitchen_farmhouse", "glb", { tris: 6000, bytes: 400000 });
add(6, "models/kitchens", "kitchen_diner kitchen_bakery", "glb", { tris: 6000, bytes: 400000 });
for (const [n, names] of [[1, "corgi-on-the-cob"], [4, "hop-tart snack-spector belgian-waffle sub-zero octo-pop nutmeg professor-hooten pork-ulele ted-e-bear polly-roger"]]) {
  add(n, "models/cameos", names.split(" ").map((s) => "cameo_" + s).join(" "), "glb", { tris: 3000, bytes: 250000 });
}
add(1, "ui", "pause sound_on sound_off", "webp", { px: 128, bytes: 16000 });
add(1, "audio/sfx", "drop_soft drop_clack", "ogg", { bytes: 60000, seconds: 1.5 });
add(1, "audio/sfx", "merge_small merge_big", "ogg", { bytes: 60000, seconds: 0.4 });
add(3, "models/specials", "special_sprinkle_ball special_skewer special_fizz_soda special_golden_crumb special_ice_cube", "glb", { tris: 600, bytes: 60000 });
add(3, "models/tools", "tool_spatula tool_pepper tool_spoon", "glb", { tris: 800, bytes: 120000 });
add(3, "ui", "tool_spatula tool_pepper tool_shrink tool_swap tool_levelup tool_shake play daily orders zen album settings share home star_on star_off lock chef_hat chain", "webp", { px: 128, bytes: 16000 });
add(3, "art/fx", "sparkle puff fizz_bubble glaze_shine crumb_bit", "webp", { px: [128, 256], bytes: 24000 });
add(3, "art/fx", "sneeze", "webp", { px: 256, bytes: 24000 });
add(4, "models/cameos", "booklava_driver truck_van", "glb");
add(5, "audio/sfx", "drop_plop land_heavy chain_tick danger_creak phew game_over new_best ui_tap tool_spatula tool_sneeze tool_shrink tool_swap special_fizz special_sprinkle golden_shimmer cameo_pop cameo_hoot cameo_hop cameo_slide cameo_squawk truck_honk", "ogg", { bytes: 60000, seconds: 1.5 });
add(5, "audio/sfx", "hamper_fanfare cameo_ukulele", "ogg", { bytes: 60000, seconds: 2.05 });
add(5, "audio/music", "music_menu music_play music_zen music_danger", "ogg", { bytes: 1000000, seconds: 90, music: true });
const optional = new Map(["farmhouse", "diner", "bakery"].map((id) =>
  [`art/kitchen_${id}_wall.webp`, { px: 1024, bytes: 120000, opaque: true }]));

const budgets = [1.5, 2.5, 1.5, 3, 4, 3];
let problems = 0;
function insist(ok, label) { if (!ok) throw new Error(label); }
function issue(file, reason) { console.error(`FAIL ${file}: ${reason}`); problems++; }
function near(actual, expected, tolerance, name) {
  insist(Math.abs(actual - expected) <= tolerance, `${name}: ${actual.toFixed(4)} vs ${expected} ± ${tolerance}`);
}
function bounds(vertices) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const vertex of vertices) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], vertex[k]);
    max[k] = Math.max(max[k], vertex[k]);
  }
  return { min, max };
}

// Clip a triangle against the front opening. Checking vertices alone misses
// a wide panel whose corners all sit outside the opening.
function overlapsOpening(face, half, height) {
  let part = face;
  for (const [axis, sign, edge] of [[0, 1, -half + 0.002], [0, -1, half - 0.002],
    [1, 1, 0.002], [1, -1, height - 0.002], [2, 1, 0.97]]) {
    const next = [];
    for (let i = 0; i < part.length; i++) {
      const a = part[i], b = part[(i + 1) % part.length];
      const da = (a[axis] - edge) * sign, db = (b[axis] - edge) * sign;
      if (da >= 0) next.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        next.push(a.map((p, k) => p + (b[k] - p) * da / (da - db)));
      }
    }
    if (next.length < 3) return false;
    part = next;
  }
  return true;
}

function checkGlb(data, rel, spec) {
  insist(data.toString("ascii", 0, 4) === "glTF" && data.readUInt32LE(4) === 2 &&
    data.readUInt32LE(8) === data.length && data.toString("ascii", 16, 20) === "JSON", "invalid glTF 2.0 header");
  // Same JSON chunk and translated scene traversal as Snack Haul's dev/glb-info.mjs.
  const end = 20 + data.readUInt32LE(12);
  const gltf = JSON.parse(data.toString("utf8", 20, end));
  insist(!gltf.animations?.length && !gltf.cameras?.length && !gltf.skins?.length &&
    !gltf.extensionsUsed?.some((x) => /lights|draco|meshopt|basisu|texture_ktx/i.test(x)), "unsupported animation, camera, skin, light or compression");
  insist(data.toString("ascii", end + 4, end + 8) === "BIN\0", "missing embedded binary chunk");
  const bin = data.subarray(end + 8);
  const nodes = new Map();
  const vertices = [];
  let triangles = 0;
  const crate = rel.startsWith("models/crates/");
  const visit = (i, off) => {
    const node = gltf.nodes[i];
    const translation = node.translation ?? [0, 0, 0];
    insist(!node.matrix && (!node.rotation || node.rotation.every((v, k) => Math.abs(v - (k === 3 ? 1 : 0)) < 1e-6)) &&
      (!node.scale || node.scale.every((v) => Math.abs(v - 1) < 1e-6)), `apply rotation and scale on ${node.name}`);
    const at = off.map((v, k) => v + translation[k]);
    const first = vertices.length;
    for (const p of gltf.meshes?.[node.mesh]?.primitives ?? []) {
      insist(p.attributes.COLOR_0 !== undefined && (p.mode ?? 4) === 4 && !p.targets, "mesh needs vertex-coloured triangles");
      const a = gltf.accessors[p.attributes.POSITION], v = gltf.bufferViews[a.bufferView];
      insist(a.componentType === 5126 && a.type === "VEC3" && !a.sparse, "unsupported positions");
      const base = vertices.length;
      const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
      for (let j = 0; j < a.count; j++) {
        const offset = start + j * (v.byteStride ?? 12);
        vertices.push(at.map((x, k) => x + bin.readFloatLE(offset + k * 4)));
      }
      const indices = gltf.accessors[p.indices];
      const count = indices?.count ?? a.count;
      if (crate) {
        const view = indices && gltf.bufferViews[indices.bufferView];
        const offset = (view?.byteOffset ?? 0) + (indices?.byteOffset ?? 0);
        const width = indices && { 5121: 1, 5123: 2, 5125: 4 }[indices.componentType];
        const vertex = (j) => vertices[base + (width ? bin.readUIntLE(offset + j * width, width) : j)];
        for (let j = 0; j < count; j += 3) {
          insist(!overlapsOpening([vertex(j), vertex(j + 1), vertex(j + 2)], CRATE.half, CRATE.height),
            `${node.name} blocks the crate front`);
        }
      }
      triangles += count / 3;
    }
    for (const c of node.children ?? []) visit(c, at);
    nodes.set(node.name, { at, geometry: vertices.slice(first) });
  };
  for (const i of gltf.scenes[gltf.scene ?? 0].nodes) visit(i, [0, 0, 0]);
  insist(triangles > 0 && triangles <= (spec.tris ?? Infinity), `${triangles} triangles (limit ${spec.tris})`);
  insist((gltf.images?.length ?? 0) <= (spec.t ? 1 : 0), "too many embedded images");
  for (const image of gltf.images ?? []) {
    const view = gltf.bufferViews[image.bufferView];
    const offset = view?.byteOffset ?? 0;
    insist(view && image.mimeType === "image/png" && bin.readUInt32BE(offset + 16) <= 512 &&
      bin.readUInt32BE(offset + 20) <= 512, "embedded snack texture must be PNG up to 512 px");
  }
  const b = bounds(vertices);
  const node = (name) => {
    insist(nodes.has(name), `missing node ${name}`);
    return nodes.get(name);
  };
  const anchor = (name, expected) => {
    const n = node(name);
    insist(!n.geometry.length, `${name} must be empty`);
    if (expected) expected.forEach((v, k) => near(n.at[k], v, 0.02, `${name} axis ${k}`));
  };
  if (spec.t) {
    const t = spec.t;
    const xs = t.points?.map((p) => p.x) ?? [-t.halfW, t.halfW];
    const ys = t.points?.map((p) => p.y) ?? [-t.halfH, t.halfH];
    const want = bounds([ [Math.min(...xs), Math.min(...ys), 0], [Math.max(...xs), Math.max(...ys), 0] ]);
    for (let k = 0; k < 2; k++) {
      const tolerance = (want.max[k] - want.min[k]) * 0.03;
      near(b.min[k], want.min[k], tolerance, `front min axis ${k}`);
      near(b.max[k], want.max[k], tolerance, `front max axis ${k}`);
      near((b.min[k] + b.max[k] - want.min[k] - want.max[k]) / 2, 0, 0.02, `origin offset axis ${k}`);
    }
    insist(b.min[2] >= -0.90001 && b.max[2] <= 0.90001, "depth exceeds ±0.9 m");
    if (t.r) {
      const radius = Math.max(...vertices.map(([x, y]) => Math.hypot(x, y)));
      near(radius, t.r, t.r * 0.03, "front radius");
    }
    if (t.points) {
      for (let i = 0; i < t.points.length; i++) {
        const a = t.points[i], q = t.points[(i + 1) % t.points.length];
        const dx = q.x - a.x, dy = q.y - a.y;
        insist(vertices.every(([x, y]) => (dx * (y - a.y) - dy * (x - a.x)) / Math.hypot(dx, dy) >= -0.03), "geometry extends beyond the wedge");
      }
    }
    if (t.id === "hamper") for (const name of ["body", "lid", "bow"]) node(name);
  }
  if (crate) {
    const { half, wall, height } = CRATE;
    const part = (name) => bounds(node(name).geometry);
    const floor = part("floor"), left = part("side_l"), right = part("side_r"), back = part("back");
    for (const [actual, expected, name] of [
      [floor.max[1], 0, "floor top"], [floor.min[1], -wall, "floor bottom"],
      [left.max[0], -half, "inside left"], [left.min[0], -half - wall, "outside left"],
      [right.min[0], half, "inside right"], [right.max[0], half + wall, "outside right"],
      [left.max[1], height, "left height"], [right.max[1], height, "right height"],
      [back.max[2], -1, "inside back"], [back.min[2], -1.16, "outside back"],
      [floor.max[2], 1, "front depth"], [floor.min[2], -1, "back depth"],
    ]) near(actual, expected, 0.02, name);
    for (const side of ["l", "r"]) {
      const post = part(`post_${side}`);
      insist(post.max[1] <= 10.87, `post_${side} is too tall`);
      anchor(`anchor_rim_${side}`);
      near(node(`anchor_rim_${side}`).at[1], post.max[1], 0.02, "rim anchor height");
    }

  }
  if (rel.startsWith("models/kitchens/")) {
    const counter = bounds(node("counter").geometry);
    near(counter.max[1], -0.6, 0.02, "counter top");
    insist(counter.min[0] <= -19.98 && counter.max[0] >= 19.98 && counter.max[2] >= 3.98, "counter too small");
    for (const [name, n] of nodes) {
      if (!n.geometry.length || name === "counter") continue;
      const k = bounds(n.geometry);
      insist(k.max[1] <= -0.58 || k.min[0] >= 3.699 || k.max[0] <= -3.699 || k.max[2] <= -1.299, `${name} intrudes on the crate`);
    }
    for (const name of ["window", "shelf_l", "shelf_r"]) anchor("anchor_" + name);
    for (const [side, x] of [["l", -4.6], ["r", 4.6]]) anchor("anchor_floor_" + side, [x, -0.6, 0.6]);
  }
  if (path.basename(rel).startsWith("cameo_")) {
    const required = ["body", "head"];
    if (rel.includes("corgi-on-the-cob")) required.push("arm_l", "arm_r", "leg_l", "leg_r", "ear_l", "ear_r", "tail", "eyelids");
    if (rel.includes("hop-tart")) required.push("ear_l", "ear_r");
    if (/belgian-waffle|polly-roger/.test(rel)) required.push("wing_l", "wing_r");
    if (rel.includes("octo-pop")) required.push("arm_1", "arm_2", "arm_3", "arm_4");
    if (rel.includes("nutmeg")) required.push("tail");
    if (rel.includes("professor-hooten")) required.push("eyes_glow");
    if (/pork-ulele|polly-roger/.test(rel)) required.push("prop");
    for (const name of required) node(name);
    for (const [name, n] of nodes) {
      if (!required.includes(name) && !/^(ear|wing|arm|leg)_[lr1-4]$/.test(name) && !["tail", "prop", "eyelids"].includes(name)) continue;
      const p = bounds(n.geometry);
      insist(n.geometry.length && n.at.every((x, k) => x >= p.min[k] - 0.0001 && x <= p.max[k] + 0.0001), `${name} pivot is outside its part`);
    }
    near(b.min[1], 0, 0.025, "cameo feet");
    near(b.max[1], 2.4, 0.3, "cameo standing height");
  }
  return `${triangles} triangles`;
}

function probe(file) {
  return JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,pix_fmt,channels,sample_rate:format=duration", "-of", "json", file], { encoding: "utf8" }));
}
function checkMedia(file, spec) {
  const info = probe(file), stream = info.streams[0];
  if (spec.px) {
    const sizes = [spec.px].flat();
    insist(stream.codec_name === "webp" && sizes.includes(stream.width) && stream.width === stream.height, `expected square WebP at ${sizes.join(" or ")} px`);
    insist(spec.opaque || /a/.test(stream.pix_fmt), "missing alpha");
    return `${stream.width}×${stream.height}`;
  }
  const { music, seconds } = spec;
  const duration = Number(info.format.duration);
  insist(stream.codec_name === "vorbis" && stream.channels === (music ? 2 : 1) && stream.sample_rate === "44100", "expected 44.1 kHz Vorbis with correct channels");
  insist(duration > 0 && duration <= seconds && (!music || duration >= 60), `duration ${duration.toFixed(3)} s`);
  // EBU R128 gates out clips under 400 ms, so pad only for measurement.
  const filter = duration < 0.4 ? "apad=whole_dur=0.400,ebur128=peak=true" : "ebur128=peak=true";
  const { stderr, status } = processAudio(file, filter);
  insist(status === 0, "ffmpeg loudness measurement failed");
  const lufs = Number([...stderr.matchAll(/I:\s*(-?\d+(?:\.\d+)?) LUFS/g)].at(-1)?.[1]);
  near(lufs, music ? -20 : -14, 3, "integrated LUFS");
  return `${duration.toFixed(3)} s, ${lufs} LUFS`;
}
function processAudio(file, filter) {
  return spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-i", file, "-af", filter, "-f", "null", "-"], { encoding: "utf8" });
}

const all = new Map(batches.flatMap((list) => [...list]));
const present = fs.existsSync(root) ? fs.readdirSync(root, { recursive: true }).filter((f) => /\.(webp|glb|ogg)$/i.test(f)) : [];
for (const file of present) if (!all.has(file) && !optional.has(file)) issue(file, "unexpected runtime path");
for (const [file, spec] of optional) if (present.includes(file)) (file.includes("farmhouse") ? batches[0] : batches[5]).set(file, spec);
for (let i = 0; i < batch; i++) {
  let total = 0;
  for (const [rel, spec] of batches[i]) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) { issue(rel, "missing"); continue; }
    const bytes = fs.statSync(file).size;
    total += bytes;
    try {
      insist(!spec.bytes || bytes < spec.bytes, `${bytes} bytes (limit ${spec.bytes})`);
      const detail = rel.endsWith(".glb") ? checkGlb(fs.readFileSync(file), rel, spec) : checkMedia(file, spec);
      console.log(`ok   ${rel} — ${bytes} bytes, ${detail}`);
    } catch (error) { issue(rel, error.message); }
  }
  console.log(`D${i + 1}: ${total} / ${budgets[i] * 1000000} bytes`);
  if (total > budgets[i] * 1000000) issue(`D${i + 1}`, "over budget");
}
if (!fs.existsSync(path.join(root, "CREDITS.md"))) issue("CREDITS.md", "missing");
console.log(`${problems} problem(s)`);
process.exitCode = problems ? 1 : 0;
