import { test, expect } from "@playwright/test";

function watchRuntime(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.stack ?? error.message}`));
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

    await page.goto("/play/last-bastion/?scenario=powerup-identity&seed=61061");
    await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
    expect(await page.evaluate(() => window.__combatAssetAudit?.runSeed)).toBe(61061);
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
      selectedShortcut: "Q",
    });
    await expectHealthyCanvas(page, failures);
  });

  test("run details remain selectable when clipboard access is blocked", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("Clipboard blocked", "NotAllowedError")) },
      });
    });
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => window.__runSummary?.provenance?.combatSeed === 61061);
    await page.keyboard.press("c");
    await page.waitForFunction(() => window.__runSummaryCopy?.fallback === true);
    const details = page.locator("#run-details-fallback textarea");
    await expect(details).toBeVisible();
    await expect(details).toHaveValue(/Combat seed: 61061/);
    await expect(details).toHaveValue(/Simulation: 3/);
    await expectHealthyCanvas(page, failures);
  });

  test("a warmed release boots offline and an unwarmed combat theme fails visibly", async ({ page, context }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.waitForFunction(() => Boolean(window.__runSummary));

    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await expect(page.locator("#game-root canvas")).toBeVisible();

    await page.goto("/play/last-bastion/?scenario=powerup-identity&biome=arctic");
    await page.waitForFunction(() => window.__combatAssetFailure?.retryable === true);
    expect((await page.evaluate(() => window.__combatAssetFailure)).failed.length).toBeGreaterThan(0);
    await context.setOffline(false);
    expect(failures.filter((failure) => failure.startsWith("pageerror:"))).toEqual([]);
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

  test("combat decisions remain keyboard-operable after overlay extraction", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?scenario=weapon-gate");
    await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "weapon-placement");
    const initial = await page.evaluate(() => window.__combatDecisionOverlay);
    expect(initial.visible).toBe(true);
    expect(initial.selectedIndex).toBe(0);
    expect(initial.optionIds.length).toBeGreaterThan(1);
    const discardIndex = initial.optionIds.indexOf("place:discard");
    expect(discardIndex).toBeGreaterThanOrEqual(0);
    expect(discardIndex).toBeLessThan(9);

    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(() => Number(window.__combatDecisionOverlay?.selectedIndex) > 0);
    await page.keyboard.press(String(discardIndex + 1));
    await page.waitForFunction(() => window.__combatDecisionOverlay?.visible === false);
    await expectHealthyCanvas(page, failures);
  });
});
