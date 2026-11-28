// Back Roads and Extra Mile screenshots and draw stats: drives each road to a point,
// waits for the ducks or sails when they are near, settles the camera, and shoots.
//   node play/labs/snack-haul/dev/side-shots.mjs <out-dir> "?full=1"
//   SHOTS='[["back-1",50],["bakery-11",80]]' picks roads and the x to stop at.
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
const out = path.resolve(process.argv[2] || "shots");
const query = process.argv[3] || "";
fs.mkdirSync(out, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.goto(`http://127.0.0.1:${server.address().port}/play/labs/snack-haul/index.html${query}`);
await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.assets.done, null, { timeout: 30000 }).catch(async (e) => { console.log("ERR", errors, await page.evaluate(() => typeof window.__snackHaul)); process.exit(1); });
const loaded = await page.evaluate(() => { const a = window.__snackHaul.assets; return { models: Object.keys(a.models).length, sounds: Object.keys(a.sounds).length, failed: a.failed }; });
console.log("assets", JSON.stringify(loaded));
await page.evaluate(() => { const H = window.__snackHaul, g = H.state.game; g.status = "failed"; g.reason = "load"; H.state.mode = "result"; H.finishDelivery(g); document.querySelector('#sheet [data-act="garage"]').click(); });
await page.waitForTimeout(400);
// [id, stop when the truck front reaches x, or a duck clock]
const shots = JSON.parse(process.env.SHOTS || '[["back-1",55],["back-2",58],["back-3",62],["back-3",72],["back-5",150],["back-6",60]]');
for (const [id, stopX, i] of shots.map((s, i) => [...s, i])) {
  const info = await page.evaluate(([id, stopX]) => {
    const H = window.__snackHaul, SH = H.SH;
    H.startDelivery(SH.findDelivery(id));
    const g = H.state.game;
    let n = 0;
    while (g.status === "driving" && n++ < 9000 && g.truck.getPosition().x < stopX) g.step(SH.botInput(g, 5));
    for (let k = 0; k < 40; k++) g.step(SH.botInput(g, 2));
    const near = g.crossings.find((f) => Math.abs(f.x0 - g.truck.getPosition().x) < 14);
    if (near) for (let k = 0; k < 900 && !(SH.duckState(near, g.clock).active && SH.duckState(near, g.clock).u > 0.3); k++) g.step(SH.botInput(g, 5));
    for (let k = 0; k < 120; k++) H.world().frameGame(g, 0.016);
    return { x: Math.round(g.truck.getPosition().x), clock: g.clock.toFixed(1), status: g.status, honks: g.honks, draw: H.world().stats() };
  }, [id, stopX]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${i}-${id}.png`) });
  console.log(id, JSON.stringify(info));
}
console.log("errors", errors.slice(0, 5));
await browser.close(); server.close();
