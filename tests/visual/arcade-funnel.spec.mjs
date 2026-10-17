import { test, expect } from "@playwright/test";

// The donation modal is shown at most once a day, stamped in
// sp_donate_shown_on. The stamp used to be the UTC date, so for anyone west of
// Greenwich "once a day" rolled over mid-evening. 20:00 in Los Angeles is
// already tomorrow in UTC: the stamp must still say today.

test.use({ timezoneId: "America/Los_Angeles" });

test("the once-a-day modal is stamped with the player's local date", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-17T20:00:00-07:00"));
  await page.goto("/play/2048/");
  await page.evaluate(() => { localStorage.removeItem("sp_donate_shown_on"); window.SnackPack.celebrate({ delay: 0 }); });
  await expect(page.locator(".sp-modal-backdrop")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("sp_donate_shown_on"))).toBe("2026-10-17");
});
