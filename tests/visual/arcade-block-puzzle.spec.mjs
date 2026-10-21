import { test, expect } from "@playwright/test";

// Block Puzzle (2026-10-22): a whole Classic game through the page — pick a
// block from the tray, tap a square it fits on — to game over, with the best
// score kept; the daily blocks are shared; Timed pauses its clock.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

// Read the board and tray from the DOM, as a player would see them.
async function view(page) {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll("#bp-board .bp-cell")];
    const size = Math.round(Math.sqrt(cells.length));
    const filled = cells.map((c) => c.classList.contains("is-filled"));
    const tray = [...document.querySelectorAll("#bp-tray .bp-piece")].map((b) => {
      const mini = b.querySelector(".bp-mini");
      if (!mini) return null;
      const w = +mini.style.gridTemplateColumns.match(/repeat\((\d+)/)[1];
      return [...mini.children].map((s, i) => (s.classList.contains("is-off") ? null : [Math.floor(i / w), i % w])).filter(Boolean);
    });
    return { size, filled, tray, status: document.getElementById("bp-status").textContent };
  });
}
function firstFit(v) {
  for (let k = 0; k < 3; k++) {
    const shape = v.tray[k]; if (!shape) continue;
    for (let r = 0; r < v.size; r++) for (let c = 0; c < v.size; c++) {
      if (shape.every(([dr, dc]) => r + dr < v.size && c + dc < v.size && !v.filled[(r + dr) * v.size + c + dc])) return { k, i: r * v.size + c };
    }
  }
  return null;
}

test("a Classic game plays to game over through the page and keeps the best score", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/play/block-puzzle/");
  await expect(page.locator("#bp-board .bp-cell")).toHaveCount(64);
  // The clock is Timed-only (the chip once showed 0:00 in Classic).
  await expect(page.locator("#bp-time-chip")).toBeHidden();
  let placed = 0, cleared = 0;
  for (let k = 0; k < 400; k++) {
    const v = await view(page);
    if (/Final score/.test(v.status)) break;
    const move = firstFit(v);
    expect(move, "the page must end the game when nothing fits").not.toBeNull();
    await page.locator("#bp-tray .bp-piece").nth(move.k).click();
    await page.locator("#bp-board .bp-cell").nth(move.i).click();
    placed++;
    if (/Cleared/.test(await page.locator("#bp-status").textContent())) cleared++;
  }
  await expect(page.locator("#bp-status")).toContainText("Final score");
  const score = +(await page.locator("#bp-score").textContent());
  expect(score).toBeGreaterThanOrEqual(placed);
  console.log(`placed ${placed} blocks, ${cleared} clears, score ${score}`);
  expect(await page.evaluate(() => +localStorage.getItem("sp_blockpuzzle_best_8"))).toBe(score);
  await page.reload();
  await expect(page.locator("#bp-best")).toHaveText(String(score));
});

test("a block that does not fit is refused and the board is unchanged", async ({ page }) => {
  await page.goto("/play/block-puzzle/");
  const v = await view(page);
  // The bottom-right square cannot take any block wider or taller than one square.
  const k = v.tray.findIndex((s) => s && s.length > 1);
  test.skip(k < 0, "the first tray was three single squares");
  await page.locator("#bp-tray .bp-piece").nth(k).click();
  await page.locator("#bp-board .bp-cell").nth(63).click();
  await expect(page.locator("#bp-status")).toContainText("doesn't fit");
  expect((await view(page)).filled.filter(Boolean)).toHaveLength(0);
});

test("the daily puzzle deals the same blocks to everyone", async ({ browser }) => {
  const trays = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/play/block-puzzle/?daily=2026-10-22");
    trays.push(JSON.stringify((await view(page)).tray));
    await ctx.close();
  }
  expect(trays[0]).toBe(trays[1]);
});

test("Timed counts down and stops while paused", async ({ page }) => {
  await page.goto("/play/block-puzzle/");
  await page.locator('.seg [data-mode="timed"]').evaluate((b) => b.click());
  await expect(page.locator("#bp-time-chip")).toBeVisible();
  await page.waitForTimeout(1600);
  const running = await page.locator("#bp-time").textContent();
  expect(running).not.toBe("2:00");
  await page.locator("#sp-pause").click();
  const frozen = await page.locator("#bp-time").textContent();
  await page.waitForTimeout(1600);
  await expect(page.locator("#bp-time")).toHaveText(frozen);
});
