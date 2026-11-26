import { expect, test } from "@playwright/test";

test("the portrait board links to the owl, hen and confirmed family", async ({ page }) => {
  await page.goto("/characters/");
  await expect(page.locator("#crew .cast-card")).toHaveCount(52);
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

test("the clue game handles guesses, new six-face pools and reset", async ({ page }) => {
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
  for (const name of ["Hen-Berry", "Professor Hooten", "Shelly-Pop", "Eggs-Benedict", "Vincent Van Mouse", "Corgi-on-the-Cob"]) {
    await another.click();
    await expect(page.getByRole("heading", { name: "Clue 1 of 3" })).toBeFocused();
    await expect(page.locator("[data-guess]:visible")).toHaveCount(6);
    await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
    await answer.click();
    await expect(page.getByRole("status")).toContainText(name);
  }
});

test("home and Reads link to the catalog, with search by legacy name", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Meet the Characters", exact: true }).first().click();
  await expect(page).toHaveURL(/\/characters\/$/);
  const search = page.getByLabel("Find a character");
  await search.fill("Wise Owl Librarian");
  await expect(page.locator("#crew .cast-card:visible")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Professor Hooten Owl" })).toBeVisible();
  await search.fill("nobody here");
  await expect(page.getByRole("status")).toHaveText("No matching characters");
  await search.fill("");
  await expect(page.locator("#crew .cast-card:visible")).toHaveCount(52);
  await page.goto("/read/");
  await expect(page.getByRole("link", { name: "Meet the Characters", exact: true })).toHaveAttribute("href", "/characters/");
});

test("an app-led profile has its own alternative portrait", async ({ page }) => {
  await page.goto("/characters/tick-tusk/");
  await page.getByText("See another portrait", { exact: true }).click();
  const art = page.locator(".cast-art img");
  await expect(art).toBeVisible();
  await expect.poll(() => art.evaluate(image => image.naturalWidth)).toBe(480);
});

test("Eggs-Benedict has her own story art and shares the chicken fact page with Hen-Berry", async ({ page }) => {
  await page.goto("/characters/eggs-benedict/");
  await expect(page.getByRole("heading", { name: "Eggs-Benedict" })).toBeVisible();
  await expect(page.getByText(/wooden clipboard/)).toBeVisible();
  await page.getByText("See a picture from the story").click();
  const scene = page.locator(".cast-art img");
  await expect(scene).toBeVisible();
  await expect.poll(() => scene.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Chickens", exact: true }).click();
  await expect(page.getByRole("link", { name: /Hen-Berry SnackPack character/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Eggs-Benedict SnackPack character/ })).toBeVisible();
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
  const downloads = await page.locator("[data-scene-sheets]").getByRole("link", { name: /PDF/ }).all();
  expect(downloads).toHaveLength(6);
  for (const link of downloads) {
    const response = await page.request.get(await link.getAttribute("href"));
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
});

test("a character profile opens its own colour sheet", async ({ page }) => {
  await page.goto("/characters/hen-berry/");
  await page.getByRole("link", { name: "Colour this character" }).click();
  await expect(page).toHaveURL(/colouring\/#hen-berry$/);
  await expect(page.locator("#hen-berry").getByRole("link", { name: "US Letter PDF" })).toHaveAttribute("href", "/characters/colouring/files/hen-berry-letter.pdf");
  await expect(page.getByRole("link", { name: "Full pack · A4" })).toHaveAttribute("href", "/characters/colouring/files/crew-a4.pdf");
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

test("story and animal filters can be shared and lead back to the book", async ({ page }) => {
  await page.goto("/characters/?group=birds&story=cluck-oclock-and-the-midnight-that-came-early");
  await expect(page.locator("#crew .cast-card:visible")).toHaveCount(4);
  await page.getByLabel("Animal group").selectOption("mammals");
  await expect(page).toHaveURL(/group=mammals/);
  await expect(page.getByRole("status")).toHaveText("No matching characters");
  await page.getByLabel("Animal group").selectOption("");
  await page.getByRole("link", { name: "Professor Hooten Owl" }).click();
  const greeting = page.locator(".cast-profile .cast-lead");
  const first = await greeting.textContent();
  await page.getByRole("button", { name: "Another hello" }).click();
  await expect(greeting).not.toHaveText(first);
  await page.getByRole("link", { name: /Midnight That Came Early/ }).click();
  await expect(page.getByText("Meet the cast", { exact: true })).toHaveCount(1);
});
