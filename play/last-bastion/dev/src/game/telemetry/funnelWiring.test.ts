// Vite's `?raw` rather than node:fs: this workspace carries no @types/node.
import MAIN from "../../main.ts?raw";
import PROTOTYPE_SCENE from "../scenes/PrototypeScene.ts?raw";
import { describe, expect, it } from "vitest";

/**
 * The funnel's own tests prove what it sends; nothing proved that the game ever
 * calls it. The original wiring (11 September 2026) was lost when two parallel
 * lines of work were reconciled the next day, and every telemetry test stayed
 * green for a month while the game reported nothing at all. Setting SITE_CODE
 * would have produced an empty dashboard. These assert the call sites exist.
 */
describe("player funnel wiring", () => {
  it("starts the funnel at boot", () => {
    expect(MAIN).toMatch(/publishPlayerFunnel\(startPlayerFunnel\(window\)\)/);
  });

  it("reports run start, wave milestones and every run ending from combat", () => {
    expect(PROTOTYPE_SCENE).toMatch(/playerFunnel\(\)\.runStarted\(/);
    expect(PROTOTYPE_SCENE).toMatch(/playerFunnel\(\)\.waveCleared\(/);
    // Quick/Daily end, expedition defeat, expedition victory.
    expect(PROTOTYPE_SCENE.match(/playerFunnel\(\)\.runEnded\(/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});
