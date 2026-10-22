import { test, expect } from "@playwright/test";

// Brick Breaker (2026-10-22). The engine is generated from the Vol 2 app; an
// autopilot simulation of it lives with the plan. These check the page: the
// keys move the paddle, Pause freezes the field, and a game ends through the
// page with the result shown.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

const frame = (page) => page.locator("#bb-canvas").evaluate((c) => c.toDataURL());
// Brightness of the paddle row, left half vs right half, from the canvas itself.
const paddleSide = (page) => page.locator("#bb-canvas").evaluate((c) => {
  const d = c.getContext("2d").getImageData(0, 520, c.width, 6).data;
  let left = 0, right = 0;
  for (let i = 0; i < d.length; i += 4) { const x = (i / 4) % c.width; const v = d[i] + d[i + 1] + d[i + 2]; if (x < c.width / 2) left += v; else right += v; }
  return right - left;
});

test("the arrow keys move the paddle and Pause freezes the field", async ({ page }) => {
  await page.goto("/play/brick-breaker/");
  await page.locator("#bb-start").click();
  const centred = await paddleSide(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowRight");
  expect(await paddleSide(page)).toBeGreaterThan(centred);
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await page.locator("#sp-pause").click();
  const a = await frame(page);
  await page.waitForTimeout(700);
  expect(await frame(page)).toBe(a);
});

test("a still paddle loses every life and the page ends the game", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/play/brick-breaker/");
  await page.locator('.seg [data-mode="expert"]').evaluate((b) => b.click());
  await expect(page.locator("#bb-lives")).toHaveText("2");
  await page.locator("#bb-start").click();
  await expect(page.locator("#bb-status")).toContainText(/Game over|Wall cleared/, { timeout: 60_000 });
  await expect(page.locator("#bb-lives")).toHaveText("0");
  await expect(page.locator("#bb-start")).toHaveText("Play again");
  await expect(page.locator("#bb-start")).toBeVisible();
});

test("on a phone, Start brings the whole field and paddle on screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/play/brick-breaker/");
  await page.locator("#bb-start").click();
  await expect.poll(async () => {
    const r = await page.locator("#bb-canvas").boundingBox();
    return r.y >= -1 && r.y + r.height <= 813; // 1 px for sub-pixel layout
  }).toBe(true);
});
