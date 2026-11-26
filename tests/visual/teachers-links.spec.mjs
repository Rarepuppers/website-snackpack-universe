import { test, expect } from "@playwright/test";

// /for-teachers/ "Links for your class": daily links carry today's UTC date
// (the day the games use) and every Copy button copies a full URL.
test("class links point at today's dailies and copy full URLs", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/for-teachers/");
  const today = new Date().toISOString().slice(0, 10);
  await expect(page.locator('[data-class-link="typing-daily"]')).toHaveAttribute("href", "/play/typing/?daily=" + today);
  await expect(page.locator('[data-class-link="math-daily"]')).toHaveAttribute("href", "/play/math-facts/?daily=" + today);
  await page.locator('[data-copy="math-daily"]').click();
  await expect(page.locator(".class-copy-status")).toContainText("/play/math-facts/?daily=" + today);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(baseURL + "/play/math-facts/?daily=" + today);
  for (const a of await page.locator("[data-class-link]").all()) {
    const href = await a.getAttribute("href");
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
  }
  await page.locator('[data-class-link="typing-daily"]').click();
  await expect(page.locator("#ty-status")).toContainText("Today's daily");
});
