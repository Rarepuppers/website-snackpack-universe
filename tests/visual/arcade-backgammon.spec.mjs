import { test, expect } from "@playwright/test";

// Backgammon (2026-10-17): a whole game through the page's own buttons —
// roll, pick a highlighted checker, pick a highlighted destination — to a
// result, then the record survives a reload. Timers are sped up.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a);
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

test("a game against the computer plays to a result and is recorded", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/play/backgammon/");
  await page.locator('.seg [data-level="beginner"]').evaluate((b) => b.click());
  // Checkers are drawn (they once collapsed to zero size).
  const chk = await page.locator(".bg-board .bg-chk").first().boundingBox();
  expect(chk.width).toBeGreaterThan(10);
  for (let k = 0; k < 6000; k++) {
    if (/wins|You win/.test(await page.locator("#bg-status").textContent())) break;
    if (await page.locator("#bg-roll").isEnabled()) { await page.locator("#bg-roll").click(); continue; }
    const dst = page.locator(".bg-board .is-dest");
    if (await dst.count()) { await dst.first().click(); continue; }
    const src = page.locator(".bg-board .is-source:not(.is-picked)");
    if (await src.count()) { await src.first().click(); continue; }
    await page.waitForTimeout(10);
  }
  await expect(page.locator("#bg-status")).toContainText(/wins|You win/);
  const [won, lost] = (await page.locator("#bg-record").textContent()).split("–").map(Number);
  expect(won + lost).toBe(1);
  await page.reload();
  const again = (await page.locator("#bg-record").textContent()).split("–").map(Number);
  expect(again[0] + again[1]).toBe(1);
});

test("the daily game rolls the same dice for everyone", async ({ browser }) => {
  const rolls = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/play/backgammon/?daily=2026-10-17");
    await page.locator("#bg-roll").click();
    rolls.push(await page.locator("#bg-dice [aria-label]").evaluateAll((ds) => ds.map((d) => d.getAttribute("aria-label")).join(" ")));
    await ctx.close();
  }
  expect(rolls[0]).toBe(rolls[1]);
});
