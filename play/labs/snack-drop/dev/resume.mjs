// Resume check: play a few drops, close the tab, open the page again, and the
// menu offers Continue, which brings back the same score, snacks and queue.
// Also checks the prototype's old save keys are carried into sp_snackdrop_v1.
//   node play/labs/snack-drop/dev/resume.mjs
import { open } from "./browser.mjs";

const { page, ctx, base, errors, close } = await open();
let fail = 0;
const ok = (cond, what) => { console.log((cond ? "ok   " : "FAIL ") + what); if (!cond) fail++; };

// An old-style best from the prototype must survive the move to one save key.
await page.goto(base);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem("sp_snackdrop_best", "1234"); });
await page.goto(base);
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.game);
ok(await page.evaluate(() => window.__snackdrop.save.bests["pantry:classic"].score === 1234), "old best carried into sp_snackdrop_v1");

await page.click("text=Play");
for (const x of [120, 300, 200, 160, 260, 220]) { await page.mouse.click(x, 400); await page.waitForTimeout(900); }
await page.waitForTimeout(1500);
const before = await page.evaluate(() => { const g = window.__snackdrop.game; return { score: g.score, drops: g.drops, n: g.snacks.length, current: g.current, next: g.next }; });
// Leaving the page (switching app, closing the tab) saves the game.
await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sp_snackdrop_v1")).resume);
ok(saved && saved.snap.drops === before.drops, `game saved on hide (${saved && saved.snap.drops} drops)`);

const page2 = await ctx.newPage();
page2.on("pageerror", (e) => errors.push(String(e)));
await page2.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.close();
await page2.goto(base);
await page2.waitForFunction(() => window.__snackdrop && window.__snackdrop.game);
ok(await page2.isVisible("text=Continue"), "menu offers Continue");
await page2.click("text=Continue");
await page2.waitForTimeout(100);
const after = await page2.evaluate(() => { const g = window.__snackdrop.game; return { score: g.score, drops: g.drops, n: g.snacks.length, current: g.current, next: g.next }; });
ok(JSON.stringify(after) === JSON.stringify(before), `same game back: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
await page2.mouse.click(200, 400); await page2.waitForTimeout(800);
ok(await page2.evaluate(() => window.__snackdrop.game.drops) === before.drops + 1, "can keep dropping");

console.log(errors.length ? "errors:\n" + errors.join("\n") : "no page errors");
await close();
process.exit(fail || errors.length ? 1 : 0);
