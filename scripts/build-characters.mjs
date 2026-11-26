import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const source = process.argv.find(arg => arg.startsWith("--source="))?.slice(9) ?? process.env.SNACKPACK_ROOT;
if (!source) throw new Error("Set SNACKPACK_ROOT or pass --source=<monorepo path>.");
const root = path.resolve(source);
const cwd = fileURLToPath(new URL("../", import.meta.url));
const options = { cwd, stdio: "inherit" };
const mediaArgs = process.argv.includes("--all-media") ? [] : ["--portraits-only"];

execFileSync(process.env.SNACKPACK_PYTHON || "python3", ["scripts/build-character-media.py", root, ...mediaArgs], options);
for (const args of [
  ["scripts/build-character-board.mjs", `--source=${root}`],
  ["scripts/build-breadcrumbs.mjs"],
  ["scripts/build-read-shelf.mjs"],
  ["scripts/build-sitemap.mjs"],
]) {
  execFileSync(process.execPath, args, options);
}
