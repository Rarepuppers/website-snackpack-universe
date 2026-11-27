import { test, expect } from "@playwright/test";

// /for-teachers/ "Links for your class": daily links reopen the current UTC activity and every Copy button copies a full URL.
test("reusable class links open the current dailies and copy full URLs", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/for-teachers/");
  const daily = "?daily=today&classroom=1";
  await expect(page.locator('[data-class-link="typing-daily"]')).toHaveAttribute("href", "/play/typing/" + daily);
  await expect(page.locator('[data-class-link="math-daily"]')).toHaveAttribute("href", "/play/math-facts/" + daily);
  await page.locator('[data-copy="math-daily"]').click();
  await expect(page.locator(".class-copy-status")).toContainText("/play/math-facts/" + daily);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(baseURL + "/play/math-facts/" + daily);
  for (const a of await page.locator("[data-class-link]").all()) {
    const href = await a.getAttribute("href");
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
  }
  await page.locator('[data-class-link="typing-daily"]').click();
  await expect(page.locator("#ty-status")).toContainText("Today's daily");
});
