// Share cards for the holiday and event bookshelves: 1200x630 JPEGs at
// read/events/<id>/social-card.jpg, composed from the event's published book
// covers (no new art) with the event title in the site's display font.
//
//   node scripts/build-read-event-cards.mjs
//
// Needs Playwright's Chromium (devDependency). Re-run when an event gains or
// loses a book, then re-run scripts/build-read-events.mjs so og:image points
// at the card. Not part of --check: Chromium's JPEG bytes are not stable across
// versions, so the card is reviewed by eye like the book art.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { publishedEvents } from "./lib/read-events.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// fonts.css uses site-absolute URLs; point them at the files for a file page.
const fontFaces = fs.readFileSync(path.join(ROOT, "assets/fonts/fonts.css"), "utf8").replace(/url\(\/assets\//g, `url(${pathToFileURL(ROOT).href}/assets/`);

const only = new Set(process.argv.filter(arg => arg.startsWith("--event=")).map(arg => arg.slice(8)));
const events = publishedEvents().filter(event => !only.size || only.has(event.id));
if (only.size && events.length !== only.size) throw new Error("Every requested event must have published books.");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const e of events) {
  const covers = e.timeline.map((t) => {
    const base = path.join(ROOT, "read", t.slug, "pages", "cover");
    const file = [`${base}-480w.webp`, `${base}.webp`, `${base}.jpg`].find((f) => fs.existsSync(f));
    if (!file) throw new Error(`${t.slug}: no cover image`);
    return pathToFileURL(file).href;
  });
  const n = covers.length;
  const imgs = covers.map((src, i) => {
    const angle = (i - (n - 1) / 2) * 5;
    const x = 560 + i * (410 / Math.max(n - 1, 1));
    const y = 120 + Math.abs(i - (n - 1) / 2) * 12;
    return `<img src="${src}" style="left:${x}px;top:${y}px;transform:rotate(${angle}deg);z-index:${i}">`;
  }).join("");
  // A file page (not setContent's about:blank) so Chromium may load the local
  // covers and fonts; removed again after the screenshot.
  const tmp = path.join(ROOT, "read/events", e.id, ".social-card.html");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, `<!doctype html><html><head><style>${fontFaces}
    body{margin:0;width:1200px;height:630px;overflow:hidden;background:${e.accent};color:#fffdf8;font-family:"DM Sans",Arial,sans-serif;position:relative}
    .copy{position:absolute;left:64px;top:96px;width:430px}
    .kicker{font-size:22px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.92}
    h1{margin:18px 0 18px;font-family:"Fraunces",Georgia,serif;font-size:76px;line-height:.98;letter-spacing:-.02em}
    p{margin:0;font-size:27px;line-height:1.35;opacity:.95}
    .site{position:absolute;left:64px;bottom:52px;font-size:22px;font-weight:700;opacity:.85}
    img{position:absolute;width:200px;height:300px;object-fit:cover;border-radius:14px;border:4px solid #fffdf8;box-shadow:0 18px 40px rgba(0,0,0,.35)}
  </style></head><body><div class="copy"><div class="kicker">Free picture books</div><h1>${esc(e.heading)}</h1><p>${n} illustrated stories to read online, read aloud or print.</p></div><div class="site">snackpackuniverse.com/read</div>${imgs}</body></html>`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, "read/events", e.id, "social-card.jpg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await page.screenshot({ type: "jpeg", quality: 82 }));
  fs.rmSync(tmp);
  console.log(`${path.relative(ROOT, out)}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
await browser.close();
