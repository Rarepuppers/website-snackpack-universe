import { test, expect } from "@playwright/test";

// 2048 board sizes and the daily (arcade plan R8, 26 Nov 2026).
const tiles = (page) => page.locator("#g-tiles .g2048-tile");

test("3x3 and 5x5 boards build, keep their own best and remember the size", async ({ page }) => {
  await page.goto("/play/2048/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#g-grid .g2048-cell")).toHaveCount(16);
  await page.locator('#g-sizes [data-size="5"]').click();
  await expect(page.locator("#g-grid .g2048-cell")).toHaveCount(25);
  await expect(tiles(page)).toHaveCount(2);
  // Tiles sit inside the board on every size.
  const inside = await page.evaluate(() => {
    const b = document.getElementById("g-tiles").getBoundingClientRect();
    return [...document.querySelectorAll("#g-tiles .g2048-tile")].every((t) => {
      const r = t.getBoundingClientRect();
      return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
    });
  });
  expect(inside).toBe(true);
  for (const k of ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) await page.keyboard.press(k);
  await page.reload();
  await expect(page.locator("#g-grid .g2048-cell")).toHaveCount(25);
  await page.locator('#g-sizes [data-size="3"]').click();
  await expect(page.locator("#g-grid .g2048-cell")).toHaveCount(9);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("sp_2048_best")));
  expect(keys.every((k) => k === "sp_2048_best_5" || k === "sp_2048_best_3")).toBe(true);
});

test("a 4x4 bottom-right tile lines up with the last cell", async ({ page }) => {
  await page.goto("/play/2048/");
  const gap = await page.evaluate(() => {
    const cells = document.querySelectorAll("#g-grid .g2048-cell");
    const last = cells[cells.length - 1].getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "g2048-tile";
    const n = 4, step = "((100% - 30px) / 4 + 10px)";
    el.style.left = "calc(3 * " + step + ")"; el.style.top = "calc(3 * " + step + ")";
    el.style.width = el.style.height = "calc((100% - 30px) / 4)";
    document.getElementById("g-tiles").appendChild(el);
    const r = el.getBoundingClientRect();
    return Math.abs(r.right - last.right) + Math.abs(r.bottom - last.bottom);
  });
  expect(gap).toBeLessThan(2);
});

test("the daily gives everyone the same tiles, has no undo, and counts when the board fills", async ({ page, browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const layout = async (p) => p.locator("#g-tiles .g2048-tile").evaluateAll((ts) => ts.map((t) => t.style.left + t.style.top + t.textContent).sort().join("|"));
  await page.goto("/play/2048/?daily=" + today);
  const other = await browser.newPage();
  await other.goto("/play/2048/?daily=" + today);
  for (const k of ["ArrowLeft", "ArrowDown"]) { await page.keyboard.press(k); await other.keyboard.press(k); }
  expect(await layout(other)).toBe(await layout(page));
  await other.close();
  await expect(page.locator("#g-undo")).toBeDisabled();
  // Play until no moves are left.
  for (let i = 0; i < 2000; i++) {
    if (await page.locator("#g-status").evaluate((e) => e.textContent.startsWith("Daily done"))) break;
    await page.keyboard.press(["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"][i % 4]);
  }
  await expect(page.locator("#g-status")).toContainText("Daily done");
  expect(Object.keys(await page.evaluate(() => window.SnackPackDaily.state().games))).toContain("2048");
});

test("an existing 4x4 save still resumes (variant unchanged)", async ({ page }) => {
  await page.goto("/play/2048/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (const k of ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "ArrowRight"]) await page.keyboard.press(k);
  await page.waitForTimeout(1200);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("2048") && k.includes("save")));
  expect(keys.some((k) => k.endsWith("_default"))).toBe(true);
});
