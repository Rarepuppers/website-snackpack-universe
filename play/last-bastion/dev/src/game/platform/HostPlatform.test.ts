import { describe, expect, it, vi } from "vitest";
import { synchronizeAchievementEvents, type SteamworksBridge } from "./PlatformAdapter";
import { createPlatformAdapterForHost } from "./HostPlatform";

function bridge(): SteamworksBridge {
  return {
    getAchievement: () => false,
    setAchievement: () => undefined,
    storeStats: () => undefined,
    readCloudFile: () => null,
    writeCloudFile: () => undefined,
  };
}

describe("host platform selection", () => {
  it("selects Steam only when preload exposed the initialized bridge", () => {
    expect(createPlatformAdapterForHost({ steamworks: bridge() }).kind).toBe("steam");
    expect(createPlatformAdapterForHost({}).kind).toBe("browser");
  });

  it("keeps Steam unlock events pending in the browser fallback", async () => {
    const adapter = createPlatformAdapterForHost({});
    await expect(synchronizeAchievementEvents(adapter, [
      { type: "achievement-unlocked", id: "first-drop" },
    ])).resolves.toEqual({ acknowledged: [], pending: ["first-drop"] });
  });

  it("does not attempt cloud I/O in the browser fallback", async () => {
    const adapter = createPlatformAdapterForHost({});
    const write = vi.spyOn(adapter, "writeCloudSave");
    await expect(adapter.readCloudSave()).resolves.toBeNull();
    expect(write).not.toHaveBeenCalled();
  });
});
