import { test, expect } from "@playwright/test";
import { openOptions } from "./helpers/options.mjs";

test.beforeEach(async ({ page }) => {
  await page.route("https://**/*", route => route.abort());
});

test("Solitaire can reopen and restart deal 2167 in either draw mode", async ({ page }) => {
  await page.goto("/play/solitaire/?deal=2167");
  const deal = page.locator("#sol-deal");
  const board = page.locator("#sol-tableau-row");
  await expect(deal).toHaveText("2167");
  const opening = await board.textContent();
  await openOptions(page);
  await page.locator('[data-draw="3"]').click();
  await expect(deal).toHaveText("2167");
  await expect(board).toHaveText(opening);
  await page.locator('#sol-stock [data-act="draw"]').click();
  await expect(page.locator("#sol-waste .sol-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Restart deal" }).click();
  await expect(deal).toHaveText("2167");
  await expect(board).toHaveText(opening);
  await expect(page.locator("#sol-waste .sol-card")).toHaveCount(0);
});

test("FreeCell checks the board for the chosen difficulty and keeps the four-cell Daily", async ({ page }) => {
  // Daily 0 was deal 1 for every mode before reduced-cell verification.
  await page.goto("/play/freecell/?daily=0");
  const deal = page.locator("#fc-deal");
  await expect(deal).toHaveText("1");
  await openOptions(page);
  await page.getByRole("button", { name: "1 cell", exact: true }).click();
  await expect(deal).toHaveText("13");
  await expect(page.locator("#fc-verified")).toHaveText("This starting deal was solved with 1 free cell.");
  await page.getByRole("button", { name: "Restart deal" }).click();
  await expect(deal).toHaveText("13");
  await page.goto("/play/freecell/?daily=0&cells=1");
  await expect(deal).toHaveText("13");
  await openOptions(page);
  await expect(page.getByRole("button", { name: "1 cell", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "2 cells", exact: true }).click();
  await expect(deal).toHaveText("2");
  await page.getByRole("button", { name: "4 cells", exact: true }).click();
  await expect(deal).toHaveText("1");
});

test("Jump back in restores the saved Solitaire draw mode", async ({ page }) => {
  await page.goto("/play/solitaire/?deal=2167&draw=3");
  await page.locator('#sol-stock [data-act="draw"]').click();
  await expect(page.locator("#sol-waste .sol-card")).toHaveCount(3);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    localStorage.setItem("sp_solitaire_pref_draw", "1");
  });

  await page.goto("/play/");
  const recent = page.locator(".arcade-recent-grid a").filter({ hasText: "Solitaire" });
  await expect(recent).toContainText("Resume saved game");
  await expect(recent).toHaveAttribute("href", /\/play\/solitaire\/\?draw=3$/);
  await recent.click();
  await expect(page.locator('[data-draw="3"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(page.locator("#sol-deal")).toHaveText("2167");
  await expect(page.locator("#sol-waste .sol-card")).toHaveCount(3);
});

test("Jump back in opens the saved FreeCell Daily and ignores expired saves", async ({ page }) => {
  await page.goto("/play/freecell/?daily=0&cells=1");
  await page.locator('#fc-cascades [data-type="cascade"][data-i="0"] .fc-card').last().click();
  await page.locator('#fc-top [data-type="free"][data-i="0"]').click();
  await expect(page.locator("#fc-moves")).toHaveText("1");
  await page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    localStorage.setItem("sp_freecell_pref_cells", "4");
  });

  await page.goto("/play/");
  const recent = page.locator(".arcade-recent-grid a").filter({ hasText: "FreeCell" });
  await expect(recent).toHaveAttribute("href", /\/play\/freecell\/\?daily=0&cells=1$/);
  await recent.click();
  await expect(page.locator('[data-cells="1"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(page.locator("#fc-moves")).toHaveText("1");

  await page.goto("/play/");
  await page.evaluate(() => {
    const key = "sp_freecell_save_daily_0_cells_1";
    const saved = JSON.parse(localStorage.getItem(key));
    saved.updatedAt -= 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await expect(recent).toHaveText(/Play again/);
  await expect(recent).toHaveAttribute("href", /\/play\/freecell\/$/);
});
