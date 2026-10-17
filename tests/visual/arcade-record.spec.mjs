import { test, expect } from "@playwright/test";
import { openOptions } from "./helpers/options.mjs";

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
  await openOptions(page);
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

  await openOptions(page);

  // A different opponent keeps its own record.
  await page.locator('.seg [data-level="6"]').click();
  await expect(page.locator("#c-you"), "Hard starts from nothing").toHaveText("0");
  await expect(page.locator("#c-cpu")).toHaveText("0");

  // And switching back brings the Easy record with it.
  await page.locator('.seg [data-level="2"]').click();
  expect(await page.locator("#c-you").textContent()).toBe(you);
  expect(errors).toEqual([]);
});

// Checkers, Reversi and Penalty Shootout showed only live counts (pieces,
// discs, goals), so no result outlived the game. Each now keeps a W–L record
// per difficulty in its own chip. Play a real game to a result with the
// game's timers sped up, reload, and require the result to still be there.
async function fastTimers(page) {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a);
    // The once-a-day donation modal opens on a first win and covers the board.
    localStorage.setItem("sp_donate_shown_on", new Date().toISOString().slice(0, 10));
  });
}
const total = (t) => t.split("\u2013").reduce((n, x) => n + Number(x), 0);

test("checkers: a finished game is kept in the record", async ({ page }) => {
  test.setTimeout(120_000);
  await fastTimers(page);
  await page.goto("/play/checkers/");
  await expect(page.locator("#ck-record")).toHaveText("0\u20130");
  for (let k = 0; k < 300; k++) {
    const st = await page.locator("#ck-status").textContent();
    if (/wins|win!/i.test(st)) break;
    if (!/your move|move undone/i.test(st)) { await page.waitForTimeout(30); continue; }
    const pieces = await page.locator("#ck-board .ck-sq:has(.ck-piece.red)").all();
    for (const sq of pieces) {
      await sq.click();
      const moves = page.locator("#ck-board .ck-sq.move");
      if (await moves.count()) { await moves.first().click(); break; }
    }
  }
  await expect(page.locator("#ck-status")).toContainText(/win/i);
  expect(total(await page.locator("#ck-record").textContent())).toBe(1);
  await page.reload();
  expect(total(await page.locator("#ck-record").textContent())).toBe(1);
});

test("reversi: a finished game is kept in the record", async ({ page }) => {
  test.setTimeout(120_000);
  await fastTimers(page);
  await page.goto("/play/reversi/");
  for (let k = 0; k < 400; k++) {
    const st = await page.locator("#rv-status").textContent();
    if (/wins|tie/i.test(st)) break;
    const legal = page.locator("#rv-board .rv-sq.legal");
    if (await legal.count()) await legal.first().click(); else await page.waitForTimeout(30);
  }
  const st = await page.locator("#rv-status").textContent();
  expect(st).toMatch(/wins|tie/i);
  const expected = /tie/i.test(st) ? 0 : 1;
  expect(total(await page.locator("#rv-record").textContent())).toBe(expected);
  await page.reload();
  expect(total(await page.locator("#rv-record").textContent())).toBe(expected);
});

test("penalty-shootout: a shootout result is kept in the record", async ({ page }) => {
  test.setTimeout(120_000);
  await fastTimers(page);
  await page.goto("/play/penalty-shootout/");
  for (let k = 0; k < 200; k++) {
    if (/win/i.test(await page.locator("#pk-status").textContent())) break;
    const b = page.locator("#pk-pad button:not([disabled])");
    if (await b.count()) await b.first().click(); else await page.waitForTimeout(40);
  }
  await expect(page.locator("#pk-status")).toContainText(/win/i);
  expect(total(await page.locator("#pk-record").textContent())).toBe(1);
  await page.reload();
  expect(total(await page.locator("#pk-record").textContent())).toBe(1);
});
