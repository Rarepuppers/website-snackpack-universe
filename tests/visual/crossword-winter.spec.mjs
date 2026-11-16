import { expect, test } from "@playwright/test";

const DAY_MS = 86400000;
const featured = [
  ["2026-12-01", "Frosty figure with a carrot nose"],
  ["2026-12-06", "Pair for your feet"],
  ["2026-12-11", "Snowshoe ___"],
  ["2026-12-16", "Patchwork bed cover"],
  ["2026-12-21", "Bauble on a branch"],
  ["2026-12-25", "Big celebration meal"],
  ["2026-12-29", "Give part to others"],
  ["2027-01-01", "When the year turns"],
  ["2027-01-08", "Single board for the slopes"],
  ["2027-01-15", "Music performance"]
];

function openCrossword(page, query = "") {
  return page.goto("/play/crossword/" + query, { waitUntil: "domcontentloaded" });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    return new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
});

test("daily winter boards are deterministic and ordinary and historical boards stay in place", async ({ page }) => {
  const clues = page.locator("#cw-across");
  for (const [day, clue] of featured) {
    await openCrossword(page, "?daily=" + day);
    await expect(clues).toContainText(clue);
  }
  await openCrossword(page, "?daily=" + Date.parse(featured[0][0]) / DAY_MS);
  await expect(clues).toContainText(featured[0][1]);

  for (const [day, clue] of [
    ["2025-12-01", "Time-travelling cyborg"],
    ["2026-11-30", "Korean Best Picture"],
    ["2026-12-02", "Pandora film series"],
    ["2027-01-16", "Craft that touches down"],
    ["2027-12-01", featured[0][1]]
  ]) {
    await openCrossword(page, "?daily=" + day);
    await expect(clues).toContainText(clue);
  }
});

test("the Winter pack works outside the season and can resume a board", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-07-01T12:00:00Z"));
  await page.setViewportSize({ width: 360, height: 800 });
  await openCrossword(page);
  const winter = page.getByRole("button", { name: "Winter", exact: true });
  const options = page.getByRole("button", { name: /^Options/ });
  await options.press("Space");
  await winter.press("Space");
  await expect(winter).toHaveAttribute("aria-pressed", "true");
  const clues = page.locator("#cw-across");
  const first = await clues.textContent();
  await page.getByRole("button", { name: "New", exact: true }).click();
  await expect(clues).not.toHaveText(first);
  const expectedClues = await clues.textContent();

  await page.keyboard.press("A");
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some(key => key.includes("crossword") && key.includes("save")))).toBe(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(clues).toHaveText(expectedClues);
  await expect(page.locator("#cw-status")).toHaveText("Saved game restored.");

  // The arcade's old generic preference must not override a dated link.
  await page.evaluate(() => localStorage.setItem("sp_crossword_pref_mode", "winter"));
  await openCrossword(page, "?daily=2026-12-01");
  await expect(options).toContainText("Daily");
  await expect(clues).toContainText(featured[0][1]);
});

test("the Daily button counts a winter solve and archive replays keep today's streak untouched", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-01T12:00:00Z"));
  await openCrossword(page);
  await page.getByRole("button", { name: /^Options/ }).click();
  await page.getByRole("button", { name: "Daily", exact: true }).click();
  await expect(page.locator("#cw-across")).toContainText(featured[0][1]);

  async function solveSnowDay() {
    await page.locator("#cw-grid").evaluate(grid => {
      for (const cell of grid.querySelectorAll(".cw-cell:not(.cw-black)")) {
        cell.click();
        document.getElementById("cw-reveal").click();
      }
    });
    await expect(page.locator("#cw-victory-sub")).toContainText("Snow Day");
  }

  await solveSnowDay();
  const state = () => page.evaluate(() => window.SnackPackDaily.state().games);
  expect(await state()).toHaveProperty("crossword");

  await page.clock.setFixedTime(new Date("2026-12-02T12:00:00Z"));
  await openCrossword(page, "?daily=2026-12-01");
  await solveSnowDay();
  expect(await state()).toEqual({});
});
