import { afterEach, describe, expect, it } from "vitest";
import {
  applyHostDisplaySelection,
  currentHostDisplaySelection,
  displayLabelForId,
  hostDisplayCapabilities,
  initializeDesktopDisplayRuntime,
} from "./DesktopDisplayRuntime";

afterEach(() => initializeDesktopDisplayRuntime({}));

describe("desktop display runtime", () => {
  it("publishes desktop capabilities and applies host-owned selection", async () => {
    const snapshots = [{
      displays: [
        { id: "1", label: "Laptop", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1040 }, scaleFactor: 1 },
        { id: "2", label: "Ultrawide", bounds: { x: 1920, y: 0, width: 3440, height: 1440 }, workArea: { x: 1920, y: 0, width: 3440, height: 1400 }, scaleFactor: 1 },
      ],
      selectedDisplayId: "1",
      fullscreenMode: "windowed" as const,
    }];
    await initializeDesktopDisplayRuntime({ desktopDisplay: {
      getSnapshot: async () => snapshots[0]!,
      apply: async (request) => ({ ...snapshots[0]!, ...request }),
    } });
    expect(hostDisplayCapabilities({ fullscreenEnabled: false, documentElement: {} })).toMatchObject({
      host: "desktop", canSelectDisplay: true,
    });
    expect(displayLabelForId("2")).toBe("Ultrawide");
    expect(await applyHostDisplaySelection({ fullscreenElement: null, documentElement: {} }, {
      fullscreenMode: "borderless", selectedDisplayId: "2",
    })).toEqual({ fullscreenMode: "borderless", selectedDisplayId: "2" });
  });

  it("falls back to browser capabilities when the bridge rejects", async () => {
    await initializeDesktopDisplayRuntime({ desktopDisplay: {
      getSnapshot: async () => { throw new Error("unavailable"); },
      apply: async () => { throw new Error("unavailable"); },
    } });
    expect(currentHostDisplaySelection()).toBeNull();
    expect(hostDisplayCapabilities({ fullscreenEnabled: false, documentElement: {} }).host).toBe("browser");
  });
});
