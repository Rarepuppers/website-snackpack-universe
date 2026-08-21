import { describe, expect, it } from "vitest";
import { REVIEW_SHELL_SCREENS, requestedShellScreen } from "./ShellReviewRoute";

describe("ShellReviewRoute", () => {
  it("opens every shell screen directly for deterministic visual review", () => {
    for (const screen of REVIEW_SHELL_SCREENS) {
      expect(requestedShellScreen(`?flow=${screen}`)).toBe(screen);
    }
  });

  it("falls back to title for missing or invalid review routes", () => {
    expect(requestedShellScreen("")).toBe("title");
    expect(requestedShellScreen("?flow=combat")).toBe("title");
    expect(requestedShellScreen("?flow=unknown")).toBe("title");
  });
});
