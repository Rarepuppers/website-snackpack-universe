import { describe, expect, it } from "vitest";
import { planDisplayPresentation } from "./DisplayPresentation";
import { planExpandedFrameHudLayout } from "./ExpandedFrameHudLayout";

describe("expanded-frame HUD layout", () => {
  it("stacks all furniture into ultrawide side panels at maximum HUD settings", () => {
    const plan = planDisplayPresentation({
      windowWidth: 3440,
      windowHeight: 1440,
      devicePixelRatio: 1,
      expandedFrameAvailable: true,
    });
    const layout = planExpandedFrameHudLayout(plan, { uiScale: 1.2, radarSize: 1.25 });

    expect(layout.complete).toBe(true);
    expect(layout.unplaced).toEqual([]);
    expect(layout.placements["status-tray"]).toMatchObject({ panel: "left", orientation: "vertical" });
    expect(layout.placements.radar).toMatchObject({ panel: "right" });
    expect(layout.placements["weapon-ring"]).toMatchObject({ panel: "right", orientation: "vertical" });
  });

  it("rejects complete Deck relocation because 40px bands cannot fit default furniture", () => {
    const plan = planDisplayPresentation({
      windowWidth: 1280,
      windowHeight: 800,
      devicePixelRatio: 1,
      expandedFrameAvailable: true,
    });
    const layout = planExpandedFrameHudLayout(plan, { uiScale: 1, radarSize: 1 });

    expect(layout.complete).toBe(false);
    expect(layout.placements).toEqual({});
    expect(layout.unplaced).toEqual(["radar", "status-tray", "weapon-ring"]);
  });

  it("can use a deeper horizontal frame without changing world FOV", () => {
    const base = planDisplayPresentation({
      windowWidth: 1280,
      windowHeight: 900,
      devicePixelRatio: 1,
      expandedFrameAvailable: true,
    });
    const layout = planExpandedFrameHudLayout(base, { uiScale: 0.8, radarSize: 0.75 });

    expect(layout.complete).toBe(true);
    expect(layout.placements["status-tray"]).toMatchObject({ panel: "top", orientation: "horizontal" });
    expect(layout.placements.radar).toMatchObject({ panel: "top" });
    expect(layout.placements["weapon-ring"]).toMatchObject({ panel: "bottom", orientation: "horizontal" });
  });

  it("does not relocate furniture for Crisp or Fill modes", () => {
    const plan = planDisplayPresentation({ windowWidth: 1920, windowHeight: 1080, devicePixelRatio: 1 });
    expect(planExpandedFrameHudLayout(plan, { uiScale: 1, radarSize: 1 })).toMatchObject({
      complete: false,
      placements: {},
      unplaced: ["radar", "status-tray", "weapon-ring"],
    });
  });
});
