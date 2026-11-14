// Prints each GLB's bounding box, node names and material names.
//   node dev/glb-info.mjs assets/models/road [more files or folders]
import fs from "node:fs";
import path from "node:path";
const files = [];
for (const arg of process.argv.slice(2)) {
  if (fs.statSync(arg).isDirectory()) fs.readdirSync(arg).filter((f) => f.endsWith(".glb")).forEach((f) => files.push(path.join(arg, f)));
  else files.push(arg);
}
for (const file of files) {
  const b = fs.readFileSync(file), json = JSON.parse(b.toString("utf8", 20, 20 + b.readUInt32LE(12)));
  const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  const visit = (i, off) => {
    const n = json.nodes[i], t = n.translation || [0, 0, 0], at = off.map((v, k) => v + t[k]);
    if (n.mesh != null) for (const p of json.meshes[n.mesh].primitives) { const a = json.accessors[p.attributes.POSITION]; for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], a.min[k] + at[k]); max[k] = Math.max(max[k], a.max[k] + at[k]); } }
    (n.children || []).forEach((c) => visit(c, at));
  };
  json.scenes[json.scene || 0].nodes.forEach((n) => visit(n, [0, 0, 0]));
  const f = (v) => v.map((x) => x.toFixed(2)).join(",");
  console.log(path.basename(file).padEnd(24), "x,y,z min", f(min).padEnd(20), "max", f(max).padEnd(18), "mats", (json.materials || []).map((m) => m.name).join("/"), process.env.NODES ? "nodes " + json.nodes.map((n) => n.name).join(",") : "");
}
