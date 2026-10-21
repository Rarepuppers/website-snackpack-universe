import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Thirteen difficulty (2026-10-21). The page had one opponent strength — the
// shared app policy — so a newcomer met the hardest CPU first. Easy / Normal /
// Sharp now differ, and each keeps its own record.
//
// The ordering test runs the page's own engine and level functions (sliced out
// of the shipped HTML, not re-implemented) for seeded four-player games with a
// Sharp-strategy player in seat 0.

const html = fs.readFileSync("play/thirteen/index.html", "utf8");

function pageEngine(seed) {
  const engine = html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI"));
  const levels = html.slice(html.indexOf("  function cpuEasyPlay"), html.indexOf("  var recordEl"));
  expect(engine.length).toBeGreaterThan(1000);
  expect(levels).toContain("function cpuLevelPlay");
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const SeededMath = Object.assign(Object.create(Math), { random: rnd });
  return new Function("Math", "location", engine + "\nvar level;\n" + levels +
    "; return { initialState, applyPlay, applyPass, cpuChoosePlay, cpuLevelPlay, setLevel: function (l) { level = l; } };")(SeededMath, { search: "" });
}

function winRate(E, lvl, games) {
  E.setLevel(lvl);
  let won = 0;
  for (let g = 0; g < games; g++) {
    const st = E.initialState(g % 2 ? "classic" : "standard");
    for (let t = 0; t < 2000 && st.phase === "playing"; t++) {
      const i = st.currentPlayer;
      const play = i === 0 ? E.cpuChoosePlay(st, i) : E.cpuLevelPlay(st, i);
      if (play === "pass") {
        if (!st.lastCombo || st.lastPlayerIdx === i) throw new Error(`${lvl}: passed while leading`);
        E.applyPass(st, i);
      } else E.applyPlay(st, i, play);
    }
    expect(st.phase, `${lvl} game ${g} finished`).toBe("gameover");
    if (st.winner === 0) won++;
  }
  return won / games;
}

test("Easy, Normal and Sharp are clearly different opponents", () => {
  const E = pageEngine(20261021), N = 800;
  const easy = winRate(E, "easy", N), normal = winRate(E, "normal", N), sharp = winRate(E, "sharp", N);
  console.log(`Sharp-strategy player wins: easy ${(easy * 100).toFixed(1)}%, normal ${(normal * 100).toFixed(1)}%, sharp ${(sharp * 100).toFixed(1)}%`);
  expect(easy - normal).toBeGreaterThan(0.05);
  expect(normal - sharp).toBeGreaterThan(0.02);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a);
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

test("a game on Easy plays to a result, lands in Easy's record, and the level is remembered", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/play/thirteen/");
  await expect(page.locator('.seg [data-level="normal"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('.seg [data-level="easy"]').evaluate((b) => b.click());
  await expect(page.locator('.seg [data-level="easy"]')).toHaveAttribute("aria-pressed", "true");
  const status = page.locator("#t-status");
  for (let k = 0; k < 4000; k++) {
    if (/win/.test(await status.textContent())) break;
    if (!(await page.locator("#t-play").isDisabled()) || !(await page.locator("#t-pass").isDisabled()) || /Your move/.test(await status.textContent())) {
      // Our turn: pass if we may, else lead the lowest card (3♠ on the first turn).
      if (!(await page.locator("#t-pass").isDisabled())) { await page.locator("#t-pass").click(); continue; }
      const spade3 = page.locator('#t-hand [aria-label="3 of spades"]');
      await ((await spade3.count()) ? spade3 : page.locator("#t-hand .th-card").first()).click();
      if (!(await page.locator("#t-play").isDisabled())) await page.locator("#t-play").click();
      continue;
    }
    await page.waitForTimeout(10);
  }
  await expect(status).toContainText(/win/);
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem("sp_thirteen_record_easy")));
  expect(rec.won + rec.lost).toBe(1);
  expect(await page.locator("#t-record").textContent()).toBe(`${rec.won}–${rec.lost}`);
  await page.reload();
  await expect(page.locator('.seg [data-level="easy"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#t-record")).toHaveText(`${rec.won}–${rec.lost}`);
  // Other levels keep their own record.
  await page.locator('.seg [data-level="sharp"]').evaluate((b) => b.click());
  await expect(page.locator("#t-record")).toHaveText("0–0");
});

test("the rules table's Classic claims match the engine", () => {
  const E = (() => {
    const engine = html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI"));
    return new Function("location", engine + "; return { rankValue, identifyCombo, canBeat };")({ search: "" });
  })();
  const c = (value, suit = 0) => ({ value, suit, id: value + "-" + suit });
  // Highest card: 2 in Standard, Ace in Classic (the 2 is the lowest).
  expect(E.rankValue(c(2), "standard")).toBeGreaterThan(E.rankValue(c(1), "standard"));
  expect(E.rankValue(c(2), "classic")).toBeLessThan(E.rankValue(c(3), "classic"));
  expect(E.rankValue(c(1), "classic")).toBeGreaterThan(E.rankValue(c(13), "classic"));
  // 2s in runs: never in Standard, allowed in Classic.
  expect(E.identifyCombo([c(2), c(3, 1), c(4, 2)], "standard")).toBeNull();
  expect(E.identifyCombo([c(2), c(3, 1), c(4, 2)], "classic")?.type).toBe("sequence");
  // Bombs chop 2s in Standard only.
  const two = E.identifyCombo([c(2, 3)], "standard");
  const pairs = [c(6), c(6, 1), c(7, 2), c(7, 3), c(8), c(8, 1)];
  expect(E.canBeat(E.identifyCombo(pairs, "standard"), two, "standard")).toBe(true);
  expect(E.canBeat(E.identifyCombo(pairs, "classic"), E.identifyCombo([c(1, 3)], "classic"), "classic")).toBe(false);
  // The page says so.
  expect(html).toContain("the 2 is the <em>lowest</em>");
});

test("the hub's Featured order leads with the games people search for", async ({ page }) => {
  await page.goto("/play/");
  const first = await page.locator(".game-grid .game-tile").evaluateAll((ts) => ts.filter((t) => !t.closest("[hidden]")).slice(0, 5).map((t) => t.getAttribute("href")));
  expect(first.map((h) => h.replace(/^\.?\/?(play\/)?|\/$/g, ""))).toEqual(["thirteen", "2048", "minesweeper", "snacky-worm", "solitaire"]);
});
