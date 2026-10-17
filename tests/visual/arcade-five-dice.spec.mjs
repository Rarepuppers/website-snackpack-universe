import { test, expect } from "@playwright/test";

// Five Dice (2026-10-17): play real games through the page's own buttons.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 10), ...a);
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

// One human turn: roll, hold the most common face, roll again, score the best box.
async function humanTurn(page) {
  await page.locator("#fd-roll").click();
  const faces = await page.locator(".fd-die").evaluateAll((ds) => ds.map((d) => +d.getAttribute("aria-label").match(/: (\d)/)[1]));
  const count = {}; faces.forEach((f) => { count[f] = (count[f] || 0) + 1; });
  const best = +Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  for (let i = 0; i < 5; i++) if (faces[i] === best) await page.locator(".fd-die").nth(i).click();
  await page.locator("#fd-roll").click();
  const values = await page.locator(".fd-box.is-open").evaluateAll((bs) => bs.map((b) => +b.textContent));
  await page.locator(".fd-box.is-open").nth(values.indexOf(Math.max(...values))).click();
}

test("a solo game runs 13 turns, and the best score survives a reload", async ({ page }) => {
  await page.goto("/play/five-dice/");
  for (let t = 0; t < 13; t++) await humanTurn(page);
  await expect(page.locator("#fd-status")).toContainText("Final score");
  const total = await page.locator("#fd-you").textContent();
  await page.reload();
  await expect(page.locator("#fd-best")).toHaveText(total);
});

test("a game against the computer finishes and is kept in the record", async ({ page }) => {
  await page.goto("/play/five-dice/");
  await page.locator('.seg [data-mode="cpu"]').evaluate((b) => b.click());
  for (let t = 0; t < 13; t++) {
    await expect(page.locator("#fd-roll")).toBeEnabled({ timeout: 10_000 });
    await humanTurn(page);
  }
  await expect(page.locator("#fd-status")).toContainText(/win|tie/i, { timeout: 10_000 });
  const tie = /tie/i.test(await page.locator("#fd-status").textContent());
  const [won, lost] = (await page.locator("#fd-best").textContent()).split("–").map(Number);
  expect(won + lost).toBe(tie ? 0 : 1);
});

test("the daily game deals everyone the same dice", async ({ browser }) => {
  const firstRolls = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/play/five-dice/?daily=2026-10-17");
    await page.locator("#fd-roll").click();
    firstRolls.push(await page.locator(".fd-die").evaluateAll((ds) => ds.map((d) => d.getAttribute("aria-label")).join(" | ")));
    await ctx.close();
  }
  expect(firstRolls[0]).toBe(firstRolls[1]);
});
