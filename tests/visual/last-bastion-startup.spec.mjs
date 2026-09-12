import { test, expect } from "@playwright/test";

/**
 * How long it takes to reach a playable combat scene, and what that time is
 * spent on.
 *
 * This exists because the first attempt to measure it was wrong. Driving the
 * in-app browser pane gave 46.7 seconds, which looked like a catastrophic
 * product defect. The pane was hidden, and a hidden tab throttles
 * `requestAnimationFrame` — which is what advances Phaser's loader. The number
 * was an artefact of the measuring instrument.
 *
 * Playwright does not throttle its pages, so this is the trustworthy version.
 * The lesson is worth keeping: never measure a rAF-driven loader in a
 * background tab.
 */
const READY = "#game-root canvas";

/**
 * "Ready" is defined as **asset quiet**: the moment the page stops requesting
 * anything new for a settling window. That is a deliberate choice, and the
 * alternative was worse — the obvious readiness flag,
 * `canvas.dataset.directPresentationAudit`, is only set by the *direct*
 * presentation path, which combat does not use (it owns a RenderTexture
 * presenter instead). Waiting on it measured the loading screen, not the game.
 *
 * Asset quiet is a proxy, not a claim about interactivity, and it is labelled
 * that way everywhere it is reported.
 */
async function measure(page, route, { settleMs = 2500, capMs = 90_000 } = {}) {
  const started = Date.now();
  await page.goto(route);
  await page.waitForSelector(READY, { state: "visible", timeout: 60_000 });
  const canvasAtMs = Date.now() - started;

  const quiet = await page.evaluate(async ({ settleMs, capMs }) => {
    const deadline = performance.now() + capMs;
    let lastCount = performance.getEntriesByType("resource").length;
    let lastChangeAt = performance.now();
    while (performance.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const count = performance.getEntriesByType("resource").length;
      if (count !== lastCount) {
        lastCount = count;
        lastChangeAt = performance.now();
      } else if (performance.now() - lastChangeAt >= settleMs) {
        return { quietAtMs: Math.round(lastChangeAt), timedOut: false };
      }
    }
    return { quietAtMs: Math.round(performance.now()), timedOut: true };
  }, { settleMs, capMs });

  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource");
    const bytes = entries.reduce((total, entry) => total + (entry.transferSize || entry.encodedBodySize || 0), 0);
    const images = entries.filter((entry) => /\.(png|webp)$/.test(entry.name.split("?")[0]));
    return {
      requests: entries.length,
      megabytes: +(bytes / 1048576).toFixed(1),
      imageCount: images.length,
      imageTransferMs: Math.round(images.reduce((total, entry) => total + entry.duration, 0)),
      lastResponseEndMs: Math.round(Math.max(0, ...entries.map((entry) => entry.responseEnd))),
      domContentLoadedMs: Math.round(performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd ?? 0),
    };
  });
  return { canvasAtMs, assetQuietAtMs: quiet.quietAtMs, quietTimedOut: quiet.timedOut, ...resources };
}

test.describe("Last Bastion startup cost", () => {
  test("reaches the title within a budget a visitor will wait", async ({ page }) => {
    const result = await measure(page, "/play/last-bastion/");
    console.log("title:", JSON.stringify(result));
    // A free browser game competes with the back button. Three seconds to a
    // rendered title is the outer edge of reasonable on a warm local server;
    // this is a regression guard, not a target.
    expect(result.canvasAtMs).toBeLessThan(10_000);
  });

  test("reaches combat, and reports where the time went", async ({ page }) => {
    const result = await measure(page, "/play/last-bastion/?screen=game");
    console.log("combat:", JSON.stringify(result));

    // The assertions are deliberately loose. The point of this test is the
    // printed breakdown — a number nobody was measuring before — plus a ceiling
    // that catches a genuine collapse rather than ordinary variation.
    expect(result.assetQuietAtMs).toBeLessThan(75_000);
    expect(result.quietTimedOut).toBe(false);
    // Transfer should stay a small fraction of the total. If this inverts, the
    // problem moved to the network and the advice changes with it.
    expect(result.imageTransferMs).toBeLessThan(result.assetQuietAtMs);
  });
});
