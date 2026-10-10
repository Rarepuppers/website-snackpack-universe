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

  test("the menu offers Daily, Quick Drop and Expedition, hides LAB, and starts today's Daily", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?flow=menu");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
    const cards = await page.evaluate(() => window.__shellState.menuCards.map((card) => card.id));
    expect(cards.slice(0, 3)).toEqual(["daily", "quick-drop", "expedition"]);
    expect(cards).toContain("arcade");
    expect(cards).not.toContain("lab");
    // A first visit is focused on the short mode.
    expect(await page.evaluate(() => window.__shellState.menuCards[window.__shellState.menuIndex].id)).toBe("quick-drop");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellState?.screen === "character-select"
      && window.__shellState?.runMode === "daily");
    // Character art loads on entry; input is ignored until it has.
    await page.waitForFunction(() => window.__shellAssetsReady === true);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("screen") === "game" && url.searchParams.has("daily"));
    const today = await page.evaluate(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    });
    expect(new URL(page.url()).searchParams.get("daily")).toBe(today);
    await expectHealthyCanvas(page, failures);
  });

  test("LAB stays reachable for QA with ?lab=1", async ({ page }) => {
    // Not ?debug=1 alone: "debug" is a combat review parameter and routes to combat.
    for (const route of ["?flow=menu&lab=1", "?screen=title&flow=menu&debug=1"]) {
      await page.goto(`/play/last-bastion/${route}`);
      await page.waitForFunction(() => window.__shellState?.screen === "menu");
      expect(await page.evaluate(() => window.__shellState.menuCards.map((card) => card.id))).toContain("lab");
    }
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

  test("the Scrap Shop does not preload unrelated encounter art", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?scenario=scrap-shop&loadout=vertical&seed=61061");
    await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
    const ids = await page.evaluate(() => window.__combatAssetAudit.ids);
    expect(ids).toContain("scrap-shop-panel-v1");
    expect(ids).toContain("quartermaster-v1");
    expect(ids).not.toContain("bastion-eater-v1");
    expect(ids).not.toContain("assembly-prime-effects-v1");
    await expectHealthyCanvas(page, failures);
  });

  test("settings can export a versioned save backup", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?flow=settings");
    await page.waitForFunction(() => window.__shellState?.screen === "settings");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    const downloadPromise = page.waitForEvent("download");
    await page.keyboard.press("Enter");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("last-bastion-save-v16.json");
    await expectHealthyCanvas(page, failures);
  });

  test("settings exposes the game privacy policy without overflowing the minimum viewport", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto("/play/last-bastion/?flow=settings");
    await page.waitForFunction(() => window.__shellState?.screen === "settings");
    await page.keyboard.press("ArrowUp");
    expect(await page.evaluate(() => {
      const state = window.__shellState;
      return state.settingsRows[state.settingsIndex];
    })).toMatchObject({ kind: "action", key: "privacy", label: "Privacy policy" });
    const canvas = await page.locator("#game-root canvas").boundingBox();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBeLessThanOrEqual(960);
    expect(canvas.height).toBeLessThanOrEqual(540);
    await expectHealthyCanvas(page, failures);

    await page.keyboard.press("Enter");
    await page.waitForURL("**/privacy/last-bastion/");
    await expect(page.getByRole("heading", { name: "Last Bastion privacy policy" })).toBeVisible();
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
    await page.keyboard.press("Escape");
    await expect(page.locator("#run-details-fallback")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("CANVAS");
    await expectHealthyCanvas(page, failures);
  });

  test("debrief game link remains selectable when clipboard access is blocked", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("Clipboard blocked", "NotAllowedError")) },
      });
    });
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await page.keyboard.press("l");
    const link = page.locator("#run-details-fallback textarea");
    await expect(link).toHaveValue("https://www.snackpackuniverse.com/play/last-bastion/");
    await expect(page.getByText("Select and copy this game link:", { exact: false })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#run-details-fallback")).toHaveCount(0);
    await expectHealthyCanvas(page, failures);
  });

  test("focus loss clears a held irreversible confirmation", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=transformation-lab");
    await page.waitForFunction(() => Boolean(window.__transformationDecisionLab));
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => Boolean(window.__transformationDecisionLab?.state?.pending));

    await page.keyboard.down("Enter");
    await page.waitForFunction(() => window.__transformationDecisionLab.state.pending.holdElapsedMs > 0);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForFunction(() => window.__transformationDecisionLab.state.pending.holdElapsedMs === 0);
    await page.waitForTimeout(500);
    expect((await page.evaluate(() => window.__transformationDecisionLab.state.pending)).holdElapsedMs).toBe(0);
    await page.keyboard.up("Enter");
    await expectHealthyCanvas(page, failures);
  });

  test("maximum HUD scale, reduced motion, and remapped movement work at the minimum viewport", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await page.evaluate(() => {
      const state = window.__shellState;
      const save = {
        version: 16,
        settings: { ...state.settings, uiScale: 1.2, reducedMotionEnabled: true },
        controls: {
          keyboard: { ...state.controls.keyboard, moveRight: "KeyZ" },
          gamepad: { ...state.controls.gamepad },
        },
        progress: {
          runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0,
          bestNodesCleared: 0, totalKills: 0, totalDamage: 0, totalScrapEarned: 0,
          bestiary: {}, threatTierBestNodes: { 0: 0, 1: 0, 2: 0 },
          threatTierVictories: { 0: 0, 1: 0, 2: 0 }, commandMarksLifetime: 0,
          purchasedArmoryNodeIds: [],
        },
        expedition: null,
        selectedPerkId: "perk-veteran",
        selectedHeroId: "marine",
        selectedThreatTier: 0,
        selectedArmoryNodeId: null,
        lastRunSummary: null,
        runHistory: [],
      };
      localStorage.setItem("last-bastion-save", JSON.stringify(save));
    });

    await page.goto("/play/last-bastion/?scenario=powerup-identity&seed=61061");
    await page.waitForFunction(() => window.__combatAccessibilityAudit?.uiScale === 1.2);
    expect(await page.evaluate(() => window.__combatAccessibilityAudit)).toMatchObject({
      uiScale: 1.2,
      reducedMotion: true,
      moveRightBinding: "KeyZ",
      paused: false,
    });
    const initialX = await page.evaluate(() => window.__combatAccessibilityAudit.playerPosition.x);
    await page.keyboard.down("z");
    await page.waitForFunction((x) => window.__combatAccessibilityAudit.playerPosition.x > x, initialX);
    await page.keyboard.up("z");

    const canvas = await page.locator("#game-root canvas").boundingBox();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBeLessThanOrEqual(1280);
    expect(canvas.height).toBeLessThanOrEqual(800);
    expect(canvas.width / canvas.height).toBeCloseTo(16 / 9, 2);
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

  test("level-up stat cards fit their rendered text inside the choices", async ({ page }) => {
    const failures = watchRuntime(page);
    for (const viewport of [{ width: 960, height: 540 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/play/last-bastion/?scenario=stat-card-review");
      await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "level-stat");
      const cards = await page.evaluate(() => window.__combatDecisionOverlay.statCardBounds);
      expect(cards).toHaveLength(4);
      for (const card of cards) {
        expect(card.overflowed, card.id).toBe(false);
        expect(card.width, card.id).toBeLessThanOrEqual(328);
        expect(card.height, card.id).toBeLessThanOrEqual(100);
        expect(card.fontSize, card.id).toBeGreaterThanOrEqual(10);
      }
      await expectHealthyCanvas(page, failures);
    }
  });
});

test.describe("Last Bastion on a touch-only phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("explains the keyboard requirement before boot and still lets a player continue", async ({ page }) => {
    await page.goto("/play/last-bastion/?screen=title");
    const notice = page.getByRole("dialog", { name: "Last Bastion needs a keyboard or controller" });
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("link", { name: "Browse the arcade" })).toHaveAttribute("href", "/play/");
    await expect(page.locator("#game-root canvas")).toHaveCount(0);
    await notice.getByRole("button", { name: "I have a keyboard or controller" }).click();
    await expect(notice).toHaveCount(0);
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    // The choice lasts for the tab, so the next screen boots straight away.
    await page.reload();
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
