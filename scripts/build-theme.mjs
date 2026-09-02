import fs from "node:fs/promises";
import path from "node:path";
import { fileEol, replaceMarkerBlock, withEol } from "./lib/marker-block.mjs";

/*
 * Injects the three-way theme wiring into every page: the anti-flash <head>
 * snippet, the site's default theme on <html>, and the deferred theme.js.
 * Idempotent — re-running replaces the generated block rather than stacking.
 *
 * Same shape as build-pwa.mjs and build-breadcrumbs.mjs, for the same reason:
 * 167 pages and no templating layer.
 *
 * Why the snippet is inline and NOT in theme.js
 * ---------------------------------------------
 * theme.js is deferred, so it runs after first paint. If it owned the initial
 * choice, a visitor on dark mode would get a full-brightness cream flash on
 * every single navigation before it corrected itself. The snippet below is tiny,
 * synchronous, and runs in <head> — it sets `data-theme` before the browser has
 * painted anything, which is the only way to avoid that flash on a static site.
 *
 * It is deliberately written to fail open: any exception (private mode blocking
 * localStorage, for instance) leaves the default theme applied rather than
 * throwing before the rest of the head parses.
 *
 * Run: node scripts/build-theme.mjs
 */

const root = path.resolve(".");
const OPEN = "<!-- theme:generated -->";
const CLOSE = "<!-- /theme:generated -->";

// The brand's own palette is the default here; the status sites pass "dark".
const DEFAULT_THEME = "cream";

const HEAD_BLOCK = [
  OPEN,
  "<script>",
  "  (function () {",
  '    var d = document.documentElement, t = null;',
  '    try { t = localStorage.getItem("snackpack.theme.v1"); } catch (e) {}',
  '    if (t !== "dark" && t !== "light" && t !== "cream") {',
  // Cream is the brand, so it is the default for everyone on a first visit --
  // deliberately NOT following prefers-color-scheme. A visitor whose OS is dark
  // was previously served the dark theme before ever seeing the real palette,
  // which made the site's own identity the exception rather than the norm.
  // Dark and light remain one click away and are remembered once chosen.
  `      t = "${DEFAULT_THEME}";`,
  "    }",
  '    d.setAttribute("data-theme", t);',
  `    d.setAttribute("data-theme-default", "${DEFAULT_THEME}");`,
  "  })();",
  "</script>",
  '<script defer src="/theme.js"></script>',
  CLOSE,
].join("\n");

async function* pages(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const p = path.join(dir, entry.name);
    const rel = path.relative(root, p).split(path.sep).join("/");
    // Last Bastion ships its own dev tree, its own build and its own art
    // direction; the shared theme has no business in it.
    if (rel.startsWith("play/last-bastion")) continue;
    if (entry.isDirectory()) yield* pages(p);
    else if (entry.name.endsWith(".html")) yield p;
  }
}

let changed = 0;
let already = 0;
let skipped = 0;

for await (const file of pages(root)) {
  let html = await fs.readFile(file, "utf8");

  const replaced = replaceMarkerBlock(html, OPEN, CLOSE, HEAD_BLOCK);
  if (replaced !== null) {
    if (replaced !== html) {
      await fs.writeFile(file, replaced);
      changed++;
    } else already++;
    continue;
  }

  if (!html.includes("</head>")) {
    console.warn("  no </head>, skipped:", path.relative(root, file));
    skipped++;
    continue;
  }

  const eol = fileEol(html);
  html = html.replace("</head>", withEol(HEAD_BLOCK, eol) + eol + "</head>");
  await fs.writeFile(file, html);
  changed++;
}

console.log(
  `Theme wiring: ${changed} page(s) written, ${already} already current` +
    (skipped ? `, ${skipped} skipped` : "") + "."
);
