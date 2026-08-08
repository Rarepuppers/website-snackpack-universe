import { describe, expect, it } from "vitest";
import { currentPlatformAdapter, initializePlatformAdapter } from "./PlatformRuntime";

describe("platform runtime", () => {
  it("boots browser-safe and records host selection once the window is available", () => {
    expect(currentPlatformAdapter().kind).toBe("browser");
    expect(initializePlatformAdapter({}).kind).toBe("browser");
    expect(currentPlatformAdapter().kind).toBe("browser");
  });
});
