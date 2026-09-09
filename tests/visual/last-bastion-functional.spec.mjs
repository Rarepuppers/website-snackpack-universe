import { test, expect } from "@playwright/test";

function watchRuntime(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    const source = message.location().url;
    const text = message.text();
    const expectedAnalyticsFailure = text.includes("cloudflareinsights.com/cdn-cgi/rum");
    if (message.type() === "error" && !expectedAnalyticsFailure
      && (!source || source.includes("/play/last-bastion/"))) {
      failures.push(`console: ${text}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("/play/last-bastion/")) {
      failures.push(`request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`);
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/play/last-bastion/") && response.status() >= 400) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

async function expectHealthyCanvas(page, failures) {
  await expect(page.locator("#game-root canvas")).toBeVisible();
  expect(failures).toEqual([]);
}

test.describe("Last Bastion executable acceptance", () => {
  test("title reaches the main menu by keyboard", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
    await expectHealthyCanvas(page, failures);
  });

  test("map and combat routes create their runtime state", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=map&mapseed=2026&threat=2");
    await page.waitForFunction(() => window.__expeditionState?.seed === 2026);
    expect(await page.evaluate(() => window.__expeditionState)).toMatchObject({
      seed: 2026,
      threatTier: 2,
      complete: false,
      armedNodeId: null,
    });
    const mapUrl = page.url();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => Number.isInteger(window.__expeditionState?.armedNodeId));
    expect(page.url()).toBe(mapUrl);
    const armedNodeId = await page.evaluate(() => window.__expeditionState.armedNodeId);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("screen") === "game" || url.searchParams.get("screen") === "event");
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("last-bastion-save")));
    expect(persisted.expedition.currentNodeId).toBe(armedNodeId);

    await page.goto("/play/last-bastion/?scenario=powerup-identity");
    await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
    await expectHealthyCanvas(page, failures);
  });

  test("settings can export a versioned save backup", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?flow=settings");
    await page.waitForFunction(() => window.__shellState?.screen === "settings");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    const downloadPromise = page.waitForEvent("download");
    await page.keyboard.press("Enter");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("last-bastion-save-v16.json");
    await expectHealthyCanvas(page, failures);
  });

  test("debrief keyboard navigation updates the selected action", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => window.__runSummaryNavigation?.selectedIndex === 1);
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => window.__runSummaryNavigation?.selectedIndex === 0);
    expect(await page.evaluate(() => window.__runSummaryNavigation)).toEqual({
      selectedIndex: 0,
      selectedShortcut: "R",
    });
    await expectHealthyCanvas(page, failures);
  });

  test("storage read failure stays visible and retryable", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem() {
            throw new DOMException("Storage blocked for acceptance test", "SecurityError");
          },
          setItem() {},
        },
      });
    });
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__savePersistence?.kind === "failed");
    expect(await page.evaluate(() => window.__savePersistence)).toEqual({
      kind: "failed",
      operation: "read",
    });
    await page.keyboard.press("p");
    await page.waitForFunction(() => window.__savePersistence?.operation === "read");
    await expectHealthyCanvas(page, failures);
  });

  test("repeated renderer boots and scene transitions remain crash-free", async ({ page }) => {
    const failures = watchRuntime(page);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await page.goto("/play/last-bastion/?screen=title");
      await page.waitForFunction(() => window.__shellState?.screen === "title");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.__shellState?.screen === "menu");
      await expectHealthyCanvas(page, failures);

      await page.goto(`/play/last-bastion/?screen=map&mapseed=${7000 + cycle}&threat=1`);
      await page.waitForFunction(() => Boolean(window.__expeditionState));
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => Number.isInteger(window.__expeditionState?.armedNodeId));
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.searchParams.get("screen") === "game" || url.searchParams.get("screen") === "event");
      await expectHealthyCanvas(page, failures);

      await page.goto("/play/last-bastion/?scenario=powerup-identity");
      await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
      await expectHealthyCanvas(page, failures);

      await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
      await page.waitForFunction(() => Number.isInteger(window.__runSummaryNavigation?.selectedIndex));
      await expectHealthyCanvas(page, failures);
    }
  });
});
