import { describe, expect, it } from "vitest";
import { resolveSceneRoute } from "./SceneRoute";

describe("route-driven scene loading", () => {
  it("keeps each standalone screen on its own route", () => {
    expect(resolveSceneRoute(new URLSearchParams("mode=gallery"))).toBe("gallery");
    expect(resolveSceneRoute(new URLSearchParams("screen=map"))).toBe("map");
    expect(resolveSceneRoute(new URLSearchParams("screen=summary"))).toBe("summary");
    expect(resolveSceneRoute(new URLSearchParams("screen=event"))).toBe("expedition-event");
  });

  it("boots the shell for a bare URL and combat for review parameters", () => {
    expect(resolveSceneRoute(new URLSearchParams())).toBe("shell");
    expect(resolveSceneRoute(new URLSearchParams("screen=title&stress=12"))).toBe("shell");
    expect(resolveSceneRoute(new URLSearchParams("stress=12"))).toBe("combat");
    expect(resolveSceneRoute(new URLSearchParams("effects=low"))).toBe("combat");
  });
});
