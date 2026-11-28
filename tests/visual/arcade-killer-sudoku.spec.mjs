import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Killer Sudoku (2026-10-22). The puzzle banks and rules engine are generated
// from the Vol 3 app. These solve a puzzle through the page (with the bank's
// own stored solution, read from the shipped HTML), check a digit that breaks
// a rule is marked, that Notes don't fill the square, and that the daily is shared.

const html = fs.readFileSync("play/killer-sudoku/index.html", "utf8");
const E = new Function(html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI")) + "; return { EASY, MEDIUM, HARD };")();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});
const cell = (page, i) => page.locator("#ks-board .ks-cell").nth(i);

test("the first Easy puzzle solves through the page and keeps a best time", async ({ page }) => {
  await page.goto("/play/killer-sudoku/");
  await expect(page.locator("#ks-num")).toHaveText("1/24");
  const p = E.EASY[0], givens = new Set(p.givens.map(([i]) => i));
  for (let i = 0; i < 81; i++) {
    if (givens.has(i)) continue;
    await cell(page, i).click();
    await page.keyboard.press(String(p.solution[i]));
  }
  await expect(page.locator("#ks-status")).toContainText("Solved in");
  expect(await page.evaluate(() => +localStorage.getItem("sp_killersudoku_best_easy"))).toBeGreaterThanOrEqual(0);
  await expect(page.locator("#ks-best")).not.toHaveText("—");
  // Solving moves the level on to the next puzzle.
  await page.reload();
  await expect(page.locator("#ks-num")).toHaveText("2/24");
});

test("a digit that breaks a rule is marked and Notes do not fill the square", async ({ page }) => {
  await page.goto("/play/killer-sudoku/");
  // Repeat a given digit in its own row: that breaks a rule, so it is marked.
  const p = E.EASY[0], [g, gv] = p.givens[0], row = Math.floor(g / 9);
  const i = [...Array(9)].map((_, k) => row * 9 + k).find((k) => !p.givens.some(([x]) => x === k));
  await cell(page, i).click();
  await page.keyboard.press(String(gv));
  await expect(cell(page, i)).toHaveClass(/is-bad/);
  await page.keyboard.press("Backspace");
  await expect(cell(page, i)).not.toHaveClass(/is-bad/);
  await page.locator('[data-act="notes"]').click();
  await page.keyboard.press("5");
  await expect(cell(page, i)).toHaveAttribute("aria-label", /notes 5/);
  await expect(cell(page, i).locator(".ks-val")).toHaveText("");
});

test("the daily puzzle is the same for everyone", async ({ browser }) => {
  const seen = [];
  for (let k = 0; k < 2; k++) {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto("/play/killer-sudoku/?daily=2026-10-22");
    await expect(page.locator("#ks-status")).toContainText("Daily practice");
    seen.push(await page.locator("#ks-board .ks-sum").allTextContents());
    await ctx.close();
  }
  expect(seen[0].length).toBeGreaterThan(5);
  expect(seen[0]).toEqual(seen[1]);
});

test("only actual edits get undo steps, and resumed progress survives another visit", async ({ page }) => {
  await page.addInitScript(() => { window.SP_EVENTS_DEBUG = []; });
  await page.goto("/play/killer-sudoku/");
  await page.waitForFunction(() => window.__spGameEvents === true);
  const i = E.EASY[0].solution.findIndex((_, index) => !E.EASY[0].givens.some(([given]) => given === index));
  const digit = String(E.EASY[0].solution[i]);
  const undo = page.locator('#ks-pad [data-act="undo"]');
  const notes = page.locator('#ks-pad [data-act="notes"]');
  const events = () => page.evaluate(() => window.SP_EVENTS_DEBUG);
  await cell(page, i).click();
  await page.keyboard.press("Backspace");
  await expect(undo).toBeDisabled();
  await notes.click();
  await page.keyboard.press(digit);
  await expect(cell(page, i)).toHaveAttribute("aria-label", /notes/);
  await page.keyboard.press("Backspace");
  await expect(cell(page, i)).toHaveAttribute("aria-label", /empty/);
  expect(await events()).toEqual(["/arcade/killer-sudoku/start"]);
  await notes.click();
  await page.keyboard.press(digit);
  await page.keyboard.press(digit);
  await notes.click();
  await page.keyboard.press("1");
  await undo.click();
  await expect(cell(page, i).locator(".ks-val")).toHaveText("");
  await notes.click();
  await page.keyboard.press(digit);
  expect(await events()).toEqual(["/arcade/killer-sudoku/start", "/arcade/killer-sudoku/first-move"]);
  const options = page.locator('.sp-options-toggle');
  if (await options.isVisible()) await options.click();
  await page.locator('.seg [data-level="easy"]').click();
  await expect(cell(page, i).locator(".ks-val")).toHaveText(digit);
  for (let visit = 0; visit < 2; visit++) {
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await page.reload();
    await page.getByRole("button", { name: "Resume game" }).click();
    await expect(cell(page, i).locator(".ks-val")).toHaveText(digit);
  }
});
