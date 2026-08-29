import { test, expect } from "@playwright/test";

async function fresh(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

async function expectResumeAfterReload(page) {
  await page.waitForTimeout(750);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Resume game" })).toBeVisible();
}

test("Solitaire offers a saved game after drawing", async ({ page }) => {
  await fresh(page, "/play/solitaire/");
  await page.locator('#sol-stock [data-act="draw"]').click();
  await expectResumeAfterReload(page);
});

test("Spider Solitaire offers a saved game after dealing", async ({ page }) => {
  await fresh(page, "/play/spider-solitaire/");
  await page.locator("#spi-stock").click();
  await expectResumeAfterReload(page);
});

test("FreeCell offers a saved game after a legal move", async ({ page }) => {
  await fresh(page, "/play/freecell/");
  await page.locator('#fc-cascades [data-type="cascade"][data-i="0"] .fc-card').last().click();
  await page.locator('#fc-top [data-type="free"][data-i="0"]').click();
  await expectResumeAfterReload(page);
});

test("Thirteen offers a saved game after play advances", async ({ page }) => {
  await fresh(page, "/play/thirteen/");
  await page.waitForTimeout(1800);
  const selectable = page.locator("#t-hand .th-card").first();
  if (await selectable.isEnabled()) await selectable.click();
  await expectResumeAfterReload(page);
});
