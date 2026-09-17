import { test, expect } from "@playwright/test";

// Persisted results.
//
// check-new-game.mjs reported 17 games as persisting no best result. Most of
// that was the checker: its pattern wanted bestKey or _best_, so it missed the
// BEST_KEY constant these games actually use, and 2048 was failing while
// plainly storing sp_2048_best. With the pattern fixed, four real gaps were
// left, of which Connect 4 was the one already showing a tally on screen that
// simply never survived a reload.

// Win/loss record: it was on screen but only for the life of the tab.
test("connect-4: the win record survives a reload and is per opponent", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/connect-4/");
  await expect(page.locator("#c-you")).toHaveText("0");

  // Play Easy out to a result. Every column is disabled while the computer
  // thinks, and stays disabled once the game ends, so the loop has to wait for
  // "my turn again, or over" rather than for a column on its own — otherwise
  // the last CPU move looks identical to a stall.
  await page.locator('.seg [data-level="2"]').click();
  const turnState = () => page.evaluate(() => ({
    open: [...document.querySelectorAll(".c4-col-btn")].filter((b) => !b.disabled).map((b) => b.dataset.col),
    over: /win|draw|four in a row/i.test(document.getElementById("c-status").textContent)
  }));

  for (let i = 0; i < 45; i++) {
    await expect.poll(async () => {
      const s = await turnState();
      return s.over || s.open.length > 0;
    }, { timeout: 8000 }).toBe(true);
    const s = await turnState();
    if (s.over) break;
    await page.locator(`.c4-col-btn[data-col="${s.open[0]}"]`).click();
  }
  await expect(page.locator("#c-status")).toContainText(/win|draw|four in a row/i, { timeout: 8000 });

  const you = await page.locator("#c-you").textContent();
  const cpu = await page.locator("#c-cpu").textContent();
  expect(Number(you) + Number(cpu), "a result was recorded").toBeGreaterThan(0);

  await page.reload();
  expect(await page.locator("#c-you").textContent(), "record survived the reload").toBe(you);
  expect(await page.locator("#c-cpu").textContent()).toBe(cpu);

  // A different opponent keeps its own record.
  await page.locator('.seg [data-level="6"]').click();
  await expect(page.locator("#c-you"), "Hard starts from nothing").toHaveText("0");
  await expect(page.locator("#c-cpu")).toHaveText("0");

  // And switching back brings the Easy record with it.
  await page.locator('.seg [data-level="2"]').click();
  expect(await page.locator("#c-you").textContent()).toBe(you);
  expect(errors).toEqual([]);
});
