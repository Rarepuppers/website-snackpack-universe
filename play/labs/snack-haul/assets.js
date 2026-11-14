// Snack Haul asset loader: authored models and sounds, each one optional.
// assets/manifest.json lists what exists (dev/make-manifest.mjs writes it).
// Anything not listed, or that fails to load, returns null and the game keeps
// its code-built model or synthesised sound.
// Files load with XMLHttpRequest because fetch() fails over file:// in the app.
import * as THREE from "./vendor/three.module.min.js";

const query = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams("");
const BASE = (query.get("assets") || "assets/").replace(/[^a-z0-9_\-./]/gi, "").replace(/\/?$/, "/");

export const Assets = { base: BASE, files: new Set(), models: {}, sounds: {}, failed: [], done: false, version: "" };

function request(url, type) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("GET", url);
    x.responseType = type;
    // A file:// request reports status 0 on success.
    x.onload = () => (x.response && (x.status === 200 || x.status === 0) ? resolve(x.response) : reject(new Error(url + " " + x.status)));
    x.onerror = () => reject(new Error(url + " failed"));
    x.send();
  });
}

// ════ GLB ═════════════════════════════════════════════════════════
// A small reader for the subset the asset plan allows: binary glTF 2.0, no
// compression, no animation, vertex colours, and at most embedded PNG or JPEG.
const COMPONENTS = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const WIDTHS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function parseGlb(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("not a GLB file");
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
  const binStart = 20 + jsonLength + 8;
  const bin = buffer.byteLength > binStart ? buffer.slice(binStart, binStart + view.getUint32(20 + jsonLength, true)) : new ArrayBuffer(0);

  const accessor = (index) => {
    const a = json.accessors[index], bv = json.bufferViews[a.bufferView], Type = COMPONENTS[a.componentType], width = WIDTHS[a.type];
    const start = (bv.byteOffset || 0) + (a.byteOffset || 0), size = Type.BYTES_PER_ELEMENT, stride = bv.byteStride || width * size;
    const out = new Type(a.count * width);
    if (stride === width * size && start % size === 0) out.set(new Type(bin, start, a.count * width));
    else {
      // Interleaved or unaligned data: copy element by element.
      const dv = new DataView(bin), read = { 5120: "getInt8", 5121: "getUint8", 5122: "getInt16", 5123: "getUint16", 5125: "getUint32", 5126: "getFloat32" }[a.componentType];
      for (let i = 0; i < a.count; i++) for (let k = 0; k < width; k++) out[i * width + k] = dv[read](start + i * stride + k * size, true);
    }
    return { array: out, width, normalized: !!a.normalized, type: a.componentType };
  };
  const floats = (acc) => {
    if (acc.type === 5126) return acc.array;
    const max = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[acc.type] || 1, out = new Float32Array(acc.array.length);
    for (let i = 0; i < out.length; i++) out[i] = acc.normalized ? Math.max(-1, acc.array[i] / max) : acc.array[i];
    return out;
  };

  const textures = (json.textures || []).map((t) => {
    const image = json.images && json.images[t.source];
    if (!image || image.bufferView == null) return null;
    const bv = json.bufferViews[image.bufferView];
    const url = URL.createObjectURL(new Blob([new Uint8Array(bin, bv.byteOffset || 0, bv.byteLength)], { type: image.mimeType || "image/png" }));
    const tex = new THREE.Texture();
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
    const img = new Image();
    img.onload = () => { tex.image = img; tex.needsUpdate = true; URL.revokeObjectURL(url); };
    img.src = url;
    return tex;
  });

  const materials = (json.materials || []).map((def) => {
    const pbr = def.pbrMetallicRoughness || {}, base = pbr.baseColorFactor || [1, 1, 1, 1], glow = def.emissiveFactor || [0, 0, 0];
    const strength = def.extensions && def.extensions.KHR_materials_emissive_strength ? def.extensions.KHR_materials_emissive_strength.emissiveStrength : 1;
    const mat = new THREE.MeshStandardMaterial({
      roughness: pbr.roughnessFactor == null ? 1 : pbr.roughnessFactor,
      metalness: pbr.metallicFactor == null ? 1 : pbr.metallicFactor,
      side: def.doubleSided ? THREE.DoubleSide : THREE.FrontSide
    });
    mat.name = def.name || "";
    mat.color.setRGB(base[0], base[1], base[2]);
    mat.emissive.setRGB(glow[0], glow[1], glow[2]);
    mat.emissiveIntensity = strength;
    if (pbr.baseColorTexture && textures[pbr.baseColorTexture.index]) mat.map = textures[pbr.baseColorTexture.index];
    if (def.alphaMode === "BLEND") { mat.transparent = true; mat.opacity = base[3]; mat.depthWrite = false; }
    if (def.alphaMode === "MASK") mat.alphaTest = def.alphaCutoff == null ? 0.5 : def.alphaCutoff;
    return mat;
  });
  const fallback = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });
  const coloured = new Map();
  const withColours = (mat) => {
    if (!coloured.has(mat)) { const c = mat.clone(); c.name = mat.name; c.vertexColors = true; coloured.set(mat, c); }
    return coloured.get(mat);
  };

  const meshes = (json.meshes || []).map((def) => def.primitives.filter((p) => p.mode == null || p.mode === 4).map((p) => {
    const geo = new THREE.BufferGeometry(), at = p.attributes;
    geo.setAttribute("position", new THREE.BufferAttribute(floats(accessor(at.POSITION)), 3));
    if (at.NORMAL != null) geo.setAttribute("normal", new THREE.BufferAttribute(floats(accessor(at.NORMAL)), 3));
    if (at.TEXCOORD_0 != null) geo.setAttribute("uv", new THREE.BufferAttribute(floats(accessor(at.TEXCOORD_0)), 2));
    if (at.COLOR_0 != null) {
      const c = accessor(at.COLOR_0), src = floats(c), rgb = c.width === 3 ? src : new Float32Array((src.length / 4) * 3);
      if (c.width === 4) for (let i = 0, n = src.length / 4; i < n; i++) { rgb[i * 3] = src[i * 4]; rgb[i * 3 + 1] = src[i * 4 + 1]; rgb[i * 3 + 2] = src[i * 4 + 2]; }
      geo.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    }
    if (p.indices != null) { const ix = accessor(p.indices).array; geo.setIndex(new THREE.BufferAttribute(ix instanceof Uint8Array ? new Uint16Array(ix) : ix, 1)); }
    if (at.NORMAL == null) geo.computeVertexNormals();
    const base = p.material != null ? materials[p.material] : fallback;
    return { geo, mat: at.COLOR_0 != null ? withColours(base) : base };
  }));

  const build = (index) => {
    const def = json.nodes[index], parts = def.mesh != null ? meshes[def.mesh] : [];
    let node;
    if (parts.length === 1) node = new THREE.Mesh(parts[0].geo, parts[0].mat);
    else { node = new THREE.Group(); parts.forEach((part) => node.add(new THREE.Mesh(part.geo, part.mat))); }
    node.name = def.name || "";
    if (def.matrix) { node.matrix.fromArray(def.matrix); node.matrix.decompose(node.position, node.quaternion, node.scale); }
    else {
      if (def.translation) node.position.fromArray(def.translation);
      if (def.rotation) node.quaternion.fromArray(def.rotation);
      if (def.scale) node.scale.fromArray(def.scale);
    }
    (def.children || []).forEach((child) => node.add(build(child)));
    return node;
  };
  const root = new THREE.Group();
  const scene = (json.scenes || [])[json.scene || 0] || { nodes: [] };
  (scene.nodes || []).forEach((n) => root.add(build(n)));
  root.updateMatrixWorld(true);
  return root;
}

// One merged geometry with colours baked into the vertices, for instanced scenery.
// part: "base" leaves out glowing surfaces, "glow" keeps only them.
const glows = (mat) => mat.name === "glow" || mat.emissive.r + mat.emissive.g + mat.emissive.b > 0.01;
function mergeForInstancing(root, part) {
  const pos = [], nor = [], col = [], v = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || glows(o.material) !== (part === "glow")) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    const base = part === "glow" && o.material.emissive.r + o.material.emissive.g + o.material.emissive.b > 0.01 ? o.material.emissive : o.material.color;
    normalMatrix.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(n, i).applyMatrix3(normalMatrix).normalize(); nor.push(v.x, v.y, v.z);
      col.push(base.r * (c ? c.getX(i) : 1), base.g * (c ? c.getY(i) : 1), base.b * (c ? c.getZ(i) : 1));
    }
  });
  if (!pos.length) return null;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// ════ Lookups: all synchronous, all null when the asset is absent ══
// name is the path under assets/models without the extension: "trucks/truck_pickup".
export function model(name) {
  const entry = Assets.models[name];
  return entry ? entry.root.clone(true) : null;
}
export function instanceGeometry(name) {
  const entry = Assets.models[name];
  if (!entry) return null;
  if (entry.merged === undefined) entry.merged = mergeForInstancing(entry.root, "base");
  return entry.merged;
}
// The glowing parts of the same model (lanterns, lit windows), or null.
export function instanceGlow(name) {
  const entry = Assets.models[name];
  if (!entry) return null;
  if (entry.glow === undefined) entry.glow = mergeForInstancing(entry.root, "glow");
  return entry.glow;
}
// True when the manifest lists this file: "ui/coin.webp", "art/sky_bakery.webp".
export function has(file) { return Assets.files.has(file); }
export function url(file) { return BASE + file + (Assets.version ? "?v=" + Assets.version : ""); }
// A texture from a listed image, or null. Loaded by XHR into a blob, so it is
// same-origin for WebGL even when the game runs from file://.
const textures = {};
export function texture(file) {
  if (!has(file)) return null;
  if (textures[file]) return textures[file];
  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  request(url(file), "arraybuffer").then((data) => {
    const blob = URL.createObjectURL(new Blob([data], { type: "image/webp" })), img = new Image();
    img.onload = () => { tex.image = img; tex.needsUpdate = true; URL.revokeObjectURL(blob); if (tex.userData.onReady) { const run = tex.userData.onReady; tex.userData.onReady = null; run(); } };
    img.src = blob;
  }).catch(() => {});
  return (textures[file] = tex);
}
export function hasModel(name) { return !!Assets.models[name]; }
// name is the path under assets/audio without the extension: "sfx/coin".
export function soundData(name) { return Assets.sounds[name] || null; }

// ════ Loading ═════════════════════════════════════════════════════
let started = null;
export function loadAssets(onChange) {
  if (started) return started;
  const tell = () => { try { onChange && onChange(Assets); } catch (e) { /* a listener must never stop loading */ } };
  started = request(BASE + "manifest.json", "text").then((text) => {
    const manifest = JSON.parse(text), stamp = manifest.version ? "?v=" + encodeURIComponent(manifest.version) : "";
    Assets.version = manifest.version || "";
    (manifest.files || []).forEach((f) => Assets.files.add(f));
    const jobs = [];
    Assets.files.forEach((file) => {
      const glb = /^models\/(.+)\.glb$/.exec(file), ogg = /^audio\/(.+)\.ogg$/.exec(file);
      if (!glb && !ogg) return;
      jobs.push(() => request(BASE + file + stamp, "arraybuffer").then((data) => {
        if (glb) Assets.models[glb[1]] = { root: parseGlb(data) };
        else Assets.sounds[ogg[1]] = data;
      }).catch((e) => { Assets.failed.push(file + ": " + e.message); }));
    });
    // Four at a time: quick on a phone without starving the first frame.
    let next = 0, last = 0;
    const worker = () => (next < jobs.length ? jobs[next++]().then(() => { if (performance.now() - last > 400) { last = performance.now(); tell(); } return worker(); }) : null);
    return Promise.all([worker(), worker(), worker(), worker()]);
  }).catch(() => { /* no manifest: run on code-built models and synthesised sound */ }).then(() => { Assets.done = true; tell(); return Assets; });
  return started;
}
