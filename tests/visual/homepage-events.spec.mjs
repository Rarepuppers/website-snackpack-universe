import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/New_York" });

test("the homepage promotes Thanksgiving from a week before the fourth Thursday", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-19T04:59:00Z"));
  await page.goto("/");
  await expect(page.locator(".hero-card picture")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse holidays and events" })).toBeVisible();

  await page.clock.setFixedTime(new Date("2026-11-19T05:01:00Z"));
  await page.reload();
  const feature = page.getByRole("link", { name: /Thanksgiving at the Harvest Table/ });
  await expect(feature).toBeVisible();
  await feature.click();
  await expect(page).toHaveURL(/\/read\/events\/thanksgiving\/$/);
  await expect(page.getByRole("heading", { name: "Thanksgiving stories" })).toBeVisible();
  await page.getByRole("link", { name: "Everybody Brought Potatoes", exact: true }).click();
  const next = page.locator(".story-next").filter({ hasText: "Next Thanksgiving story" });
  await next.getByRole("link", { name: /Corgi-on-the-Cob and the Harvest Table/ }).click();
  await expect(page.locator(".story-next").filter({ hasText: "Next Thanksgiving story" })).toHaveCount(0);
});

test("the hero changes at local midnight in an open tab even with Classic selected", async ({ page }) => {
  const beforeMidnight = new Date("2026-12-02T04:59:55Z");
  await page.clock.install({ time: beforeMidnight });
  await page.clock.pauseAt(beforeMidnight);
  await page.addInitScript(() => localStorage.setItem("snackpack.seasonal-appearance.v1", "classic"));
  await page.goto("/");
  await expect(page.locator("[data-home-feature='thanksgiving']")).toBeVisible();
  await expect(page.locator("[data-home-feature='christmas']")).toBeHidden();

  await page.clock.fastForward(6_000);
  await expect(page.locator("[data-home-feature='thanksgiving']")).toBeHidden();
  const christmas = page.getByRole("link", { name: /Christmas in the Woods/ });
  await expect(christmas).toBeVisible();
  await christmas.click();
  await expect(page).toHaveURL(/\/read\/events\/christmas\/$/);
});

test("the active banner fits at 320px and 200% text on dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.clock.setFixedTime(new Date("2027-11-18T18:00:00Z"));
  await page.addInitScript(() => localStorage.setItem("snackpack.theme.v1", "dark"));
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const banner = page.getByRole("link", { name: /Thanksgiving at the Harvest Table/ });
  await expect(banner).toBeVisible();
  await banner.focus();
  await expect(banner).toBeFocused();
  expect(await banner.evaluate(element => element.scrollWidth <= element.clientWidth + 1
    && document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the studio art and holiday bookshelf link are available", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero-card picture")).toBeVisible();
    await expect(page.locator(".home-event-feature:visible")).toHaveCount(0);
    await page.getByRole("link", { name: "Browse holidays and events" }).click();
    await expect(page).toHaveURL(/\/read\/events\/$/);
  });
});
