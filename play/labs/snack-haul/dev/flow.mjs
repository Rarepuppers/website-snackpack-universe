// End-to-end flow through the real page and pedals. Run: node play/labs/snack-haul/dev/flow.mjs
import { chromium } from "playwright";
const URL = process.env.SH_URL || "http://localhost:4179/play/labs/snack-haul/";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 812, height: 375 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/cloudflareinsights|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
await page.goto(URL);
await page.waitForFunction(() => window.__snackHaul);
await page.waitForTimeout(600);
const log = (k, v) => console.log(k.padEnd(20), JSON.stringify(v));
const finish = (target, maxX) => page.evaluate(({ target, maxX }) => {
  const H = window.__snackHaul, g = H.state.game, t = g.terrain;
  let n = 0;
  while (g.status === "driving" && n++ < 16000) {
    const p = g.truck.getPosition(), vx = g.truck.getLinearVelocity().x, to = (t.zoneStart + t.zoneEnd) / 2 - p.x;
    if (maxX && p.x > maxX) break;
    let want = target; if (to < 40) want = Math.min(want, Math.max(0.1, to * 0.28));
    const i = { gas: false, brake: false };
    if (to < 1 && vx > 0.2) i.brake = true; else if (to < 0.5) {} else if (vx < want) i.gas = true; else if (vx > want + 1.6) i.brake = true;
    g.step(i);
  }
  return { status: g.status, reason: g.reason, live: g.live() };
}, { target, maxX });
const sheet = () => page.evaluate(() => document.getElementById("sheet").innerText.replace(/\n+/g, " | "));
const veilOn = () => page.waitForSelector(".veil.on", { timeout: 15000 });

// Real pedal, by mouse on the GAS button.
await page.click("[data-nav=play]");
await page.waitForTimeout(500);
const gas = await page.locator("#gas").boundingBox();
const x0 = await page.evaluate(() => window.__snackHaul.state.game.truck.getPosition().x);
await page.mouse.move(gas.x + 40, gas.y + 40); await page.mouse.down(); await page.waitForTimeout(1800); await page.mouse.up();
log("pedal moved", { x0, x1: await page.evaluate(() => window.__snackHaul.state.game.truck.getPosition().x), input: await page.evaluate(() => window.__snackHaul.state.input.gas) });
await page.click("#pause"); await veilOn(); log("pause", await sheet());
await page.click("[data-act=resume]");
await finish(4.5); await veilOn(); log("delivery 1", await sheet());
await page.click("[data-act=next]"); await page.waitForTimeout(300);
await finish(15); await veilOn(); log("fast delivery", await sheet());
await page.click("[data-act=garage]"); await page.waitForTimeout(300);
await page.evaluate(() => { const s = window.__snackHaul.save(); s.coins = 900; });
await page.click(".back"); await page.click("[data-nav=garage]"); await page.waitForTimeout(200);
await page.click("[data-up=straps]");
await page.click("[data-truck=van]"); await page.waitForTimeout(400);
log("bought", await page.evaluate(() => { const s = window.__snackHaul.save(); return { coins: s.coins, trucks: s.trucks, truck: s.truck, up: s.upgrades, achieved: Object.keys(s.achieved) }; }));
await page.click(".back"); await page.click("[data-nav=daily]"); await page.waitForTimeout(400);
log("daily", await page.evaluate(() => { const g = window.__snackHaul.state.game; return { id: g.delivery.id, truck: g.spec.id }; }));
await finish(4); await veilOn(); log("daily done", await sheet());
await page.click("[data-act=garage]"); await page.click(".back"); await page.waitForTimeout(200);
log("home daily", await page.evaluate(() => document.querySelector("[data-nav=daily]").innerText.replace(/\n/g, " | ")));
for (const q of ["low", "medium", "high", "auto"]) {
  await page.click("[data-nav=settings]"); await page.click(`[data-set=quality][data-val=${q}]`); await page.waitForTimeout(350); await page.click(".back");
}
log("quality", await page.evaluate(() => window.__snackHaul.world().stats()));
await page.click("[data-nav=goals]"); log("goals", await page.evaluate(() => document.querySelectorAll(".goal.done").length)); await page.click(".back");
await page.reload(); await page.waitForFunction(() => window.__snackHaul); await page.waitForTimeout(400);
log("after reload", await page.evaluate(() => { const s = window.__snackHaul.save(); return { truck: s.truck, stars: s.stars, coins: s.coins, deliveries: s.stats.deliveries }; }));
await browser.close();
console.log("errors:", errors.length ? errors : "none");
