// Writes tiny stand-in GLBs to dev/fixture-assets/ so dev/assets-check.mjs can
// prove the loader swaps authored models in without any real art:
// a flat square for the Cookie and a flat panel for the Pantry Box container.
//   node play/labs/snack-drop/dev/make-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "fixture-assets");

function glb(name, w, h, rgb) {
  const pos = new Float32Array([-w, -h, 0, w, -h, 0, w, h, 0, -w, h, 0]);
  const col = new Float32Array([...rgb, ...rgb, ...rgb, ...rgb]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(col.buffer), Buffer.from(idx.buffer)]);
  const json = {
    asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name, mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, indices: 2, material: 0 }] }],
    materials: [{ name: "fixture", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.8 }, doubleSided: true }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 48 }, { buffer: 0, byteOffset: 48, byteLength: 48 }, { buffer: 0, byteOffset: 96, byteLength: 12 }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: "VEC3", min: [-w, -h, 0], max: [w, h, 0] },
      { bufferView: 1, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: 6, type: "SCALAR" }
    ]
  };
  let j = Buffer.from(JSON.stringify(json)); j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
  const b = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + b.length, 8);
  const ch = (len, type) => { const c = Buffer.alloc(8); c.writeUInt32LE(len, 0); c.writeUInt32LE(type, 4); return c; };
  return Buffer.concat([head, ch(j.length, 0x4e4f534a), j, ch(b.length, 0x004e4942), b]);
}

fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(path.join(root, "models/snacks"), { recursive: true });
fs.mkdirSync(path.join(root, "models/containers"), { recursive: true });
fs.writeFileSync(path.join(root, "models/snacks/snack_cookie.glb"), glb("fixture_cookie", 0.52, 0.52, [0.2, 0.6, 1]));
fs.writeFileSync(path.join(root, "models/containers/container_pantry.glb"), glb("fixture_container", 3.6, 5.2, [0.3, 0.8, 0.4]));
execFileSync(process.execPath, [path.join(here, "make-manifest.mjs"), root], { stdio: "inherit" });
