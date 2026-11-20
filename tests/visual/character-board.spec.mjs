import { expect, test } from "@playwright/test";

test("the portrait board links to the owl, hen and confirmed family", async ({ page }) => {
  await page.goto("/characters/");
  await expect(page.locator("#crew .cast-card")).toHaveCount(6);
  await page.getByRole("link", { name: "Professor Hooten Owl" }).click();
  await expect(page.getByRole("heading", { name: "Professor Hooten" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Midnight That Came Early/ })).toBeVisible();
  await page.getByRole("link", { name: "Meet the Characters", exact: true }).first().click();
  await page.getByRole("link", { name: "Hen-Berry Hen" }).click();
  await expect(page.getByRole("heading", { name: "Hen-Berry" })).toBeVisible();
  await page.getByRole("link", { name: "Coop-Accino", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Coop-Accino" })).toBeVisible();
});

test("Panda-Cake links to a sourced animal fact and back", async ({ page }) => {
  await page.goto("/characters/panda-cake/");
  await page.getByRole("link", { name: "Giant panda" }).click();
  await expect(page.getByRole("heading", { name: "Giant panda" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Smithsonian’s National Zoo" })).toHaveAttribute("href", "https://nationalzoo.si.edu/animals/giant-panda");
  await page.getByRole("link", { name: "Panda-Cake SnackPack character" }).click();
  await expect(page).toHaveURL(/characters\/panda-cake\/$/);
});

test("the clue game handles guesses, all three rounds and reset", async ({ page }) => {
  await page.goto("/characters/clues/");
  const clue = page.getByRole("button", { name: "Read another clue" });
  const answer = page.getByRole("button", { name: "Show me the answer" });
  const another = page.getByRole("button", { name: "Another mystery" });
  await page.getByRole("button", { name: "Hen-Berry Hen" }).click();
  await expect(page.getByRole("status")).toContainText("Have another go");
  await expect(page.getByRole("button", { name: "Hen-Berry Hen" })).toBeFocused();
  await clue.press("Enter");
  await expect(page.getByRole("heading", { name: "Clue 2 of 3" })).toBeFocused();
  await clue.click();
  await expect(clue).toBeDisabled();
  await page.getByRole("button", { name: "Cluck O’Clock Rooster" }).click();
  await expect(page.getByRole("status")).toContainText("Cluck O’Clock");
  await expect(page.getByRole("link", { name: "Meet this character" })).toBeFocused();
  for (const name of ["Hen-Berry", "Professor Hooten", "Cluck O’Clock"]) {
    await another.click();
    await expect(page.getByRole("heading", { name: "Clue 1 of 3" })).toBeFocused();
    await answer.click();
    await expect(page.getByRole("status")).toContainText(name);
  }
});

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });
  test("the static clue and answer remain usable", async ({ page }) => {
    await page.goto("/characters/clues/");
    await page.locator("summary").click();
    await expect(page.getByRole("link", { name: "Meet Cluck O’Clock" })).toBeVisible();
  });
});

test("the colouring page offers two true PDF downloads per sheet", async ({ page }) => {
  await page.goto("/characters/colouring/");
  const downloads = await page.getByRole("link", { name: /PDF/ }).all();
  expect(downloads).toHaveLength(6);
  for (const link of downloads) {
    const response = await page.request.get(await link.getAttribute("href"));
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
});

test("the board fits a 320px dark screen at 200 percent text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.addInitScript(() => localStorage.setItem("snackpack.theme.v1", "dark"));
  await page.goto("/characters/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await expect(page.getByRole("heading", { name: /Come meet/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const card of await page.locator("#crew .cast-card").all()) {
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});
