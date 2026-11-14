// Writes assets/manifest.json: the list of models and sounds the game may load.
// Run after assets change, from anywhere:
//   node play/labs/snack-haul/dev/make-manifest.mjs [assets folder]
// The game loads only what is listed, so a missing file costs no request.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, "..", "assets"));
fs.mkdirSync(root, { recursive: true });

const files = [];
const hash = crypto.createHash("sha1");
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(glb|ogg|webp)$/.test(entry.name)) {
      const rel = path.relative(root, full).replace(/\\/g, "/");
      if (!/^(models|audio|art|ui)\//.test(rel)) continue;
      files.push(rel);
      hash.update(rel).update(fs.readFileSync(full));
    }
  }
};
walk(root);

// The version changes whenever a listed file changes, so browsers refetch.
const manifest = { version: files.length ? hash.digest("hex").slice(0, 10) : "", files };
fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`${path.relative(process.cwd(), path.join(root, "manifest.json"))}: ${files.length} file(s), version ${manifest.version || "none"}`);
