// Tags every Stripe donation link with where it was clicked, so Stripe shows the
// source as the payment's client_reference_id. Idempotent: links that already
// carry a client_reference_id (atlas, worldcup) are left alone.
//   node scripts/tag-stripe-links.mjs          rewrite pages
//   node scripts/tag-stripe-links.mjs --check  list untagged links and exit 1 if any
// IDs: <page>-<spot>, for example play-chess-badge, app-badgify-badge, home-badge,
// play-flappy-snacky-btn. play/funnel.js tags its own pop-up at run time.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_RE = /href="(https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+)"/g;
const check = process.argv.includes("--check");

// Page id from the file's folder: play/chess -> play-chess, apps/badgify -> app-badgify.
function pageId(file) {
  const dir = path.dirname(file).split(path.sep).filter((p) => p && p !== ".");
  if (!dir.length) return "home";
  if (dir.length === 1) return dir[0] === "play" ? "play-hub" : dir[0] === "apps" ? "apps-hub" : dir[0].replace(/[^a-z0-9-]/gi, "");
  const [top, ...rest] = dir;
  const head = top === "apps" ? "app" : top === "world-cup" ? "worldcup" : top;
  return [head, ...rest].join("-").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

const files = execSync("git ls-files '*.html'", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
let changed = 0, links = 0;
const untagged = [];
for (const file of files) {
  const full = path.join(root, file);
  const src = fs.readFileSync(full, "utf8");
  if (!src.includes("buy.stripe.com")) continue;
  const id = pageId(file);
  // The spot is the link's class: the footer badge, or an in-page button.
  const out = src.replace(/<a\b[^>]*>/g, (tag) => {
    if (!/buy\.stripe\.com/.test(tag) || /client_reference_id=/.test(tag)) return tag;
    const spot = /class="[^"]*donate-badge/.test(tag) ? "badge" : "btn";
    links++;
    untagged.push(file + " " + id + "-" + spot);
    return tag.replace(URL_RE, (_, url) => `href="${url}?client_reference_id=${id}-${spot}"`);
  });
  if (out !== src) { changed++; if (!check) fs.writeFileSync(full, out); }
}
if (check) {
  untagged.forEach((x) => console.log("untagged", x));
  process.exitCode = untagged.length ? 1 : 0;
} else console.log(`tagged ${links} links in ${changed} pages`);
