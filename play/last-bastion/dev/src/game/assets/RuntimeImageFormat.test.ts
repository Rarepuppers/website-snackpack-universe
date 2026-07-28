import { describe, expect, it } from "vitest";
import { runtimeImageUrl } from "./RuntimeImageFormat";

describe("runtimeImageUrl", () => {
  it("selects WebP when the browser can encode it", () => {
    expect(runtimeImageUrl("master.png", "runtime.webp", {
      createCanvas: () => ({ toDataURL: () => "data:image/webp;base64,UklGRg==" }),
    })).toBe("runtime.webp");
  });

  it("falls back to PNG when WebP support is unavailable", () => {
    expect(runtimeImageUrl("master.png", "runtime.webp", {
      createCanvas: () => ({ toDataURL: () => "data:image/png;base64,iVBORw==" }),
    })).toBe("master.png");
    expect(runtimeImageUrl("master.png", "runtime.webp", {})).toBe("master.png");
  });

  it("supports explicit review overrides", () => {
    expect(runtimeImageUrl("master.png", "runtime.webp", {
      search: "?imageformat=png",
      createCanvas: () => ({ toDataURL: () => "data:image/webp;base64,UklGRg==" }),
    })).toBe("master.png");
    expect(runtimeImageUrl("master.png", "runtime.webp", {
      search: "?imageformat=webp",
    })).toBe("runtime.webp");
  });
});
