// Auto graphics: the starting tier follows the phone, and the tier Auto settles on is kept.
//   node play/labs/snack-haul/dev/quality-check.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../../..");
const repo = path.resolve(site, "..");
let chromium;
for (const home of [process.env.PLAYWRIGHT_HOME, path.join(repo, "website-keeping-up"), site, repo].filter(Boolean)) {
  try { ({ chromium } = createRequire(path.join(home, "x.js"))("playwright")); break; } catch { /* try the next */ }
}
if (!chromium) { console.error("Playwright not found. Set PLAYWRIGHT_HOME."); process.exit(2); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const url = `http://127.0.0.1:${server.address().port}/play/labs/snack-haul/index.html?full=1`;
let bad = 0;
async function tier(memory, cores, before) {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 } });
  await ctx.addInitScript(([m, c, saved]) => {
    Object.defineProperty(navigator, "deviceMemory", { get: () => m });
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => c });
    if (saved) localStorage.setItem(saved[0], saved[1]);
  }, [memory, cores, before]);
  const page = await ctx.newPage();
  await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
  await page.goto(url);
  await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.world(), null, { timeout: 30000 });
  const got = await page.evaluate(() => window.__snackHaul.world().quality.name);
  // Auto steps down: the tier it lands on is saved for next launch.
  const saved = await page.evaluate(() => { const w = window.__snackHaul.world(); w.onQualityChange("low"); return localStorage.getItem(Object.keys(localStorage).find((k) => /snack/i.test(k))); });
  await ctx.close();
  return { got, saved };
}
for (const [mem, cores, want] of [[2, 8, "low"], [8, 4, "low"], [4, 8, "medium"], [8, 8, "high"], [undefined, undefined, "high"]]) {
  const r = await tier(mem, cores);
  if (r.got !== want) bad++;
  console.log("memory", mem, "cores", cores, "->", r.got, r.got === want ? "ok" : "WANT " + want);
}
// A saved autoTier wins over the phone's numbers.
const keyed = ["sp_snackhaul_v1", JSON.stringify({ autoTier: "medium", savedAt: Date.now() })];
const again = await tier(8, 8, keyed);
if (again.got !== "medium") bad++;
console.log("saved autoTier medium on a strong phone ->", again.got, again.got === "medium" ? "ok" : "WANT medium");
await browser.close(); server.close();
process.exitCode = bad ? 1 : 0;
