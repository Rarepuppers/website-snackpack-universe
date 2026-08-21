import { describe, expect, it } from "vitest";
import { TITLE_BACKDROP_ASSET, titleBackdropAssetId } from "./TitleBackdropAsset";

describe("TitleBackdropAsset", () => {
  it("locks the 4K 16:9 title master contract", () => {
    expect(TITLE_BACKDROP_ASSET).toMatchObject({
      kind: "image",
      id: "title-menu-backdrop-v1",
      logicalWidth: 3840,
      logicalHeight: 2160,
      pivot: { x: 0.5, y: 0.5 },
    });
    expect(TITLE_BACKDROP_ASSET.logicalWidth / TITLE_BACKDROP_ASSET.logicalHeight).toBe(16 / 9);
  });

  it("keeps an explicit legacy review fallback", () => {
    expect(titleBackdropAssetId("")).toBe("title-menu-backdrop-v1");
    expect(titleBackdropAssetId("?titlebackdrop=legacy")).toBe("bastion-logistics-map-backdrop-v1");
  });
});
