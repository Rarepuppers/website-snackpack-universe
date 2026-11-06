// Screenshots of every region, truck and menu through the real page, in headless
// Chromium. Needs the site served on 4179.
// Run from website-snackpack-universe: node play/labs/snack-haul/dev/gallery.mjs <outDir> [names...]
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const out = process.argv[2] || ".";
const only = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
const URL = process.env.SH_URL || "http://localhost:4179/play/labs/snack-haul/";

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
async function open(viewport, preset) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/cloudflareinsights|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript((save) => { if (save) localStorage.setItem("sp_snackhaul_v1", JSON.stringify(save)); }, preset || null);
  await page.goto(URL);
  await page.waitForFunction(() => window.__snackHaul);
  await page.waitForTimeout(900);
  return page;
}
const want = (n) => !only.length || only.includes(n);
const LAND = { width: 812, height: 375 }, PORT = { width: 390, height: 844 }, DESK = { width: 1280, height: 720 };
const rich = { coins: 2600, trucks: ["pickup", "van", "buggy", "hauler"], upgrades: { engine: 2, suspension: 2, tyres: 2, straps: 2, tank: 2 } };

async function drive(page, id, x, truck, name) {
  if (!want(name)) return;
  const info = await page.evaluate(async ({ id, x, truck }) => {
    const H = window.__snackHaul;
    if (truck) H.save().truck = truck;
    H.startDelivery(H.SH.findDelivery(id));
    const g = H.state.game;
    let n = 0;
    while (g.status === "driving" && n++ < 9000 && g.truck.getPosition().x < x) {
      const vx = g.truck.getLinearVelocity().x;
      g.step({ gas: vx < 5.5, brake: vx > 7 });
    }
    await new Promise((r) => setTimeout(r, 1200));
    return { x: Math.round(g.truck.getPosition().x), live: g.live(), status: g.status, stats: H.world().stats() };
  }, { id, x, truck });
  await page.screenshot({ path: path.join(out, name + ".png") });
  console.log(name, JSON.stringify(info));
}

const page = await open(LAND, rich);
if (want("home")) await page.screenshot({ path: path.join(out, "home.png") });
await drive(page, "bakery-3", 58, "pickup", "bakery");
await drive(page, "dunes-5", 66, "van", "dunes");
await drive(page, "frost-4", 60, "buggy", "frost");
await drive(page, "chilli-5", 66, "hauler", "chilli");
await page.close();

if (want("garage") || want("routes") || want("goals")) {
  const p = await open(LAND, rich);
  for (const s of ["routes", "garage", "goals"]) {
    if (!want(s)) continue;
    await p.evaluate((nav) => { const b = document.querySelector("[data-nav=back],.back"); if (b) b.click(); document.querySelector(`[data-nav=${nav}]`).click(); }, s);
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(out, s + ".png") });
  }
  await p.close();
}
if (want("portrait")) {
  const p = await open(PORT, rich);
  await p.screenshot({ path: path.join(out, "portrait-home.png") });
  await drive(p, "dunes-3", 60, "pickup", "portrait");
  await p.close();
}
if (want("desktop")) {
  const p = await open(DESK, rich);
  await drive(p, "bakery-5", 60, "hauler", "desktop");
  await p.close();
}
await browser.close();
console.log("errors:", errors.length ? errors : "none");
