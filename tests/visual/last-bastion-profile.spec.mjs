import { test, expect } from "@playwright/test";

/**
 * QA-12 — frame pacing and leak detection, measured rather than assumed.
 *
 * The game already records frame times: `FramePacingTelemetry` keeps a bounded
 * rolling window and the combat presenter publishes it on
 * `window.__displayPresentationAudit.framePacing`. Nothing read it. This runs the
 * game and reports the numbers, and checks the one thing a human reviewer cannot
 * eyeball at all — whether repeated screen transitions leak.
 *
 * ## Two honest limits
 *
 * This is a **desktop Chromium on one developer machine**, so the absolute frame
 * times describe this box and nothing else. The audit was explicit that budgets
 * must be agreed per target device before results mean anything, and no such
 * budget exists yet, so the frame assertions here are collapse detectors rather
 * than targets.
 *
 * And the heap reading is NOT leak detection, however much it looks like it:
 * every screen here is its own document, so each transition discards the
 * previous heap and a per-cycle leak cannot accumulate in the number. It is kept
 * because a single document ballooning is still a real regression, and the test
 * says so in place of implying more.
 */
async function bootCombat(page, query = "") {
  await page.goto(`/play/last-bastion/?screen=game${query}`);
  await page.waitForSelector("#game-root canvas", { state: "visible", timeout: 60_000 });
  // Frame pacing needs a warm window before it reports; the telemetry itself
  // declares when it is ready rather than us guessing a sleep.
  await page.waitForFunction(
    () => window.__displayPresentationAudit?.framePacing?.ready === true,
    undefined,
    { timeout: 60_000 },
  );
}

/** Collect garbage through CDP so a heap reading is not just uncollected litter. */
async function usedHeapBytes(page) {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("HeapProfiler.collectGarbage");
  } catch {
    // Not fatal: the reading is noisier without it, which the caller allows for.
  } finally {
    await client.detach().catch(() => {});
  }
  return page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
}

test.describe("Last Bastion performance profile", () => {
  test.describe.configure({ mode: "serial" });

  test("reports frame pacing in combat", async ({ page }) => {
    await bootCombat(page);
    // Let it run long enough that the window is real play rather than boot.
    await page.waitForTimeout(6000);
    const pacing = await page.evaluate(() => window.__displayPresentationAudit?.framePacing ?? null);

    const environment = await page.evaluate(() => ({
      userAgent: navigator.userAgent,
      viewport: `${innerWidth}x${innerHeight}`,
      devicePixelRatio,
      visibility: document.visibilityState,
      targetFramesPerSecond: 60,
      evidenceFloorFramesPerSecond: 30,
    }));
    console.log("profileEnvironment:", JSON.stringify(environment));
    console.log("framePacing:", JSON.stringify(pacing));
    expect(pacing, "combat did not publish frame pacing").not.toBeNull();
    expect(pacing.sampleCount).toBeGreaterThan(0);

    // The game targets 60 fps. Headless evidence is allowed to miss that target,
    // but must sustain a 30 fps floor without long perceptible stalls.
    expect(pacing.p99FrameMilliseconds).toBeLessThan(60);
    expect(pacing.averageFrameMilliseconds).toBeLessThan(33.4);
  });

  test("reports frame pacing under the density stress profile", async ({ page }) => {
    // The heaviest thing the game can be asked to draw. If anything is going to
    // fall over it is this, and it is the route the density gates already use.
    await bootCombat(page, "&stress=12");
    await page.waitForTimeout(6000);
    const pacing = await page.evaluate(() => window.__displayPresentationAudit?.framePacing ?? null);
    console.log("framePacing(stress=12):", JSON.stringify(pacing));
    expect(pacing).not.toBeNull();
    expect(pacing.p99FrameMilliseconds).toBeLessThan(75);
    expect(pacing.averageFrameMilliseconds).toBeLessThan(40);
  });

  test("keeps heap and texture resources bounded during sustained dense combat", async ({ page }) => {
    await bootCombat(page, "&scenario=density-capacity");
    await page.waitForTimeout(4000);
    const baselineHeap = await usedHeapBytes(page);
    const baseline = await page.evaluate(() => ({
      textures: window.__displayPresentationAudit?.textures ?? null,
      recovery: window.__displayPresentationAudit?.contextRecovery ?? null,
      resources: performance.getEntriesByType("resource").length,
    }));

    await page.waitForTimeout(12_000);
    const afterHeap = await usedHeapBytes(page);
    const after = await page.evaluate(() => ({
      textures: window.__displayPresentationAudit?.textures ?? null,
      recovery: window.__displayPresentationAudit?.contextRecovery ?? null,
      resources: performance.getEntriesByType("resource").length,
    }));
    console.log("sustainedCombatResources:", JSON.stringify({ baselineHeap, afterHeap, baseline, after }));

    expect(baseline.textures).not.toBeNull();
    // A handful of lazy Pixi wrappers may materialize after the baseline even
    // though the underlying browser resource set is already stable. Bound both
    // wrapper growth and the decoded footprint instead of demanding bitwise
    // equality from two samples of a running scene.
    expect(after.resources).toBe(baseline.resources);
    expect(after.textures.textureCount / Math.max(1, baseline.textures.textureCount)).toBeLessThan(1.05);
    expect(after.textures.sourceCount / Math.max(1, baseline.textures.sourceCount)).toBeLessThan(1.05);
    expect(after.textures.estimatedDecodedBytes / Math.max(1, baseline.textures.estimatedDecodedBytes)).toBeLessThan(1.01);
    expect(after.recovery?.lostCount ?? 0).toBe(0);
    if (baselineHeap > 0) expect(afterHeap / baselineHeap).toBeLessThan(2.5);
  });

  test("survives repeated transitions, and reports the heap for the record", async ({ page }) => {
    // Read the assertion before trusting it. Last Bastion is a MULTI-PAGE app —
    // every screen is its own URL and its own document — so each cycle here
    // discards the previous JS heap entirely. A per-cycle leak therefore *cannot*
    // accumulate in this number, and calling this "leak detection" would be the
    // false-confidence trap: a green check that proves nothing.
    //
    // What it does prove is that four full transition cycles complete without
    // the game failing to boot, and it prints the heap so a real regression —
    // one screen suddenly costing twice as much — is visible in the log.
    //
    // GPU allocation is not directly exposed by browsers, so the production
    // audit reports the stable proxies we can observe: Pixi texture/source
    // counts, decoded source-byte estimates, and WebGL context-loss events.
    await bootCombat(page);
    const baseline = await usedHeapBytes(page);

    const cycles = [];
    for (let cycle = 0; cycle < 4; cycle += 1) {
      await page.goto("/play/last-bastion/?screen=map");
      await page.waitForSelector("#game-root canvas", { state: "visible", timeout: 60_000 });
      await page.waitForTimeout(500);
      await bootCombat(page);
      cycles.push(await page.evaluate(() => ({
        textures: window.__displayPresentationAudit?.textures ?? null,
        recovery: window.__displayPresentationAudit?.contextRecovery ?? null,
      })));
    }

    const after = await usedHeapBytes(page);
    console.log("heap:", JSON.stringify({
      baselineBytes: baseline,
      afterBytes: after,
      cycles,
      note: "fresh document per cycle — not a leak check",
    }));

    // A single combat document costing several times what it did at boot is a
    // real regression even across separate documents, so this ceiling is worth
    // having. It is not, and must not be described as, a leak test.
    if (baseline > 0) {
      expect(after / baseline, "one combat document ballooned").toBeLessThan(3);
    }
    expect(cycles.every((cycle) => (cycle.recovery?.lostCount ?? 0) === 0)).toBe(true);
    const textureCounts = cycles.map((cycle) => cycle.textures?.textureCount ?? 0);
    const sourceCounts = cycles.map((cycle) => cycle.textures?.sourceCount ?? 0);
    expect(Math.max(...textureCounts) / Math.max(1, Math.min(...textureCounts)), "texture count varied by more than 5% across fresh documents").toBeLessThan(1.05);
    expect(Math.max(...sourceCounts) / Math.max(1, Math.min(...sourceCounts)), "texture source count varied by more than 5% across fresh documents").toBeLessThan(1.05);
    const decodedBytes = cycles.map((cycle) => cycle.textures?.estimatedDecodedBytes ?? 0);
    expect(Math.max(...decodedBytes) / Math.max(1, Math.min(...decodedBytes)), "decoded texture footprint varied by more than 5% across fresh documents").toBeLessThan(1.05);
  });

});
