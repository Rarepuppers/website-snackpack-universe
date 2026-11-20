// Beat your ghost, in the real page: a slow bot run is saved as your ghost, then
// the autopilot races it. Screenshots show the ghost's name tag, the live gap
// chip, and the results line. Also races Dash Dalloway on a route not yet beaten.
//   node play/labs/snack-haul/dev/ghost-check.mjs <out-dir> [width] [height]
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
const out = path.resolve(process.argv[2] || "ghost-shots");
const W = Number(process.argv[3] || 996), H = Number(process.argv[4] || 448);
fs.mkdirSync(out, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/cloudflareinsights|CORS/.test(m.text())) errors.push(m.text()); });
await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.goto(`http://127.0.0.1:${server.address().port}/play/labs/snack-haul/index.html`);
await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.assets.done, null, { timeout: 30000 });

async function race(id, setup, label) {
  const info = await page.evaluate(([id, setup]) => {
    const Hk = window.__snackHaul, SH = Hk.SH, save = Hk.save();
    save.stars[id] = 3;
    if (setup === "mine") {
      save.rival[id] = true;
      const g = SH.createGame({ id, upgrades: save.upgrades, truck: "pickup" });
      let n = 0;
      while (g.status === "driving" && n++ < 20000) g.step(SH.botInput(g, 4));
      save.ghost[id] = { v: 2, truck: "pickup", upgrades: Object.assign({}, save.upgrades), rec: g.rec.slice(), time: g.time };
      save.truck = "pickup";
    } else delete save.rival[id];
    Hk.startDelivery(SH.findDelivery(id));
    Hk.state.autopilot = 5.5;
    return { ghost: Hk.state.ghost && Hk.state.ghost.kind, time: save.ghost[id] && save.ghost[id].time };
  }, [id, setup]);
  console.log(label, id, JSON.stringify(info));
  const shots = [6000, 9000];
  for (const [i, wait] of shots.entries()) {
    await page.waitForTimeout(wait);
    const chip = await page.evaluate(() => { const el = document.getElementById("gap"); return { hidden: el.hidden, text: el.textContent, cls: el.className, t: window.__snackHaul.state.game.time.toFixed(1) }; });
    console.log("  chip", JSON.stringify(chip));
    await page.screenshot({ path: path.join(out, `${label}-drive-${i + 1}.png`) });
  }
  await page.waitForFunction(() => window.__snackHaul.state.mode === "result", null, { timeout: 240000, polling: 500 });
  await page.waitForTimeout(800);
  const result = await page.evaluate(() => [...document.querySelectorAll("#sheet .unlocked, #sheet .challenge, #sheet p")].map((e) => e.textContent.trim()).filter(Boolean));
  console.log("  result", JSON.stringify(result));
  await page.screenshot({ path: path.join(out, `${label}-result.png`) });
}

await race("bakery-2", "mine", "mine");
await race("bakery-3", "rival", "rival");
console.log(errors.length ? "ERRORS " + JSON.stringify(errors) : "no page errors");
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
