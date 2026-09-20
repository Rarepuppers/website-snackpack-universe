import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/*
 * Cache-busts the Pinball ES module graph.
 *
 * GitHub Pages serves these modules with `Cache-Control: max-age=600` and they
 * are imported by bare relative path, so for ten minutes after a deploy a
 * returning player can run the previous renderer against the current page. That
 * was observed during the v19 rollout: the service worker had upgraded, but the
 * browser's own HTTP cache answered the SW's network-first fetch with the old
 * render.js, and the SW then stored that stale copy.
 *
 * Versioning only the entry does not fix it, because a fresh game.js still
 * imports `./engine.js` by a bare path that the HTTP cache can answer. So every
 * intra-graph specifier carries the same token.
 *
 * The token is a content hash of the whole module set, not a hand-bumped
 * integer: it changes exactly when the code changes, and never needs a human to
 * remember. index.html is safe to anchor on because navigations are
 * network-first in sw.js and GitHub Pages revalidates HTML.
 *
 * Run:   node scripts/build-pinball-version.mjs
 * Guard: node scripts/build-pinball-version.mjs --check
 */

const root = path.resolve(".");
const DIR = path.join(root, "play", "pinball");
const PAGE = path.join(DIR, "index.html");
// Every module in the graph. table.js has no imports of its own but its bytes
// still belong in the hash: a coordinate change must invalidate the others.
const MODULES = ["engine.js", "game.js", "render.js", "rules.js", "table.js"];
const ENTRY = "game.js";

/** `./name.js` or `./name.js?v=abc123` at the end of an import specifier. */
function specifierRe(name) {
  return new RegExp(`(['"])\\./${name.replace(".", "\\.")}(?:\\?v=[0-9a-f]+)?\\1`, "g");
}

function entryRe() {
  return new RegExp(`(src=")\\./${ENTRY.replace(".", "\\.")}(?:\\?v=[0-9a-f]+)?(")`, "g");
}

/** Strip any existing token so the hash is of the code, not of the last hash. */
function canonical(source) {
  let out = source;
  for (const name of MODULES) out = out.replace(specifierRe(name), `$1./${name}$1`);
  return out;
}

async function main() {
  const check = process.argv.includes("--check");

  const sources = new Map();
  for (const name of MODULES) {
    sources.set(name, await fs.readFile(path.join(DIR, name), "utf8"));
  }

  const hash = crypto.createHash("sha256");
  for (const name of MODULES) {
    hash.update(name);
    // Normalise line endings: this repo is CRLF in the working tree, and a
    // token that changed with the checkout dialect would churn every clone.
    hash.update(canonical(sources.get(name)).replace(/\r\n/g, "\n"));
  }
  const token = hash.digest("hex").slice(0, 10);

  const writes = [];

  for (const name of MODULES) {
    let next = canonical(sources.get(name));
    for (const dep of MODULES) {
      if (dep === name) continue;
      next = next.replace(specifierRe(dep), `$1./${dep}?v=${token}$1`);
    }
    if (next !== sources.get(name)) writes.push([path.join(DIR, name), next]);
  }

  const html = await fs.readFile(PAGE, "utf8");
  const nextHtml = html.replace(entryRe(), `$1./${ENTRY}?v=${token}$2`);
  if (!entryRe().test(html)) {
    throw new Error(`Cannot find the ${ENTRY} module script tag in ${PAGE}`);
  }
  if (nextHtml !== html) writes.push([PAGE, nextHtml]);

  if (!writes.length) {
    console.log(`Pinball module version is current (v=${token}).`);
    return;
  }

  if (check) {
    console.error(
      `Pinball module version is stale. Expected v=${token} in:\n` +
        writes.map(([file]) => `  ${path.relative(root, file)}`).join("\n") +
        "\nRun: node scripts/build-pinball-version.mjs"
    );
    process.exit(1);
  }

  for (const [file, content] of writes) await fs.writeFile(file, content, "utf8");
  console.log(`Pinball module version stamped v=${token} (${writes.length} files).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
