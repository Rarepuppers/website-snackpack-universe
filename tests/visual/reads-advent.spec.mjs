import fs from "node:fs";
import { expect, test } from "@playwright/test";

const slug = "twenty-four-letters-before-christmas";
const url = `/read/${slug}/`;
const registry = JSON.parse(fs.readFileSync(new URL("../../data/web-originals.json", import.meta.url)));
test.skip(!registry[slug], "The Advent book is awaiting publication");
test.use({ timezoneId: "Australia/Sydney", viewport: { width: 390, height: 844 } });

for (const [day, open, today] of [
  ["2027-11-20", 0, 0],
  ["2027-12-01", 1, 1],
  ["2027-12-12", 12, 12],
  ["2027-12-24", 24, 24],
  ["2027-12-25", 24, 0],
  ["2027-07-01", 24, 0],
]) {
  test(`local ${day} has ${open} days available`, async ({ page }) => {
    // Half past midnight in Sydney is still the previous day in UTC.
    await page.clock.setFixedTime(new Date(`${day}T00:30:00+${day.includes("-07-") ? "10" : "11"}:00`));
    await page.goto("/read/events/christmas/");
    const board = page.locator("[data-advent-calendar]");
    await expect(board.locator("[data-advent-tile]")).toHaveCount(24);
    await expect(board.locator("[data-advent-locked]")).toHaveCount(24 - open);
    await expect(board.locator('[aria-current="date"]')).toHaveCount(Number(today > 0));
    if (today) await expect(board.getByRole("link", { name: `Day ${today}, today` })).toBeVisible();
    const jump = open < 24 ? open + 1 : 24;
    const tile = board.locator(`a[href$="#page-${jump}"]`);
    if (open < 24) await expect(tile).toHaveAccessibleName(`Day ${jump} opens on ${jump} December`);
    await tile.click();
    await expect(page).toHaveURL(new RegExp(`/read/${slug}/#page-${jump}$`));
    await expect(page.locator(".story-page-card .story-page-copy:visible")).toHaveCount(open);
    await expect(page.locator("#page-24 .story-page-copy")).toBeAttached();
    if (open < 24) {
      await expect(page.locator(`#page-${jump}`)).toBeVisible();
      await expect(page.locator(`#page-${jump}`)).toHaveText(new RegExp(`Day ${jump} opens on ${jump} December`));
      await expect(page.locator(`#page-${jump} .story-page-copy`)).toBeHidden();
    }
    await page.goto(url);
    await page.getByRole("button", { name: "One page at a time" }).click();
    await expect(page.locator(".reader-bar-label")).toHaveText(`Page ${Math.max(1, open)} of 24`);
  });
}

test("read-ahead reveals future days and the saved open page takes priority", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-12-12T04:00:00Z"));
  await page.goto(url);
  await page.getByText("For grown-ups", { exact: true }).click();
  const readAhead = page.getByRole("button", { name: "Read ahead (grown-ups)" });
  await readAhead.click();
  await expect(page.locator(".story-page-copy:visible")).toHaveCount(24);
  await readAhead.click();
  await expect(page.locator(".story-page-copy:visible")).toHaveCount(12);
  await page.getByRole("button", { name: "One page at a time" }).click();
  await expect(page.locator(".reader-bar-label")).toHaveText("Page 12 of 24");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator(".reader-bar-label")).toHaveText("Page 11 of 24");
  await page.goto(url);
  await page.getByRole("button", { name: "One page at a time" }).click();
  await expect(page.locator(".reader-bar-label")).toHaveText("Page 11 of 24");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("all 24 days and calendar links remain readable", async ({ page }) => {
    await page.goto("/read/events/christmas/");
    const lastTile = page.locator("[data-advent-tile]").last();
    await expect(lastTile).toBeVisible();
    await lastTile.click();
    await expect(page.locator(".story-page-copy:visible")).toHaveCount(24);
    await expect(page.locator("#page-24 .story-page-copy")).toContainText("The twins looked at each other.");
  });
});
