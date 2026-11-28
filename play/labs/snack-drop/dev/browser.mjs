// Shared set-up for the Playwright checks: a static server over the website
// root and a phone-sized page with the analytics beacon stubbed out.
// Needs Playwright from the main website checkout (PLAYWRIGHT_HOME overrides).
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const site = path.resolve(here, "../../../..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".ogg": "audio/ogg", ".glb": "model/gltf-binary" };

export async function open({ touch = false, width = 412, height = 860 } = {}) {
  let chromium;
  for (const home of [process.env.PLAYWRIGHT_HOME, site, path.resolve(site, "../website-snackpack-universe")].filter(Boolean)) {
    try { ({ chromium } = createRequire(path.join(home, "x.js"))("playwright")); break; } catch { /* next */ }
  }
  if (!chromium) { console.error("Playwright not found. Set PLAYWRIGHT_HOME."); process.exit(2); }
  const server = http.createServer((req, res) => {
    const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
  const base = `http://127.0.0.1:${server.address().port}/play/labs/snack-drop/index.html`;
  const close = async () => { await browser.close(); server.close(); };
  return { page, ctx, base, errors, close };
}
