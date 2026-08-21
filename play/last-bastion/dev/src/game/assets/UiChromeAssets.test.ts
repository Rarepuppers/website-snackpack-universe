import { describe, expect, it } from "vitest";
import {
  UI_BUTTON_SLICE,
  UI_CHROME_ASSETS,
  UI_FOCUS_SLICE,
  UI_PANEL_SLICE,
  uiButtonAssetId,
  uiChromeEnabled,
} from "./UiChromeAssets";

describe("UiChromeAssets", () => {
  it("locks the U1 panel and five-state button contract", () => {
    expect(UI_CHROME_ASSETS.map((asset) => asset.id)).toEqual([
      "ui-panel-frame-v1",
      "ui-panel-recessed-v1",
      "ui-panel-raised-v1",
      "ui-panel-emphasis-v1",
      "ui-button-idle-v1",
      "ui-button-hover-v1",
      "ui-button-selected-v1",
      "ui-button-pressed-v1",
      "ui-button-disabled-v1",
      "ui-focus-brackets-v1",
      "ui-header-plate-v1",
      "ui-divider-rule-v1",
    ]);
    expect(UI_CHROME_ASSETS[0]).toMatchObject({ logicalWidth: 256, logicalHeight: 256 });
    expect(UI_CHROME_ASSETS.slice(4, 9).every((asset) =>
      asset.logicalWidth === 320 && asset.logicalHeight === 120)).toBe(true);
  });

  it("keeps stable nine-slice margins and a legacy review fallback", () => {
    expect(UI_PANEL_SLICE).toEqual({ left: 48, right: 48, top: 48, bottom: 48 });
    expect(UI_BUTTON_SLICE).toEqual({ left: 48, right: 48, top: 36, bottom: 36 });
    expect(UI_FOCUS_SLICE).toEqual({ left: 32, right: 32, top: 32, bottom: 32 });
    expect(uiChromeEnabled("")).toBe(true);
    expect(uiChromeEnabled("?uichrome=legacy")).toBe(false);
  });

  it("maps every interaction state to a stable runtime id", () => {
    expect(["idle", "hover", "selected", "pressed", "disabled"].map((state) =>
      uiButtonAssetId(state as Parameters<typeof uiButtonAssetId>[0]))).toEqual([
      "ui-button-idle-v1",
      "ui-button-hover-v1",
      "ui-button-selected-v1",
      "ui-button-pressed-v1",
      "ui-button-disabled-v1",
    ]);
  });
});
