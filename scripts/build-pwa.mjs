import fs from "node:fs/promises";
import path from "node:path";

/*
 * Injects the PWA wiring — manifest link, apple-touch-icon and the service
 * worker registration — into every page. Idempotent: re-running replaces the
 * previously generated block rather than stacking duplicates.
 *
 * Why a codemod rather than hand-editing: there are ~145 pages and the arcade
 * has no templating layer, so this matches how breadcrumbs and related-games
 * are already maintained.
 *
 * Run: node scripts/build-pwa.mjs
 */

const root = path.resolve(".");
const OPEN = "<!-- pwa:generated -->";
const CLOSE = "<!-- /pwa:generated -->";

const HEAD_BLOCK = [
  OPEN,
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="/assets/icon-192.png">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="SnackPack">',
  "<script>",
  '  if ("serviceWorker" in navigator) {',
  '    window.addEventListener("load", function () {',
  '      navigator.serviceWorker.register("/sw.js").catch(function () {});',
  "    });",
  "  }",
  "</script>",
  CLOSE,
].join("\n");

// Pages that should not advertise themselves as the installable app.
const SKIP = new Set(["404.html"]);

async function* pages(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const p = path.join(dir, entry.name);
    const rel = path.relative(root, p).split(path.sep).join("/");
    // Last Bastion ships its own dev tree and its own build; leave it alone.
    if (rel.startsWith("play/last-bastion")) continue;
    if (entry.isDirectory()) yield* pages(p);
    else if (entry.name.endsWith(".html") && !SKIP.has(rel)) yield p;
  }
}

let changed = 0;
let already = 0;

for await (const file of pages(root)) {
  let html = await fs.readFile(file, "utf8");
  const existing = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}\\n?`, "g");

  if (existing.test(html)) {
    const next = html.replace(existing, HEAD_BLOCK + "\n");
    if (next !== html) { await fs.writeFile(file, next); changed++; } else already++;
    continue;
  }

  if (!html.includes("</head>")) {
    console.warn("  no </head>, skipped:", path.relative(root, file));
    continue;
  }
  html = html.replace("</head>", HEAD_BLOCK + "\n</head>");
  await fs.writeFile(file, html);
  changed++;
}

console.log(`PWA wiring: ${changed} page(s) written, ${already} already current.`);
